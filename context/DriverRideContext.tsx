import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type DriverRideStatus = "not_busy" | "ride_created" | "ride_started";

interface DriverRideContextValue {
  status: DriverRideStatus;
  rideId: string | null;
  riderId: string | null;

  // WS event handler
  handleWsEvent: (msg: any) => void;
  finishRide: () => void;
  loadPersisted: () => Promise<void>;
  reset: () => void;
}

const DriverRideContext = createContext<DriverRideContextValue>({
  status: "not_busy",
  rideId: null,
  riderId: null,
  handleWsEvent: () => {},
  finishRide: () => {},
  loadPersisted: async () => {},
  reset: () => {},
});

export const useDriverRide = () => useContext(DriverRideContext);

export const DriverRideProvider = ({ children }) => {
  const [status, setStatus] = useState<DriverRideStatus>("not_busy");
  const [rideId, setRideId] = useState<string | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);

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
  const event = msg.data?.event || msg.event || msg.type;

  console.log("🔍 Handling WS event:", event, "Full message:", msg);

  if (event === "ride_created" && msg.payload) {
    const { ride_id, rider_id } = msg.payload;

    console.log("🚗 Driver received ride_created:", msg.payload);

    setStatus("ride_created");
    setRideId(ride_id);
    setRiderId(rider_id);

    persist({
      status: "ride_created",
      rideId: ride_id,
      riderId: rider_id,
    });
  }

  if (event === "ride_started" && msg.data) {
    const { ride_id } = msg.data;
    
    console.log("🏁 Driver received ride_started:", msg.data);
    
    setStatus("ride_started");
    persist({
      status: "ride_started",
      rideId: rideId || ride_id,
      riderId,
    });
  }
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
      }}
    >
      {children}
    </DriverRideContext.Provider>
  );
};
