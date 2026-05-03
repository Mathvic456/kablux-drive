import { Alert, Platform } from "react-native";
import notifee, {
    AndroidNotificationSetting,
    AuthorizationStatus,
} from "@notifee/react-native";

export type PermissionGap = "notifications" | "fullScreenIntent";

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
