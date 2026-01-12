import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

interface KycDocumentPayload {
  doc_type: "DRIVER_LICENSE" | "NATIONAL_ID" | "POLICE_CLEARANCE";
  file: string;
}

export const useSubmitKycDocument = () => {
  return useMutation({
    mutationFn: async (data: KycDocumentPayload) => {
      console.log("🚀 [KYC Submit] Initiating request...");
      console.log(`📂 Type: ${data.doc_type}`);
      console.log(`🆔 File ID: ${data.file}`);
      const response = await api.post("drivers/kyc/documents/", data);
      return response;
    },

    onSuccess: (res) => {
      console.log("✅ [KYC Submit] Success Response:", JSON.stringify(res.data, null, 2));
    },

    onError: (error: any) => {
      console.error("❌ [KYC Submit] Error Details:");
      if (error.response) {

        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        // Something happened in setting up the request
        console.error("Message:", error.message);
      }
    },
  });
};