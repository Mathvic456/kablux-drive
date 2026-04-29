import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

const fetchNotifications = async () => {
  const response = await api.get("/rides/ride_orders/");
  return response.data;
};

export const useNotifications = (enabled = true) => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: enabled ? 5000 : false,
    refetchOnWindowFocus: false,
    enabled,
    retry: false,
  });
};