import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { sendSOSRequest } from '../services/sos.service';
import { WSS_URL } from '../constants/api';

const incidentKey = (rideId) => `sos_incident_${rideId}`;

const CHUNK_DURATION_MS = 2000;

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

export function useSOSAudio(rideId) {
  const [sosStatus, setSosStatus] = useState('idle');
  const [bytesStreamed, setBytesStreamed] = useState(0);

  const { getValidToken } = useAuth();

  const isActiveRef = useRef(false);
  const isRecordingRef = useRef(false);
  const wsRef = useRef(null);
  // In-memory cache so we don't hit AsyncStorage on every stop/start within a session.
  const incidentIdRef = useRef(null);
  const bytesRef = useRef(0);
  const prevRideIdRef = useRef(rideId);

  // When the ride changes (end, cancel, new ride), clear the stored incident_id.
  useEffect(() => {
    const prev = prevRideIdRef.current;
    prevRideIdRef.current = rideId;

    if (prev && prev !== rideId) {
      AsyncStorage.removeItem(incidentKey(prev)).catch(() => { });
      incidentIdRef.current = null;
    }
  }, [rideId]);

  const cleanup = useCallback(async () => {
    isRecordingRef.current = false;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (_) { }

    // Intentionally NOT clearing incidentIdRef or AsyncStorage here —
    // the incident_id is reused across stop/restart within the same ride.
    bytesRef.current = 0;
    isActiveRef.current = false;
  }, []);

  const sendChunk = useCallback(async () => {
    if (!isRecordingRef.current) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

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
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      wsRef.current.send(arrayBuffer);

      bytesRef.current += arrayBuffer.byteLength;
      setBytesStreamed(bytesRef.current);
      console.log(`[SOS] chunk sent — ${arrayBuffer.byteLength} bytes | total ${bytesRef.current} bytes`);
    } catch (err) {
      if (recordingInstance) {
        await recordingInstance.stopAndUnloadAsync().catch(() => { });
      }
      console.error('[SOS] chunk error:', err);
    }

    if (isRecordingRef.current) {
      sendChunk();
    }
  }, []);

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

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Microphone access is required for SOS audio.');
      isActiveRef.current = false;
      setSosStatus('idle');
      return;
    }

    // Reuse the incident_id from a previous SOS session on this ride (in-memory first,
    // then AsyncStorage so it survives app restarts within the same ride).
    let incidentId = incidentIdRef.current;
    if (!incidentId) {
      try {
        incidentId = await AsyncStorage.getItem(incidentKey(rideId));
      } catch (_) { }
    }

    if (!incidentId) {
      try {
        const data = await sendSOSRequest(rideId);
        incidentId = data?.incident_id;
        if (!incidentId) throw new Error('No incident_id in response');
        await AsyncStorage.setItem(incidentKey(rideId), incidentId);
      } catch (err) {
        console.error('[SOS] HTTP error:', err);
        Alert.alert('SOS Failed', 'Could not create SOS record. Please try again.');
        isActiveRef.current = false;
        setSosStatus('idle');
        return;
      }
    }

    incidentIdRef.current = incidentId;

    const token = await getValidToken();
    if (!token) {
      Alert.alert('SOS Failed', 'Authentication error. Please try again.');
      isActiveRef.current = false;
      setSosStatus('idle');
      return;
    }

    const ws = new WebSocket(`${WSS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log('[SOS] WS open — sending start_audio_recording, incident_id:', incidentId);
      ws.send(JSON.stringify({
        type: 'start_audio_recording',
        incident_id: incidentId,
      }));

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      isRecordingRef.current = true;
      setSosStatus('recording');
      sendChunk();
    };

    ws.onerror = () => {
      console.error('[SOS] WebSocket error');
      isRecordingRef.current = false;
      cleanup().then(() => {
        setSosStatus('error');
        Alert.alert('SOS Error', 'Connection failed. Please try again.');
      });
    };

    ws.onclose = () => {
      if (isRecordingRef.current) {
        // Unexpected close during active session
        isRecordingRef.current = false;
        cleanup().then(() => {
          setSosStatus('error');
          Alert.alert('SOS Disconnected', 'The connection was lost. Please try again.');
        });
      }
    };
  }, [rideId, getValidToken, sendChunk, cleanup]);

  const stopSOS = useCallback(async () => {
    if (!isActiveRef.current) return;

    isRecordingRef.current = false;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[SOS] sending stop_audio_recording, total bytes sent:', bytesRef.current);
      wsRef.current.send(JSON.stringify({
        type: 'stop_audio_recording',
        incident_id: incidentIdRef.current
      }));
    }

    await cleanup();
    setSosStatus('idle');
  }, [cleanup]);

  const toggleSOS = useCallback(() => {
    if (sosStatus === 'idle' || sosStatus === 'error') {
      startSOS();
    } else if (sosStatus === 'recording') {
      stopSOS();
    }
  }, [sosStatus, startSOS, stopSOS]);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => { });
    };
  }, []);

  return { sosStatus, toggleSOS, bytesStreamed };
}
