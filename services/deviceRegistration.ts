import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { api } from "./api";
import { getDevicePushToken } from "../hooks/usePushNotifications";

/**
 * Device registration service.
 *
 * Binds the current device push token to the authenticated user on the
 * backend. Token comes from expo-notifications: FCM on Android, APNs on iOS.
 * Safe to call repeatedly (idempotent on the server).
 *
 * Call sites:
 *   - after a successful login
 *   - on app cold-start if a token exists (cheap idempotent re-registration)
 *   - before clearing local auth on logout (unregister)
 */

const LAST_REGISTERED_TOKEN_KEY = "lastRegisteredFcmToken";

type RegisterPayload = {
  platform: "android" | "ios";
  fcm_token: string;
};

/**
 * Register the current device's push token with the backend.
 * If `token` is not provided, it will be fetched via getDevicePushToken().
 *
 * Skips the network call if the token is unchanged since the last successful
 * registration, unless `force` is passed.
 */
export async function registerDevice(
  token?: string | null,
  opts: { force?: boolean } = {}
): Promise<boolean> {
  try {
    const fcmToken = token ?? (await getDevicePushToken());
    if (!fcmToken) {
      console.log("📭 [DeviceReg] No FCM token available, skipping register");
      return false;
    }

    if (!opts.force) {
      const last = await AsyncStorage.getItem(LAST_REGISTERED_TOKEN_KEY);
      if (last === fcmToken) {
        console.log("✅ [DeviceReg] Token unchanged, skipping re-register");
        return true;
      }
    }

    const payload: RegisterPayload = {
      platform: Platform.OS === "ios" ? "ios" : "android",
      fcm_token: fcmToken,
    };

    await api.post("devices/register/", payload);
    await AsyncStorage.setItem(LAST_REGISTERED_TOKEN_KEY, fcmToken);
    console.log("✅ [DeviceReg] Device registered:", fcmToken.slice(0, 16) + "…");
    return true;
  } catch (err: any) {
    console.error(
      "❌ [DeviceReg] registerDevice failed:",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    return false;
  }
}

/**
 * Unregister the current device's push token from the backend.
 * Called on logout before clearing local auth state so the request can
 * still authenticate.
 */
export async function unregisterDevice(token?: string | null): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(LAST_REGISTERED_TOKEN_KEY);
    const fcmToken = token ?? stored;
    if (!fcmToken) {
      console.log("📭 [DeviceReg] No stored token to unregister");
      return false;
    }

    await api.post("devices/unregister/", { fcm_token: fcmToken });
    await AsyncStorage.removeItem(LAST_REGISTERED_TOKEN_KEY);
    console.log("👋 [DeviceReg] Device unregistered");
    return true;
  } catch (err: any) {
    // Non-fatal — still clear local state so logout completes.
    console.warn(
      "⚠️ [DeviceReg] unregisterDevice failed (continuing):",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    await AsyncStorage.removeItem(LAST_REGISTERED_TOKEN_KEY);
    return false;
  }
}

/**
 * Forget the cached last-registered token without calling the backend.
 * Useful if the backend reports the token is invalid and we want the next
 * registerDevice() call to re-send.
 */
export async function clearRegisteredTokenCache(): Promise<void> {
  await AsyncStorage.removeItem(LAST_REGISTERED_TOKEN_KEY);
}
