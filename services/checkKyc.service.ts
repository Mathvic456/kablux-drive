import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface DriverKycStatusResponse {
  documents: any[];
  vehicles: any[];
  kyc_status: "PENDING" | "APPROVED" | "REJECTED";
}

export const useDriverKycStatus = () => {
  return useQuery<DriverKycStatusResponse>({
    queryKey: ["driver-kyc-status"],
    queryFn: async () => {
      const res = await api.get<DriverKycStatusResponse>(
        "drivers/kyc/status/"
      );
      return res.data; // ✅ MUST return something
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};
