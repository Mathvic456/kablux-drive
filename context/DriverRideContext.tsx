import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFetch } from "../utils/fetch-handler";
import { useAuth } from "./AuthContext";

type DriverRideStatus =
  | "not_busy"
  | "ride_created"
  | "arrived"
  | "ride_started";

interface DriverRideContextValue {
  status: DriverRideStatus;
  rideId: string | null;
  riderId: string | null;
  isOnline: boolean;
  arrive: () => void;
  startRide: () => void;
  handleWsEvent: (msg: any) => void;
  finishRide: () => void;
  loadPersisted: () => Promise<void>;
  reset: () => void;
  toggleOnline: () => Promise<void>;
}

const DriverRideContext = createContext<DriverRideContextValue>({
  status: "not_busy",
  rideId: null,
  riderId: null,
  isOnline: false,
  handleWsEvent: () => { },
  finishRide: () => { },
  loadPersisted: async () => { },
  reset: () => { },
  arrive: () => { },
  startRide: () => { },
  toggleOnline: async () => { },
});

export const useDriverRide = () => useContext(DriverRideContext);

interface DriverRideProviderProps {
  children: React.ReactNode;
}

export const DriverRideProvider = ({ children }: DriverRideProviderProps) => {
  const [status, setStatus] = useState<DriverRideStatus>("not_busy");
  const [rideId, setRideId] = useState<string | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const { request } = useFetch();
  const { token } = useAuth();

  const toggleOnline = async () => {
    try {
      const response = await request('users/active_status/', {
        method: 'POST',
        body: { is_online: !isOnline },
        token
      });
      console.log("✅ [DRIVER_RIDE] Toggle online response:", response);
      setIsOnline((prev) => !prev);
    } catch (error) {
      console.error("❌ [DRIVER_RIDE] Failed to toggle online status:", error);
    }
  };

  // Load persistent state
  const loadPersisted = async () => {
    try {
      const saved = await AsyncStorage.getItem("driverRideState");
      console.log('💾 [DRIVER_RIDE] Saved state:', saved);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      setStatus(parsed.status);
      setRideId(parsed.rideId);
      setRiderId(parsed.riderId);
      console.log("🔥 [DRIVER_RIDE] Rehydrated ride state:", parsed);
    } catch (err) {
      console.error("❌ [DRIVER_RIDE] Failed to load persisted state:", err);
    }
  };

  useEffect(() => {
    loadPersisted();
  }, []);

  const persist = async (data: {
    status: DriverRideStatus;
    rideId: string | null;
    riderId: string | null;
  }) => {
    try {
      await AsyncStorage.setItem("driverRideState", JSON.stringify(data));
      console.log("💾 [DRIVER_RIDE] Persisted state:", data);
    } catch (err) {
      console.error("❌ [DRIVER_RIDE] Failed to persist state:", err);
    }
  };

  const handleWsEvent = (msg: any) => {
    const rawEvent = msg.data?.type || msg.type || msg.event;
    const event = rawEvent?.toUpperCase().replace(/\s+/g, "_");

    console.log("[DRIVER_RIDE] ========== WS EVENT ==========");
    console.log("[DRIVER_RIDE] Event type:", event);
    console.log("[DRIVER_RIDE] Full message:", JSON.stringify(msg, null, 2));
    console.log("[DRIVER_RIDE] ================================");

    if (event === "RIDE_ACCEPTED") {
      const { ride_id, rider_id } = msg.data || {};

      if (!ride_id || !rider_id) {
        console.error("[DRIVER_RIDE] Missing ride_id or rider_id in RIDE_ACCEPTED event:", msg);
        return;
      }

      console.log("✅ [DRIVER_RIDE] Driver ride accepted!");
      console.log("  - Ride ID:", ride_id);
      console.log("  - Rider ID:", rider_id);

      setStatus("ride_created");
      setRideId(ride_id);
      setRiderId(rider_id);

      persist({
        status: "ride_created",
        rideId: ride_id,
        riderId: rider_id,
      });
    } else {
      console.log("[DRIVER_RIDE] Unhandled event type:", event);
    }
  };

  const startRide = () => {
    if (!rideId) {
      console.warn("[DRIVER_RIDE] Cannot start ride - no rideId");
      return;
    }

    console.log("[DRIVER_RIDE] Starting ride:", rideId);
    setStatus("ride_started");

    persist({
      status: "ride_started",
      rideId,
      riderId,
    });
  };

  const arrive = () => {
    if (!rideId) {
      console.warn("[DRIVER_RIDE] Cannot mark arrived - no rideId");
      return;
    }

    console.log("[DRIVER_RIDE] Driver arrived at pickup location");
    setStatus("arrived");

    persist({
      status: "arrived",
      rideId,
      riderId,
    });
  };

  // Driver finishes the ride
  const finishRide = () => {
    console.log("🏁 [DRIVER_RIDE] Finishing ride and resetting state");
    setStatus("not_busy");
    setRideId(null);
    setRiderId(null);

    persist({
      status: "not_busy",
      rideId: null,
      riderId: null,
    });
  };

  const reset = () => {
    console.log("🔄 [DRIVER_RIDE] Resetting driver ride state");
    finishRide();
  };

  return (
    <DriverRideContext.Provider
      value={{
        status,
        rideId,
        riderId,
        isOnline,
        handleWsEvent,
        finishRide,
        loadPersisted,
        reset,
        arrive,
        startRide,
        toggleOnline,
      }}
    >
      {children}
    </DriverRideContext.Provider>
  );
};