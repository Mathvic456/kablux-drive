import { getDirectionsGeometry } from "../../utils/googleDirections";
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
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

  const [slideAnim] = useState(new Animated.Value(height * 0.35));
  const [currentDriverLocation, setCurrentDriverLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [locating, setLocating] = useState(true);

  const locationSubscription = useRef(null);

  // Derived rider & trip data
  const rider = rideDetails?.rider;
  const riderName = rider?.name || 'Rider';
  const riderPhoto = rider?.profile_image?.file || null;
  const riderPhone = rider?.phone_number || null;
  const dropoffAddress =
    rideDetails?.raw?.dropoff_address || rideDetails?.dropoff_address || 'Drop-off Location';

  // Slide-in animation
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

  // Fetch route
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
            if (geometry.distance != null) setRouteDistance(geometry.distance / 1000);
            if (geometry.duration != null) setRouteDuration(geometry.duration / 60);
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

  // Animate map to fit driver + destination
  useEffect(() => {
    if (!currentDriverLocation) return;

    if (destination) {
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
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: currentDriverLocation.latitude,
            longitude: currentDriverLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000
        );
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

  const handleCall = () => {
    if (riderPhone) {
      Linking.openURL(`tel:${riderPhone}`);
    }
  };

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
      >
        {/* Route polyline — shadow + fill */}
        {routeCoordinates.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="rgba(0,0,0,0.4)"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
              zIndex={1}
            />
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

        {/* Driver marker */}
        {currentDriverLocation && (
          <Marker coordinate={currentDriverLocation} title="You" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverMarker}>
              <Image
                source={require('../../assets/curr-location.png')}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker coordinate={destination} title={destination.address}>
            {isHeadingToPickup ? (
              <View style={styles.pickupMarker}>
                <Ionicons name="navigate" size={16} color="#facc15" />
              </View>
            ) : (
              <View style={styles.dropoffMarker}>
                <MaterialIcons name="flag" size={18} color="#facc15" />
              </View>
            )}
          </Marker>
        )}
      </MapView>

      {/* Loading overlay */}
      {(locating || loadingRoute) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#facc15" />
          <Text style={styles.loadingText}>
            {locating ? 'Locating…' : 'Loading route…'}
          </Text>
        </View>
      )}

      {/* Top bar */}
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

        {/* ── Rider info ── */}
        <View style={styles.riderRow}>
          {riderPhoto ? (
            <Image source={{ uri: riderPhoto }} style={styles.riderPhoto} />
          ) : (
            <View style={styles.riderPhotoPlaceholder}>
              <Feather name="user" size={22} color="#aaa" />
            </View>
          )}

          <View style={styles.riderInfo}>
            <Text style={styles.riderName}>{riderName}</Text>
            <View style={styles.dropoffRow}>
              <MaterialIcons name="flag" size={13} color="#facc15" style={{ marginRight: 4 }} />
              <Text style={styles.riderDropoff} numberOfLines={1}>
                {dropoffAddress}
              </Text>
            </View>
          </View>

          {riderPhone && (
            <TouchableOpacity onPress={handleCall} style={styles.callButton} activeOpacity={0.8}>
              <Feather name="phone-call" size={18} color="#1c1c1c" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Distance / ETA ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>
              {routeDistance != null ? `${routeDistance.toFixed(1)} km` : '—'}
            </Text>
          </View>
          <View style={styles.infoSeparator} />
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ETA</Text>
            <Text style={styles.infoValue}>
              {routeDuration != null ? `${Math.round(routeDuration)} min` : '—'}
            </Text>
          </View>
        </View>

        {/* ── Active destination strip ── */}
        <View style={styles.destinationDisplay}>
          {isHeadingToPickup ? (
            <Text style={{ color: '#facc15', fontWeight: '600', marginRight: 6, textTransform: 'uppercase', fontSize: 12, textAlign: 'center' }}>
              Pickup:
              <Ionicons name="navigate" size={16} color="#facc15" style={{ marginRight: 10 }} />
            </Text>
          ) : (
            <MaterialIcons name="flag" size={16} color="#facc15" style={{ marginRight: 10 }} />
          )}
          <Text style={styles.destinationAddress} numberOfLines={2}>
            {destination?.address || 'Loading...'}
          </Text>
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
    backgroundColor: '#1c1c1c',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  // ── Rider row ──────────────────────────────────────────────────────────────

  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  riderPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#facc15',
  },
  riderPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2b2b2b',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  dropoffRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderDropoff: {
    color: '#aaa',
    fontSize: 12,
    flex: 1,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },

  // ── Divider ────────────────────────────────────────────────────────────────

  divider: {
    height: 1,
    backgroundColor: '#2b2b2b',
    marginBottom: 16,
  },

  // ── Info row ───────────────────────────────────────────────────────────────

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2b2b2b',
    borderRadius: 15,
    paddingVertical: 14,
    marginBottom: 14,
  },
  infoBox: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  infoSeparator: {
    width: 1,
    height: 36,
    backgroundColor: '#3a3a3a',
  },

  // ── Destination strip ──────────────────────────────────────────────────────

  destinationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    backgroundColor: '#2b2b2b',
    borderRadius: 10,
  },
  destinationAddress: {
    flex: 1,
    fontSize: 14,
    color: '#ddd',
    fontWeight: '500',
  },
});