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
  handleWsEvent: () => { },
  finishRide: () => { },
  loadPersisted: async () => { },
  reset: () => { },
  arrive: () => { },
  startRide: () => { },
  toggleOnline: async () => { },
});

export const useDriverRide = () => useContext(DriverRideContext);

export const DriverRideProvider = ({ children }) => {
  const [status, setStatus] = useState<DriverRideStatus>("not_busy");
  const [rideId, setRideId] = useState<string | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const { request } = useFetch();
  const { token } = useAuth();

  const toggleOnline = async () => {
    try {
      const response = await request('users/active_status/', { method: 'POST', body: { is_online: !isOnline }, token });
      console.log("Toggle online response:", response);
    } catch (error) {
      console.error("Failed to toggle online status----:", error);
    }
    setIsOnline((prev) => !prev);
  }

  // Load persistent state
  const loadPersisted = async () => {
    try {
      const saved = await AsyncStorage.getItem("driverRideState");
      if (!saved) return;

      const parsed = JSON.parse(saved);
      setStatus(parsed.status);
      setRideId(parsed.rideId);
      setRiderId(parsed.riderId);
      console.log("🔥 Rehydrated ride state:", parsed);
    } catch (err) {
      console.log("Failed to load persisted driver ride:", err);
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
    await AsyncStorage.setItem("driverRideState", JSON.stringify(data));
  };

  const handleWsEvent = (msg: any) => {
    const rawEvent =
      msg.data?.type ||
      msg.type ||
      msg.event;

    const event = rawEvent?.toUpperCase().replace(/\s+/g, "_");

    console.log("🔍 Handling WS event:", event, "Full message:", msg);

    if (event === "RIDE_ACCEPTED") {
      const { ride_id, rider_id } = msg.data;

      console.log("✅ Driver ride accepted:", ride_id, rider_id);

      setStatus("ride_created");
      setRideId(ride_id);
      setRiderId(rider_id);

      persist({
        status: "ride_created",
        rideId: ride_id,
        riderId: rider_id,
      });
    }

  };
  const startRide = () => {
    if (!rideId) return;

    setStatus("ride_started");

    persist({
      status: "ride_started",
      rideId,
      riderId,
    });

    console.log("🚦 Driver status set to RIDE_STARTED");
  };

  const arrive = () => {
    if (!rideId) return;

    setStatus("arrived");

    persist({
      status: "arrived",
      rideId,
      riderId,
    });

    console.log("📍 Driver status set to ARRIVED");
  };


  // Driver finishes the ride
  const finishRide = () => {
    setStatus("not_busy");
    setRideId(null);
    setRiderId(null);

    persist({
      status: "not_busy",
      rideId: null,
      riderId: null,
    });
  };


  const reset = () => finishRide();

  return (
    <DriverRideContext.Provider
      value={{
        status,
        rideId,
        riderId,
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
