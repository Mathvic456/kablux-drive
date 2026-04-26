import { Alert, Platform } from "react-native";
import notifee, {
    AndroidNotificationSetting,
    AuthorizationStatus,
} from "@notifee/react-native";

import { BubbleOverlay } from "../modules/bubble-overlay/src";

export type PermissionGap = "notifications" | "fullScreenIntent" | "overlay";

export async function getMissingDriverPermissions(): Promise<PermissionGap[]> {
    if (Platform.OS !== "android") return [];

    const missing: PermissionGap[] = [];

    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        missing.push("notifications");
    }
    if (
        settings.android.alarm !== undefined &&
        settings.android.alarm !== AndroidNotificationSetting.ENABLED
    ) {
        missing.push("fullScreenIntent");
    }

    if (BubbleOverlay.isSupported() && !BubbleOverlay.hasPermission()) {
        missing.push("overlay");
    }

    return missing;
}

const COPY: Record<PermissionGap, { title: string; body: string; action: () => void | Promise<void> }> = {
    notifications: {
        title: "Notifications",
        body: "Required so you don't miss ride requests.",
        action: () => notifee.openNotificationSettings(),
    },
    fullScreenIntent: {
        title: "Show on lock screen",
        body: "Lets new ride requests light up your phone, even when locked.",
        action: () => notifee.openAlarmPermissionSettings(),
    },
    overlay: {
        title: "Show ride bubble",
        body: "Floats a small bubble over other apps so you can return to a ride quickly.",
        action: () => BubbleOverlay.requestPermission(),
    },
};

function promptForPermission(gap: PermissionGap): Promise<void> {
    const copy = COPY[gap];
    return new Promise<void>((resolve) => {
        Alert.alert(
            copy.title,
            copy.body,
            [
                { text: "Skip", style: "cancel", onPress: () => resolve() },
                {
                    text: "Allow",
                    onPress: async () => {
                        await copy.action();
                        resolve();
                    },
                },
            ],
            { cancelable: false },
        );
    });
}

export async function ensureDriverPermissions(): Promise<boolean> {
    const missing = await getMissingDriverPermissions();
    if (missing.length === 0) return true;

    for (const gap of missing) {
        await promptForPermission(gap);
    }

    const stillMissing = await getMissingDriverPermissions();
    return stillMissing.length === 0;
}

export async function ensureOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== "android" || !BubbleOverlay.isSupported()) return true;
    if (BubbleOverlay.hasPermission()) return true;
    await promptForPermission("overlay");
    return BubbleOverlay.hasPermission();
}
