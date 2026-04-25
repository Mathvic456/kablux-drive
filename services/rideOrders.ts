import { api } from "./api";

/**
 * Ride details + active ride-orders fetchers.
 *
 * Two endpoints, two jobs:
 *   - fetchRideDetails(id)   → GET /rides/{id}/details/
 *       Verifies a ride is still valid (exists, not cancelled/expired).
 *       Used after notification-sourced hydration before we present the
 *       offer to the driver.
 *
 *   - fetchRideOrders()      → GET /rides/ride_orders/
 *       Returns the driver's active inbox of pending offers. Used on
 *       WebSocket (re)connect to reconcile rides that may have arrived
 *       while the driver was offline / app was killed.
 */

export type RideDetails = {
  id: string;
  status: string;
  fare?: string;
  pickup_address?: string;
  dropoff_address?: string;
  pickup_lat?: string;
  pickup_lng?: string;
  dropoff_lat?: string;
  dropoff_lng?: string;
  driver?: any;
  rider?: {
    user_id?: string;
    name?: string;
    rating?: string;
    phone_number?: string;
    profile_image?: any;
  };
  start_time?: string;
  end_time?: string;
  created_at?: string;
  [k: string]: any;
};

/**
 * Ride statuses that mean "don't bother presenting / don't accept".
 * Matched case-insensitively. Unknown statuses pass through (we err on
 * the side of showing rather than silently swallowing).
 */
const TERMINAL_STATUSES = new Set([
  "cancelled",
  "canceled",
  "completed",
  "expired",
  "rejected",
  "declined",
]);

export function isAcceptableStatus(status: string | undefined | null): boolean {
  if (!status) return true;
  return !TERMINAL_STATUSES.has(status.toLowerCase());
}

export async function fetchRideDetails(
  rideId: string
): Promise<RideDetails | null> {
  console.log(`🔍 [RideOrders] GET /rides/${rideId}/details/`);
  try {
    const res = await api.get(`rides/${rideId}/details/`);
    const data = (res.data ?? null) as RideDetails | null;
    console.log(
      `✅ [RideOrders] Ride ${rideId} details → status=${data?.status ?? "<unknown>"} fare=${data?.fare ?? "<none>"}`
    );
    return data;
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      console.warn(`⚠️ [RideOrders] Ride ${rideId} not found (404) — likely cancelled or expired`);
    } else {
      console.warn(
        `⚠️ [RideOrders] fetchRideDetails(${rideId}) failed:`,
        status,
        err?.message
      );
    }
    return null;
  }
}

export async function fetchRideOrders(): Promise<any[]> {
  console.log(`🔍 [RideOrders] GET /rides/ride_orders/`);
  try {
    const res = await api.get("rides/ride_orders/");
    const list = res.data?.results ?? res.data ?? [];
    const arr = Array.isArray(list) ? list : [];
    console.log(`✅ [RideOrders] ride_orders returned ${arr.length} active offer(s)`);
    return arr;
  } catch (err: any) {
    console.warn(
      `⚠️ [RideOrders] fetchRideOrders failed:`,
      err?.response?.status,
      err?.message
    );
    return [];
  }
}
