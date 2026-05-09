import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

/**
 * Background driver-location beacon.
 *
 * Strategy: iOS kills WebSockets in background, but TaskManager wakes briefly
 * for location events. Each wake fires an HTTP POST with the current fix.
 * The server caches it and fans out to the rider's (foreground) socket.
 *
 * This beacon is a SUPPLEMENT to the foreground socket path in
 * WebSocketProvider — both can run concurrently without harm (the server
 * treats them as the same stream of updates).
 */

export const LOCATION_TASK_NAME = "kablux-driver-location-beacon";
const ENDPOINT = `${API_URL}rides/driver/location`;
const TOKEN_CACHE_KEY = "token"; // same key AuthContext writes to

type TaskBody = {
    data?: { locations?: Location.LocationObject[] };
    error?: TaskManager.TaskManagerError | null;
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: TaskBody) => {
    if (error) {
        console.warn("🛰️ [BEACON] Task error:", error);
        return;
    }

    const locations = data?.locations;
    if (!locations?.length) return;

    // Use the freshest fix in the batch.
    const latest = locations[locations.length - 1];
    const body = {
        lat: latest.coords.latitude,
        long: latest.coords.longitude,
        accuracy: latest.coords.accuracy,
        speed: latest.coords.speed,
        heading: latest.coords.heading,
        ts: latest.timestamp,
    };

    try {
        // Pull token directly from AsyncStorage — the auth getter isn't
        // reachable from a background task (no React context).
        const token = await AsyncStorage.getItem(TOKEN_CACHE_KEY);
        if (!token) {
            console.warn("🛰️ [BEACON] No token in storage, skipping post");
            return;
        }

        const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            console.warn("🛰️ [BEACON] Post failed:", res.status);
            // On 401 we stop the beacon — token is expired; foreground refresh
            // will restart it on next online toggle.
            if (res.status === 401) {
                await stopLocationBeacon().catch(() => { });
            }
        }
    } catch (err) {
        console.warn("🛰️ [BEACON] Post threw:", err);
    }
});

/**
 * Start the background beacon. Caller must already have:
 *   - Foreground location permission (granted)
 *   - Background location permission (granted)
 * Safe to call repeatedly; no-op if already running.
 */
export async function startLocationBeacon(): Promise<boolean> {
    try {
        const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (already) return true;

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10_000,
            distanceInterval: 50,
            showsBackgroundLocationIndicator: true,
            pausesUpdatesAutomatically: false,
            foregroundService: {
                notificationTitle: "Kablux Driver",
                notificationBody: "Sharing your location with the rider.",
                notificationColor: "#facc15",
            },
        });
        console.log("🛰️ [BEACON] Started");
        return true;
    } catch (err) {
        console.error("🛰️ [BEACON] Failed to start:", err);
        return false;
    }
}

/** Stop the background beacon. Safe to call when not running. */
export async function stopLocationBeacon(): Promise<void> {
    try {
        const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (!running) return;
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log("🛰️ [BEACON] Stopped");
    } catch (err) {
        console.warn("🛰️ [BEACON] Failed to stop:", err);
    }
}

/** Request the "Always" background permission after foreground is granted. */
export async function ensureBackgroundPermission(): Promise<boolean> {
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== "granted") return false;

    const bg = await Location.getBackgroundPermissionsAsync();
    if (bg.status === "granted") return true;

    const req = await Location.requestBackgroundPermissionsAsync();
    return req.status === "granted";
}
