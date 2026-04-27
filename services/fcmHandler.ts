import messaging from "@react-native-firebase/messaging";
import { registerDevice } from "./deviceRegistration";

/**
 * FCM token lifecycle: permission prompt, token retrieval, and token-refresh
 * propagation to the backend.
 */

let initialised = false;

export function initFcm(): void {
  if (initialised) return;
  initialised = true;

  messaging().onTokenRefresh(async (newToken) => {
    console.log("🔄 [FCM] Token refreshed:", newToken.slice(0, 16) + "…");
    try {
      await registerDevice(newToken, { force: true });
    } catch (err) {
      console.warn("⚠️ [FCM] Token refresh re-register failed:", err);
    }
  });

  console.log("✅ [FCM] Handlers initialised");
}

export async function getFcmToken(): Promise<string | null> {
  try {
    const authStatus = await messaging().hasPermission();
    if (authStatus === messaging.AuthorizationStatus.DENIED) {
      console.log("🔕 [FCM] Notification permission denied — no token");
      return null;
    }
    const token = await messaging().getToken();
    return token || null;
  } catch (err) {
    console.error("❌ [FCM] getToken failed:", err);
    return null;
  }
}

export async function requestFcmPermission(): Promise<boolean> {
  try {
    const status = await messaging().requestPermission();
    const granted =
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL;
    console.log(`🔔 [FCM] Permission status: ${status} (granted=${granted})`);
    return granted;
  } catch (err) {
    console.warn("⚠️ [FCM] requestPermission failed:", err);
    return false;
  }
}
