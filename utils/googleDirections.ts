import { decode } from '@googlemaps/polyline-codec';
import Constants from 'expo-constants';

/**
 * Get directions between two points using Google Directions API
 * @param pickupLng - Pickup longitude
 * @param pickupLat - Pickup latitude
 * @param dropoffLng - Dropoff longitude
 * @param dropoffLat - Dropoff latitude
 * @returns Route geometry as array of [lat, lng] coordinates, distance (meters), and duration (seconds)
 */
export interface RouteResult {
    coordinates: number[][]; // Array of [lat, lng] pairs
    distance: number; // Distance in meters
    duration: number; // Duration in seconds
    polyline: string; // Encoded polyline string
}

export const getDirections = async (
    pickupLng: number,
    pickupLat: number,
    dropoffLng: number,
    dropoffLat: number
): Promise<RouteResult | null> => {
    try {
        const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey || process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

        if (!apiKey) {
            console.error('Google Maps API key not found');
            throw new Error('Google Maps API key is not configured');
        }

        const origin = `${pickupLat},${pickupLng}`;
        const destination = `${dropoffLat},${dropoffLng}`;

        const url = `https://maps.googleapis.com/maps/api/directions/json?` +
            `origin=${encodeURIComponent(origin)}` +
            `&destination=${encodeURIComponent(destination)}` +
            `&mode=driving` +
            `&alternatives=false` +
            `&language=en` +
            `&key=${apiKey}`;

        console.log('Fetching directions from Google Directions API:', { pickupLng, pickupLat, dropoffLng, dropoffLat });

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Directions API error:', response.status, errorText);
            throw new Error(`Directions API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'OK' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const leg = route.legs[0];
            const encodedPolyline = route.overview_polyline.points;

            // Decode polyline to get coordinates
            const decodedPath = decode(encodedPolyline, 5); // 5 is the precision factor
            // Convert from [lat, lng] pairs to array format
            const coordinates = decodedPath.map(([lat, lng]) => [lat, lng]);

            const result: RouteResult = {
                coordinates,
                distance: leg.distance.value, // meters
                duration: leg.duration.value, // seconds
                polyline: encodedPolyline,
            };

            console.log('Route received:', {
                distance: `${(leg.distance.value / 1000).toFixed(2)} km`,
                duration: `${Math.round(leg.duration.value / 60)} min`,
                points: coordinates.length
            });

            return result;
        } else if (data.status === 'ZERO_RESULTS') {
            console.warn('No route found between the specified points');
            throw new Error('No route found between the specified locations');
        } else if (data.status === 'REQUEST_DENIED') {
            console.error('Directions API request denied:', data.error_message);
            throw new Error(`Directions API access denied: ${data.error_message || 'Check your API key and billing'}`);
        } else {
            console.error('Directions API error:', data.status, data.error_message);
            throw new Error(`Directions API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        }
    } catch (error: any) {
        console.error('Error fetching directions:', error);
        throw error; // Re-throw to allow caller to handle
    }
};
