import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

const WSS_URL = process.env.EXPO_PUBLIC_WSS_URL;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface RideOffer {
  ride_id: string;
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  estimated_fare: number;
  [key: string]: any;
}

interface SocketContextValue {
  socket: WebSocket | null;
  isConnected: boolean;
  rideOffers: RideOffer[];
  setTokenFromOutside?: (token: string) => void;
  currentLocation: { lat: number; lng: number } | null;
}

export const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  rideOffers: [],
  currentLocation: null,
});

/*{
    ride_id: "test-ride-123",
    pickup: { lat: 6.4568, lng: 3.3488 }, // Lagos coordinates
    destination: { lat: 6.4698, lng: 3.3812 },
    estimated_fare: 2500,
    customer_name: "Test User",
    distance: "3.2 km",
    duration: "15 mins",
    payment_method: "cash"
  }*/

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const ws = useRef<WebSocket | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const locationInterval = useRef<NodeJS.Timer | null>(null);
  const currentLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [rideOffers, setRideOffers] = useState<RideOffer[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

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
      if (data.access) {
        await AsyncStorage.setItem("token", data.access);
        console.log("🔁 Token refreshed!");
        return data.access;
      }
      return null;
    } catch (err) {
      console.error("Token refresh failed:", err);
      return null;
    }
  };

  const sendLocationUpdate = (socket: WebSocket, location: { lat: number; lng: number }) => {
    console.log("🧭 Trying to send location", socket.readyState, location);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "location_update",
        data: { lat: location.lat, long: location.lng },
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
      const coords = { lat: initialLocation.coords.latitude, lng: initialLocation.coords.longitude };
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
          const newCoords = { lat: location.coords.latitude, lng: location.coords.longitude };
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

  const connectWebSocket = async (accessToken: string) => {
    if (ws.current) ws.current.close();

    const socket = new WebSocket(`${WSS_URL}?token=${accessToken}`);
    ws.current = socket;

    socket.onopen = async () => {
      console.log("✅ WebSocket connected (Driver)");
      setIsConnected(true);

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

    socket.onclose = async () => {
      console.log("🚪 WS closed (Driver)");
      setIsConnected(false);
      stopLocationTracking();

      if (locationInterval.current) {
        clearInterval(locationInterval.current);
        locationInterval.current = null;
      }

      setTimeout(async () => {
        let storedToken = token || (await AsyncStorage.getItem("token"));
        if (!storedToken || isExpired(storedToken)) {
          storedToken = await refreshAccessToken();
        }
        if (storedToken) connectWebSocket(storedToken);
      }, 3000);
    };

    socket.onerror = (err) => {
      console.error("⚠️ WS Error (Driver):", err);
      setIsConnected(false);
    };
  };

  useEffect(() => {
    const init = async () => {
      let storedToken = await AsyncStorage.getItem("token");
      if (!storedToken || isExpired(storedToken)) storedToken = await refreshAccessToken();
      if (storedToken) {
        setToken(storedToken);
        connectWebSocket(storedToken);
      } else {
        console.warn("🚫 No valid token, cannot connect WS");
      }
    };
    init();

    return () => {
      ws.current?.close();
      stopLocationTracking();
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    };
  }, []);

  const setTokenFromOutside = (newToken: string) => {
    setToken(newToken);
    connectWebSocket(newToken);
  };

  return (
    <SocketContext.Provider value={{ socket: ws.current, isConnected, rideOffers, setTokenFromOutside, currentLocation }}>
      {children}
    </SocketContext.Provider>
  );
};