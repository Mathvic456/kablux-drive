import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { api } from "./api";
import { CREATEACCOUNT_TYPE } from "./type";


export const useRegisterEndPoint = () => {
  return useMutation<AxiosResponse<any>, any, CREATEACCOUNT_TYPE>({
    mutationFn: (data) => api.post("auth/register/", data),

    onSuccess: (res) => {
      console.log("✅ Registration successful:", res.data);
    },

    onError: (error: any) => {
      console.error("❌ Registration error:", error);
    },
  });
};


type LoginPayload = {
  email: string;
  password: string;
  fcm_token?: string;
};

export const useLoginEndPoint = (
  navigation: any,
  remember: boolean,
  setTokens: (
    access: string,
    refresh: string,
    remember: boolean
  ) => Promise<void>
) => {
  return useMutation<AxiosResponse<any>, any, LoginPayload>({
    mutationFn: (data) => api.post("auth/login/", data),

    onSuccess: async (res) => {
      const accessToken = res.data?.data?.access;
      const refreshToken = res.data?.data?.refresh;
      const userId = res.data?.data?.user?.id;

      if (!accessToken || !refreshToken) {
        console.error("❌ Missing tokens in login response");
        throw new Error("Invalid login response");
      }

      console.log(`🔑 Login successful (Remember Me: ${remember})`);

      // Save tokens via AuthContext
      await setTokens(accessToken, refreshToken, remember);

      // Store user ID separately
      if (userId) {
        await AsyncStorage.setItem("userId", userId);
        console.log("✅ User ID saved");
      }

      // Navigate to Mainapp
      navigation.replace("Mainapp");

      try {
        const pendingRes = await api.get("rides/pending_requests/");
        const pendingRequests = pendingRes.data?.results || pendingRes.data || [];
        if (pendingRequests.length > 0) {
          console.log(`🔔 [LOGIN] Found ${pendingRequests.length} pending ride request(s)`);
          // Pending requests will be picked up by WebSocket on connect
        }
      } catch (pendingErr) {
        // Non-critical — don't block login if pending requests endpoint fails
        console.log("ℹ️ [LOGIN] No pending requests or endpoint unavailable");
      }
    },

    onError: (error: any) => {
      if (error?.response?.status === 401) {
        console.log("❌ Invalid email or password");
      } else {
        console.error("⚠️ Login error:", error?.message || error);
      }
    },
  });
};


type ActiveStatusPayload = {
  is_online: boolean;
};

export const useActiveStatusEndPoint = () => {
  const queryClient = useQueryClient();

  return useMutation<AxiosResponse<any>, any, ActiveStatusPayload>({
    mutationFn: (data) => api.post("users/active_status/", data),

    onSuccess: (res) => {
      console.log("🟢 Active status updated:", res.data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },

    onError: (error: any) => {
      console.error("❌ Active status error:", error);
    },
  });
};



export const useLogoutEndPoint = (
  clearTokens: () => Promise<void>
) => {
  return useMutation<boolean, any, void>({
    mutationFn: async () => {
      await clearTokens();
      await AsyncStorage.multiRemove(["userId", "pendingEmail", "driverRideState"]);

      console.log("🗑️ Cleared all user data");
      return true;
    },

    onSuccess: () => {
      console.log("✅ User logged out successfully");
      // Logout navigation is handled in DrawerNavigator's handleLogout
    },

    onError: (error: any) => {
      console.error("❌ Logout error:", error);
    },
  });
};

