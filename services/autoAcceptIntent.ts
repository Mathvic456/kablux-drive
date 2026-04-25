/**
 * In-memory signal for "the user tapped Accept on the notification —
 * please run the in-app Accept flow as soon as the ride is hydrated and
 * the WebSocket is ready."
 *
 * Lives here (not AsyncStorage) because it's only consulted while the
 * app is open. If the app is killed before Home.js picks it up, the
 * user will just see the offer card and tap Accept manually — an
 * acceptable fallback.
 *
 * Consumer pattern in Home.js:
 *   - `peekAutoAccept(id)` to check without consuming
 *   - `clearAutoAccept(id)` only after a successful WS send
 * This way, if WS is still reconnecting when the first attempt runs,
 * a later re-render (when isConnected flips true) can retry.
 */

const pending = new Set<string>();

export function markAutoAccept(rideRequestId: string): void {
  pending.add(rideRequestId);
  console.log(`🎯 [AutoAccept] Marked ${rideRequestId} for auto-accept`);
}

export function peekAutoAccept(rideRequestId: string): boolean {
  return pending.has(rideRequestId);
}

export function clearAutoAccept(rideRequestId: string): void {
  if (pending.delete(rideRequestId)) {
    console.log(`✅ [AutoAccept] Cleared mark for ${rideRequestId}`);
  }
}

export function snapshotAutoAccepts(): string[] {
  return Array.from(pending);
}
