import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

export const useVerifyOtpEndPoint = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) => 
      api.post("auth/verify_otp/", data),

    onSuccess: (res) => {
      console.log("✅ OTP verified:", res.data);
    },

    onError: (error: any) => {
      console.error("❌ OTP verification failed:", error.response?.data || error);
    },
  });
};


export const useResendOtpEndPoint = () => {
  return useMutation({
    mutationFn: (data: { email: string }) => 
      api.post("auth/resend_otp/", data), // Ensure this endpoint matches your backend

    onSuccess: (res) => {
      console.log("✅ OTP Resent:", res.data);
    },

    onError: (error: any) => {
      console.error("❌ OTP Resend failed:", error.response?.data || error);
    },
  });
};