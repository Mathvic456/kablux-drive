package expo.modules.bubbleoverlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import androidx.core.app.NotificationCompat
import kotlin.math.abs

class BubbleService : Service() {
  private var bubbleView: View? = null
  private var windowManager: WindowManager? = null
  private var layoutParams: WindowManager.LayoutParams? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    startInForeground()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val rider = intent?.getStringExtra(EXTRA_RIDER) ?: ""
    val fare = intent?.getStringExtra(EXTRA_FARE) ?: ""
    val status = intent?.getStringExtra(EXTRA_STATUS) ?: "incoming"
    ensureBubbleAttached()
    applyPayload(rider, fare, status)
    return START_STICKY
  }

  private fun startInForeground() {
    val channelId = ensureBubbleStatusChannel()
    val notification: Notification = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(android.R.drawable.ic_menu_compass)
      .setContentTitle("Kablux Drive is active")
      .setContentText("Tap to return to the app")
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setContentIntent(launchAppPendingIntent())
      .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
        FG_NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else {
      startForeground(FG_NOTIFICATION_ID, notification)
    }
  }

  private fun ensureBubbleStatusChannel(): String {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (nm.getNotificationChannel(CHANNEL_ID) == null) {
        nm.createNotificationChannel(
          NotificationChannel(
            CHANNEL_ID,
            "Driver session",
            NotificationManager.IMPORTANCE_LOW,
          ).apply {
            description = "Shown while the floating ride bubble is active."
            setShowBadge(false)
          },
        )
      }
    }
    return CHANNEL_ID
  }

  private fun launchAppPendingIntent(): PendingIntent {
    val launch = packageManager.getLaunchIntentForPackage(packageName)
      ?: Intent(Intent.ACTION_MAIN).apply {
        setPackage(packageName)
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(
      this, 0, launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun ensureBubbleAttached() {
    if (bubbleView != null) return

    val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val view = LayoutInflater.from(this).inflate(R.layout.bubble_view, null, false)

    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      @Suppress("DEPRECATION")
      WindowManager.LayoutParams.TYPE_PHONE
    }

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      type,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = 24
      y = 240
    }

    attachTouchHandler(view, params, wm)

    try {
      wm.addView(view, params)
    } catch (e: Exception) {
      e.printStackTrace()
      return
    }

    bubbleView = view
    windowManager = wm
    layoutParams = params
  }

  private fun attachTouchHandler(
    view: View,
    params: WindowManager.LayoutParams,
    wm: WindowManager,
  ) {
    val touchSlop = (view.context.resources.displayMetrics.density * 8).toInt()
    var initialX = 0
    var initialY = 0
    var initialTouchX = 0f
    var initialTouchY = 0f
    var moved = false

    view.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          initialX = params.x
          initialY = params.y
          initialTouchX = event.rawX
          initialTouchY = event.rawY
          moved = false
          true
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = (event.rawX - initialTouchX).toInt()
          val dy = (event.rawY - initialTouchY).toInt()
          if (!moved && (abs(dx) > touchSlop || abs(dy) > touchSlop)) {
            moved = true
          }
          if (moved) {
            params.x = initialX + dx
            params.y = initialY + dy
            try {
              wm.updateViewLayout(view, params)
            } catch (_: Exception) { /* view may be detached */ }
          }
          true
        }
        MotionEvent.ACTION_UP -> {
          if (!moved) {
            try {
              startActivity(launchAppIntent())
            } catch (e: Exception) {
              e.printStackTrace()
            }
          }
          true
        }
        else -> false
      }
    }
  }

  private fun launchAppIntent(): Intent {
    val launch = packageManager.getLaunchIntentForPackage(packageName)
      ?: Intent(Intent.ACTION_MAIN).apply {
        setPackage(packageName)
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
    return launch.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
  }

  private fun applyPayload(rider: String, fare: String, status: String) {
    val view = bubbleView ?: return
    val statusText = view.findViewById<TextView>(R.id.bubble_status)
    val fareText = view.findViewById<TextView>(R.id.bubble_fare)
    statusText?.text = humanReadableStatus(status, rider)
    fareText?.text = if (fare.isNotBlank()) "₦$fare" else ""
    fareText?.visibility = if (fare.isNotBlank()) View.VISIBLE else View.GONE
  }

  private fun humanReadableStatus(status: String, rider: String): String =
    when (status) {
      "incoming" -> if (rider.isNotBlank()) "New ride • $rider" else "New ride"
      "accepted" -> "Heading to pickup"
      "arrived" -> "Arrived at pickup"
      "on_trip" -> "On trip"
      "idle" -> "Driver online"
      else -> "Driver online"
    }

  override fun onDestroy() {
    detachBubble()
    super.onDestroy()
  }

  private fun detachBubble() {
    val view = bubbleView
    val wm = windowManager
    if (view != null && wm != null) {
      try { wm.removeView(view) } catch (_: Exception) { /* already detached */ }
    }
    bubbleView = null
    windowManager = null
    layoutParams = null
  }

  companion object {
    private const val CHANNEL_ID = "bubble_status"
    private const val FG_NOTIFICATION_ID = 9912
    private const val EXTRA_RIDER = "rider"
    private const val EXTRA_FARE = "fare"
    private const val EXTRA_STATUS = "status"
    private const val ACTION_STOP = "expo.modules.bubbleoverlay.STOP"

    fun start(context: Context, payload: Map<String, Any?>, replace: Boolean) {
      val intent = Intent(context, BubbleService::class.java).apply {
        putExtra(EXTRA_RIDER, payload["rider"]?.toString().orEmpty())
        putExtra(EXTRA_FARE, payload["fare"]?.toString().orEmpty())
        putExtra(EXTRA_STATUS, payload["status"]?.toString().orEmpty())
        if (replace) action = "UPDATE" else action = "SHOW"
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      val intent = Intent(context, BubbleService::class.java).apply {
        action = ACTION_STOP
      }
      context.stopService(intent)
    }
  }
}
