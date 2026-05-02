/**
 * Map integration feature flag.
 *
 * Flip USE_IN_APP_MAP to toggle ride-flow navigation UX:
 *   true  → legacy in-app DriverMapScreen (react-native-maps + polyline + markers).
 *           Map button on the active ride card opens that screen.
 *   false → external handoff only. Map button calls openDirections() directly,
 *           launching Google/Apple Maps with the current phase's target.
 *
 * When false, DriverMapScreen is still registered in the navigator as a safety
 * net — no route points to it, but flipping back to true re-enables the old
 * flow with zero code changes.
 */
export const USE_IN_APP_MAP = false;
