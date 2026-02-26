import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";


export const rideKeys = {
  all: ["rides"] as const,
  details: (id: string) => [...rideKeys.all, "details", id] as const,
  active: () => [...rideKeys.all, "active"] as const,
};



const fetchRideDetails = async (rideId: string) => {
  console.log(`🔍 Fetching ride details for ID: ${rideId}`);
  const { data } = await api.get(`rides/${rideId}/details/`);
  console.log("✅ Ride details fetched successfully");
  return data;
};

const startRide = async (rideId: string) => {
  console.log(`🚗 Starting ride: ${rideId}`);
  const { data } = await api.patch(`rides/${rideId}/start/`);
  console.log("✅ Ride started successfully");
  return data;
};


const arriveRide = async (rideId: string) => {
  console.log(`📍 Driver arrived for ride: ${rideId}`);
  const { data } = await api.patch(`rides/${rideId}/driver_arrived/`);
  console.log("✅ Driver arrival registered successfully");
  return data;
};

const finishRide = async (rideId: string) => {
  console.log(`🏁 Finishing ride: ${rideId}`);
  const { data } = await api.patch(`rides/${rideId}/complete/`);
  console.log("✅ Ride finished successfully");
  return data;
};

// ==================== Hooks ====================

/**
 * Hook to fetch ride details
 * @param rideId - The ride ID to fetch details for
 * @param options - Additional options (enabled, etc.)
 */
export const useRideDetails = (
  rideId: string | null,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
  }
) => {
  return useQuery({
    queryKey: rideKeys.details(rideId || ""),
    queryFn: () => fetchRideDetails(rideId!),
    enabled: !!rideId && (options?.enabled !== false),
    onSuccess: options?.onSuccess,
    onError: (error: any) => {
      console.error("❌ Error fetching ride details:", error);
      options?.onError?.(error);
    },
    retry: 2,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to start a ride
 */
export const useStartRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId: string) => startRide(rideId),
    onSuccess: (data, rideId) => {
      console.log("✅ Ride started mutation successful");

      // Invalidate and refetch ride details
      queryClient.invalidateQueries({ queryKey: rideKeys.details(rideId) });
    },
    onError: (error: any) => {
      console.error("❌ Error starting ride:", error);
    },
  });
};




export const useArriveRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId: string) => arriveRide(rideId),

    onSuccess: (data, rideId) => {
      console.log("✅ Driver arrival mutation successful");

      queryClient.invalidateQueries({ queryKey: rideKeys.details(rideId) });
    },

    onError: (error: any) => {
      console.error("❌ Error marking arrival:", error);
    },
  });
};


/**
 * Hook to finish a ride
 */
export const useFinishRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId: string) => finishRide(rideId),
    onSuccess: (data, rideId) => {
      console.log("✅ Ride finished mutation successful");

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: rideKeys.details(rideId) });
      queryClient.invalidateQueries({ queryKey: rideKeys.active() });
    },
    onError: (error: any) => {
      console.error("❌ Error finishing ride:", error);
    },
  });
};