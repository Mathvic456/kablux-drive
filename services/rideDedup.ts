/**
 * Cross-channel ride request dedup.
 *
 * The backend sends both a WebSocket event and a push notification for every
 * ride dispatch. Depending on timing, app state, and reconnect order, the
 * same ride can arrive over both channels. This service is the single source
 * of truth for "has this ride already been presented somewhere?"
 *
 * Call sites:
 *   - WS RIDE_REQUESTED handler (before pushing to rideNotifications)
 *   - FCM background handler (before CallKeep.displayIncomingCall)
 *   - AppState foreground transition (to expire stale CallKeep presentations)
 *
 * Semantics:
 *   - shouldPresent(rideId) returns true the FIRST time a rideId is seen and
 *     false on every subsequent call within TTL_MS.
 *   - markAccepted / markDeclined / markCancelled terminate the entry; a
 *     future arrival for the same rideId is suppressed (user already acted).
 *   - Entries auto-expire after TTL_MS so stale rides don't leak memory.
 */

type RideState = "pending" | "accepted" | "declined" | "cancelled";

type Entry = {
  state: RideState;
  firstSeenAt: number;
  source: string;
};

const TTL_MS = 60_000;

const store = new Map<string, Entry>();

function sweep() {
  const now = Date.now();
  for (const [rideId, entry] of store.entries()) {
    if (now - entry.firstSeenAt > TTL_MS) {
      store.delete(rideId);
    }
  }
}

/**
 * Atomic "claim" for a ride arrival.
 * Returns true if this is the first arrival within TTL_MS — caller should
 * present the UI. Returns false if another channel already claimed it.
 */
export function shouldPresent(rideId: string, source: string): boolean {
  sweep();
  const existing = store.get(rideId);
  if (existing) {
    console.log(
      `🟰 [Dedup] ${rideId} already seen via '${existing.source}' (state=${existing.state}), suppressing '${source}'`
    );
    return false;
  }
  store.set(rideId, { state: "pending", firstSeenAt: Date.now(), source });
  console.log(`🟢 [Dedup] ${rideId} claimed by '${source}'`);
  return true;
}

/** Check without claiming. */
export function isKnown(rideId: string): boolean {
  sweep();
  return store.has(rideId);
}

export function markAccepted(rideId: string) {
  const e = store.get(rideId);
  if (e) e.state = "accepted";
  else store.set(rideId, { state: "accepted", firstSeenAt: Date.now(), source: "accept" });
}

export function markDeclined(rideId: string) {
  const e = store.get(rideId);
  if (e) e.state = "declined";
  else store.set(rideId, { state: "declined", firstSeenAt: Date.now(), source: "decline" });
}

export function markCancelled(rideId: string) {
  const e = store.get(rideId);
  if (e) e.state = "cancelled";
  else store.set(rideId, { state: "cancelled", firstSeenAt: Date.now(), source: "cancel" });
}

/** Test / debug helpers. */
export function __clearDedupStore() {
  store.clear();
}

export function __dedupSnapshot() {
  sweep();
  return Array.from(store.entries()).map(([rideId, entry]) => ({ rideId, ...entry }));
}
