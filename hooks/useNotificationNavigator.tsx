import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef } from "../screens/context/NavigationContext";
import { useAuth } from "../context/AuthContext";

const PENDING_KEY = "pendingNotificationPayload";
const NAV_READY_MAX_ATTEMPTS = 20;
const NAV_READY_INTERVAL_MS = 250;

type NotificationData = Record<string, any> | null | undefined;

const waitForNavReady = (): Promise<boolean> =>
    new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
            if (navigationRef.isReady()) return resolve(true);
            if (++attempts >= NAV_READY_MAX_ATTEMPTS) return resolve(false);
            setTimeout(check, NAV_READY_INTERVAL_MS);
        };
        check();
    });

const stashPending = async (data: NotificationData) => {
    try {
        await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(data ?? {}));
    } catch (err) {
        console.warn("⚠️ Failed to stash pending notification:", err);
    }
};

const consumePending = async (): Promise<NotificationData> => {
    try {
        const raw = await AsyncStorage.getItem(PENDING_KEY);
        if (!raw) return null;
        await AsyncStorage.removeItem(PENDING_KEY);
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const navigateForData = (data: NotificationData) => {
    if (!data) return;
    const type = data.type || data.click_action;
    const hasRideData = data.ride_request_id || data.ride_id || type === "RIDE_REQUESTED";

    if (type === "RIDE_REQUESTED" || hasRideData) {
        // @ts-ignore - untyped navigator params
        navigationRef.navigate("Mainapp", {
            screen: "MainTabs",
            params: { screen: "Home", params: { notificationData: data } },
        });
    } else if (data.screen) {
        // @ts-ignore - untyped navigator params
        navigationRef.navigate(data.screen, data.params || {});
    }
};

/**
 * Single source of truth for notification-tap navigation.
 *
 * Responsibilities:
 *  - Handle foreground/background taps and cold-start taps.
 *  - Gate navigation on a valid auth token; refresh if possible.
 *  - If unauthenticated, stash the payload and replay once a token appears
 *    (i.e. after the user logs in).
 *
 * Render this once, as high as possible inside <AuthProvider>.
 */
export function useNotificationNavigator() {
    const { token, getValidToken } = useAuth();
    const coldStartHandled = useRef(false);
    const replayInFlight = useRef(false);

    const routeWithAuth = async (data: NotificationData) => {
        if (!data) return;

        const valid = await getValidToken().catch(() => null);
        if (!valid) {
            console.log("🔒 [NOTIFICATION] No valid token — stashing payload for post-login replay");
            await stashPending(data);
            return;
        }

        const ready = await waitForNavReady();
        if (!ready) {
            console.warn("⚠️ [NOTIFICATION] Navigation never became ready — stashing");
            await stashPending(data);
            return;
        }

        navigateForData(data);
    };

    // Global notification presentation handler (foreground display behavior).
    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    }, []);

    // Foreground/background tap handling.
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            console.log("🔔 [NOTIFICATION] Tap received:", data);
            routeWithAuth(data);
        });
        return () => sub.remove();
    }, [getValidToken]);

    // Cold-start: app launched from a notification tap.
    useEffect(() => {
        if (coldStartHandled.current) return;
        coldStartHandled.current = true;

        Notifications.getLastNotificationResponseAsync()
            .then((response) => {
                if (!response) return;
                const data = response.notification.request.content.data;
                console.log("🔔 [COLD START] App opened from notification:", data);
                routeWithAuth(data);
            })
            .catch((err) => console.warn("⚠️ getLastNotificationResponseAsync failed:", err));
    }, []);

    // Replay any stashed payload once a valid token is present (post-login).
    useEffect(() => {
        if (!token || replayInFlight.current) return;
        replayInFlight.current = true;

        (async () => {
            try {
                const pending = await consumePending();
                if (!pending) return;
                console.log("🔁 [NOTIFICATION] Replaying stashed payload after login:", pending);
                const ready = await waitForNavReady();
                if (ready) navigateForData(pending);
                else await stashPending(pending); // put it back for the next attempt
            } finally {
                replayInFlight.current = false;
            }
        })();
    }, [token]);
}

/** Call on logout to discard any stashed payload so it doesn't leak across accounts. */
export async function clearPendingNotification() {
    try {
        await AsyncStorage.removeItem(PENDING_KEY);
    } catch {
        // ignore
    }
}
