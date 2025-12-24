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

const { height } = Dimensions.get('window');

export default function DriverMapScreen({ navigation }) {
  const mapRef = useRef(null);
  const route = useRoute();
  const { rideDetails } = route.params;
  const { status } = useDriverRide();

  const [slideAnim] = useState(new Animated.Value(height * 0.25));
  const [currentDriverLocation, setCurrentDriverLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);

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
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionModalVisible(true);
        return;
      }

      // Watch driver position
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          const newCoordinate = { latitude, longitude };
          setCurrentDriverLocation(newCoordinate);
        }
      );
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Fit map to show both driver and destination
  useEffect(() => {
    if (currentDriverLocation && destination && mapRef.current) {
      mapRef.current.fitToCoordinates([currentDriverLocation, destination], {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  }, [currentDriverLocation, destination]);

  // Set destination based on ride status
  useEffect(() => {
    if (!rideDetails?.raw) {
      console.warn("⚠️ No ride details found");
      return;
    }

    const raw = rideDetails.raw;
    
    console.log("🗺️ Setting destination based on status:", status);
    console.log("📍 Raw data:", raw);

    // When driver is on the way or just arrived, show route to PICKUP
    if (status === "ride_created" || status === "driver_on_way" || status === "arrived") {
      const pickupLat = parseFloat(raw.pickup_lat);
      const pickupLng = parseFloat(raw.pickup_lng);
      
      if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
        setDestination({
          latitude: pickupLat,
          longitude: pickupLng,
          address: raw.pickup_address || "Pickup Location",
        });
        console.log("✅ Destination set to PICKUP:", pickupLat, pickupLng);
      } else {
        console.error("❌ Invalid pickup coordinates");
      }
    }
    // When ride has started, show route to DROPOFF
    else if (status === "ride_started") {
      const dropoffLat = parseFloat(raw.dropoff_lat);
      const dropoffLng = parseFloat(raw.dropoff_lng);
      
      if (!isNaN(dropoffLat) && !isNaN(dropoffLng)) {
        setDestination({
          latitude: dropoffLat,
          longitude: dropoffLng,
          address: raw.dropoff_address || "Drop-off Location",
        });
        console.log("✅ Destination set to DROPOFF:", dropoffLat, dropoffLng);
      } else {
        console.error("❌ Invalid dropoff coordinates");
      }
    }
  }, [status, rideDetails]);

  const handleBackPress = () => {
    navigation.goBack();
  };

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

  const renderDriverMapContent = () => {
    if (!GOOGLE_API_KEY) {
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Map API Key is missing!</Text>
        </View>
      );
    }

    // Show loader until we get the first GPS lock
    if (!currentDriverLocation) {
      return (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.mapSubtext}>Locating Driver...</Text>
        </View>
      );
    }

    if (!destination) {
      return (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.mapSubtext}>Loading destination...</Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentDriverLocation.latitude,
          longitude: currentDriverLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={darkMapStyle}
      >
        {/* Driver Marker (Your Location) */}
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

        {/* Destination Marker (Pickup or Drop-off) */}
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

        {/* Route Line from Driver to Destination */}
        <MapViewDirections
          origin={currentDriverLocation}
          destination={destination}
          apikey={GOOGLE_API_KEY}
          strokeWidth={5}
          strokeColor="#007aff"
          optimizeWaypoints={true}
          onReady={(result) => {
            console.log(`Distance: ${result.distance} km`);
            console.log(`Duration: ${result.duration} min`);
            setRouteDistance(result.distance);
            setRouteDuration(result.duration);
          }}
          onError={(errorMessage) => {
            console.warn("MapViewDirections Error:", errorMessage);
          }}
        />
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        {renderDriverMapContent()}
      </View>

      {/* Top Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconContainer} onPress={handleBackPress}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          <ActivityIndicator size="small" color="white" style={{ marginLeft: 5 }} />
        </View>
      </View>

      {/* Bottom Panel - Ride Info Summary */}
      <Animated.View style={[styles.bottomPanel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.dragHandle} />

        {/* Distance & Time Info */}
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

        {/* Destination Display */}
        <View style={styles.destinationDisplay}>
          <Feather name="map-pin" size={18} color="#007aff" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.destinationTitle}>{getDestinationLabel()}</Text>
            <Text style={styles.destinationAddress} numberOfLines={2}>
              {destination?.address || "Loading..."}
            </Text>
          </View>
        </View>

        {/* Open Navigation Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (destination) {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
              setPermissionModalVisible(true);
              // You can use Linking.openURL(url) to actually open Google Maps
            }
          }}
        >
          <Text style={styles.actionButtonText}>Open Navigation</Text>
          <Feather name="navigation" size={20} color="white" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
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
        confirmButtonColor="#007aff"
        themeColor="#007aff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#333',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1c'
  },
  mapText: {
    fontSize: 18,
    color: '#f0d46d',
    fontWeight: 'bold',
  },
  mapSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 10,
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
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
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
    backgroundColor: "#007aff",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: 'white'
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
    backgroundColor: '#007aff',
    padding: 15,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});