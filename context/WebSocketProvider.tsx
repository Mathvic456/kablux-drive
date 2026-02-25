import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from "../screens/context/NavigationContext";
import { useDriverRide } from "./DriverRideContext";
import { useAuth } from "./AuthContext";

const WSS_URL = process.env.EXPO_PUBLIC_WSS_URL;

// --- Types ---
interface RideNotification {
  ride_request_id: string;
  notification_type: string;
  ride_type: string;
  message: string;
  rider_name?: string;
  rider_rating?: string;
  time_to_pickup?: string;
  address?: string;
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
  // FIX: shouldReconnect controls ONLY reconnect-on-drop, not user intent.
  // isOnlineRef tracks user intent so we never reconnect when user chose offline.
  const shouldReconnect = useRef(false);
  const isOnlineRef = useRef(false);
  const sentOffersRef = useRef<Map<string, RideNotification>>(new Map());
  const currentRideIdRef = useRef<string | null>(null);

  // FIX: Toggling is tracked separately to prevent double-fires causing flicker.
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

  useEffect(() => {
    console.log("🔄 [WSP_DRIVER] rideId changed:", rideId);
    currentRideIdRef.current = rideId;
  }, [rideId]);

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
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
  };

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
  // FIX: Guard with isTogglingRef so rapid taps don't cause flicker or double-connect.
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

        const validToken = await getValidToken();
        if (validToken) {
          connectWebSocket(validToken);
        } else {
          console.error("❌ [TOGGLE] No valid token, reverting online intent");
          isOnlineRef.current = false;
          shouldReconnect.current = false;
        }
      }
    } finally {
      isTogglingRef.current = false;
    }
  };

  // --- NOTIFICATION PARSING ---
  // FIX: Expanded field name fallbacks so offers aren't silently dropped.
  const parseRideNotification = (data: any): RideNotification | null => {
    try {
      console.log("🛠️ [PARSING] Raw data:", JSON.stringify(data, null, 2));

      // FIX: Accept all known field name variants from the server
      const finalId =
        data.ride_request_id ||
        data.ride_id ||
        data.request_id ||
        data.id ||
        null;

      if (!finalId) {
        console.warn("⚠️ [PARSE FAILED] No ride ID found in any known field. Full payload:", JSON.stringify(data));
        return null;
      }

      const offerMatch = data.message?.match(/Rider offer:\s*([\d.]+)/);
      const distanceVal = data.distance
        ? parseFloat(data.distance)
        : data.distance_km
          ? parseFloat(data.distance_km)
          : undefined;

      const timeCalc = distanceVal ? String((distanceVal / 0.5) * 60) : "0";

      const parsed: RideNotification = {
        ride_request_id: finalId,
        notification_type: data.type || "RIDE_REQUESTED",
        ride_type: data.ride_type || "standard",
        message: data.message || "",
        rider_name: data.rider_name || "Unknown Rider",
        rider_rating: data.rider_rating || "4.5",
        time_to_pickup: timeCalc,
        address: data.pickup || data.pickup_address || data.address || "Address not provided",
        offer_amount: offerMatch
          ? parseFloat(offerMatch[1])
          : data.offer_amount ?? data.fare ?? 0,
        estimated_fare: data.estimated_fare ?? data.fare,
        distance_km: distanceVal,
      };

      console.log("✅ [PARSED] Notification ready:", parsed.ride_request_id);
      return parsed;
    } catch (err) {
      console.error("❌ [PARSE ERROR]", err);
      return null;
    }
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
    // FIX: Don't open a new socket if one is already open/connecting
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
        if (msg.type === "notify" && msg.data) {
          console.log("🔔 [WS_DRIVER] Forwarding to DriverRideContext:", msg.data.type);
          handleWsEvent(msg);
        }

        // FIX: Handle RIDE_REQUESTED at both possible levels in the payload
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
        }

        console.log("📩 [WS_DRIVER] ================================");
      } catch (err) {
        console.error("❌ [WS_DRIVER] Message parse error:", err);
      }
    };

    socket.onclose = (e) => {
      console.log(`🚪 [WS_DRIVER] Closed. Code: ${e.code}, Reason: ${e.reason || "None"}`);
      setIsConnected(false);

      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }

      // FIX: Only reconnect if user intent is still "online"
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

      // FIX: Restart location tracking on reconnect (was missing before)
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

  // --- MOUNT / UNMOUNT ---
  useEffect(() => {
    console.log("🎬 [LIFECYCLE] Driver WebSocketProvider Mounted");

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === 'granted') {
        console.log("✅ [INIT] Permission already granted, auto-connecting...");
        isOnlineRef.current = true;
        shouldReconnect.current = true;
        await startLocationTracking();
        const validToken = await getValidToken();
        if (validToken) connectWebSocket(validToken);
      } else {
        console.log("⏸️ [INIT] No permission yet, waiting for user action");
      }
    })();

    return () => {
      console.log("🧹 [LIFECYCLE] WebSocketProvider Unmounting");
      isOnlineRef.current = false;
      shouldReconnect.current = false;
      ws.current?.close();
      stopLocationTracking();
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