import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Alert, Linking, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";

/**
 * Get device push token for FCM/APNs
 * @returns Promise<string | null> - Device push token or null if failed
 */
export async function getDevicePushToken(): Promise<string | null> {
    try {
        if (!Device.isDevice) {
            console.log("Not a physical device - push notifications unavailable");
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
                await Notifications.deleteNotificationChannelAsync("request");
                await Notifications.setNotificationChannelAsync("request_v3", {
                    name: "Ride Request",
                    importance: Notifications.AndroidImportance.MAX,
                    sound: "new_kablux_sound.wav",
                    vibrationPattern: [0, 500, 200, 500, 200, 500],
                    lightColor: "#FF231F7C",
                });
            } catch (channelError) {
                console.error("Failed to set Android notification channel:", channelError);
            }
        }

        const tokenData = await Notifications.getDevicePushTokenAsync();
        const token = tokenData.data;

        console.log("Device Push Token:", token);
        console.log("Token Type:", tokenData.type);

        return token;
    } catch (error: any) {
        console.error("Failed to get device push token:", error);
        return null;
    }
}

/**
 * Hook to handle push notifications setup and configuration
 * @param enabled - Whether to enable push notifications (default: true)
 */
export function usePushNotifications(enabled: boolean = true) {
    const navigation = useNavigation<any>();

    useEffect(() => {
        if (!enabled) return;

        // Configure notification handler
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        // Handle notification clicks


        // Initialize push notifications
        const initializePushNotifications = async () => {
            try {
                const token = await getDevicePushToken();

                if (token) {
                    console.log("Push notifications initialized successfully");
                    // You can handle the token here (e.g., save to backend)
                }
            } catch (error) {
                console.error("Error initializing push notifications:", error);
            }
        };

        initializePushNotifications();

    }, [enabled, navigation]);
}