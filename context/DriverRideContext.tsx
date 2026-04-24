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
  negotiationUpdates: any[];
  rideAcceptedAt: number | null;
  expectedArrivalMinutes: number;
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
  negotiationUpdates: [],
  rideAcceptedAt: null,
  expectedArrivalMinutes: 15,
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
  const [rideAcceptedAt, setRideAcceptedAt] = useState<number | null>(null);
  const expectedArrivalMinutes = 15; // Default ETA threshold in minutes

  // Statuses the server returns for a ride that is no longer active.
  const TERMINAL_STATUSES = new Set(["cancelled", "completed", "finished", "not_busy"]);
  const loadPersisted = async () => {
    try {
      const saved = await api.get('rides/current/');
      const parsed = saved?.data;
      console.log('[DRIVER_RIDE] Reconcile payload:', parsed);

      const hasActive =
        parsed &&
        parsed.id &&
        parsed.status &&
        !TERMINAL_STATUSES.has(String(parsed.status).toLowerCase());

      if (!hasActive) {
        console.log("[DRIVER_RIDE] Server has no active ride — clearing local state");
        setStatus("not_busy");
        setRideId(null);
        setRiderId(null);
        setRideAcceptedAt(null);
        return;
      }

      setStatus(parsed.status);
      setRideId(parsed.id);
      setRiderId(parsed.rider?.user_id ?? null);
      console.log("[DRIVER_RIDE] Rehydrated ride state:", parsed.id, parsed.status);
    } catch (err: any) {
      // 404 from `rides/current/` typically means no active ride; treat as reset.
      if (err?.response?.status === 404) {
        console.log("[DRIVER_RIDE] No active ride (404) — clearing local state");
        setStatus("not_busy");
        setRideId(null);
        setRiderId(null);
        setRideAcceptedAt(null);
        return;
      }
      console.error("[DRIVER_RIDE] Failed to reconcile ride state:", err);
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
      setRideAcceptedAt(Date.now());

    } else if (event === "RIDE_CANCELLED") {
      console.log("[DRIVER_RIDE] Ride cancelled — resetting state");

      // Cross-channel dedup: mark cancelled so any in-flight native
      // presentation is suppressed, and dismiss the ringing notification
      // if one is currently shown for this ride.
      try {
        const rideKey =
          msg.data?.ride_request_id ?? msg.data?.ride_id ?? msg.ride_request_id ?? msg.ride_id;
        if (rideKey) {
          // Lazy require to avoid a circular import at module load.
          const { markCancelled } = require("../services/rideDedup");
          const { cancelRingingNotification } = require("../services/ringingNotification");
          markCancelled(String(rideKey));
          cancelRingingNotification(String(rideKey)).catch((err: any) =>
            console.warn("[DRIVER_RIDE] cancelRingingNotification failed:", err)
          );
        }
      } catch (err) {
        console.warn("[DRIVER_RIDE] RIDE_CANCELLED cleanup failed (non-fatal):", err);
      }

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
    setRideAcceptedAt(null);
    setTriggerEffect((prev) => prev + 1)

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
        negotiationUpdates,
        rideAcceptedAt,
        expectedArrivalMinutes,
      }}
    >
      {children}
    </DriverRideContext.Provider>
  );
};