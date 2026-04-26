package expo.modules.bubbleoverlay

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BubbleOverlayModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BubbleOverlay")

    Function("hasPermission") {
      val ctx = appContext.reactContext ?: return@Function false
      Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(ctx)
    }

    AsyncFunction("requestPermission") { promise: Promise ->
      val ctx = appContext.reactContext
      if (ctx == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(ctx)) {
        promise.resolve(true)
        return@AsyncFunction
      }
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${ctx.packageName}"),
      ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
      ctx.startActivity(intent)
      promise.resolve(false)
    }

    Function("show") { payload: Map<String, Any?> ->
      val ctx = appContext.reactContext
      if (ctx != null &&
        (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(ctx))) {
        BubbleService.start(ctx, payload, replace = false)
      }
    }

    Function("update") { payload: Map<String, Any?> ->
      val ctx = appContext.reactContext
      if (ctx != null) {
        BubbleService.start(ctx, payload, replace = true)
      }
    }

    Function("hide") {
      val ctx = appContext.reactContext
      if (ctx != null) {
        BubbleService.stop(ctx)
      }
    }

    // Bring the app to the foreground from a backgrounded state. Allowed
    // because the app holds SYSTEM_ALERT_WINDOW (granted for the bubble).
    // Optionally accepts a deeplink path appended to the kablux-drive:// scheme,
    // e.g. "ride/<rideId>".
    Function("openApp") { deeplink: String? ->
      val ctx = appContext.reactContext ?: return@Function
      val intent = if (!deeplink.isNullOrBlank()) {
        Intent(Intent.ACTION_VIEW, Uri.parse("kablux-drive://$deeplink"))
      } else {
        ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
          ?: Intent(Intent.ACTION_MAIN).apply {
            setPackage(ctx.packageName)
            addCategory(Intent.CATEGORY_LAUNCHER)
          }
      }
      intent.addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK
          or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
          or Intent.FLAG_ACTIVITY_SINGLE_TOP,
      )
      try {
        ctx.startActivity(intent)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }
}
