import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from "../screens/context/NavigationContext";
import { useDriverRide } from "./DriverRideContext";
import { useAuth } from "./AuthContext";
import { playMessageSound } from "../utils/PlayMessageSound";
import { authEvents } from "../utils/authEvents";
import { fetchProfileStatus } from "../services/profile.service";
import { parseRideRequest } from "../utils/notificationMapper";
import { requestBatteryOptimizationExemption } from "../services/batteryOptimization";
import {
  startLocationBeacon,
  stopLocationBeacon,
  ensureBackgroundPermission,
} from "../services/locationBeacon";
import { useNotifications } from "../services/notification.service";

const WSS_URL = process.env.EXPO_PUBLIC_WSS_URL;

// --- Types ---
interface RideNotification {
  ride_request_id: string;
  ride_id?: string | null;
  notification_type: string;
  ride_type: string;
  message: string;
  rider_name?: string;
  rider_rating?: string;
  time_to_pickup?: string;
  pickup?: string;
  dropoff?: string;
  offer_amount?: number;
  estimated_fare?: number;
  distance_km?: number;
}

interface SocketContextValue {
  socket: WebSocket | null;
  isConnected: boolean;
  rideNotifications: RideNotification[];
  setRideNotifications: React.Dispatch<React.SetStateAction<RideNotification[]>>;
  currentLocation: { lat: number; long: number } | null;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  clearNotification: (rideId: string) => void;
  clearAllNotifications: () => void;
  sentOffers: Map<string, RideNotification>;
  saveSentOffer: (rideId: string, offer: RideNotification) => void;
  getSentOffer: (rideId: string) => RideNotification | undefined;
  locationPermission: string | null;
  chatMessages: Record<string, any[]>;
  sendChatMessage: (rideId: string, text: string) => Promise<void>;
  toggleOnlineStatus: () => Promise<void>;
  // Exposed so Home can call the server-side status update alongside the WS toggle
  goOnlineOnServer: () => Promise<void>;
  goOfflineOnServer: () => Promise<void>;
}

export const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('🏗️ [WSP_DRIVER] WebSocketProvider rendering...');

  // Refs
  const ws = useRef<WebSocket | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);
  const currentLocationRef = useRef<{ lat: number; long: number } | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryAttempts = useRef(0);
  const maxRetryDelay = 30000;
  const shouldReconnect = useRef(false);
  const isOnlineRef = useRef(false); // tracks user intent (online/offline)
  const sentOffersRef = useRef<Map<string, RideNotification>>(new Map());
  const currentRideIdRef = useRef<string | null>(null);

  const isTogglingRef = useRef(false);

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [rideNotifications, setRideNotifications] = useState<RideNotification[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; long: number } | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [, forceUpdate] = useState(0);
  const [locationPermission, setLocationPermission] = useState<string>('undetermined');
  const { token, getValidToken, clearTokens } = useAuth();
  const { rideId, handleWsEvent } = useDriverRide();
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const { data: notifications } = useNotifications(!!token);


  useEffect(() => {
    console.log("🔄 [WSP_DRIVER] rideId changed:", rideId);
    currentRideIdRef.current = rideId;
  }, [rideId]);

  // --- LOGOUT LOGIC ---
  const handleLogout = useCallback(async () => {
    console.log("🚪 [LOGOUT] Session expired - cleaning up everything...");
    isOnlineRef.current = false;
    shouldReconnect.current = false;

    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    stopLocationTracking();
    await clearTokens();
    setSessionExpired(true);

    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' as never }] });
      }
    }, 100);
  }, [clearTokens]); // only clearTokens is external; everything else is refs/local state

  // --- SERVER STATUS HELPERS ---
  // These are intentionally no-ops here; Home wires them to activeStatusMutation.
  // Exposed on context so callers can coordinate both WS + server status together.
  const goOnlineOnServer = async () => {
    // Implemented by consumer (Home) via activeStatusMutation
  };
  const goOfflineOnServer = async () => {
    // Implemented by consumer (Home) via activeStatusMutation
  };

  // --- TOGGLE ONLINE/OFFLINE ---
  const toggleOnlineStatus = async () => {
    if (isTogglingRef.current) {
      console.log("⚠️ [TOGGLE] Already toggling, ignoring duplicate call");
      return;
    }
    isTogglingRef.current = true;

    try {
      if (isOnlineRef.current) {
        // --- GO OFFLINE ---
        console.log("[USER ACTION] Going offline");
        isOnlineRef.current = false;
        shouldReconnect.current = false;

        if (retryTimeout.current) {
          clearTimeout(retryTimeout.current);
          retryTimeout.current = null;
        }

        stopLocationTracking();
        stopLocationBeacon().catch(() => { });

        if (ws.current) {
          ws.current.close();
          ws.current = null;
        }

        // State is set AFTER cleanup, not before, to prevent flicker.
        setIsConnected(false);
        setRideNotifications([]);

      } else {
        // --- GO ONLINE ---
        console.log("[USER ACTION] Going online");

        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);

        if (status !== 'granted') {
          console.warn("🚫 [PERMISSION] Location denied, cannot go online");
          return; // Don't set isOnlineRef - stay offline
        }

        isOnlineRef.current = true;
        shouldReconnect.current = true;

        await startLocationTracking();

        // Best-effort background beacon: prompts for "Always" location the
        // first time. If the user declines, we fall back to foreground-only
        // tracking — going online still succeeds.
        const bgGranted = await ensureBackgroundPermission();
        if (bgGranted) {
          await startLocationBeacon();
        } else {
          console.warn("🛰️ [BEACON] Background permission not granted; foreground-only");
        }

        const validToken = await getValidToken();
        if (validToken) {
          connectWebSocket(validToken);
        } else {
          console.error("❌ [TOGGLE] No valid token, reverting online intent");
          isOnlineRef.current = false;
          shouldReconnect.current = false;
        }

        // One-shot (cooldown-gated) prompt to whitelist the app from
        // battery optimization. Ensures FCM + the on-duty foreground
        // service (locationBeacon) survive OEM background killers. Runs
        // after the connect attempt so it doesn't block going online.
        requestBatteryOptimizationExemption().catch((err) => {
          console.warn("🔋 [BatteryOpt] prompt failed (non-fatal):", err);
        });
      }
    } finally {
      isTogglingRef.current = false;
    }
  };

  // --- NOTIFICATION PARSING ---
  const parseRideNotification = (data: any): RideNotification | null => {
    console.log("🛠️ [PARSING] Raw data:", JSON.stringify(data, null, 2));
    const parsed = parseRideRequest(data);
    if (parsed) {
      console.log("✅ [PARSED] Notification ready:", parsed.ride_request_id);
    } else {
      console.warn("⚠️ [PARSE FAILED] Could not parse notification. Full payload:", JSON.stringify(data));
    }
    return parsed as RideNotification | null;
  };

  // --- MAP STORAGE (SENT OFFERS) ---
  const saveSentOffer = (rideId: string, offer: RideNotification) => {
    sentOffersRef.current.set(rideId, offer);
    forceUpdate(v => v + 1);
  };

  const getSentOffer = (rideId: string) => {
    return sentOffersRef.current.get(rideId);
  };

  // --- LOCATION LOGIC ---
  const sendLocationUpdate = (socket: WebSocket, location: { lat: number; long: number }) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "location_update",
        data: { lat: location.lat, long: location.long },
      }));
      console.log("📍 [LOCATION] Sent:", location);
    }
  };

  const startLocationTracking = async () => {
    console.log("🛰️ [LOCATION] Initializing...");
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: loc.coords.latitude, long: loc.coords.longitude };
      setCurrentLocation(coords);
      currentLocationRef.current = coords;

      if (ws.current?.readyState === WebSocket.OPEN) {
        sendLocationUpdate(ws.current, coords);
      }

      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 50 },
        (location) => {
          const newCoords = {
            lat: location.coords.latitude,
            long: location.coords.longitude,
          };
          setCurrentLocation(newCoords);
          currentLocationRef.current = newCoords;

          if (ws.current?.readyState === WebSocket.OPEN) {
            sendLocationUpdate(ws.current, newCoords);
          }
        }
      );
      console.log("✅ [LOCATION] Tracking active");
    } catch (err) {
      console.error("❌ [LOCATION] Error:", err);
    }
  };

  const stopLocationTracking = () => {
    console.log("🛑 [LOCATION] Stopping...");
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  // --- CHAT ---
  const sendChatMessage = async (rideId: string, text: string) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage = {
      id: tempId,
      text,
      sender: 'driver',
      timestamp: new Date(),
    };

    setChatMessages(prev => {
      const existing = prev[rideId] || [];
      if (existing.some(m => m.id === tempId)) return prev;
      return { ...prev, [rideId]: [...existing, newMessage] };
    });

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "send_message",
        data: { ride_id: rideId, message: text },
      }));
    }
  };

  // --- WEBSOCKET LIFECYCLE ---
  const connectWebSocket = async (accessToken: string) => {
    if (
      ws.current &&
      (ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING)
    ) {
      console.log("⚠️ [WS] Socket already open/connecting, skipping duplicate connect");
      return;
    }

    if (ws.current) {
      ws.current.close();
    }

    console.log(`🔌 [WS] Connecting to: ${WSS_URL}`);
    const socket = new WebSocket(`${WSS_URL}?token=${accessToken}`);
    ws.current = socket;

    socket.onopen = () => {
      console.log("✅ [WS] Connected (Driver)");
      setIsConnected(true);
      retryAttempts.current = 0;

      // Send current location immediately on connect
      if (currentLocationRef.current) {
        sendLocationUpdate(socket, currentLocationRef.current);
      }

      locationInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN && currentLocationRef.current) {
          sendLocationUpdate(ws.current, currentLocationRef.current);
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("[WS_DRIVER] ========== NEW MESSAGE ==========");
        console.log("[WS_DRIVER] Type:", msg.type);
        console.log("[WS_DRIVER] Full payload:", JSON.stringify(msg, null, 2));

        // Forward ALL notify events to DriverRideContext
        if ((msg.type === "notify" || msg.type === "negotiation_update") && msg.data) {
          console.log("🔔 [WS_DRIVER] Forwarding to DriverRideContext:", msg.data.type);
          handleWsEvent(msg);
        }

        const isRideRequested =
          (msg.type === "notify" && msg.data?.type === "RIDE_REQUESTED") ||
          msg.type === "RIDE_REQUESTED";

        if (isRideRequested) {
          console.log("🚗 [WS_DRIVER] New ride request detected!");
          // Data can be at msg.data or msg itself
          const rawData = msg.data || msg;
          const notification = parseRideNotification(rawData);

          if (notification) {
            setRideNotifications(prev => {
              if (prev.some(n => n.ride_request_id === notification.ride_request_id)) {
                console.log("⚠️ [WS_DRIVER] Duplicate notification, ignoring:", notification.ride_request_id);
                return prev;
              }
              console.log("✅ [WS_DRIVER] Adding notification:", notification.ride_request_id);
              return [...prev, notification];
            });
          }
        } else if (msg.event === "ride_cancelled") {
          handleWsEvent(msg);
        } else if (msg.type === "error" && msg.message?.includes("expired")) {
          console.error("🔑 [WS_DRIVER] Auth expired");
          handleLogout();
        } else if (msg.type === "chat_message" && msg.message) {
          const { id, content, sender_role, created_at } = msg.message;
          const activeRideId = currentRideIdRef.current;

          if (activeRideId) {
            const newMessage = {
              id: String(id),
              text: content,
              sender: sender_role === 'rider' ? 'rider' : 'driver',
              timestamp: new Date(created_at),
            };

            setChatMessages(prev => {
              const existing = prev[activeRideId] || [];
              if (existing.some(m => m.id === String(id))) return prev;

              const cleanExisting = existing.filter(m => {
                const isTemp = m.id.startsWith('temp_');
                const isSameContent = m.text === content;
                return !(isTemp && isSameContent);
              });

              return { ...prev, [activeRideId]: [...cleanExisting, newMessage] };
            });
          }
        } else {
          console.log("⚠️ [WS_DRIVER] Unhandled message type:", msg.type);
          console.log("⚠️ [WS_DRIVER] Unhandled message type:", msg);
        }

        console.log("📩 [WS_DRIVER] ================================");
      } catch (err) {
        console.error("❌ [WS_DRIVER] Message parse error:", err);
      } finally {
        playMessageSound()
      }
    };

    socket.onclose = (e) => {
      console.log(`🚪 [WS_DRIVER] Closed. Code: ${e.code}, Reason: ${e.reason || "None"}`);
      setIsConnected(false);

      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }

      if (shouldReconnect.current && isOnlineRef.current) {
        scheduleRetry();
      } else {
        console.log("🛑 [WS] Not reconnecting - user is offline or session ended");
      }
    };

    socket.onerror = (err) => {
      console.error("⚠️ [WS_DRIVER] Socket error:", err);
    };
  };

  const scheduleRetry = () => {
    if (!shouldReconnect.current || !isOnlineRef.current) return;
    if (retryTimeout.current) clearTimeout(retryTimeout.current);

    const delay = Math.min(1000 * Math.pow(2, retryAttempts.current), maxRetryDelay);
    console.log(`⏰ [RETRY] Attempt ${retryAttempts.current + 1} in ${delay}ms`);
    retryAttempts.current++;

    retryTimeout.current = setTimeout(async () => {
      if (!isOnlineRef.current) {
        console.log("🛑 [RETRY] User went offline, cancelling retry");
        return;
      }

      console.log("🔄 [RETRY] Reconnecting...");

      if (!locationSubscription.current) {
        await startLocationTracking();
      }

      const validToken = await getValidToken();
      if (validToken) {
        connectWebSocket(validToken);
      } else {
        console.log("❌ [RETRY] No valid token");
        scheduleRetry();
      }
    }, delay);
  };

  // --- LOGOUT EVENT LISTENER ---
  useEffect(() => {
    authEvents.onLogout(handleLogout);
    return () => {
      authEvents.offLogout();
    };
  }, [handleLogout]);

  // --- AppState listener for reconnection on foreground return ---
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // Only act when transitioning from background/inactive to active
      if (
        (previousState === "background" || previousState === "inactive") &&
        nextAppState === "active"
      ) {
        console.log("📱 [APPSTATE] App returned to foreground");

        // Only reconnect if the driver intended to be online
        if (!isOnlineRef.current) {
          console.log("⏸️ [APPSTATE] Driver is offline, skipping reconnect");
          return;
        }

        // Check if socket is still alive
        if (
          ws.current &&
          ws.current.readyState === WebSocket.OPEN
        ) {
          console.log("✅ [APPSTATE] Socket still open, sending location ping");
          if (currentLocationRef.current) {
            sendLocationUpdate(ws.current, currentLocationRef.current);
          }
          return;
        }

        // Socket is dead or closing — reconnect
        console.log("🔄 [APPSTATE] Socket not open, reconnecting...");
        shouldReconnect.current = true;

        // Restart location tracking if it stopped
        if (!locationSubscription.current) {
          await startLocationTracking();
        }

        const validToken = await getValidToken();
        if (validToken) {
          connectWebSocket(validToken);
        } else {
          console.error("❌ [APPSTATE] No valid token for reconnect");
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [getValidToken]);

  // --- MOUNT / UNMOUNT ---
  useEffect(() => {
    console.log("🎬 [LIFECYCLE] Driver WebSocketProvider Mounted");

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== 'granted') {
        console.log("⏸️ [INIT] No permission yet, waiting for user action");
        return;
      }

      // Check server-side online status before auto-connecting
      const validToken = await getValidToken();
      if (!validToken) {
        console.log("⏸️ [INIT] No valid token, waiting for auth");
        return;
      }

      try {
        const { is_online } = await fetchProfileStatus();
        console.log(`📡 [INIT] Server online status: ${is_online}`);

        if (is_online) {
          console.log("✅ [INIT] Server says online, reconnecting...");
          isOnlineRef.current = true;
          shouldReconnect.current = true;
          await startLocationTracking();
          // Resume beacon silently if user already granted bg permission in a
          // prior session. Don't re-prompt here.
          const bg = await Location.getBackgroundPermissionsAsync();
          if (bg.status === "granted") {
            await startLocationBeacon();
          }
          connectWebSocket(validToken);
        } else {
          console.log("⏸️ [INIT] Server says offline, staying offline");
        }
      } catch (err) {
        console.error("❌ [INIT] Failed to fetch profile status, staying offline:", err);
      }
    })();

    return () => {
      console.log("🧹 [LIFECYCLE] WebSocketProvider Unmounting");
      isOnlineRef.current = false;
      shouldReconnect.current = false;
      ws.current?.close();
      stopLocationTracking();
      stopLocationBeacon().catch(() => { });
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: ws.current,
        isConnected,
        rideNotifications,
        setRideNotifications,
        currentLocation,
        sessionExpired,
        clearSessionExpired: () => setSessionExpired(false),
        clearNotification: (id) =>
          setRideNotifications(prev =>
            prev.filter(n => n.ride_request_id !== id)
          ),
        clearAllNotifications: () => setRideNotifications([]),
        sentOffers: sentOffersRef.current,
        saveSentOffer,
        getSentOffer,
        locationPermission,
        toggleOnlineStatus,
        goOnlineOnServer,
        goOfflineOnServer,
        chatMessages,
        sendChatMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};