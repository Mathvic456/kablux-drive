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
import androidx.core.app.NotificationCompat
import kotlin.math.abs

class BubbleService : Service() {
  private var bubbleView: View? = null
  private var trashView: View? = null
  private var windowManager: WindowManager? = null
  private var layoutParams: WindowManager.LayoutParams? = null
  private var trashLayoutParams: WindowManager.LayoutParams? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    startInForeground()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    ensureBubbleAttached()
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

  private fun overlayWindowType(): Int =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      @Suppress("DEPRECATION")
      WindowManager.LayoutParams.TYPE_PHONE
    }

  private fun ensureBubbleAttached() {
    if (bubbleView != null) return

    val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val view = LayoutInflater.from(this).inflate(R.layout.bubble_view, null, false)

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      overlayWindowType(),
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
    val density = view.context.resources.displayMetrics.density
    val touchSlop = (density * 8).toInt()
    val dismissRadiusPx = density * DISMISS_RADIUS_DP
    var initialX = 0
    var initialY = 0
    var initialTouchX = 0f
    var initialTouchY = 0f
    var moved = false

    view.setOnTouchListener { v, event ->
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
            showTrashZone(wm)
          }
          if (moved) {
            params.x = initialX + dx
            params.y = initialY + dy
            try {
              wm.updateViewLayout(v, params)
            } catch (_: Exception) { /* view may be detached */ }
            updateTrashHighlight(v, params, dismissRadiusPx)
          }
          true
        }
        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
          val wasMoved = moved
          val overTrash = wasMoved && isOverTrashZone(v, params, dismissRadiusPx)
          hideTrashZone(wm)
          if (overTrash) {
            broadcastDismissed()
            stopSelf()
          } else if (!wasMoved) {
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

  private fun showTrashZone(wm: WindowManager) {
    if (trashView != null) return
    val view = LayoutInflater.from(this).inflate(R.layout.bubble_trash_zone, null, false)
    val metrics = resources.displayMetrics
    val density = metrics.density
    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      overlayWindowType(),
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
      y = (density * TRASH_BOTTOM_MARGIN_DP).toInt()
    }
    try {
      wm.addView(view, params)
      trashView = view
      trashLayoutParams = params
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  private fun hideTrashZone(wm: WindowManager) {
    val view = trashView ?: return
    try { wm.removeView(view) } catch (_: Exception) { /* already detached */ }
    trashView = null
    trashLayoutParams = null
  }

  private fun bubbleCenter(view: View, params: WindowManager.LayoutParams): Pair<Float, Float> {
    val cx = params.x + view.width / 2f
    val cy = params.y + view.height / 2f
    return cx to cy
  }

  private fun trashCenter(): Pair<Float, Float>? {
    val view = trashView ?: return null
    val metrics = resources.displayMetrics
    val cx = metrics.widthPixels / 2f
    val cy = metrics.heightPixels - (resources.displayMetrics.density * TRASH_BOTTOM_MARGIN_DP) - view.height / 2f
    return cx to cy
  }

  private fun isOverTrashZone(
    view: View,
    params: WindowManager.LayoutParams,
    radiusPx: Float,
  ): Boolean {
    val (bx, by) = bubbleCenter(view, params)
    val (tx, ty) = trashCenter() ?: return false
    val dx = bx - tx
    val dy = by - ty
    return (dx * dx + dy * dy) <= radiusPx * radiusPx
  }

  private fun updateTrashHighlight(
    view: View,
    params: WindowManager.LayoutParams,
    radiusPx: Float,
  ) {
    val trash = trashView ?: return
    val active = isOverTrashZone(view, params, radiusPx)
    trash.scaleX = if (active) 1.2f else 1f
    trash.scaleY = if (active) 1.2f else 1f
    trash.alpha = if (active) 1f else 0.85f
  }

  private fun broadcastDismissed() {
    val intent = Intent(ACTION_DISMISSED).apply {
      setPackage(packageName)
    }
    sendBroadcast(intent)
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

  override fun onDestroy() {
    val wm = windowManager
    if (wm != null) hideTrashZone(wm)
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
    private const val ACTION_STOP = "expo.modules.bubbleoverlay.STOP"
    private const val DISMISS_RADIUS_DP = 56f
    private const val TRASH_BOTTOM_MARGIN_DP = 96f

    const val ACTION_DISMISSED = "expo.modules.bubbleoverlay.DISMISSED"

    fun start(context: Context, replace: Boolean) {
      val intent = Intent(context, BubbleService::class.java).apply {
        action = if (replace) "UPDATE" else "SHOW"
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
