import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type RideHistoryItem = {
  id: number;
  vehicle?: {
    model: string;
    type: string;
  };
  driver?: {
    name: string;
  };
  createdAt?: string;
  date?: string;
  rating?: number;
  type?: string;
  status?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  price?: number;
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
      const res = await api.get<{ data: RideHistoryResponse }>("rides/history/");
      console.log("Ride history API response:", res.data);
      return res.data?.data ?? []; 
    },
    enabled, // Only fetch when true
  });
};