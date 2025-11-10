import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

const WSS_URL = process.env.EXPO_PUBLIC_WSS_URL;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface RideOffer {
  ride_id: string;
  pickup: { lat: number; long: number };
  destination: { lat: number; long: number };
  estimated_fare: number;
  [key: string]: any;
}

interface SocketContextValue {
  socket: WebSocket | null;
  isConnected: boolean;
  rideOffers: RideOffer[];
  setTokenFromOutside?: (token: string) => void;
  currentLocation: { lat: number; long: number } | null;
}

export const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  rideOffers: [],
  currentLocation: null,
});

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const ws = useRef<WebSocket | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const locationInterval = useRef<NodeJS.Timer | null>(null);
  const currentLocationRef = useRef<{ lat: number; long: number } | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryAttempts = useRef(0);
  const maxRetryDelay = 30000; // Max 30 seconds between retries

  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [rideOffers, setRideOffers] = useState<RideOffer[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; long: number } | null>(null);

  const isExpired = (token: string) => {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refresh = await AsyncStorage.getItem("refreshToken");
      if (!refresh) throw new Error("No refresh token");

      const res = await fetch(`${API_URL}auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) throw new Error("Failed to refresh");
      const data = await res.json();
      if (data.data.access) {
        await AsyncStorage.setItem("token", data.data.access);
        console.log("🔁 Token refreshed!");
        return data.data.access;
      }
      return null;
    } catch (err) {
      console.error("Token refresh failed:", err);
      return null;
    }
  };

  const sendLocationUpdate = (socket: WebSocket, location: { lat: number; long: number }) => {
    console.log("🧭 Trying to send location", socket.readyState, location);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "location_update",
        data: { lat: location.lat, long: location.long },
      }));
      console.log("📍 Location update sent:", location);
    } else {
      console.log("❌ Socket not open, readyState:", socket.readyState);
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

      // Send initial location immediately if socket is open
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
          
          // Send location update immediately when location changes
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
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, capped at 30s
    const delay = Math.min(1000 * Math.pow(2, retryAttempts.current), maxRetryDelay);
    retryAttempts.current++;
    return delay;
  };

  const resetRetryAttempts = () => {
    retryAttempts.current = 0;
  };

  const attemptConnection = async () => {
    try {
      // Try to get token from storage or refresh it
      let storedToken = token || (await AsyncStorage.getItem("token"));
      
      if (!storedToken || isExpired(storedToken)) {
        console.log("🔄 Token missing or expired, attempting refresh...");
        storedToken = await refreshAccessToken();
      }

      if (storedToken) {
        console.log("✅ Token available, connecting WebSocket...");
        setToken(storedToken);
        connectWebSocket(storedToken);
        return true;
      } else {
        console.log("⏳ No token yet, will retry...");
        return false;
      }
    } catch (err) {
      console.error("❌ Connection attempt failed:", err);
      return false;
    }
  };

  const scheduleRetry = () => {
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
    }

    const delay = getRetryDelay();
    console.log(`⏰ Scheduling connection retry in ${delay}ms (attempt ${retryAttempts.current})`);

    retryTimeout.current = setTimeout(async () => {
      const success = await attemptConnection();
      
      // If still no token, schedule another retry
      if (!success) {
        scheduleRetry();
      }
    }, delay);
  };

  const connectWebSocket = async (accessToken: string) => {
    if (ws.current) ws.current.close();

    const socket = new WebSocket(`${WSS_URL}?token=${accessToken}`);
    ws.current = socket;

    socket.onopen = async () => {
      console.log("✅ WebSocket connected (Driver)", accessToken);
      setIsConnected(true);
      resetRetryAttempts(); // Reset retry counter on successful connection

      // Start location tracking (will send initial location when ready)
      await startLocationTracking();

      // Set up interval to send location updates every 5 seconds
      // Use ref to always get the latest location
      locationInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN && currentLocationRef.current) {
          sendLocationUpdate(ws.current, currentLocationRef.current);
        } else {
          console.log("⏸️ Skipping location update - socket or location not ready");
        }
      }, 5000);
    };

    socket.onmessage = (event) => {
      console.log("📩 Raw incoming message:", event.data);
      try {
        const msg = JSON.parse(event.data);
        console.log("📩 Incoming WS message:", msg);

        switch (msg.type) {
          case "notify":
            console.log("🚗 New ride offer received:", msg.data);
            setRideOffers(prev => [...prev, msg.data]);
            break;
          case "subscribed":
            console.log("✅ Subscribed successfully to driver updates");
            break;
          default:
            if (msg.ride_id) {
              console.log("🚗 Maybe ride offer?", msg);
              setRideOffers(prev => [...prev, msg]); 
            } else {
              console.log("ℹ️ Unknown message type, ignoring:", msg.type);
            }
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
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }


      scheduleRetry();
    };

    socket.onerror = (err) => {
      console.error("⚠️ WS Error (Driver):", err);
      setIsConnected(false);
    };
  };

  useEffect(() => {
    const init = async () => {
      const success = await attemptConnection();
      
      // If no token found, start retry loop
      if (!success) {
        console.log("🔄 Starting retry loop for token...");
        scheduleRetry();
      }
    };
    
    init();

    return () => {
      // Cleanup
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
      ws.current?.close();
      stopLocationTracking();
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    };
  }, []);

  const setTokenFromOutside = (newToken: string) => {
    console.log("🔑 Token received from outside, connecting...");
    setToken(newToken);
    resetRetryAttempts();
    
    // Clear any pending retry
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
    
    connectWebSocket(newToken);
  };

  return (
    <SocketContext.Provider value={{ socket: ws.current, isConnected, rideOffers, setTokenFromOutside, currentLocation }}>
      {children}
    </SocketContext.Provider>
  );
};