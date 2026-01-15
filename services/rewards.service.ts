import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export const useDriverDashboard = () => {
  return useQuery({
    queryKey: ["driver-dashboard"],
    queryFn: () =>
      api
        .get("rewards/driver/dashboard/")
        .then((res) => {
          console.log(
          "Dashboard FULL:",
          JSON.stringify(res.data, null, 2)
        );

          return res.data

        }),
  });

  
};
