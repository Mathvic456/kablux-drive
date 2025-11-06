import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

const fetchNotifications = async () => {
  const response = await api.get("/rides/ride_orders/");
  return response.data;
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 5000, 
    refetchOnWindowFocus: false,
  });
};