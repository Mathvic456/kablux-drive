import { getDirectionsGeometry } from "@/utils/googleDirections";
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { darkMapStyle } from '../../styles/darkMapStyle';
import { useRoute } from '@react-navigation/native';
import { useDriverRide } from '../../context/DriverRideContext';
import CentralModal from '../components/CentralModal';

const { width, height } = Dimensions.get('window');

const DEFAULT_REGION = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function DriverMapScreen({ navigation }) {
  const mapRef = useRef(null);
  const route = useRoute();
  const { rideDetails } = route.params;
  const { status } = useDriverRide();

  console.log('ride dets------------', rideDetails);

  const [slideAnim] = useState(new Animated.Value(height * 0.25));
  const [currentDriverLocation, setCurrentDriverLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [locating, setLocating] = useState(true);

  const locationSubscription = useRef(null);

  // Slide in animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Request location permissions and start tracking
  useEffect(() => {
    (async () => {
      let { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setPermissionModalVisible(true);
        setLocating(false);
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setCurrentDriverLocation({ latitude, longitude });
          setLocating(false);
        }
      );
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Fetch route using getDirectionsGeometry (same pattern as RideMapView)
  useEffect(() => {
    if (currentDriverLocation && destination) {
      setLoadingRoute(true);

      getDirectionsGeometry(
        currentDriverLocation.longitude,
        currentDriverLocation.latitude,
        destination.longitude,
        destination.latitude
      )
        .then((geometry) => {
          if (geometry && geometry.coordinates) {
            const coords = geometry.coordinates.map(([lng, lat]) => ({
              latitude: lat,
              longitude: lng,
            }));
            setRouteCoordinates(coords);

            // Derive distance & duration from the geometry if available
            if (geometry.distance != null) setRouteDistance(geometry.distance / 1000); // metres → km
            if (geometry.duration != null) setRouteDuration(geometry.duration / 60);   // seconds → minutes
          } else {
            setRouteCoordinates([]);
          }
          setLoadingRoute(false);
        })
        .catch((error) => {
          console.error('Error fetching route:', error);
          setRouteCoordinates([]);
          setLoadingRoute(false);
        });
    } else {
      setRouteCoordinates([]);
    }
  }, [currentDriverLocation, destination]);

  // Animate map to fit driver + destination whenever either changes
  useEffect(() => {
    if (!currentDriverLocation) return;

    if (destination) {
      // Prefer route coordinates for a tighter fit, fall back to endpoints
      const points =
        routeCoordinates.length > 0
          ? routeCoordinates
          : [currentDriverLocation, destination];

      const allLatitudes = points.map((c) => c.latitude);
      const allLongitudes = points.map((c) => c.longitude);

      const minLat = Math.min(...allLatitudes);
      const maxLat = Math.max(...allLatitudes);
      const minLng = Math.min(...allLongitudes);
      const maxLng = Math.max(...allLongitudes);

      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const latPadding = latDiff * 0.2 || 0.01;
      const lngPadding = lngDiff * 0.2 || 0.01;

      const newRegion = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDiff + latPadding * 2, 0.01),
        longitudeDelta: Math.max(lngDiff + lngPadding * 2, 0.01),
      };

      setTimeout(() => {
        try {
          mapRef.current?.animateToRegion(newRegion, 1000);
        } catch (error) {
          console.error('Error animating map:', error);
        }
      }, 600);
    } else {
      const newRegion = {
        latitude: currentDriverLocation.latitude,
        longitude: currentDriverLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setTimeout(() => {
        mapRef.current?.animateToRegion(newRegion, 1000);
      }, 600);
    }
  }, [currentDriverLocation, destination, routeCoordinates]);

  // Set destination based on ride status
  useEffect(() => {
    if (!rideDetails?.raw) {
      console.warn('⚠️ No ride details found');
      return;
    }

    const raw = rideDetails.raw;

    if (status === 'ride_created' || status === 'driver_on_way' || status === 'arrived') {
      const pickupLat = parseFloat(raw.pickup_lat);
      const pickupLng = parseFloat(raw.pickup_lng);

      if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
        setDestination({
          latitude: pickupLat,
          longitude: pickupLng,
          address: raw.pickup_address || 'Pickup Location',
        });
      } else {
        console.error('❌ Invalid pickup coordinates');
      }
    } else if (status === 'ride_started' || status === 'started') {
      const dropoffLat = parseFloat(raw.dropoff_lat);
      const dropoffLng = parseFloat(raw.dropoff_lng);

      if (!isNaN(dropoffLat) && !isNaN(dropoffLng)) {
        setDestination({
          latitude: dropoffLat,
          longitude: dropoffLng,
          address: raw.dropoff_address || 'Drop-off Location',
        });
      } else {
        console.error('❌ Invalid dropoff coordinates');
      }
    }
  }, [status, rideDetails]);

  const isHeadingToPickup =
    status === 'ride_created' || status === 'driver_on_way' || status === 'arrived';

  const getStatusText = () => {
    switch (status) {
      case 'ride_created':
      case 'driver_on_way':
        return 'Heading to Pickup';
      case 'arrived':
        return 'Arrived at Pickup';
      case 'ride_started':
        return 'Ride in Progress';
      default:
        return 'Active Ride';
    }
  };

  const getDestinationLabel = () =>
    isHeadingToPickup ? 'Pickup Location' : 'Drop-off Location';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
      // customMapStyle={darkMapStyle}
      >
        {/* Route polyline — dual-layer shadow/fill trick */}
        {routeCoordinates.length > 0 && (
          <>
            {/* Shadow layer */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="rgba(0,0,0,0.4)"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
              zIndex={1}
            />
            {/* Main route line */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#facc15"
              strokeWidth={2.5}
              lineCap="round"
              lineJoin="round"
              zIndex={2}
            />
          </>
        )}

        {/* Driver (current location) marker */}
        {currentDriverLocation && (
          <Marker
            coordinate={currentDriverLocation}
            title="You"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarker}>
              <Image
                source={require('../../assets/curr-location.png')}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}

        {/* Destination marker — pin for pickup, flag for drop-off */}
        {destination && (
          <Marker
            coordinate={destination}
            title={getDestinationLabel()}
            description={destination.address}
          >
            {isHeadingToPickup ? (
              // Pickup: green-ringed circle with a navigation icon
              <View style={styles.pickupMarker}>
                <Ionicons name="navigate" size={16} color="#facc15" />
              </View>
            ) : (
              // Drop-off: yellow-ringed circle with a flag icon
              <View style={styles.dropoffMarker}>
                <MaterialIcons name="flag" size={18} color="#facc15" />
              </View>
            )}
          </Marker>
        )}
      </MapView>

      {/* Loading overlay — outside MapView to avoid Fabric/JSI crash */}
      {(locating || loadingRoute) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#facc15" />
          <Text style={styles.loadingText}>
            {locating ? 'Locating…' : 'Loading route…'}
          </Text>
        </View>
      )}

      {/* Top navigation bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Bottom panel */}
      <Animated.View style={[styles.bottomPanel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.dragHandle} />

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>
              {routeDistance != null ? `${routeDistance.toFixed(1)} km` : '—'}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ETA</Text>
            <Text style={styles.infoValue}>
              {routeDuration != null ? `${Math.round(routeDuration)} min` : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.destinationDisplay}>
          {isHeadingToPickup ? (
            <Ionicons name="navigate" size={18} color="#facc15" style={{ marginRight: 10 }} />
          ) : (
            <MaterialIcons name="flag" size={18} color="#facc15" style={{ marginRight: 10 }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.destinationTitle}>{getDestinationLabel()}</Text>
            <Text style={styles.destinationAddress} numberOfLines={2}>
              {destination?.address || 'Loading...'}
            </Text>
          </View>
        </View>
      </Animated.View>

      <CentralModal
        visible={permissionModalVisible}
        onClose={() => setPermissionModalVisible(false)}
        title="Location Permission"
        subText="Location access is required to show your position and calculate routes."
        icon="map-pin"
        confirmText="OK"
        closeText=""
        onConfirm={() => setPermissionModalVisible(false)}
        confirmButtonColor="#facc15"
        themeColor="#facc15"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    width,
    height,
  },

  // ── Markers ────────────────────────────────────────────────────────────────

  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1c1c1c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#facc15',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  // Matches RideMapView pickupMarker style, adapted to dark theme
  pickupMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  // Matches RideMapView dropoffMarker style, adapted to dark theme
  dropoffMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#facc15',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },

  // ── Overlays ───────────────────────────────────────────────────────────────

  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
  },

  // ── Top bar ────────────────────────────────────────────────────────────────

  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#facc15',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#1c1c1c',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Bottom panel ───────────────────────────────────────────────────────────

  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#1c1c1c',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 25,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2b2b2b',
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 15,
  },
  infoBox: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  separator: {
    width: 1,
    height: '100%',
    backgroundColor: '#333',
  },
  destinationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#2b2b2b',
    borderRadius: 10,
  },
  destinationTitle: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '500',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
  },
});
