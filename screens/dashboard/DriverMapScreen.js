import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location'; // Import Location
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
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from "react-native-maps-directions";
import { darkMapStyle } from '../../styles/darkMapStyle';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("EXPO_PUBLIC_GOOGLE_API_KEY is missing in environment variables.");
}

const { height } = Dimensions.get('window');

const mockRideData = {
  dropOffLocation: {
    latitude: 6.4167,
    longitude: 3.4333,
    address: 'Eko Atlantic City, Victoria Island, Lagos',
  },

  initialDistance: 'Calculating...', 
  initialTime: '...',
};

export default function DriverMapScreen({ navigation }) {
  const mapRef = useRef(null);

  const [slideAnim] = useState(new Animated.Value(height * 0.25));
  

  const [currentDriverLocation, setCurrentDriverLocation] = useState(null);
  const [rideMetrics, setRideMetrics] = useState({
    distance: mockRideData.initialDistance,
    duration: mockRideData.initialTime
  });

  const locationSubscription = useRef(null);


  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);


  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to track your drive.');
        return;
      }

      // B. Watch Position
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


  useEffect(() => {
    if (currentDriverLocation && mockRideData.dropOffLocation && mapRef.current) {
      mapRef.current.fitToCoordinates([currentDriverLocation, mockRideData.dropOffLocation], {
        edgePadding: { top: 100, right: 50, bottom: 250, left: 50 }, 
        animated: true,
      });
    }

  }, [currentDriverLocation === null]); 

  const handleBackPress = () => {
    navigation.navigate('home');
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
        {/* Driver/Pickup Marker (Dynamic) */}
        <Marker
          coordinate={currentDriverLocation}
          title="You"
          anchor={{ x: 0.5, y: 0.5 }} // Center the icon
        >
          <View style={styles.driverMarkerContainer}>
            <Image
              source={require('../../assets/images/target.png')} 
              style={{ width: 30, height: 30 }}
              resizeMode="contain"
            />
          </View>
        </Marker>

        {/* Drop-off Location Marker (Static) */}
        <Marker
          coordinate={mockRideData.dropOffLocation}
          title="Rider Drop-off"
          description={mockRideData.dropOffLocation.address}
        >
          <View style={styles.destinationMarkerContainer}>
            <FontAwesome5 name="flag-checkered" size={20} color="#1c1c1c" />
          </View>
        </Marker>

        {/* Route Line from Driver (Dynamic) to Drop-off */}
        <MapViewDirections
          origin={currentDriverLocation}
          destination={mockRideData.dropOffLocation}
          apikey={GOOGLE_API_KEY}
          strokeWidth={5}
          strokeColor="#007aff"
          optimizeWaypoints={true}
          onReady={(result) => {
            setRideMetrics({
              distance: `${result.distance.toFixed(1)} km`,
              duration: `${Math.round(result.duration)} min`
            });

          }}
          onError={(errMessage) => console.warn("MapViewDirections Error:", errMessage)}
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
          <Text style={styles.statusText}>Active Ride</Text>
          <ActivityIndicator size="small" color="white" style={{ marginLeft: 5 }} />
        </View>
      </View>

      {/* Bottom Panel - Ride Info Summary */}
      <Animated.View style={[styles.bottomPanel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.dragHandle} />
        
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Distance to Drop-off</Text>
            <Text style={styles.infoValue}>{rideMetrics.distance}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Est. Time</Text>
            <Text style={styles.infoValue}>{rideMetrics.duration}</Text>
          </View>
        </View>

        <View style={styles.destinationDisplay}>
          <Feather name="map-pin" size={18} color="#007aff" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.destinationTitle}>Drop-off Location</Text>
            <Text style={styles.destinationAddress}>{mockRideData.dropOffLocation.address}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => console.log('Navigate via Google Maps / Waze')}
        >
          <Text style={styles.actionButtonText}>Open Navigation</Text>
          <Feather name="navigation" size={20} color="white" style={{ marginLeft: 10 }} />
        </TouchableOpacity>

      </Animated.View>
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
    height: height * 0.25,
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
    padding: 10,
    backgroundColor: '#2b2b2b',
    borderRadius: 10,
  },
  destinationTitle: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
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