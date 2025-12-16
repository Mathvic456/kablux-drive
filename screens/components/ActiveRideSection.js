import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ActiveRideSection = ({ 
  status, 
  rideId, 
  rideDetails, 
  onStartRide, 
  onFinishRide,
  isStarting = false,
  isFinishing = false,
  isLoadingDetails = false,
  onArrived,
  isArriving,
}) => {
  const navigation = useNavigation();
  
  // Logic to determine phases
  const isPickupPhase = status === 'ride_created' || status === 'driver_on_way';
  
  if (status === 'not_busy') return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to render the text/icon inside the main button
  const renderButtonContent = (loading, icon, text) => {
    if (loading) return <ActivityIndicator color="black" size="small" />;
    return (
      <>
        <Ionicons name={icon} size={20} color="black" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>{text}</Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* --- HEADER STATUS BAR --- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, !isPickupPhase && styles.activeDot]} />
          <Text style={styles.headerTitle}>
            {isPickupPhase ? 'Heading to Passenger' : 'Ride in Progress'}
          </Text>
        </View>
        <Text style={styles.rideId}>#{rideId ? rideId.slice(0, 5) : '...'}</Text>
      </View>

      {isLoadingDetails && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#facc15" size="small" />
          <Text style={styles.loadingText}>Syncing details...</Text>
        </View>
      )}


      {rideDetails?.rider && (
        <View style={styles.riderCard}>
          <View style={styles.riderAvatar}>
            {rideDetails.rider.profile_image ? (
                <Image source={{uri: rideDetails.rider.profile_image}} style={styles.avatarImage} />
            ) : (
                <Ionicons name="person" size={24} color="#facc15" />
            )}
          </View>
          <View style={styles.riderDetails}>
            <Text style={styles.riderLabel}>PASSENGER</Text>
            <Text style={styles.riderName}>{rideDetails.rider.name || "Passenger"}</Text>
          </View>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.routeContainer}>
        {/* Pickup */}
        <View style={styles.addressRow}>
            <View style={styles.timelineContainer}>
                <Ionicons name="ellipse" size={12} color="#facc15" />
                <View style={styles.timelineLine} />
            </View>
            <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>PICKUP</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                    {rideDetails?.pickup_address || "Pickup location not set"}
                </Text>
            </View>
        </View>

        {/* Dropoff */}
        <View style={styles.addressRow}>
            <View style={styles.timelineContainer}>
                <Ionicons name="location" size={12} color="#4CAF50" />
            </View>
            <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>DROPOFF</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                    {rideDetails?.dropoff_address || "Destination not set"}
                </Text>
            </View>
        </View>
      </View>

      {/* --- FARE INFO --- */}
      {rideDetails?.fare !== undefined && (
        <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Est. Fare</Text>
            <Text style={styles.fareValue}>{formatCurrency(rideDetails.fare)}</Text>
        </View>
      )}

      {/* --- ACTION BUTTONS --- */}
      <View style={styles.actionsContainer}>
        
        {/* 1. Main Action Button (Flex Grow) */}
        {isPickupPhase && (
          <TouchableOpacity 
            style={[styles.actionButton, isArriving && styles.buttonDisabled]}
            onPress={onArrived}
            disabled={isArriving}
          >
            {renderButtonContent(isArriving, "location", "I Have Arrived")}
          </TouchableOpacity>
        )}

        {status === "arrived" && (
          <TouchableOpacity 
            style={[styles.actionButton, isStarting && styles.buttonDisabled]}
            onPress={onStartRide}
            disabled={isStarting}
          >
            {renderButtonContent(isStarting, "play", "Start Trip")}
          </TouchableOpacity>
        )}

        {status === 'ride_started' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.finishButton, isFinishing && styles.buttonDisabled]}
            onPress={onFinishRide}
            disabled={isFinishing}
          >
            {renderButtonContent(isFinishing, "flag", "Complete Ride")}
          </TouchableOpacity>
        )}

        {/* 2. Map Button (Fixed Square) */}
        <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => navigation.navigate('DriverMapScreen', { rideDetails })}
        >
            <Ionicons name="map-outline" size={24} color="white" />
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  /* HEADER */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#facc15',
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rideId: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },

  /* LOADING */
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingText: {
    color: '#999',
    marginLeft: 8,
    fontSize: 12,
  },

  /* RIDER INFO */
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#facc15',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  riderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  riderLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  riderName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 16,
  },

  /* ROUTE */
  routeContainer: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineContainer: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#444',
    minHeight: 25,
  },
  addressContent: {
    flex: 1,
    paddingBottom: 16,
  },
  addressLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    color: '#eee',
    fontSize: 14,
    lineHeight: 20,
  },

  /* FARE */
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fareLabel: {
    color: '#999',
    fontSize: 14,
  },
  fareValue: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: 'bold',
  },

  /* --- BUTTON STYLES FIXED --- */
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 54,
    backgroundColor: '#facc15',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
  },
  mapButton: {
    width: 54,
    height: 54,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  primaryButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 15,
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.6,
  }
});

export default ActiveRideSection;