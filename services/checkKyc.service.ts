import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface KYCSteps {
  documents_completed: boolean;
  profile_completed: boolean;
  vehicle_added: boolean;
  vehicle_images_completed: boolean;
  transfer_recipient_completed: boolean;
}

export interface KYCStatusResponse {
  kyc_status: "PENDING" | "APPROVED" | "REJECTED"; // extend if needed
  progress_count: number;
  progress_percent: number;
  steps: KYCSteps;
  total_steps: number;
  vehicle_id?: string | null;
}

export const useDriverKycStatus = () => {
  return useQuery<KYCStatusResponse>({
    queryKey: ["driver-kyc-status"],
    queryFn: async () => {
      const res = await api.get<KYCStatusResponse>(
        "drivers/kyc/status/"
      );
      return res.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};
