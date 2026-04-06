import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SocketContext } from '../../context/WebSocketProvider';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { darkMapStyle } from '../../styles/darkMapStyle';
import * as Location from 'expo-location';
import CentralModal from '../components/CentralModal';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { socket } = useContext(SocketContext);
  const { item, onCounterSubmitted } = route.params || {};

  const [counterAmount, setCounterAmount] = useState(item?.offer_amount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualText, setManualText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', isError: false });
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.5244, // Default Lagos
    longitude: 3.3792,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isGeocoding, setIsGeocoding] = useState(true);

  const mapRef = useRef(null);
  const originalOffer = item?.offer_amount || 0;

  // 🛡️ Guard Clause
  if (!item || !item.ride_request_id) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#f44336" />
        <Text style={styles.errorText}>Invalid Ride Data</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleIncrease = () => setCounterAmount(prev => prev + 100);
  const handleDecrease = () => setCounterAmount(prev => Math.max(0, prev - 100));

  // Quick suggestion handlers
  const setSuggestion = (amount) => {
    if (amount > 0) setCounterAmount(amount);
  };

  const handleSubmitCounter = async () => {
    if (counterAmount <= 0) {
      setModalData({ title: 'Error', message: 'Please enter a valid counter offer amount', isError: true });
      setModalVisible(true);
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setModalData({ title: 'Connection Error', message: 'WebSocket is not connected', isError: true });
      setModalVisible(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const message = {
        type: "create_driver_offer",
        data: {
          ride_request_id: item.ride_request_id,
          counter_offer: counterAmount,
        },
      };

      console.log("📤 Sending Counter Offer:", JSON.stringify(message));
      socket.send(JSON.stringify(message));

      setModalData({ title: 'Success', message: 'Your offer has been sent', isError: false });
      setModalVisible(true);

    } catch (error) {
      console.error('Error submitting counter:', error);
      setModalData({ title: 'Error', message: 'Failed to submit counter offer.', isError: true });
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const difference = counterAmount - originalOffer;
  const hasAdjusted = counterAmount !== originalOffer;

  // Geocode pickup address
  useEffect(() => {
    (async () => {
      if (item?.address) {
        try {
          setIsGeocoding(true);
          const geocoded = await Location.geocodeAsync(item.address);
          if (geocoded.length > 0) {
            const newRegion = {
              latitude: geocoded[0].latitude,
              longitude: geocoded[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setMapRegion(newRegion);

            // Animate map to new location
            if (mapRef.current) {
              mapRef.current.animateToRegion(newRegion, 1000);
            }
          }
        } catch (e) {
          console.log("Geocoding failed, using default location:", e);
        } finally {
          setIsGeocoding(false);
        }
      } else {
        setIsGeocoding(false);
      }
    })();
  }, [item?.address]);

  return (
    <View style={styles.container}>

      {/* 1. Background Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          customMapStyle={darkMapStyle}
          initialRegion={mapRegion}
          region={mapRegion}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
        >
          <Marker coordinate={{
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude,
          }}>
            <View style={styles.mapMarkerContainer}>
              <FontAwesome5 name="map-pin" size={16} color="#1c1c1c" />
            </View>
          </Marker>
        </MapView>


        {/* Loading indicator while geocoding */}
        {isGeocoding && (
          <View style={styles.geocodingIndicator}>
            <ActivityIndicator color="#facc15" size="small" />
          </View>
        )}
      </View>

      {/* 2. Immovable Modal Overlay */}
      <View style={styles.modalContent}>
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Header: Back Button & Title */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Price Details</Text>
              </View>

            </View>

            {/* Pickup Location Info */}
            <View style={styles.locationSection}>
              <Text style={styles.labelLeft}>Pickup</Text>
              <View style={styles.addressRow}>
                <View style={styles.smallMarker}>
                  <View style={styles.innerDot} />
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {item.address || "Pickup Location"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Base Offer Title */}
            <Text style={styles.sectionTitle}>Base Offer</Text>

            {/* Price & Controls (+ / -) */}
            <View style={styles.priceControlRow}>
              <TouchableOpacity
                onPress={handleDecrease}
                style={styles.circleButton}
                disabled={isSubmitting || counterAmount <= 0}
              >
                <Ionicons name="remove" size={24} color="white" />
              </TouchableOpacity>

              {isManualEntry ? (
                <View style={styles.manualInputRow}>
                  <Text style={styles.manualPrefix}>₦</Text>
                  <TextInput
                    style={styles.manualInput}
                    keyboardType="numeric"
                    value={manualText}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '');
                      setManualText(cleaned);
                    }}
                    autoFocus
                    maxLength={7}
                    placeholder="0"
                    placeholderTextColor="#666"
                    onBlur={() => {
                      const val = parseInt(manualText, 10);
                      if (val > 0) setCounterAmount(val);
                      setIsManualEntry(false);
                      setManualText('');
                    }}
                    onSubmitEditing={() => {
                      const val = parseInt(manualText, 10);
                      if (val > 0) setCounterAmount(val);
                      setIsManualEntry(false);
                      setManualText('');
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity onPress={() => {
                  setManualText(String(counterAmount));
                  setIsManualEntry(true);
                }}>
                  <Text style={styles.mainPrice}>
                    ₦{counterAmount.toLocaleString()}
                  </Text>
                  <Text style={styles.tapHint}>Tap to type amount</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleIncrease}
                style={styles.circleButton}
                disabled={isSubmitting}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Difference indicator */}
            {hasAdjusted && (
              <Text style={[
                styles.differenceText,
                difference > 0 ? styles.higher : styles.lower
              ]}>
                {difference > 0 ? '+' : ''}₦{Math.abs(difference).toLocaleString()} from original offer
              </Text>
            )}

            {/* Price Suggestions (3 Boxes) */}
            <View style={styles.suggestionsRow}>
              {/* 1000 Below Original */}
              <TouchableOpacity
                style={styles.suggestionBox}
                onPress={() => setSuggestion(Math.max(0, originalOffer - 1000))}
                disabled={originalOffer <= 1000}
              >
                <Text style={styles.suggestionText}>- ₦1,000</Text>
                <Text style={styles.suggestionSubText}>Below</Text>
              </TouchableOpacity>

              {/* 1000 Above Original */}
              <TouchableOpacity
                style={styles.suggestionBox}
                onPress={() => setSuggestion(originalOffer + 1000)}
              >
                <Text style={styles.suggestionText}>+ ₦1,000</Text>
                <Text style={styles.suggestionSubText}>Above</Text>
              </TouchableOpacity>

              {/* 2000 Above Original */}
              <TouchableOpacity
                style={styles.suggestionBox}
                onPress={() => setSuggestion(originalOffer + 2000)}
              >
                <Text style={styles.suggestionText}>+ ₦2,000</Text>
                <Text style={styles.suggestionSubText}>Above</Text>
              </TouchableOpacity>
            </View>

            {/* Counter Offer Button (Brand Yellow) */}
            <TouchableOpacity
              onPress={handleSubmitCounter}
              disabled={isSubmitting || counterAmount <= 0}
              style={[
                styles.submitButton,
                (isSubmitting || counterAmount <= 0) && styles.disabledButton,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Counter Offer for ₦{counterAmount.toLocaleString()}
                </Text>
              )}
            </TouchableOpacity>

            {/* Close/Cancel Button (White Outline) */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Success/Error Modal */}
      <CentralModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          if (!modalData.isError && modalData.title === 'Success') {
            if (onCounterSubmitted) onCounterSubmitted();
            navigation.goBack();
          }
        }}
        title={modalData.title}
        subText={modalData.message}
        icon={modalData.isError ? 'alert-circle' : 'checkmark-circle'}
        confirmText="OK"
        closeText=""
        onConfirm={() => {
          setModalVisible(false);
          if (!modalData.isError && modalData.title === 'Success') {
            if (onCounterSubmitted) onCounterSubmitted();
            navigation.goBack();
          }
        }}
        confirmButtonColor={modalData.isError ? '#f44336' : '#facc15'}
        themeColor={modalData.isError ? '#f44336' : '#4CAF50'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  container: {
    flex: 1,
    backgroundColor: '#181818',
    position: 'relative',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#facc15',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // --- Map Background ---
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  geocodingIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
  },
  mapMarkerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#facc15",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },

  // --- Modal Content ---
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%', // Takes up 60% from bottom (adjust as needed)
    padding: 15,
    zIndex: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitleContainer: {
    textAlign: "center",
    paddingLeft: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',

  },

  // --- Location Section ---
  locationSection: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  labelLeft: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#facc15',
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#facc15',
  },
  addressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },

  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },

  // --- Base Offer ---
  sectionTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
    fontWeight: '600',
  },
  priceControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 15,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  tapHint: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#facc15',
    paddingBottom: 4,
  },
  manualPrefix: {
    color: '#facc15',
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 2,
  },
  manualInput: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },

  // --- Difference ---
  differenceText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: '600',
  },
  higher: {
    color: '#4CAF50',
  },
  lower: {
    color: '#f44336',
  },

  // --- Suggestions ---
  suggestionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  suggestionBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    width: '31%',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  suggestionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  suggestionSubText: {
    color: '#aaa',
    fontSize: 10,
    textTransform: 'uppercase',
  },

  // --- Actions ---
  submitButton: {
    backgroundColor: '#facc15',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: "#facc15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    marginHorizontal: 15,
  },
  submitButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
});