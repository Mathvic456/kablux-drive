import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { api } from "./api";
import { CREATEACCOUNT_TYPE } from "./type";

// Types for modal control
export type AuthResult = {
  success: boolean;
  message: string;
  data?: any;
};

export const useRegisterEndPoint = () => {
  const mutation = useMutation<AxiosResponse<any>, any, CREATEACCOUNT_TYPE>({
    mutationFn: (data) => api.post("auth/register/", data),
    onSuccess: (res) => {
      console.log("Registration successful:", res.data);
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
    },
  });

  return mutation;
};

export const useLoginEndPoint = (
  navigation: any,
  remember: boolean,
  setTokens: (access: string, refresh: string, remember: boolean) => Promise<void>
) => {
  return useMutation({
    mutationFn: (data) => api.post("auth/login/", data),

    onSuccess: async (res) => {
      const token = res.data?.data?.access;
      const refreshToken = res.data?.data?.refresh;
      const userId = res.data?.data?.user?.id;

      if (!token || !refreshToken) {
        console.error("❌ Missing tokens in response");
        throw new Error("Invalid login response");
      }

      console.log(`🔑 Login successful (Remember Me: ${remember})`);

      // Store tokens in AuthContext
      // This will handle both Context (in-memory) and AsyncStorage (if remember = true)
      await setTokens(token, refreshToken, remember);

      // Store userId separately (this is not auth-related, so keep in AsyncStorage)
      await AsyncStorage.setItem("userId", userId);
      console.log("✅ User ID saved");

      // Navigate to main app
      navigation.replace("Tabs");
    },

    onError: (error: any) => {
      console.error("Login error:", error);

      if (error?.response?.status === 401) {
        console.log("❌ Invalid email or password");
      } else {
        console.log("⚠️ Something went wrong:", error?.message);
      }
    },
  });
};

export const useLogoutEndPoint = (
  clearTokens: () => Promise<void>
) => {
  return useMutation({
    mutationFn: async () => {
      // Clear all auth tokens through AuthContext
      // This handles: token, refreshToken, and rememberMe flag
      await clearTokens();
      
      // Clear other non-auth data
      await AsyncStorage.multiRemove(['userId', 'pendingEmail']);
      
      console.log("🗑️ Cleared all user data");
      return true;
    },
    onSuccess: () => {
      console.log("✅ User logged out successfully");
    },
    onError: (error: any) => {
      console.error("❌ Logout error:", error);
    },
  });
};