import { useEffect, useState, useCallback, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Alert, Linking, Platform } from "react-native";
import { navigationRef } from "../screens/context/NavigationContext";

export interface PushTokenState {
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

export async function getDevicePushToken(): Promise<string | null> {
    try {
        if (!Device.isDevice) {
            console.log("📱 Not a physical device - push notifications unavailable");
            return null;
        }

        const options = Platform.OS === 'ios' ? {
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
            },
        } : {};

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync(options);
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            Alert.alert(
                "Notifications Disabled",
                "Oops! Notifications are turned off. To make sure you don't miss important updates, please enable notifications in your device settings.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Open Settings",
                        onPress: () => {
                            if (Platform.OS === "ios") {
                                Linking.openURL("app-settings:");
                            } else {
                                Linking.openSettings();
                            }
                        }
                    }
                ],
                { cancelable: true }
            );
            return null;
        }

        if (Platform.OS === "android") {
            try {
                await Notifications.setNotificationChannelAsync("default", {
                    name: "default",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF231F7C",
                    sound: 'kablux-sound.mp3',
                    enableVibrate: true,
                });
            } catch (channelError) {
                console.error("❌ Failed to set Android notification channel:", channelError);
            }
        }

        const tokenData = await Notifications.getDevicePushTokenAsync();
        const token = tokenData.data;

        console.log("🔑 Device Push Token:", token);
        console.log("📋 Token Type:", tokenData.type);

        return token;
    } catch (error: any) {
        console.error("❌ Failed to get device push token:", error);
        return null;
    }
}

function handleNotificationNavigation(data: any) {
    if (!data) return;

    console.log("🔔 [NOTIFICATION] Processing tap data:", JSON.stringify(data));

    // If notification contains ride request data, navigate to Home
    // where ride requests are displayed
    const hasRideData = data.ride_request_id || data.ride_id || data.type === "RIDE_REQUESTED";

    if (hasRideData) {
        console.log("🚗 [NOTIFICATION] Ride request notification tapped, navigating to Home");

        // Wait for navigation to be ready (handles cold start)
        const tryNavigate = (attempts = 0) => {
            if (navigationRef.isReady()) {
                navigationRef.reset({
                    index: 0,
                    routes: [{ name: 'Mainapp' as never }],
                });
            } else if (attempts < 10) {
                setTimeout(() => tryNavigate(attempts + 1), 500);
            }
        };

        tryNavigate();
        return;
    }

    // Generic screen navigation from notification payload
    if (data.screen) {
        const tryNavigate = (attempts = 0) => {
            if (navigationRef.isReady()) {
                navigationRef.navigate(data.screen as never, data.params as never);
            } else if (attempts < 10) {
                setTimeout(() => tryNavigate(attempts + 1), 500);
            }
        };

        tryNavigate();
    }
}

export function usePushNotifications(enabled: boolean = true) {
    const [pushTokenState, setPushTokenState] = useState<PushTokenState>({
        token: null,
        isLoading: false,
        error: null,
    });

    const initialNotificationHandled = useRef(false);

    const getPushToken = useCallback(async (): Promise<string | null> => {
        if (!enabled) return null;

        setPushTokenState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const token = await getDevicePushToken();
            setPushTokenState({
                token,
                isLoading: false,
                error: null,
            });
            return token;
        } catch (error: any) {
            const errorMessage = error?.message || "Failed to get push token";
            setPushTokenState({
                token: null,
                isLoading: false,
                error: errorMessage,
            });
            console.error("❌ Error getting push token:", error);
            return null;
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("🔔 Notification clicked:", response.notification.request.content.data);
            const data = response.notification.request.content.data;
            handleNotificationNavigation(data);
        });

        // Handle cold start: check if app was opened via notification
        if (!initialNotificationHandled.current) {
            initialNotificationHandled.current = true;
            Notifications.getLastNotificationResponseAsync().then(response => {
                if (response) {
                    console.log("🔔 [COLD START] App opened from notification:", response.notification.request.content.data);
                    const data = response.notification.request.content.data;
                    handleNotificationNavigation(data);
                }
            });
        }

        getPushToken().then((token) => {
            if (token) {
                console.log("✅ Push notifications initialized successfully");
            }
        });

        return () => {
            subscription.remove();
        };
    }, [enabled, getPushToken]);

    return {
        ...pushTokenState,
        getPushToken,
    };
}
