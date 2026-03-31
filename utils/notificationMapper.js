/**
 * Parse a raw notification payload into a ride offer object.
 * Works with both FCM push data and WebSocket message data.
 *
 * @param {object} data - raw notification payload
 * @returns {object|null} parsed ride offer, or null if unparsable
 */
function safeParseFloat(value) {
  if (value == null) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

export function parseRideRequest(data) {
  if (!data) return null;

  const rideId =
    data.ride_request_id ||
    data.ride_id ||
    data.request_id ||
    data.id ||
    null;

  if (!rideId) return null;

  const offerMatch = data.message?.match(/Rider offer:\s*([\d.]+)/);
  const distanceVal = safeParseFloat(data.distance) ?? safeParseFloat(data.distance_km);

  const timeCalc = distanceVal ? String((distanceVal / 0.5) * 60) : "0";

  return {
    ride_request_id: rideId,
    ride_id: data.ride_id || null,
    notification_type: data.type || "RIDE_REQUESTED",
    ride_type: data.ride_type || "standard",
    message: data.message || "",
    rider_name: data.rider_name || "Unknown Rider",
    rider_rating: data.rider_rating || "4.5",
    time_to_pickup: timeCalc,
    pickup: data.pickup || data.pickup_address || data.address || "Unknown pickup",
    dropoff: data.destination || data.dropoff_address || "Unknown dropoff",
    offer_amount: offerMatch
      ? parseFloat(offerMatch[1])
      : safeParseFloat(data.offer_amount) ?? safeParseFloat(data.fare) ?? 0,
    estimated_fare: safeParseFloat(data.estimated_fare) ?? safeParseFloat(data.fare),
    distance_km: distanceVal,
  };
}

/**
 * Central dispatcher — given a raw notification payload, returns
 * { type, data } where `type` identifies the modal/action and
 * `data` is the parsed payload for that modal.
 *
 * @param {object} raw - raw notification / event payload
 * @returns {{ type: string, data: object } | null}
 */
export function mapNotificationToAction(raw) {
  if (!raw) return null;

  const type = raw.type || raw.click_action;

  switch (type) {
    case "RIDE_REQUESTED": {
      const offer = parseRideRequest(raw);
      return offer ? { type: "RIDE_REQUESTED", data: offer } : null;
    }
    default:
      return null;
  }
}
