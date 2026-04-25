import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persistence for FCM ride payloads so the deep-link handler can hydrate
 * the ride offer UI without a backend round-trip. The OS may kill our JS
 * runtime between the background FCM handler and the user tapping the
 * notification, so the cache must survive process death — AsyncStorage.
 *
 * Structure: one key per ride, namespaced. Entries self-expire after
 * TTL_MS so stale rides don't accumulate.
 */

const KEY_PREFIX = "ridePayload:";
const INDEX_KEY = "ridePayload:__index__";
const TTL_MS = 10 * 60 * 1000; // 10 minutes — generous, covers ring-then-tap delay

export type CachedRidePayload = {
  ride_request_id: string;
  rider_name?: string;
  fare?: string | number;
  distance?: string | number;
  pickup?: string;
  destination?: string;
  ride_type?: string;
  cachedAt: number;
  [k: string]: any;
};

async function readIndex(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(ids));
  } catch {
    /* non-fatal */
  }
}

export async function cacheRidePayload(payload: CachedRidePayload): Promise<void> {
  const id = payload.ride_request_id;
  if (!id) return;
  const entry = { ...payload, cachedAt: Date.now() };
  try {
    await AsyncStorage.setItem(KEY_PREFIX + id, JSON.stringify(entry));
    const index = await readIndex();
    if (!index.includes(id)) {
      index.push(id);
      await writeIndex(index);
    }
    console.log(`💾 [RidePayloadCache] Stored ${id}`);
  } catch (err) {
    console.warn("[RidePayloadCache] cache failed:", err);
  }
}

export async function readRidePayload(
  rideRequestId: string
): Promise<CachedRidePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + rideRequestId);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedRidePayload;
    if (Date.now() - entry.cachedAt > TTL_MS) {
      await clearRidePayload(rideRequestId);
      console.log(`🗑️ [RidePayloadCache] Expired ${rideRequestId}`);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export async function clearRidePayload(rideRequestId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_PREFIX + rideRequestId);
    const index = await readIndex();
    const next = index.filter((id) => id !== rideRequestId);
    if (next.length !== index.length) await writeIndex(next);
  } catch {
    /* non-fatal */
  }
}

/**
 * Sweep expired entries. Cheap to call periodically; no-op if nothing to
 * remove. Invoked opportunistically on cache writes.
 */
export async function sweepRidePayloads(): Promise<void> {
  const index = await readIndex();
  if (index.length === 0) return;
  const now = Date.now();
  const alive: string[] = [];
  for (const id of index) {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + id).catch(() => null);
    if (!raw) continue;
    try {
      const entry = JSON.parse(raw) as CachedRidePayload;
      if (now - entry.cachedAt > TTL_MS) {
        await AsyncStorage.removeItem(KEY_PREFIX + id).catch(() => {});
      } else {
        alive.push(id);
      }
    } catch {
      await AsyncStorage.removeItem(KEY_PREFIX + id).catch(() => {});
    }
  }
  if (alive.length !== index.length) await writeIndex(alive);
}
