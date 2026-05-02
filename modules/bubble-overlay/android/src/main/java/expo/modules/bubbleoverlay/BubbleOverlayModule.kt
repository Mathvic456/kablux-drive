package expo.modules.bubbleoverlay

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BubbleOverlayModule : Module() {
  private var dismissReceiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("BubbleOverlay")

    Events("onDismissed")

    OnCreate {
      val ctx = appContext.reactContext ?: return@OnCreate
      val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
          if (intent?.action == BubbleService.ACTION_DISMISSED) {
            sendEvent("onDismissed", emptyMap<String, Any>())
          }
        }
      }
      val filter = IntentFilter(BubbleService.ACTION_DISMISSED)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        ctx.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        @Suppress("UnspecifiedRegisterReceiverFlag")
        ctx.registerReceiver(receiver, filter)
      }
      dismissReceiver = receiver
    }

    OnDestroy {
      val ctx = appContext.reactContext
      val receiver = dismissReceiver
      if (ctx != null && receiver != null) {
        try { ctx.unregisterReceiver(receiver) } catch (_: Exception) { /* not registered */ }
      }
      dismissReceiver = null
    }

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

    Function("show") {
      val ctx = appContext.reactContext
      if (ctx != null &&
        (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(ctx))) {
        BubbleService.start(ctx, replace = false)
      }
    }

    Function("update") {
      val ctx = appContext.reactContext
      if (ctx != null) {
        BubbleService.start(ctx, replace = true)
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
