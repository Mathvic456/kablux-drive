import { requireNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

/**
 * Typed JS wrapper around the tiny KeyguardCheck native module.
 * iOS is a no-op — this module targets Android only.
 */
type KeyguardCheckNative = {
  isLocked(): boolean;
  isInteractive(): boolean;
};

let cached: KeyguardCheckNative | null | undefined;

function getNative(): KeyguardCheckNative | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== "android") {
    cached = null;
    return null;
  }
  try {
    cached = requireNativeModule<KeyguardCheckNative>("KeyguardCheck");
  } catch (err) {
    console.warn("[KeyguardCheck] Native module not linked:", err);
    cached = null;
  }
  return cached;
}

/** True when the Android keyguard is currently showing (locked). */
export function isDeviceLocked(): boolean {
  const mod = getNative();
  if (!mod) return false;
  try {
    return mod.isLocked();
  } catch (err) {
    console.warn("[KeyguardCheck] isLocked threw:", err);
    return false;
  }
}

/** True when the screen is on + device is interactive. */
export function isDeviceInteractive(): boolean {
  const mod = getNative();
  if (!mod) return false;
  try {
    return mod.isInteractive();
  } catch (err) {
    console.warn("[KeyguardCheck] isInteractive threw:", err);
    return false;
  }
}
