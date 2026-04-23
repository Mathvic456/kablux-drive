import { Alert, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Battery optimization exemption prompt.
 *
 * Android's Doze mode + OEM-specific aggressive process killers (MIUI,
 * ColorOS, OneUI) suspend the app's foreground service and delay FCM
 * delivery. Asking the user to whitelist the app from battery optimization
 * is the recommended mitigation.
 *
 * We open the system settings page (`android.settings.
 * IGNORE_BATTERY_OPTIMIZATION_SETTINGS`) where the user can toggle the app
 * off the optimized list. We don't use the direct-grant intent
 * `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` because Play Store policy
 * restricts that permission to a small set of use cases.
 *
 * This is additive, non-blocking UX — failure to whitelist just means
 * degraded delivery, not broken.
 */

const PROMPTED_KEY = "batteryOptimization.promptedAt";
const PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function hasPromptedRecently(): Promise<boolean> {
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
 * Ask the user to disable battery optimization for the app. Shows a
 * rationale Alert first, then opens the system settings page on confirm.
 * Returns true if the user accepted the prompt (tapped "Open settings"),
 * false otherwise. Call site is responsible for deciding when to invoke.
 *
 * @param opts.force ignore the cooldown and re-prompt
 */
export async function requestBatteryOptimizationExemption(
  opts: { force?: boolean } = {}
): Promise<boolean> {
  if (Platform.OS !== "android") return false;

  if (!opts.force && (await hasPromptedRecently())) {
    console.log("🔋 [BatteryOpt] Recently prompted, skipping");
    return false;
  }

  await markPrompted();

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      "Stay available for ride requests",
      "Android may put Kablux to sleep while you're online, which can delay or drop ride requests. To avoid missing rides, please remove Kablux from battery optimization.",
      [
        {
          text: "Not now",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Open settings",
          onPress: async () => {
            try {
              await Linking.sendIntent(
                "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"
              );
              resolve(true);
            } catch (err) {
              console.warn("🔋 [BatteryOpt] sendIntent failed, fallback to settings:", err);
              try {
                await Linking.openSettings();
                resolve(true);
              } catch {
                resolve(false);
              }
            }
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
