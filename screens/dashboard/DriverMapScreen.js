import { Feather, FontAwesome5 } from '@expo/vector-icons';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from "react-native-maps-directions";
import { darkMapStyle } from '../../styles/darkMapStyle';
import { useRoute } from '@react-navigation/native';
import { useDriverRide } from '../../context/DriverRideContext';
import CentralModal from '../components/CentralModal';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("EXPO_PUBLIC_GOOGLE_API_KEY is missing in environment variables.");
}

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
  // console.log('api key', GOOGLE_API_KEY)
  // console.log('ride dets------------', rideDetails)

  const [slideAnim] = useState(new Animated.Value(height * 0.25));
  const [currentDriverLocation, setCurrentDriverLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
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
      // Renamed to avoid shadowing the context `status`
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

  // Animate map to fit driver + destination whenever either changes
  useEffect(() => {
    if (!currentDriverLocation) return;

    if (destination) {
      const allLatitudes = [currentDriverLocation.latitude, destination.latitude];
      const allLongitudes = [currentDriverLocation.longitude, destination.longitude];

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
  }, [currentDriverLocation, destination]);

  // Set destination based on ride status
  useEffect(() => {

    if (!rideDetails?.raw) {
      console.warn("⚠️ No ride details found");
      return;
    }

    const raw = rideDetails.raw;

    if (status === "ride_created" || status === "driver_on_way" || status === "arrived") {
      const pickupLat = parseFloat(raw.pickup_lat);
      const pickupLng = parseFloat(raw.pickup_lng);

      if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
        setDestination({
          latitude: pickupLat,
          longitude: pickupLng,
          address: raw.pickup_address || "Pickup Location",
        });
      } else {
        console.error("❌ Invalid pickup coordinates");
      }
    } else if (status === "ride_started") {
      const dropoffLat = parseFloat(raw.dropoff_lat);
      const dropoffLng = parseFloat(raw.dropoff_lng);

      if (!isNaN(dropoffLat) && !isNaN(dropoffLng)) {
        setDestination({
          latitude: dropoffLat,
          longitude: dropoffLng,
          address: raw.dropoff_address || "Drop-off Location",
        });
      } else {
        console.error("❌ Invalid dropoff coordinates");
      }
    }
  }, [status, rideDetails]);

  const getStatusText = () => {
    switch (status) {
      case "ride_created":
      case "driver_on_way":
        return "Heading to Pickup";
      case "arrived":
        return "Arrived at Pickup";
      case "ride_started":
        return "Ride in Progress";
      default:
        return "Active Ride";
    }
  };

  const getDestinationLabel = () => {
    if (status === "ride_created" || status === "driver_on_way" || status === "arrived") {
      return "Pickup Location";
    }
    return "Drop-off Location";
  };

  return (
    <View style={styles.container}>

      {/* MapView with explicit pixel width/height — this is the most reliable
          way to guarantee the map renders on both iOS and Android. No wrapper
          View, no absoluteFillObject ambiguity. All overlays use position
          'absolute' to float above it. */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={darkMapStyle}
      >
        {currentDriverLocation && (
          <Marker
            coordinate={currentDriverLocation}
            title="You"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarkerContainer}>
              <Image
                source={require('../../assets/images/target.png')}
                style={{ width: 30, height: 30 }}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}

        {destination && (
          <Marker
            coordinate={destination}
            title={getDestinationLabel()}
            description={destination.address}
          >
            <View style={styles.destinationMarkerContainer}>
              <FontAwesome5
                name={status === "ride_started" ? "flag-checkered" : "map-pin"}
                size={20}
                color="#1c1c1c"
              />
            </View>
          </Marker>
        )}

        {currentDriverLocation && destination && GOOGLE_API_KEY && (
          <MapViewDirections
            origin={currentDriverLocation}
            destination={destination}
            apikey={GOOGLE_API_KEY}
            strokeWidth={5}
            strokeColor="#facc15"
            optimizeWaypoints={true}
            onReady={(result) => {
              setRouteDistance(result.distance);
              setRouteDuration(result.duration);
            }}
            onError={(errorMessage) => {
              console.warn("MapViewDirections Error:", errorMessage);
            }}
          />
        )}
      </MapView>

      {/* Locating indicator — outside MapView to avoid Fabric/JSI crash */}
      {locating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#facc15" />
          <Text style={styles.loadingText}>Locating…</Text>
        </View>
      )}

      {/* Top Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {/* <ActivityIndicator size="small" color="white" style={{ marginLeft: 5 }} /> */}
        </View>
      </View>

      {/* Bottom Panel */}
      <Animated.View style={[styles.bottomPanel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.dragHandle} />

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>
              {routeDistance ? `${routeDistance.toFixed(1)} km` : '...'}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ETA</Text>
            <Text style={styles.infoValue}>
              {routeDuration ? `${Math.round(routeDuration)} min` : '...'}
            </Text>
          </View>
        </View>

        <View style={styles.destinationDisplay}>
          <Feather name="map-pin" size={18} color="#facc15" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.destinationTitle}>{getDestinationLabel()}</Text>
            <Text style={styles.destinationAddress} numberOfLines={2}>
              {destination?.address || "Loading..."}
            </Text>
          </View>
        </View>

        {/* <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (destination) {
              setPermissionModalVisible(true);
            }
          }}
        >
          <Text style={styles.actionButtonText}>Open Navigation</Text>
          <Feather name="navigation" size={20} color="white" style={{ marginLeft: 10 }} />
        </TouchableOpacity> */}
      </Animated.View>

      <CentralModal
        visible={permissionModalVisible}
        onClose={() => setPermissionModalVisible(false)}
        title="Navigation"
        subText="This would open Google Maps for turn-by-turn navigation"
        icon="navigation"
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
  // Explicit pixel dimensions are the most reliable way to size a MapView.
  // flex:1 and absoluteFillObject both depend on the parent having a resolved
  // size before the map mounts, which isn't guaranteed on Android/Fabric.
  map: {
    width,
    height,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
  },
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
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  driverMarkerContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#facc15",
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: 'white',
  },
  destinationMarkerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0d46d",
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
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
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#facc15',
    padding: 15,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});