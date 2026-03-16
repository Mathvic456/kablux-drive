import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";

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
  setNegotiationUpdates: React.Dispatch<React.SetStateAction<any[]>>;
  negotiationUpdates: any[]
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
  setNegotiationUpdates: () => { },
  negotiationUpdates: []
});

export const useDriverRide = () => useContext(DriverRideContext);

interface DriverRideProviderProps {
  children: React.ReactNode;
}

export const DriverRideProvider = ({ children }: DriverRideProviderProps) => {
  const [status, setStatus] = useState<DriverRideStatus>("not_busy");
  const [rideId, setRideId] = useState<string | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);
  const { token } = useAuth();
  const [triggerEffect, setTriggerEffect] = useState(0);
  const [negotiationUpdates, setNegotiationUpdates] = useState([]);

  // Load persistent state
  const loadPersisted = async () => {

    try {
      const saved = await api.get('rides/current/')
      console.log('[DRIVER_RIDE] Saved state:', saved?.data);
      if (!saved) return;

      const parsed = saved?.data;
      setStatus(parsed?.status);
      setRideId(parsed?.id);
      setRiderId(parsed.rider?.user_id);
      console.log("[DRIVER_RIDE] Rehydrated ride state:", parsed);
    } catch (err) {
      console.error("[DRIVER_RIDE] Failed to load persisted state:", err);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadPersisted();
    return () => {
      setStatus('not_busy');
      setRideId(null);
      setRiderId(null);
    }
  }, [triggerEffect, token]);

  // const persist = async (data: {
  //   status: DriverRideStatus;
  //   rideId: string | null;
  //   riderId: string | null;
  // }) => {
  //   try {
  //     await AsyncStorage.setItem("driverRideState", JSON.stringify(data));
  //     console.log("💾 [DRIVER_RIDE] Persisted state:", data);
  //   } catch (err) {
  //     console.error("❌ [DRIVER_RIDE] Failed to persist state:", err);
  //   }
  // };

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

      setStatus("ride_created");
      setRideId(ride_id);
      setRiderId(rider_id);

    } else if (rawEvent === "ride_cancelled") {
      console.log("resetting from driver context");
      reset();

    } else if (rawEvent === "negotiation_update") {
      console.log("[DRIVER_RIDE] Negotiation update received:", msg.data);
      setNegotiationUpdates((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        const exists = prevArray.findIndex((item) => item.ride_request_id === msg.data.ride_request_id);
        if (exists !== -1) {
          const updated = [...prevArray];
          updated[exists] = msg.data;
          return updated;
        }
        return [...prevArray, msg.data];
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
    setTriggerEffect((prev) => prev + 1)

    // persist({
    //   status: "ride_started",
    //   rideId,
    //   riderId,
    // });
  };

  const arrive = () => {
    if (!rideId) {
      console.warn("[DRIVER_RIDE] Cannot mark arrived - no rideId");
      return;
    }

    console.log("[DRIVER_RIDE] Driver arrived at pickup location");
    setStatus("arrived");
    setTriggerEffect((prev) => prev + 1)


    // persist({
    //   status: "arrived",
    //   rideId,
    //   riderId,
    // });
  };

  // Driver finishes the ride
  const finishRide = () => {
    console.log("🏁 [DRIVER_RIDE] Finishing ride and resetting state");
    setStatus("not_busy");
    setRideId(null);
    setRiderId(null);
    setTriggerEffect((prev) => prev + 1)



    // persist({
    //   status: "not_busy",
    //   rideId: null,
    //   riderId: null,
    // });
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
        handleWsEvent,
        finishRide,
        loadPersisted,
        reset,
        arrive,
        startRide,
        setNegotiationUpdates,
        negotiationUpdates
      }}
    >
      {children}
    </DriverRideContext.Provider>
  );
};