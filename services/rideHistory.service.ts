import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type RideHistoryItem = {
  driver: string;
  rider: string;
  pickup_address: string;
  dropoff_address: string;
  fare: string; // API returns string like "13500.00"
  start_time: string;
  end_time: string;
  status: string;
};

export type RideHistoryResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: RideHistoryItem[];
};

// In services/rideHistory.service.ts
export const useRideHistory = (enabled) => {
  return useQuery({
    queryKey: ["rideHistory"],
    queryFn: async () => {
      console.log("Fetching rides..."); // Keep this short
      try {
        const res = await api.get("rides/history/");
        // console.log("Ride history API response:", res.data); // <--- COMMENT THIS OUT
        return res.data;
      } catch (err) {
        console.error("Fetch Error:", err); // Does this print infinitely?
        throw err;
      }
    },
    enabled,
    retry: 1, // <--- ADD THIS: Stop it from retrying infinitely if it fails
    staleTime: 30000,
  });
};