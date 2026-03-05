export default {
  expo: {
    name: "kablux-drive",
    slug: "kablux-drive",
    version: "1.0.0",
    scheme: "kablux-drive",
    orientation: "portrait",
    icon: "./assets/r-logo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    owner: "agbaby02",
    splash: {
      image: "./assets/splash-icon.png",
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
        UIBackgroundModes: ["audio"],
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_IOS_API_KEY,
      },
      "bundleIdentifier": "com.kablux.kabluxdriver",
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
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CALL_PHONE",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
      ],
      package: "com.crashingout.kabluxdrive",
      googleServicesFile: "./google-services.json",
      versionCode: 35
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true,
        },
      ],
      "expo-mail-composer",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
          locationAlwaysPermission: "Allow $(PRODUCT_NAME) to use your location.",
          locationWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
        },
      ],
      [
        "expo-notifications",
        {
          sound: "./assets/sounds/kablux-sound.wav"
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