import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from "@notifee/react-native";
import { Linking } from "react-native";
import { api } from "./api";
import { markAccepted, markDeclined } from "./rideDedup";

/**
 * Ringing notification for incoming ride requests.
 *
 * Replaces the CallKeep-based system call UI with a notifee-driven
 * full-screen notification. On locked devices the OS promotes the
 * notification to a full-screen takeover thanks to `fullScreenAction`;
 * on unlocked devices it shows as a high-importance heads-up banner.
 * Either way, the tap target opens MainActivity with the same deep link
 * the CallKeep path used, so downstream hydration is unchanged.
 *
 * UI styling is completely under our control via the IncomingRide
 * screen that renders after the deep link fires. The notification
 * itself is a thin OS chrome around the attention grab.
 */

const CHANNEL_ID = "kablux.ride.incoming";
const CHANNEL_NAME = "Incoming Ride Requests";

// Maps rideRequestId -> notification id so we can dismiss a specific
// ride's notification on cancel. notifee notification ids are strings
// we choose; using the ride id keeps the mapping trivial.
function notificationIdFor(rideRequestId: string): string {
  return `ride:${rideRequestId}`;
}

async function ensureChannel(): Promise<string> {
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
    sound: "new_kablux_sound", // raw resource bundled from assets/sounds/new_kablux_sound.wav
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    visibility: AndroidVisibility.PUBLIC,
    bypassDnd: true,
  });
}

export async function displayRingingNotification(args: {
  rideRequestId: string;
  riderName?: string;
  fare?: string | number;
  distance?: string | number;
  pickup?: string;
  destination?: string;
}): Promise<void> {
  const channelId = await ensureChannel();
  const id = notificationIdFor(args.rideRequestId);

  const body = [
    args.fare ? `Fare ${args.fare}` : null,
    args.distance ? `${args.distance} km` : null,
    args.pickup ? `Pickup: ${args.pickup}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const deepLink = `kablux-drive://ride/${encodeURIComponent(
    args.rideRequestId
  )}?source=notification`;

  await notifee.displayNotification({
    id,
    title: args.riderName
      ? `New ride from ${args.riderName}`
      : "New ride request",
    body: body || "Tap to view details",
    data: {
      rideRequestId: args.rideRequestId,
      deepLink,
    },
    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      loopSound: true,
      ongoing: true,
      autoCancel: false,
      smallIcon: "ic_launcher",
      pressAction: {
        id: "default",
        launchActivity: "default",
      },
      // OS promotes to full-screen takeover when device is locked.
      fullScreenAction: {
        id: "default",
        launchActivity: "default",
      },
      actions: [
        {
          title: "Accept",
          pressAction: {
            id: "accept",
            launchActivity: "default",
          },
        },
        {
          title: "Decline",
          pressAction: {
            id: "decline",
          },
        },
      ],
    },
  });
}

export async function cancelRingingNotification(
  rideRequestId: string
): Promise<void> {
  try {
    await notifee.cancelNotification(notificationIdFor(rideRequestId));
  } catch (err) {
    console.warn("[RingingNotif] cancelNotification failed:", err);
  }
}

async function postDecline(rideRequestId: string): Promise<void> {
  try {
    await api.post(`rides/${rideRequestId}/decline/`, { source: "notification" });
  } catch (err: any) {
    console.warn(
      "⚠️ [RingingNotif] decline POST failed:",
      err?.response?.status || err?.message
    );
  }
}

async function handleEvent(type: EventType, detail: any): Promise<void> {
  const rideRequestId: string | undefined = detail?.notification?.data?.rideRequestId;
  const deepLink: string | undefined = detail?.notification?.data?.deepLink;
  const actionId: string | undefined = detail?.pressAction?.id;

  if (!rideRequestId) return;

  if (type === EventType.ACTION_PRESS && actionId === "decline") {
    markDeclined(rideRequestId);
    await cancelRingingNotification(rideRequestId);
    await postDecline(rideRequestId);
    return;
  }

  if (
    type === EventType.PRESS ||
    (type === EventType.ACTION_PRESS && actionId === "accept") ||
    (type === EventType.ACTION_PRESS && actionId === "default")
  ) {
    markAccepted(rideRequestId);
    await cancelRingingNotification(rideRequestId);
    if (deepLink) {
      try {
        await Linking.openURL(deepLink);
      } catch (err) {
        console.warn("[RingingNotif] Failed to open deep link:", err);
      }
    }
    return;
  }
}

let listenersRegistered = false;

/**
 * Register foreground + background notification event handlers.
 * Safe to call multiple times — idempotent. Background handler
 * registration must happen at module load (index.js) so killed-state
 * action-button taps are processed.
 */
export function setupRingingNotification(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  notifee.onForegroundEvent(({ type, detail }) => {
    handleEvent(type, detail).catch((err) =>
      console.error("[RingingNotif] foreground event error:", err)
    );
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    await handleEvent(type, detail).catch((err) =>
      console.error("[RingingNotif] background event error:", err)
    );
  });

  console.log("✅ [RingingNotif] Handlers registered");
}
