import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { navigationRef } from "../screens/context/NavigationContext";
import { useDriverRide } from "./DriverRideContext";
import { useAuth } from "./AuthContext";

const WSS_URL = process.env.EXPO_PUBLIC_WSS_URL;

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
  setRideNotifications: (notifications: RideNotification[]) => void;
  currentLocation: { lat: number; long: number } | null;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  clearNotification: (rideId: string) => void;
  clearAllNotifications: () => void;
}

export const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  rideNotifications: [],
  setRideNotifications: () => {},
  currentLocation: null,
  sessionExpired: false,
  clearSessionExpired: () => {},
  clearNotification: () => {},
  clearAllNotifications: () => {},
});

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const ws = useRef<WebSocket | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const locationInterval = useRef<NodeJS.Timer | null>(null);
  const currentLocationRef = useRef<{ lat: number; long: number } | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryAttempts = useRef(0);
  const maxRetryDelay = 30000;
  const shouldReconnect = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [rideNotifications, setRideNotifications] = useState<RideNotification[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; long: number } | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const { handleWsEvent } = useDriverRide();
  const { token, getValidToken, clearTokens, isTokenExpired } = useAuth();

  const handleLogout = async () => {
    console.log("🚪 Session expired - logging out...");

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

    if (locationInterval.current) {
      clearInterval(locationInterval.current as unknown as number);
      locationInterval.current = null;
    }

    await clearTokens();
    setSessionExpired(true);

    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
        });
      }
    }, 100);
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  const clearNotification = (rideId: string) => {
    setRideNotifications(prev => prev.filter(notif => notif.ride_request_id !== rideId));
    console.log(`🗑️ Cleared notification for ride: ${rideId}`);
  };

  const clearAllNotifications = () => {
    setRideNotifications([]);
    console.log("🗑️ Cleared all notifications");
  };

const parseRideNotification = (data: any): RideNotification | null => {
    try {
      // 1. Log what we are parsing to debug
      // console.log("Parsing data:", data);

      const offerMatch = data.message?.match(/Rider offer:\s*([\d.]+)/);
      const distanceVal = data.distance ? parseFloat(data.distance) : undefined;
      const timeCalc = distanceVal ? String((distanceVal / 0.5) * 60) : "0";

      // 🔴 CRITICAL FIX: Explicitly check for ride_id and map it
      const finalId = data.ride_id || data.ride_request_id;

      if (!finalId) {
        console.warn("⚠️ Parse failed: Missing ID in data:", data);
        return null;
      }

      return {
        ride_request_id: finalId, // ✅ Mapped correctly now
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
        ride_request_view_id: data.ride_request_view_id 
      };
    } catch (err) {
      console.error("❌ Error parsing ride notification:", err);
      return null;
    }
  };
  const sendLocationUpdate = (socket: WebSocket, location: { lat: number; long: number }) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "location_update",
        data: { lat: location.lat, long: location.long },
      }));
      console.log("📍 Location update sent:", location);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("🚫 Location permission denied");
        return;
      }

      const initialLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: initialLocation.coords.latitude, long: initialLocation.coords.longitude };
      setCurrentLocation(coords);
      currentLocationRef.current = coords;
      console.log("📍 Initial location set:", coords);

      if (ws.current?.readyState === WebSocket.OPEN) {
        sendLocationUpdate(ws.current, coords);
      }

      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 50 },
        (location) => {
          const newCoords = { lat: location.coords.latitude, long: location.coords.longitude };
          setCurrentLocation(newCoords);
          currentLocationRef.current = newCoords;
          console.log("📍 Location updated:", newCoords);
          
          if (ws.current?.readyState === WebSocket.OPEN) {
            sendLocationUpdate(ws.current, newCoords);
          }
        }
      );

      console.log("✅ Location tracking started");
    } catch (err) {
      console.error("❌ Location tracking error:", err);
    }
  };

  const stopLocationTracking = () => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    console.log("🛑 Location tracking stopped");
  };

  const getRetryDelay = () => {
    const delay = Math.min(1000 * Math.pow(2, retryAttempts.current), maxRetryDelay);
    retryAttempts.current++;
    return delay;
  };

  const resetRetryAttempts = () => {
    retryAttempts.current = 0;
  };

  const attemptConnection = async () => {
    if (!shouldReconnect.current) {
      console.log("🛑 Reconnection disabled, skipping attempt");
      return false;
    }

    try {
      // Use AuthContext to get valid token
      const validToken = await getValidToken();

      if (validToken) {
        console.log("✅ Token available, connecting WebSocket...");
        connectWebSocket(validToken);
        return true;
      } else {
        console.log("❌ No valid token available");
        return false;
      }
    } catch (err) {
      console.error("❌ Connection attempt failed:", err);
      return false;
    }
  };

  const scheduleRetry = () => {
    if (!shouldReconnect.current) {
      console.log("🛑 Reconnection disabled, skipping retry schedule");
      return;
    }

    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
    }

    const delay = getRetryDelay();
    console.log(`⏰ Scheduling connection retry in ${delay}ms (attempt ${retryAttempts.current})`);

    retryTimeout.current = setTimeout(async () => {
      const success = await attemptConnection();
      
      if (!success && shouldReconnect.current) {
        scheduleRetry();
      }
    }, delay);
  };

  const connectWebSocket = async (accessToken: string) => {
    if (ws.current) ws.current.close();

    const socket = new WebSocket(`${WSS_URL}?token=${accessToken}`);
    ws.current = socket;

    socket.onopen = async () => {
      console.log("✅ WebSocket connected (Driver)");
      setIsConnected(true);
      resetRetryAttempts();

      await startLocationTracking();

      locationInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN && currentLocationRef.current) {
          sendLocationUpdate(ws.current, currentLocationRef.current);
        }
      }, 5000);
    };

socket.onmessage = (event) => {
      //console.log("📩 Raw incoming message:", event.data); 
      try {
        const msg = JSON.parse(event.data);
        console.log("📩 Incoming WS message:", msg);

        switch (msg.type) {
          case "notify":
            // CHANGE: Access msg.data instead of msg.event
            const notificationData = msg.data;

            // CHANGE: Check notificationData.type (Log shows "type": "RIDE_REQUESTED")
            if (notificationData && notificationData.type === "RIDE_REQUESTED") {
              console.log("🚗 New ride request received:", notificationData);
              
              const notification = parseRideNotification(notificationData);
              
              if (notification) {
                setRideNotifications(prev => {
                  const exists = prev.some(n => n.ride_request_id === notification.ride_request_id);
                  if (exists) {
                    console.log("⚠️ Duplicate notification ignored");
                    return prev;
                  }
                  return [...prev, notification];
                });
              }
            } else {
              console.log("ℹ️ Other notification type:", notificationData?.type);
            }
            break;

          case "subscribed":
            console.log("✅ Subscribed successfully to driver updates");
            break;

          default:
            console.log("ℹ️ Unknown message type:", msg.type);
        }
      } catch (err) {
        console.error("❌ WS Message parse error:", err);
      }
    };

    socket.onclose = async (event) => {
      console.log("🚪 WS closed (Driver)", event.code, event.reason);
      setIsConnected(false);
      stopLocationTracking();

      if (locationInterval.current) {
        clearInterval(locationInterval.current as unknown as number);
        locationInterval.current = null;
      }

      if (shouldReconnect.current) {
        scheduleRetry();
      } else {
        console.log("🛑 Not scheduling retry - reconnection disabled");
      }
    };

    socket.onerror = (err) => {
      console.error("⚠️ WS Error (Driver):", err);
      setIsConnected(false);
    };
  };

  // Initial connection attempt on mount
  useEffect(() => {
    const init = async () => {
      shouldReconnect.current = true;
      
      const validToken = await getValidToken();
      
      if (validToken) {
        console.log("✅ Token available on mount, connecting...");
        await attemptConnection();
      } else {
        console.log("⚠️ No token available on mount");
      }
    };
    
    init();

    return () => {
      shouldReconnect.current = false;
      
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
      ws.current?.close();
      stopLocationTracking();
      if (locationInterval.current) {
        clearInterval(locationInterval.current as unknown as number);
      }
    };
  }, []);

  
  useEffect(() => {
    const checkAndConnect = async () => {
      // Only try to connect if we have a token and we're not already connected
      if (token && !isConnected && shouldReconnect.current) {
        console.log("🔑 Token detected in context, attempting WebSocket connection...");
        
        // Clear any pending retry
        if (retryTimeout.current) {
          clearTimeout(retryTimeout.current);
          retryTimeout.current = null;
        }
        
        // Reset retry attempts for fresh connection
        resetRetryAttempts();
        
        await attemptConnection();
      }
    };
    
    checkAndConnect();
  }, [token, isConnected]);

  return (
    <SocketContext.Provider 
      value={{ 
        socket: ws.current, 
        isConnected, 
        rideNotifications,
        setRideNotifications,
        currentLocation,
        sessionExpired,
        clearSessionExpired,
        clearNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};