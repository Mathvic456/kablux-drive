import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

export const usePasswordReset = () => {
  return useMutation({
    mutationFn: (data: {
      new_password: string;
      email: string;
      otp: string;

    }) => api.post("auth/password_reset_confirm/", data),
    onSuccess: (res) => {
      console.log("✅ Password reset successfully");
    },
    onError: (error: any) => {
      console.error("❌ Password reset failed:", error);
    },
  });
};
