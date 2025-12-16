import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

interface KycDocumentPayload {
  doc_type: "DRIVER_LICENSE" | "NATIONAL_ID" | "POLICE_CLEARANCE";
  file: string;
}

export const useSubmitKycDocument = () => {
  return useMutation({
    mutationFn: (data: KycDocumentPayload) => 
      api.post("drivers/kyc/documents/", data),

    onSuccess: (res) => {
      console.log("✅ KYC document submitted:", res.data);
    },

    onError: (error: any) => {
      console.error("❌ KYC submission failed:", error.response?.data || error);
    },
  });
};