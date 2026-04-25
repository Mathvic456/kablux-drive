const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Adds android:showWhenLocked + android:turnScreenOn to MainActivity.
 *
 * USE_FULL_SCREEN_INTENT permission lets the OS LAUNCH the activity
 * over the lock screen. These two activity attributes let the launched
 * activity actually be VISIBLE over the keyguard (and turn the screen
 * on if it's off). Without them, MainActivity launches behind the lock
 * screen and the user sees nothing.
 *
 * Both attributes were introduced in API 27 (Android 8.1) and replace
 * the older window flags FLAG_SHOW_WHEN_LOCKED + FLAG_TURN_SCREEN_ON.
 *
 * Reference:
 *   https://developer.android.com/reference/android/app/Activity#setShowWhenLocked(boolean)
 */
module.exports = function withMainActivityLockScreenFlags(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest?.application?.[0];
    if (!application) {
      console.warn(
        "[withMainActivityLockScreenFlags] No <application> in manifest, skipping"
      );
      return config;
    }

    const mainActivity = (application.activity || []).find((a) => {
      const name = a?.$?.["android:name"];
      return name === ".MainActivity" || name?.endsWith(".MainActivity");
    });

    if (!mainActivity) {
      console.warn(
        "[withMainActivityLockScreenFlags] MainActivity not found, skipping"
      );
      return config;
    }

    mainActivity.$["android:showWhenLocked"] = "true";
    mainActivity.$["android:turnScreenOn"] = "true";

    console.log(
      "[withMainActivityLockScreenFlags] Applied showWhenLocked + turnScreenOn"
    );

    return config;
  });
};
