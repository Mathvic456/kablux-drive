import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee, { AndroidNotificationSetting } from "@notifee/react-native";

/**
 * USE_FULL_SCREEN_INTENT permission prompt.
 *
 * On Android 14+ (API 34+), this permission defaults to DENIED for any
 * app that isn't classified as a default dialer or alarm app. When
 * denied, notifee's `fullScreenAction` silently degrades to a heads-up
 * banner — meaning ride dispatches never take over the lock screen and
 * the driver can miss them.
 *
 * The permission is declared in the manifest (see app.config.js) but
 * the user must toggle it in system settings via the dedicated page.
 * Notifee exposes `openAlarmPermissionSettings()` which routes to the
 * correct page on every Android version.
 *
 * Cooldown-gated so we don't pester the user on every online toggle.
 */

const PROMPTED_KEY = "fullScreenIntentPermission.promptedAt";
const PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

async function hasPromptedRecently(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PROMPTED_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < PROMPT_COOLDOWN_MS;
  } catch {
    return false;
  }
}

async function markPrompted(): Promise<void> {
  try {
    await AsyncStorage.setItem(PROMPTED_KEY, String(Date.now()));
  } catch {
    /* non-fatal */
  }
}

/**
 * Check whether the OS will currently honor a fullScreenAction.
 * Returns false on iOS, on older Android (no equivalent setting), and
 * when notifee can't read the setting.
 */
export async function isFullScreenIntentEnabled(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    const settings = await notifee.getNotificationSettings();
    const status = settings.android?.alarm;
    return status === AndroidNotificationSetting.ENABLED;
  } catch (err) {
    console.warn("[FullScreenIntent] getNotificationSettings failed:", err);
    return false;
  }
}

/**
 * Show the rationale + open the system settings page.
 *
 * @param opts.force ignore cooldown
 * @returns true if the user accepted the prompt and we routed to settings
 */
export async function requestFullScreenIntentPermission(
  opts: { force?: boolean } = {}
): Promise<boolean> {
  if (Platform.OS !== "android") return false;

  // Short-circuit if already enabled — no need to prompt.
  if (await isFullScreenIntentEnabled()) {
    console.log("🔓 [FullScreenIntent] Already enabled, skipping prompt");
    return true;
  }

  if (!opts.force && (await hasPromptedRecently())) {
    console.log("🔕 [FullScreenIntent] Recently prompted, skipping");
    return false;
  }

  await markPrompted();

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      "Enable full-screen ride alerts",
      "To make sure you never miss a ride request, allow Kablux to display incoming rides as a full-screen takeover — even when your phone is locked.\n\nOn the next screen, find Kablux and turn it on.",
      [
        {
          text: "Not now",
          style: "cancel",
          onPress: () => {
            console.log("🔕 [FullScreenIntent] User dismissed prompt");
            resolve(false);
          },
        },
        {
          text: "Open settings",
          onPress: async () => {
            try {
              await notifee.openAlarmPermissionSettings();
              console.log("🔓 [FullScreenIntent] Opened settings page");
              resolve(true);
            } catch (err) {
              console.warn(
                "[FullScreenIntent] openAlarmPermissionSettings failed:",
                err
              );
              resolve(false);
            }
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
