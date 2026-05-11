import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { sendSOSRequest } from '../services/sos.service';
import { WSS_URL } from '../constants/api';
import { getDirections } from '../utils/googleDirections';

const incidentKey = (rideId) => `sos_incident_${rideId}`;

const CHUNK_DURATION_MS = 2000;

// Bounds for the auto-stop timer. We never want a session shorter than 5 min
// (gives the driver time to stay on the line in an emergency) nor longer than
// 2h (the cap protects against pathological API responses).
const MIN_MAX_DURATION_SECONDS = 300;
const MAX_MAX_DURATION_SECONDS = 7200;
const DEFAULT_MAX_DURATION_SECONDS = 3600;

// At most ~10s of audio held while we wait to reconnect.
const MAX_PENDING_CHUNKS = 5;

const AUDIO_OPTIONS = {
  isMeteringEnabled: false,
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

const clampDuration = (seconds) =>
  Math.max(MIN_MAX_DURATION_SECONDS, Math.min(MAX_MAX_DURATION_SECONDS, Math.round(seconds)));

export function useSOSAudio(rideId, { dropoffLat, dropoffLng } = {}) {
  const [sosStatus, setSosStatus] = useState('idle');
  const [bytesStreamed, setBytesStreamed] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const { getValidToken } = useAuth();

  const isActiveRef = useRef(false);
  const isRecordingRef = useRef(false);
  const wsRef = useRef(null);
  const incidentIdRef = useRef(null);
  const bytesRef = useRef(0);
  const prevRideIdRef = useRef(rideId);

  const maxDurationSecondsRef = useRef(DEFAULT_MAX_DURATION_SECONDS);
  const sessionStartedAtRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const reconnectAttemptedRef = useRef(false);
  const pendingChunksRef = useRef([]);

  // Keep the latest dropoff coords in a ref so callbacks don't need to
  // recreate when they change.
  const dropoffRef = useRef({ lat: dropoffLat, lng: dropoffLng });
  useEffect(() => {
    dropoffRef.current = { lat: dropoffLat, lng: dropoffLng };
  }, [dropoffLat, dropoffLng]);

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const cleanup = useCallback(async () => {
    isRecordingRef.current = false;
    clearCountdown();
    pendingChunksRef.current = [];
    reconnectAttemptedRef.current = false;

    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) { }
      wsRef.current = null;
    }

    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (_) { }

    // Intentionally NOT clearing incidentIdRef or AsyncStorage here —
    // the incident_id is reused across stop/restart within the same ride.
    bytesRef.current = 0;
    sessionStartedAtRef.current = null;
    setRemainingSeconds(null);
    isActiveRef.current = false;
  }, [clearCountdown]);

  // Flush any chunks captured while the WS was offline. Caller must verify
  // the socket is OPEN before invoking.
  const flushPendingChunks = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    while (pendingChunksRef.current.length > 0) {
      const buf = pendingChunksRef.current.shift();
      try {
        ws.send(buf);
        bytesRef.current += buf.byteLength;
      } catch (err) {
        console.warn('[SOS] failed to flush pending chunk', err);
        pendingChunksRef.current.unshift(buf);
        return;
      }
    }
    setBytesStreamed(bytesRef.current);
  }, []);

  const sendChunk = useCallback(async () => {
    if (!isRecordingRef.current) return;

    let recordingInstance = null;
    try {
      const { recording } = await Audio.Recording.createAsync(AUDIO_OPTIONS);
      recordingInstance = recording;

      await new Promise((resolve) => setTimeout(resolve, CHUNK_DURATION_MS));

      if (!isRecordingRef.current) {
        await recordingInstance.stopAndUnloadAsync().catch(() => { });
        return;
      }

      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      if (!uri) return;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      try { new FileSystem.File(uri).delete(); } catch (_) { }

      if (!isRecordingRef.current) return;

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Drain any buffered chunks first to preserve ordering.
        flushPendingChunks();
        ws.send(arrayBuffer);
        bytesRef.current += arrayBuffer.byteLength;
        setBytesStreamed(bytesRef.current);
      } else {
        // Socket isn't ready. Buffer the chunk (bounded) so we can resend
        // once a reconnect completes.
        if (pendingChunksRef.current.length >= MAX_PENDING_CHUNKS) {
          const dropped = pendingChunksRef.current.shift();
          console.warn(`[SOS] pending buffer full; dropped oldest ${dropped.byteLength} bytes`);
        }
        pendingChunksRef.current.push(arrayBuffer);
        console.warn(`[SOS] WS not open; buffered chunk (${pendingChunksRef.current.length}/${MAX_PENDING_CHUNKS})`);
      }
    } catch (err) {
      if (recordingInstance) {
        await recordingInstance.stopAndUnloadAsync().catch(() => { });
      }
      console.error('[SOS] chunk error:', err);
    }

    if (isRecordingRef.current) {
      sendChunk();
    }
  }, [flushPendingChunks]);

  // Snapshot current driver location + estimated drive time to dropoff at the
  // moment SOS starts. Returns { maxDurationSeconds, location } and never
  // throws — we fall back rather than block SOS.
  const computeMaxDurationAndLocation = useCallback(async () => {
    const fallback = { maxDurationSeconds: DEFAULT_MAX_DURATION_SECONDS, location: null };
    const { lat: dLat, lng: dLng } = dropoffRef.current || {};

    let location = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[SOS] location permission denied — using fallback duration');
        return fallback;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (err) {
      console.warn('[SOS] could not read current location — using fallback duration', err);
      return fallback;
    }

    if (!Number.isFinite(dLat) || !Number.isFinite(dLng)) {
      console.warn('[SOS] dropoff coords missing — using fallback duration', { dLat, dLng });
      return { ...fallback, location };
    }

    try {
      const result = await getDirections(location.lng, location.lat, dLng, dLat);
      if (result && Number.isFinite(result.duration)) {
        const clamped = clampDuration(result.duration);
        console.log(`[SOS] computed max duration ${clamped}s (raw ${result.duration}s)`);
        return { maxDurationSeconds: clamped, location };
      }
      console.warn('[SOS] directions result lacks duration — using fallback');
    } catch (err) {
      console.warn('[SOS] directions API failed — using fallback duration', err);
    }
    return { ...fallback, location };
  }, []);

  const stopSOS = useCallback(async (opts = {}) => {
    if (!isActiveRef.current && !isRecordingRef.current) return;
    const { silent = false } = opts;

    isRecordingRef.current = false;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        console.log('[SOS] sending stop_audio_recording, total bytes sent:', bytesRef.current);
        wsRef.current.send(JSON.stringify({
          type: 'stop_audio_recording',
          incident_id: incidentIdRef.current,
        }));
      } catch (err) {
        console.warn('[SOS] failed to send stop message', err);
      }
    }

    await cleanup();
    setSosStatus('idle');

    if (!silent) {
      // Stays silent — caller (auto-stop) handles its own alert; manual stop
      // doesn't need one.
    }
  }, [cleanup]);

  const startCountdown = useCallback(() => {
    clearCountdown();
    sessionStartedAtRef.current = Date.now();
    setRemainingSeconds(maxDurationSecondsRef.current);

    countdownIntervalRef.current = setInterval(() => {
      const startedAt = sessionStartedAtRef.current;
      if (!startedAt) return;
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, maxDurationSecondsRef.current - elapsed);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearCountdown();
        // Auto-stop with a user-facing notice.
        stopSOS({ silent: true }).finally(() => {
          Alert.alert(
            'SOS Ended',
            'The SOS session reached the estimated trip duration. Tap SOS to start a new session if needed.'
          );
        });
      }
    }, 1000);
  }, [clearCountdown, stopSOS]);

  // Opens the WebSocket and wires onopen/onerror/onclose. Called from both
  // the initial start and the single reconnect attempt.
  const openWebSocket = useCallback(async (incidentId, isReconnect) => {
    let token = await getValidToken();
    if (!token) {
      // Try once more after a brief delay — token may still be refreshing.
      await new Promise((r) => setTimeout(r, 1000));
      token = await getValidToken();
    }
    if (!token) {
      Alert.alert('SOS Failed', 'Authentication error. Please try again.');
      await cleanup();
      setSosStatus('idle');
      return;
    }

    const ws = new WebSocket(`${WSS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log(`[SOS] WS open (${isReconnect ? 'reconnect' : 'initial'}) — incident_id:`, incidentId);
      try {
        ws.send(JSON.stringify({
          type: 'start_audio_recording',
          incident_id: incidentId,
        }));
      } catch (err) {
        console.warn('[SOS] failed to send start_audio_recording', err);
      }

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.warn('[SOS] could not set audio mode', err);
      }

      // Flush any chunks that were buffered while we were reconnecting.
      flushPendingChunks();

      if (!isReconnect) {
        isRecordingRef.current = true;
        startCountdown();
        sendChunk();
      } else {
        // On reconnect, recording loop is already running; just resume status.
        isRecordingRef.current = true;
      }
      setSosStatus('recording');
    };

    ws.onerror = (event) => {
      console.error('[SOS] WebSocket error', event?.message || '');
    };

    ws.onclose = () => {
      console.log('[SOS] WS closed', { isRecording: isRecordingRef.current, reconnectAttempted: reconnectAttemptedRef.current });
      if (!isRecordingRef.current) return;

      if (!reconnectAttemptedRef.current) {
        reconnectAttemptedRef.current = true;
        setSosStatus('connecting');
        console.log('[SOS] attempting one reconnect');
        openWebSocket(incidentId, true).catch((err) => {
          console.error('[SOS] reconnect failed', err);
          isRecordingRef.current = false;
          cleanup().then(() => {
            setSosStatus('error');
            Alert.alert('SOS Disconnected', 'The connection was lost. Please try again.');
          });
        });
        return;
      }

      isRecordingRef.current = false;
      cleanup().then(() => {
        setSosStatus('error');
        Alert.alert('SOS Disconnected', 'The connection was lost. Please try again.');
      });
    };
  }, [cleanup, flushPendingChunks, getValidToken, sendChunk, startCountdown]);

  const startSOS = useCallback(async () => {
    if (isActiveRef.current) return;
    if (!rideId) {
      Alert.alert('SOS Failed', 'Ride ID is missing.');
      return;
    }

    isActiveRef.current = true;
    setSosStatus('connecting');
    bytesRef.current = 0;
    setBytesStreamed(0);
    reconnectAttemptedRef.current = false;
    pendingChunksRef.current = [];

    const { status: micStatus } = await Audio.requestPermissionsAsync();
    if (micStatus !== 'granted') {
      isActiveRef.current = false;
      setSosStatus('idle');
      Alert.alert(
        'Microphone Permission Required',
        'Microphone access is required for SOS audio. Open Settings to enable it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    // Capture location + estimated trip duration. Never blocks SOS.
    const { maxDurationSeconds, location } = await computeMaxDurationAndLocation();
    maxDurationSecondsRef.current = maxDurationSeconds;

    // Reuse the incident_id from a previous SOS session on this ride (in-memory
    // first, then AsyncStorage so it survives app restarts within the same ride).
    let incidentId = incidentIdRef.current;
    if (!incidentId) {
      try {
        incidentId = await AsyncStorage.getItem(incidentKey(rideId));
      } catch (e) {
        console.warn('[SOS] AsyncStorage read error', e);
      }
    }

    if (!incidentId) {
      try {
        const data = await sendSOSRequest(rideId, {
          location: location || undefined,
          estimated_duration_seconds: maxDurationSeconds,
        });
        incidentId = data?.incident_id;
        if (!incidentId) throw new Error('No incident_id in response');
        try {
          await AsyncStorage.setItem(incidentKey(rideId), incidentId);
        } catch (e) {
          console.warn('[SOS] AsyncStorage write error', e);
        }
      } catch (err) {
        console.error('[SOS] HTTP error:', err);
        isActiveRef.current = false;
        setSosStatus('idle');
        Alert.alert('SOS Failed', 'Could not create SOS record. Please try again.');
        return;
      }
    }

    incidentIdRef.current = incidentId;

    await openWebSocket(incidentId, false);
  }, [rideId, computeMaxDurationAndLocation, openWebSocket]);

  const toggleSOS = useCallback(() => {
    if (sosStatus === 'idle' || sosStatus === 'error') {
      startSOS();
    } else if (sosStatus === 'recording') {
      stopSOS();
    }
  }, [sosStatus, startSOS, stopSOS]);

  // If the ride changes (end, cancel, new ride), stop any in-flight SOS and
  // clear the stored incident_id for the previous ride.
  useEffect(() => {
    const prev = prevRideIdRef.current;
    prevRideIdRef.current = rideId;
    if (!prev || prev === rideId) return;

    if (isRecordingRef.current || isActiveRef.current) {
      console.log('[SOS] ride changed mid-session — stopping');
      stopSOS({ silent: true }).catch(() => { });
    }
    AsyncStorage.removeItem(incidentKey(prev)).catch((e) =>
      console.warn('[SOS] AsyncStorage remove error', e)
    );
    incidentIdRef.current = null;
  }, [rideId, stopSOS]);

  // Surface a warning if the app is backgrounded mid-session — on iOS the
  // OS may suspend the recording. (Android foreground-service work is
  // tracked separately.)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && isRecordingRef.current) {
        console.warn('[SOS] app backgrounded during active session — recording may be suspended on iOS');
      }
    });
    return () => sub.remove();
  }, []);

  // Final cleanup on unmount.
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      clearCountdown();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (_) { }
        wsRef.current = null;
      }
      Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => { });
    };
  }, [clearCountdown]);

  return { sosStatus, toggleSOS, bytesStreamed, remainingSeconds };
}
