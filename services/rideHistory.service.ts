import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

// 1. Updated Type based on your JSON logs
export type RideHistoryItem = {
  driver: string;
  rider: string;
  pickup_address: string;  // Changed from pickupLocation
  dropoff_address: string; // Changed from dropoffLocation
  fare: number;            // Changed from price
  start_time: string;      // Changed from createdAt/date
  end_time: string;
  status: string;
  // Note: 'id', 'rating', and 'type' were missing from your logs.
  // I kept them optional in case the backend adds them later, 
  // but we will use index as key if ID is missing.
  id?: number; 
  rating?: number;
  type?: string; 
};

export type RideHistoryResponse = {
  status: string;
  message: string;
  count: number;
  next: string | null;
  previous: string | null;
  results: RideHistoryItem[];
};

export const useRideHistory = (enabled: boolean) => {
  return useQuery({
    queryKey: ["rideHistory"],
    queryFn: async () => {
      const res = await api.get<RideHistoryResponse>("rides/history/");
      console.log("Ride history API response:", res.data);
      return res.data ?? { count: 0, results: [], message: "", status: "" }; 
    },
    enabled,
  });
};