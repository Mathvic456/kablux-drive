import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import { shouldPresent } from "./rideDedup";
import { registerDevice } from "./deviceRegistration";
import { displayRingingNotification } from "./ringingNotification";

/**
 * FCM message handler + token lifecycle.
 *
 * Registered at module load in index.js so the background handler is in
 * place before any message can arrive on a fresh JS runtime (killed-state
 * delivery). Foreground messages are also routed through here for a single
 * code path.
 *
 * Responsibilities:
 *   - Claim the ride via rideDedup so WS can't present a duplicate modal.
 *   - Hand off to the native CallKeep layer (Phase 2b) — see `presentRide`.
 *   - Propagate token refreshes to the backend via registerDevice.
 */

export type FcmRidePayload = {
  type: "RIDE_REQUESTED" | string;
  ride_request_id: string;
  rider_name?: string;
  rider_rating?: string | number;
  fare?: string | number;
  distance?: string | number;
  pickup_address?: string;
  destination_address?: string;
  // Backend may add more — treat as opaque pass-through.
  [k: string]: any;
};

function parseRidePayload(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage | null | undefined
): FcmRidePayload | null {
  if (!remoteMessage?.data) return null;
  const data = remoteMessage.data as Record<string, any>;
  const type = data.type || data.event;
  if (type !== "RIDE_REQUESTED") return null;

  // Backend sends `ride_id` as the canonical field for ride dispatch.
  // The other names are accepted as defensive fallbacks.
  const rideRequestId =
    data.ride_id ??
    data.ride_request_id ??
    data.rideRequestId ??
    data.id ??
    null;
  if (!rideRequestId) {
    console.warn("[FCM] RIDE_REQUESTED payload missing ride id:", data);
    return null;
  }

  return { ...data, type, ride_request_id: String(rideRequestId) };
}

/**
 * Present a ride via a notifee ringing notification.
 *
 * On locked devices the OS promotes this to a full-screen takeover
 * (fullScreenAction). On unlocked devices it shows as a heads-up
 * banner with Accept / Decline action buttons. Either way, tap
 * opens our custom RN ride-offer screen via deep link.
 */
async function presentRide(ride: FcmRidePayload): Promise<void> {
  await displayRingingNotification({
    rideRequestId: ride.ride_request_id,
    riderName: typeof ride.rider_name === "string" ? ride.rider_name : undefined,
    fare: ride.fare,
    distance: ride.distance,
    pickup: typeof ride.pickup === "string" ? ride.pickup : undefined,
    destination: typeof ride.destination === "string" ? ride.destination : undefined,
  });
}

async function handleRemoteMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage | null | undefined,
  origin: "background" | "foreground"
): Promise<void> {
  const ride = parseRidePayload(remoteMessage);
  if (!ride) {
    console.log(`📨 [FCM/${origin}] Non-ride message, ignoring`);
    return;
  }

  // In foreground, the WS-driven modal is the primary UX. Backend
  // dual-sends (WS + FCM), so the FCM copy here is redundant — firing
  // CallKeep would slam a full-screen incoming-call UI over the app the
  // driver is already using. Claim dedup so a late-arriving WS event for
  // the same ride is not double-presented, then stop here. WS will
  // present via the existing rideNotifications flow.
  if (origin === "foreground") {
    shouldPresent(ride.ride_request_id, `fcm:${origin}`);
    console.log(
      `🪟 [FCM/foreground] Deferring to WS modal for ride ${ride.ride_request_id}`
    );
    return;
  }

  // Background / killed: native CallKeep UI is the only way to reach the
  // driver. Dedup guards the (rare) race where WS reconnects and
  // redelivers the same ride before CallKeep finishes presenting.
  if (!shouldPresent(ride.ride_request_id, `fcm:${origin}`)) {
    console.log(
      `🟰 [FCM/${origin}] Ride ${ride.ride_request_id} already claimed, skipping`
    );
    return;
  }

  try {
    await presentRide(ride);
  } catch (err) {
    console.error(`❌ [FCM/${origin}] presentRide failed:`, err);
  }
}

let initialised = false;

/**
 * Register FCM handlers. Safe to call multiple times — idempotent via
 * `initialised` flag. Background handler registration MUST happen at
 * module load (index.js), before any UI renders.
 */
export function initFcm(): void {
  if (initialised) return;
  initialised = true;

  // Background / killed-state handler. Runs in a headless JS instance.
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("📥 [FCM/background] Message received:", remoteMessage?.messageId);
    await handleRemoteMessage(remoteMessage, "background");
  });

  // Foreground handler. Fires while the JS runtime is live. The WS path is
  // usually primary in foreground, but we still run the dedup-guarded
  // handler so dual-send doesn't cause a race if WS is momentarily
  // disconnected.
  messaging().onMessage(async (remoteMessage) => {
    console.log("📥 [FCM/foreground] Message received:", remoteMessage?.messageId);
    await handleRemoteMessage(remoteMessage, "foreground");
  });

  // Token refresh — push the new token to the backend so dispatch keeps
  // working. deviceRegistration.ts short-circuits if unchanged.
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

/**
 * Fetch the current FCM token. Exposed for deviceRegistration so the login
 * / cold-start paths can prefer the native Firebase token over
 * expo-notifications' token (they're both FCM on Android, but
 * @react-native-firebase is the source of truth for this app).
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    const authStatus = await messaging().hasPermission();
    if (
      authStatus === messaging.AuthorizationStatus.DENIED
    ) {
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

/**
 * Request notification permission via the Firebase SDK. On Android 13+
 * this triggers the POST_NOTIFICATIONS runtime prompt; on older Android
 * it is an immediate grant. Idempotent — safe to call alongside the
 * existing expo-notifications prompt.
 */
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
