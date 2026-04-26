import { useEffect, useRef } from "react";
import { Linking } from "react-native";
import { useContext } from "react";
import { SocketContext } from "../context/WebSocketProvider";
import { api } from "../services/api";
import { parseRideRequest } from "../utils/notificationMapper";
import { shouldPresent } from "../services/rideDedup";

/**
 * Deep-link handler for ride offers.
 *
 * Accepts URLs of the form:
 *   kablux-drive://ride/<rideRequestId>?source=<callkeep|notification|bubble>
 *
 * Used by the native layer (Phase 2b — CallKeep `answerCall`) to reanimate
 * the ride offer UI when the app is opened from a killed or backgrounded
 * state in response to a ride dispatch.
 *
 * Side-effect only — this hook doesn't navigate. It fetches the pending
 * ride request from the backend and pushes it into the existing
 * `rideNotifications` list in SocketContext so the normal foreground UI
 * picks it up. The foreground flow is untouched.
 */

const RIDE_URL_REGEX = /^kablux-drive:\/\/ride\/([^/?#]+)(?:\?(.*))?$/i;

function parseRideUrl(url: string | null): { rideRequestId: string; source: string } | null {
  if (!url) return null;
  const match = RIDE_URL_REGEX.exec(url);
  if (!match) return null;

  const rideRequestId = decodeURIComponent(match[1]);
  const query = match[2] || "";
  const params = new URLSearchParams(query);
  const source = params.get("source") || "deeplink";
  return { rideRequestId, source };
}

export function useRideDeepLink() {
  const socket = useContext(SocketContext);
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    const present = async (url: string | null) => {
      const parsed = parseRideUrl(url);
      if (!parsed) return;
      const { rideRequestId, source } = parsed;

      if (inFlight.current.has(rideRequestId)) return;
      inFlight.current.add(rideRequestId);

      try {
        if (!shouldPresent(rideRequestId, source)) {
          console.log(`🟰 [DeepLink] ${rideRequestId} already claimed, skipping`);
          return;
        }

        // Hydrate via existing pending-requests endpoint. No new backend
        // surface needed for Phase 1c.
        const res = await api.get("rides/ride_orders/");
        const pending = res.data?.results || res.data || [];
        const match = pending.find((r: any) => {
          const id = r.ride_request_id ?? r.id;
          return String(id) === String(rideRequestId);
        });

        if (!match) {
          console.log(`⚠️ [DeepLink] ${rideRequestId} not in pending — ride may have expired`);
          return;
        }

        const notification = parseRideRequest(match);
        if (!notification) {
          console.warn("[DeepLink] parseRideRequest returned null for", match);
          return;
        }

        socket.setRideNotifications((prev) => {
          if (prev.some((n) => n.ride_request_id === notification.ride_request_id)) {
            return prev;
          }
          console.log(`✅ [DeepLink] Presenting ${rideRequestId} (source=${source})`);
          return [...prev, notification];
        });
      } catch (err) {
        console.error("[DeepLink] Failed to hydrate ride:", err);
      } finally {
        // Release the in-flight guard after a short cooldown so repeated
        // taps don't spam the pending endpoint.
        setTimeout(() => inFlight.current.delete(rideRequestId), 2000);
      }
    };

    // Cold-start: app was opened by the deep link.
    Linking.getInitialURL().then(present).catch((err) => {
      console.warn("[DeepLink] getInitialURL failed:", err);
    });

    // Warm-start: deep link arrives while app is running.
    const sub = Linking.addEventListener("url", (evt) => present(evt.url));
    return () => sub.remove();
  }, [socket]);
}
