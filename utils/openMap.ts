import { Linking, Platform } from 'react-native';

type Coord = { lat: number; lng: number };

const isValidCoord = (c?: Partial<Coord>): c is Coord =>
    !!c && Number.isFinite(c.lat) && Number.isFinite(c.lng);

const tryOpen = async (url: string): Promise<boolean> => {
    try {
        const supported = await Linking.canOpenURL(url);
        if (!supported) return false;
        await Linking.openURL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Open turn-by-turn directions from origin to destination.
 * Prefers Google Maps app, then Apple Maps (iOS), then web fallback.
 *
 * iOS note: for `comgooglemaps://` detection to work, add `comgooglemaps`
 * (and `maps`) to `LSApplicationQueriesSchemes` in Info.plist.
 */
export const openDirections = async (origin: Coord, destination: Coord): Promise<void> => {
    if (!isValidCoord(origin) || !isValidCoord(destination)) {
        console.warn('openDirections: invalid coords', { origin, destination });
        return;
    }

    const o = `${origin.lat},${origin.lng}`;
    const d = `${destination.lat},${destination.lng}`;

    const nativeUrl = Platform.select({
        ios: `comgooglemaps://?saddr=${o}&daddr=${d}&directionsmode=driving`,
        android: `google.navigation:q=${d}&origin=${o}`,
    });

    if (nativeUrl && (await tryOpen(nativeUrl))) return;

    if (Platform.OS === 'ios') {
        const appleUrl = `maps://?saddr=${o}&daddr=${d}&dirflg=d`;
        if (await tryOpen(appleUrl)) return;
    }

    const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`;
    await tryOpen(webUrl);
};

/**
 * Open a single location pin in the maps app (no routing).
 * Use this for "tap marker to view in Maps" flows.
 */
export const openLocation = async (coord: Coord, label?: string): Promise<void> => {
    if (!isValidCoord(coord)) {
        console.warn('openLocation: invalid coord', coord);
        return;
    }

    const latLng = `${coord.lat},${coord.lng}`;
    const q = label ? `${latLng}(${encodeURIComponent(label)})` : latLng;

    const nativeUrl = Platform.select({
        ios: `comgooglemaps://?q=${q}&center=${latLng}`,
        android: `geo:${latLng}?q=${q}`,
    });

    if (nativeUrl && (await tryOpen(nativeUrl))) return;

    if (Platform.OS === 'ios') {
        const appleUrl = `maps://?q=${label ? encodeURIComponent(label) : latLng}&ll=${latLng}`;
        if (await tryOpen(appleUrl)) return;
    }

    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
    await tryOpen(webUrl);
};
