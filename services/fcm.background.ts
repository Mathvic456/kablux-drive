import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
} from '@notifee/react-native';

export const RIDE_ALERT_CHANNEL_ID = 'ride_alert';
const RIDE_NOTIFICATION_TTL_MS = 25_000;

let channelEnsured: Promise<void> | null = null;

export async function ensureRideAlertChannel(): Promise<void> {
  if (channelEnsured) return channelEnsured;
  channelEnsured = (async () => {
    await notifee.createChannel({
      id: RIDE_ALERT_CHANNEL_ID,
      name: 'Incoming ride requests',
      description:
        'Full-screen alerts for new ride offers. Keep enabled to avoid missing rides.',
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
      bypassDnd: true,
      visibility: AndroidVisibility.PUBLIC,
    });
  })();
  return channelEnsured;
}

function formatRideBody(data: Record<string, string>): string {
  const offer = data.rider_offer ?? data.fare;
  const pickup = data.pickup ?? data.from ?? '';
  const fareLabel = offer && offer !== 'None' ? `₦${offer}` : 'Standard fare';
  return pickup ? `${fareLabel} • ${pickup}` : fareLabel;
}

/**
 * Display a full-screen-intent ride alert via Notifee.
 *
 * Call this from the foreground notification handler (or any place that
 * detects a ride request) when an incoming notification has
 * `type === "RIDE_REQUESTED"`. The system wakes the screen and launches
 * the activity over the lock screen.
 */
export async function displayRideAlertNotification(
  data: Record<string, string>,
): Promise<void> {
  console.log("🚖 [Notifee] displayRideAlertNotification called with data:", JSON.stringify(data, null, 2));
  await ensureRideAlertChannel();
  console.log("🚖 [Notifee] Channel ensured");
  const rideId = data.ride_id || `unknown_${Date.now()}`;
  const result = await notifee.displayNotification({
    id: `ride_${rideId}`,
    title: data.title || 'New ride request',
    body: formatRideBody(data),
    data,
    android: {
      channelId: RIDE_ALERT_CHANNEL_ID,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: 'ic_notification',
      autoCancel: true,
      timeoutAfter: RIDE_NOTIFICATION_TTL_MS,
      pressAction: { id: 'default', launchActivity: 'default' },
      fullScreenAction: { id: 'default', launchActivity: 'default' },
    },
  });
  console.log("🚖 [Notifee] displayNotification returned id:", result);
}

export function isRideRequestPayload(
  data: Record<string, any> | null | undefined,
): boolean {
  if (!data) return false;
  return data.type === 'RIDE_REQUESTED' || data.click_action === 'RIDE_REQUESTED';
}

/**
 * Display a generic full-screen-intent notification for any payload.
 * Used as the catch-all for non-ride-request notifications when we want
 * every alert to wake the device and take over the lock screen.
 */
export async function displayFullScreenNotification(
  payload: {
    title?: string;
    body?: string;
    data?: Record<string, any>;
  },
): Promise<void> {
  console.log("📣 [Notifee] displayFullScreenNotification called with payload:", JSON.stringify(payload, null, 2));
  await ensureRideAlertChannel();
  console.log("📣 [Notifee] Channel ensured");
  const data = (payload.data ?? {}) as Record<string, string>;
  const id = data.notification_id || `notif_${Date.now()}`;
  const resolvedTitle = payload.title || data.title || 'Kablux Drive';
  const resolvedBody = payload.body || data.message || data.body || '';
  console.log("📣 [Notifee] Showing id:", id, "title:", resolvedTitle, "body:", resolvedBody);
  const result = await notifee.displayNotification({
    id,
    title: resolvedTitle,
    body: resolvedBody,
    data,
    android: {
      channelId: RIDE_ALERT_CHANNEL_ID,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: 'ic_notification',
      autoCancel: true,
      pressAction: { id: 'default', launchActivity: 'default' },
      fullScreenAction: { id: 'default', launchActivity: 'default' },
    },
  });
  console.log("📣 [Notifee] displayNotification returned id:", result);
}

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { pressAction, notification } = detail;
  if (!notification) return;
  if (pressAction?.id === 'decline') {
    await notifee.cancelNotification(notification.id ?? '');
  }
});
