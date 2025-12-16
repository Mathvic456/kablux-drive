import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
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

  return (
    <View style={styles.container}>
      {/* Header Status Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, !isPickupPhase && styles.activeDot]} />
          <Text style={styles.headerTitle}>
            {isPickupPhase ? 'Heading to Passenger' : 'Ride in Progress'}
          </Text>
        </View>
        <Text style={styles.rideId}>#{rideId ? rideId.slice(0, 5) : '...'}</Text>
      </View>

      {/* Loading State */}
      {isLoadingDetails && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#facc15" size="small" />
          <Text style={styles.loadingText}>Syncing details...</Text>
        </View>
      )}

      {/* RIDER INFO CARD */}
      {rideDetails?.rider && (
        <View style={styles.riderCard}>
          <View style={styles.riderAvatar}>
             {/* UPDATED: Changed .image to .profile_image based on your JSON logs */}
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

      {/* ROUTE INFO */}
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

      {/* FARE INFO */}
      {rideDetails?.fare !== undefined && (
        <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Est. Fare</Text>
            <Text style={styles.fareValue}>{formatCurrency(rideDetails.fare)}</Text>
        </View>
      )}

      {/* ACTION BUTTONS */}
      <View style={styles.actionContainer}>
        {isPickupPhase && (
          <TouchableOpacity 
            style={[styles.primaryButton, isArriving && styles.buttonDisabled]}
            onPress={onArrived}
            disabled={isArriving}
          >
            {isArriving ? (
              <ActivityIndicator color="black" size="small" />
            ) : (
              <>
                <Ionicons name="location" size={20} color="black" />
                <Text style={styles.primaryButtonText}>I Have Arrived</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {status === "arrived" && (
          <TouchableOpacity 
            style={[styles.primaryButton, isStarting && styles.buttonDisabled]}
            onPress={onStartRide}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator color="black" size="small" />
            ) : (
              <>
                <Ionicons name="play" size={20} color="black" />
                <Text style={styles.primaryButtonText}>Start Trip</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {status === 'ride_started' && (
          <View style={styles.startedButtons}>
            <TouchableOpacity 
              style={[styles.primaryButton, styles.finishButton, isFinishing && styles.buttonDisabled]}
              onPress={onFinishRide}
              disabled={isFinishing}
            >
              {isFinishing ? (
                <ActivityIndicator color="black" size="small" />
              ) : (
                <>
                  <Ionicons name="flag" size={20} color="black" />
                  <Text style={styles.primaryButtonText}>Complete Ride</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => navigation.navigate('DriverMapScreen', { rideDetails })}
            >
              <Ionicons name="map-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
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
  },
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
    backgroundColor: '#facc15', // Yellow for pickup
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: '#4CAF50', // Green for active trip
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
  /* RIDER CARD STYLES */
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
    overflow: 'hidden', // Ensures image stays in circle
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  },
  riderName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#facc15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
    gap: 4,
  },
  ratingText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 12,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#facc15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 16,
  },
  /* ROUTE STYLES */
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
  /* FARE STYLES */
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
  /* BUTTONS */
  actionContainer: {
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#facc15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  finishButton: {
    backgroundColor: '#4CAF50', // Green
  },
  mapButton: {
    backgroundColor: '#333',
    width: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 10,
  },
  startedButtons: {
    flexDirection: 'row',
  },
  primaryButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.6,
  }
});

export default ActiveRideSection;