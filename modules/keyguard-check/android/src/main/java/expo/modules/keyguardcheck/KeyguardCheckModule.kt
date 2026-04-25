package expo.modules.keyguardcheck

import android.app.KeyguardManager
import android.content.Context
import android.os.PowerManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Tiny native bridge exposing lock-screen state to JS.
 *
 * Used by the FCM handler to decide whether to post a notification
 * (locked) or open the app directly via deep link (unlocked).
 *
 * Intentionally minimal — one getter, no permissions required.
 */
class KeyguardCheckModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KeyguardCheck")

    /**
     * True when the device is currently showing the lock screen
     * (either because the user explicitly locked it or it timed out).
     * Returns false when the device is unlocked or has no secure lock
     * configured.
     */
    Function("isLocked") {
      val context = appContext.reactContext ?: return@Function false
      val km = context.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
      km?.isKeyguardLocked ?: false
    }

    /**
     * True when the screen is on and the device is considered
     * interactive (i.e. the user can interact with it). Useful as a
     * secondary signal: an unlocked-but-screen-off phone is not
     * meaningfully "in use".
     */
    Function("isInteractive") {
      val context = appContext.reactContext ?: return@Function false
      val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
      pm?.isInteractive ?: false
    }
  }
}
