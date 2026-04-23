import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNCallKeep from "react-native-callkeep";
import { api } from "./api";
import { markAccepted, markDeclined } from "./rideDedup";

/**
 * CallKeep integration for background ride dispatch.
 *
 * Flow:
 *   1. FCM background handler calls `displayRideCall(ride)` which generates
 *      a UUID, persists the uuid<->ride mapping, and invokes
 *      RNCallKeep.displayIncomingCall(). Android shows full-screen
 *      incoming-call UI (locked or unlocked — no branching).
 *   2. User taps Answer → `answerCall` event fires in JS. We emit a
 *      deep link `kablux-drive://ride/:rideRequestId?source=callkeep`
 *      which the existing useRideDeepLink hook consumes to hydrate the
 *      ride offer UI.
 *   3. User taps Decline (or CallKeep times out) → `endCall` event fires.
 *      We POST the decline to the backend and mark the ride declined in
 *      the dedup store.
 *
 * Cold-start note: if the app was killed, CallKeep replays the answerCall
 * event after the JS runtime boots and listeners are registered. The
 * uuid<->ride mapping is persisted in AsyncStorage so it survives the
 * process death.
 */

const UUID_MAP_KEY = "callkeep.uuidToRide";

type UuidMap = Record<string, string>; // uuid -> ride_request_id

let setupDone = false;
let listenersRegistered = false;

async function readMap(): Promise<UuidMap> {
  try {
    const raw = await AsyncStorage.getItem(UUID_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeMap(map: UuidMap): Promise<void> {
  try {
    await AsyncStorage.setItem(UUID_MAP_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn("[CallKeep] Failed to persist uuid map:", err);
  }
}

async function storeUuid(uuid: string, rideRequestId: string): Promise<void> {
  const map = await readMap();
  map[uuid] = rideRequestId;
  await writeMap(map);
}

async function resolveUuid(uuid: string): Promise<string | null> {
  const map = await readMap();
  return map[uuid] ?? null;
}

async function clearUuid(uuid: string): Promise<void> {
  const map = await readMap();
  if (map[uuid]) {
    delete map[uuid];
    await writeMap(map);
  }
}

/**
 * Minimal RFC4122 v4 generator. CallKeep requires one unique UUID per call.
 */
function uuidv4(): string {
  // eslint-disable-next-line no-bitwise
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Idempotent. Safe to call from index.js module load AND from a React
 * effect. Registers event listeners on first call; subsequent calls are
 * no-ops.
 */
export async function setupCallKeep(): Promise<void> {
  if (setupDone) return;
  setupDone = true;

  try {
    await RNCallKeep.setup({
      ios: {
        appName: "Kablux",
        // iOS fields are left here for the future iOS phase.
        supportsVideo: false,
        maximumCallGroups: "1",
        maximumCallsPerCallGroup: "1",
      },
      android: {
        alertTitle: "Permissions required",
        alertDescription: "Kablux needs phone-call access to show incoming ride requests.",
        cancelButton: "Cancel",
        okButton: "OK",
        imageName: "ic_launcher",
        // Uses the telecom framework with a self-managed connection service.
        additionalPermissions: [],
        selfManaged: true,
        foregroundService: {
          channelId: "kablux.ride.callkeep",
          channelName: "Incoming Ride Requests",
          notificationTitle: "Kablux is ready to receive rides",
          notificationIcon: "ic_launcher",
        },
      },
    });

    if (Platform.OS === "android") {
      // Ensures the ConnectionService is registered as the phone account.
      RNCallKeep.registerPhoneAccount({
        alertTitle: "Permissions required",
        alertDescription: "Kablux needs phone-call access to show incoming ride requests.",
        cancelButton: "Cancel",
        okButton: "OK",
        imageName: "ic_launcher",
        additionalPermissions: [],
        selfManaged: true,
      } as any);
    }

    console.log("✅ [CallKeep] Setup complete");
  } catch (err) {
    console.error("❌ [CallKeep] Setup failed:", err);
  }

  registerListeners();
}

function registerListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  // User tapped Answer. Open the ride offer UI via deep link. The
  // useRideDeepLink hook will claim dedup + hydrate + inject.
  RNCallKeep.addEventListener("answerCall", async ({ callUUID }) => {
    console.log("📞 [CallKeep] answerCall:", callUUID);
    const rideRequestId = await resolveUuid(callUUID);
    if (!rideRequestId) {
      console.warn("[CallKeep] answerCall for unknown uuid:", callUUID);
      RNCallKeep.endCall(callUUID);
      return;
    }

    markAccepted(rideRequestId);

    // Dismiss the CallKeep UI — the in-app offer screen takes over. Final
    // accept/decline/counter choice happens there (per product decision:
    // counter-offer requires the full UI).
    RNCallKeep.endCall(callUUID);
    await clearUuid(callUUID);

    const url = `kablux-drive://ride/${encodeURIComponent(
      rideRequestId
    )}?source=callkeep`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error("[CallKeep] Failed to open deep link:", err);
    }
  });

  // User tapped Decline or CallKeep timed out. POST decline to backend.
  RNCallKeep.addEventListener("endCall", async ({ callUUID }) => {
    console.log("📞 [CallKeep] endCall:", callUUID);
    const rideRequestId = await resolveUuid(callUUID);
    await clearUuid(callUUID);
    if (!rideRequestId) return;

    markDeclined(rideRequestId);
    try {
      await api.post(`rides/${rideRequestId}/decline/`, { source: "callkeep" });
    } catch (err: any) {
      // Non-fatal — backend will time the offer out anyway.
      console.warn(
        "⚠️ [CallKeep] decline POST failed (non-fatal):",
        err?.response?.status || err?.message
      );
    }
  });

  // Optional: useful for debugging / telemetry.
  RNCallKeep.addEventListener("didDisplayIncomingCall", ({ callUUID, handle, error }) => {
    console.log("📞 [CallKeep] didDisplayIncomingCall:", { callUUID, handle, error });
  });

  console.log("✅ [CallKeep] Listeners registered");
}

/**
 * Display an incoming-call UI for a ride. Safe to call from the FCM
 * background handler (headless JS). Returns the generated UUID so callers
 * can correlate with future events if needed.
 */
export async function displayRideCall(args: {
  rideRequestId: string;
  riderName?: string;
}): Promise<string> {
  // Setup must run in the headless runtime too — it's idempotent.
  await setupCallKeep();

  const callUUID = uuidv4();
  await storeUuid(callUUID, args.rideRequestId);

  const handle = args.rideRequestId;
  const displayName = args.riderName || "New ride request";

  try {
    RNCallKeep.displayIncomingCall(
      callUUID,
      handle,
      displayName,
      "generic",
      false
    );
    console.log(
      `📞 [CallKeep] displayIncomingCall issued uuid=${callUUID} ride=${args.rideRequestId}`
    );
  } catch (err) {
    console.error("❌ [CallKeep] displayIncomingCall failed:", err);
    await clearUuid(callUUID);
    throw err;
  }

  return callUUID;
}

/**
 * End any active CallKeep session for a given ride (e.g. server sent
 * RIDE_CANCELLED mid-dispatch). Walks the persisted uuid map to find the
 * match.
 */
export async function endCallForRide(rideRequestId: string): Promise<void> {
  const map = await readMap();
  const match = Object.entries(map).find(([, rid]) => rid === rideRequestId);
  if (!match) return;
  const [uuid] = match;
  try {
    RNCallKeep.endCall(uuid);
  } catch (err) {
    console.warn("[CallKeep] endCall failed:", err);
  }
  await clearUuid(uuid);
}
