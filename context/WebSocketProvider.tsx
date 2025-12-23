import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
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
  sentOffers: Map<string, RideNotification>; // ✅ Fixed: Point to actual Map
  saveSentOffer: (rideId: string, offer: RideNotification) => void;
  getSentOffer: (rideId: string) => RideNotification | undefined;
  locationPermission: string | null; // 'granted', 'denied', 'undetermined'
  goOnline: () => Promise<void>;
  chatMessages: Record<string, any[]>;
  sendChatMessage: (rideId: string, text: string) => Promise<void>;
}

export const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('🏗️ WebSocketProvider rendering...');
  
  // Refs
  const ws = useRef<WebSocket | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);
  const currentLocationRef = useRef<{ lat: number; long: number } | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryAttempts = useRef(0);
  const maxRetryDelay = 30000;
  const shouldReconnect = useRef(true);
  const sentOffersRef = useRef<Map<string, RideNotification>>(new Map());

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [rideNotifications, setRideNotifications] = useState<RideNotification[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; long: number } | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [, forceUpdate] = useState(0); // For forcing re-render when Map changes
  const [locationPermission, setLocationPermission] = useState<string>('undetermined');
  const { token, getValidToken, clearTokens } = useAuth();
  const [hasInitialized, setHasInitialized] = useState(false);
  const { rideId } = useDriverRide(); // Add after all your other refs/state
const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    console.log("🚪 [LOGOUT] Session expired - cleaning up everything...");
    shouldReconnect.current = false;

    if (retryTimeout.current) {
      console.log("⏰ [LOGOUT] Clearing pending retry timeout");
      clearTimeout(retryTimeout.current);
    }

    if (ws.current) {
      console.log("🔌 [LOGOUT] Closing active socket");
      ws.current.close();
      ws.current = null;
    }

    stopLocationTracking();
    await clearTokens();
    setSessionExpired(true);

    setTimeout(() => {
      if (navigationRef.isReady()) {
        console.log("🚀 [LOGOUT] Navigating to Login screen");
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' as never }] });
      }
    }, 100);
  };

const goOnline = async () => {
  console.log("👆 [USER ACTION] goOnline clicked");
  
  const { status } = await Location.requestForegroundPermissionsAsync();
  setLocationPermission(status);

  if (status !== 'granted') {
    console.warn("🚫 [PERMISSION] User denied location");
    return;
  }

  if (!hasInitialized) {
    setHasInitialized(true);
    await startLocationTracking();
    const validToken = await getValidToken();
    if (validToken) connectWebSocket(validToken);
  }
};

  const parseRideNotification = (data: any): RideNotification | null => {
    try {
      console.log("🛠️ [PARSING] Attempting to parse raw data:", data);
      const offerMatch = data.message?.match(/Rider offer:\s*([\d.]+)/);
      const distanceVal = data.distance ? parseFloat(data.distance) : undefined;
      const timeCalc = distanceVal ? String((distanceVal / 0.5) * 60) : "0";

      const finalId = data.ride_id || data.ride_request_id;
      if (!finalId) {
        console.warn("⚠️ [PARSE FAILED] Missing ride_id in payload:", data);
        return null;
      }

      const parsed = {
        ride_request_id: finalId,
        notification_type: data.type || "RIDE_REQUESTED",
        ride_type: data.ride_type || "standard",
        message: data.message || "",
        rider_name: data.rider_name || "Unknown Rider",
        rider_rating: data.rider_rating || "4.5",
        time_to_pickup: timeCalc,
        address: data.pickup || data.pickup_address || "Address not provided",
        offer_amount: offerMatch ? parseFloat(offerMatch[1]) : (data.fare || 0),
        estimated_fare: data.fare,
        distance_km: distanceVal,
      };
      console.log("✅ [PARSED] Successfully formatted notification:", parsed.ride_request_id);
      return parsed;
    } catch (err) {
      console.error("❌ [PARSE ERROR] Fatal error during parsing:", err);
      return null;
    }
  };

  // --- MAP STORAGE (SENT OFFERS) ---
  const saveSentOffer = (rideId: string, offer: RideNotification) => {
    console.log(`💾 [STORAGE] Saving offer for ride: ${rideId}`);
    sentOffersRef.current.set(rideId, offer);
    console.log(`📊 [STORAGE] Map entries: ${sentOffersRef.current.size}. Keys:`, Array.from(sentOffersRef.current.keys()));
    forceUpdate(v => v + 1); // Ensure context consumers see the update
  };

  const getSentOffer = (rideId: string) => {
    console.log(`🔍 [STORAGE] Looking for ride: ${rideId}`);
    const result = sentOffersRef.current.get(rideId);
    result ? console.log("✅ [STORAGE] Offer found") : console.log("❌ [STORAGE] Offer not found");
    return result;
  };

  // --- LOCATION LOGIC ---
  const sendLocationUpdate = (socket: WebSocket, location: { lat: number; long: number }) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "location_update",
        data: { lat: location.lat, long: location.long },
      }));
      console.log("📍 [LOCATION] Sent to server:", location);
    } else {
      console.log("📍 [LOCATION] WebSocket not open, update skipped. State:", socket.readyState);
    }
  };

  const startLocationTracking = async () => {
    console.log("🛰️ [LOCATION] Initializing tracking...");
    try {

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: loc.coords.latitude, long: loc.coords.longitude };
      
      setCurrentLocation(coords);
      currentLocationRef.current = coords;

      if (ws.current?.readyState === WebSocket.OPEN) {
        sendLocationUpdate(ws.current, coords);
      }

      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 50 },
        (location) => {
          const newCoords = { lat: location.coords.latitude, long: location.coords.longitude };
          console.log("📍 [LOCATION] Watch update:", newCoords);
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
    console.log("🛑 [LOCATION] Stopping tracking...");
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  const sendChatMessage = async (rideId: string, text: string) => {
  const payload = {
    type: "send_message",
    data: { ride_id: rideId, message: text }
  };

  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newMessage = { 
    id: tempId,
    text, 
    sender: 'driver', 
    timestamp: new Date() 
  };
  
  setChatMessages(prev => ({
    ...prev,
    [rideId]: [...(prev[rideId] || []), newMessage]
  }));

  if (ws.current?.readyState === WebSocket.OPEN) {
    ws.current.send(JSON.stringify(payload));
  }
};

  // --- WEBSOCKET LIFECYCLE ---
  const connectWebSocket = async (accessToken: string) => {
    if (ws.current) {
      console.log("🔌 [WS] Existing connection found, closing it first");
      ws.current.close();
    }

    console.log(`🔌 [WS] Connecting to: ${WSS_URL}`);
    const socket = new WebSocket(`${WSS_URL}?token=${accessToken}`);
    ws.current = socket;

    socket.onopen = () => {
      console.log("✅ [WS] Connected and Ready (Driver)");
      setIsConnected(true);
      retryAttempts.current = 0;

      locationInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN && currentLocationRef.current) {
          console.log("💓 [WS] Sending location heartbeat");
          sendLocationUpdate(ws.current, currentLocationRef.current);
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("📩 [WS] Message received:", msg.type);

        if (msg.type === "notify" && msg.data?.type === "RIDE_REQUESTED") {
          console.log("🚗 [WS] New ride request detected!");
          const notification = parseRideNotification(msg.data);
          
          if (notification) {
            setRideNotifications(prev => {
              if (prev.some(n => n.ride_request_id === notification.ride_request_id)) {
                console.log("⚠️ [WS] Ignoring duplicate notification ID:", notification.ride_request_id);
                return prev;
              }
              return [...prev, notification];
            });
          }
        } else if (msg.type === "error" && msg.message?.includes("expired")) {
          console.error("🔑 [WS] Auth error detected in message stream");
          handleLogout();
        } 
            else if (msg.type === "chat_message" && msg.message) {
              const { id, content, sender_role, created_at } = msg.message;
              
              if (rideId) {
                const newMessage = {
                  id: String(id),
                  text: content,
                  sender: sender_role === 'rider' ? 'rider' : 'driver', // Note: "rider" not "user"
                  timestamp: new Date(created_at),
                };

                setChatMessages(prev => ({
                  ...prev,
                  [rideId]: [...(prev[rideId] || []), newMessage]
                }));
              }
            }
      } catch (err) {
        console.error("❌ [WS] Message parse error:", err);
      }
    };

    socket.onclose = (e) => {
      console.log(`🚪 [WS] Closed. Code: ${e.code}, Reason: ${e.reason || "None"}`);
      setIsConnected(false);
      stopLocationTracking();
      if (shouldReconnect.current) scheduleRetry();
    };

    socket.onerror = (err) => {
      console.error("⚠️ [WS] Error:", err);
    };
  };

  const scheduleRetry = () => {
    if (!shouldReconnect.current) return;
    
    if (retryTimeout.current) clearTimeout(retryTimeout.current);
    
    const delay = Math.min(1000 * Math.pow(2, retryAttempts.current), maxRetryDelay);
    console.log(`⏰ [RETRY] Attempt ${retryAttempts.current + 1} scheduled in ${delay}ms`);
    retryAttempts.current++;

    retryTimeout.current = setTimeout(async () => {
      console.log("🔄 [RETRY] Executing connection attempt...");
      const validToken = await getValidToken();
      if (validToken) {
        connectWebSocket(validToken);
      } else {
        console.log("❌ [RETRY] No valid token, retry failed");
        scheduleRetry();
      }
    }, delay);
  };

  // --- EFFECTS ---
  useEffect(() => {
    console.log("🎬 [LIFECYCLE] Provider Mounted");
    shouldReconnect.current = true;
    getValidToken().then(t => t && connectWebSocket(t));

    return () => {
      console.log("🧹 [LIFECYCLE] Provider Unmounting - cleaning up...");
      shouldReconnect.current = false;
      ws.current?.close();
      stopLocationTracking();
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

useEffect(() => {
  (async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status);
    
    // Only auto-connect if permission was previously granted
    if (status === 'granted' && !hasInitialized) {
      setHasInitialized(true);
      await startLocationTracking();
      const validToken = await getValidToken();
      if (validToken) connectWebSocket(validToken);
    }
  })();
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
        clearNotification: (id) => setRideNotifications(prev => prev.filter(n => n.ride_request_id !== id)),
        clearAllNotifications: () => setRideNotifications([]),
        sentOffers: sentOffersRef.current,
        saveSentOffer,
        getSentOffer,
        locationPermission, 
        goOnline,
        chatMessages,
        sendChatMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};