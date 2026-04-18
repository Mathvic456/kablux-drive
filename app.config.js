export default {
  expo: {
    name: "kablux-drive",
    slug: "kablux-drive",
    version: "1.0.1",
    scheme: "kablux-drive",
    orientation: "portrait",
    icon: "./assets/r-logo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    owner: "agbaby02",
    splash: {
      image: "./assets/adaptive-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    notification: {
      color: "#ffffff",
    },
    ios: {
      buildNumber: "5",
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "This app needs access to your location to share it with emergency contacts.",
        NSMicrophoneUsageDescription:
          "This app needs access to your microphone to record audio for safety purposes.",
        UIBackgroundModes: ["audio", "location"],
        LSApplicationQueriesSchemes: ["comgooglemaps", "maps"],
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Kablux needs your location while the app is in the background so riders can see your position during an active trip.",
        NSLocationAlwaysUsageDescription:
          "Kablux needs your location while the app is in the background so riders can see your position during an active trip.",
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_IOS_API_KEY,
      },
      bundleIdentifier: "com.kablux.kabluxdriver",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
        },
      },
      edgeToEdgeEnabled: false,
      blockedPermissions: [
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_AUDIO",
        "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_CONTACTS",
        "android.permission.WRITE_CONTACTS",
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT",
        "android.permission.SYSTEM_ALERT_WINDOW",
      ],
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
        "android.permission.CALL_PHONE",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
      ],
      package: "com.crashingout.kabluxdrive",
      googleServicesFile: "./google-services.json",
      versionCode: 53,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow $(PRODUCT_NAME) to access your photos for document upload.",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true,
        },
      ],
      "expo-mail-composer",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Kablux needs your location while in the background so riders can see your position during an active trip.",
          locationAlwaysPermission:
            "Kablux needs your location while in the background so riders can see your position during an active trip.",
          locationWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      [
        "expo-notifications",
        {
          sound: "./assets/sounds/new_kablux_sound.wav",
        },
      ],
      [
        "expo-av",
        {
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone for audio recording.",
        },
      ],
      "expo-font",
    ],
    extra: {
      eas: {
        projectId: "67453bc9-908b-4dea-8b94-d45f405b60d5",
      },
    },
  },
};