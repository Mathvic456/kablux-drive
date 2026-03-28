import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      api.post("auth/forget_password/", data),
    onSuccess: (res) => {
      console.log("✅ OTP sent successfully");
    },
    onError: (error: any) => {
      console.error("❌ Error sending OTP:", error);
    },
  });
};

export const useResendOTP = () => {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      api.post("auth/resend_otp/", data),
    onSuccess: (res) => {
      console.log("✅ Resend OTP sent successfully", res);
    },
    onError: (error: any) => {
      console.error("❌ Error sending OTP:", error);
    },
  });
};


