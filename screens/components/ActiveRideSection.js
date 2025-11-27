import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ActiveRideSection = ({ 
  status, 
  rideId, 
  riderId, 
  rideDetails, 
  onStartRide, 
  onFinishRide,
  isStarting = false,
  isFinishing = false,
  isLoadingDetails = false,
}) => {
  const navigation = useNavigation();
  

  if (status === 'not_busy') return null;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get driver rating stars
  const renderRating = (rating) => {
    const stars = [];
    const numRating = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= numRating ? 'star' : 'star-outline'}
          size={14}
          color="#facc15"
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name={status === 'ride_created' ? 'navigate-circle' : 'car'} 
          size={32} 
          color="#facc15" 
        />
        <Text style={styles.title}>
          {status === 'ride_created' ? 'Passenger Pickup' : 'Ride in Progress'}
        </Text>
      </View>

      {/* Loading State */}
      {isLoadingDetails && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#facc15" size="small" />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      )}

      {/* Ride Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Ride ID:</Text>
          <Text style={styles.value}>{rideId ? rideId.slice(0, 8) : 'N/A'}...</Text>
        </View>
        
        {riderId && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Rider ID:</Text>
            <Text style={styles.value}>{riderId.slice(0, 8)}...</Text>
          </View>
        )}

        {/* Fare Display */}
        {rideDetails?.fare && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Fare:</Text>
            <Text style={[styles.value, styles.fareText]}>
              {formatCurrency(rideDetails.fare)}
            </Text>
          </View>
        )}

        {/* Addresses */}
        {rideDetails && (
          <>
            <View style={styles.divider} />
            
            {/* Pickup Address */}
            <View style={styles.addressContainer}>
              <View style={styles.addressHeader}>
                <Ionicons name="location" size={18} color="#facc15" />
                <Text style={styles.addressLabel}>Pickup</Text>
              </View>
              <Text style={styles.addressText} numberOfLines={2}>
                {rideDetails.pickup_address || "Pickup Location"}
              </Text>
            </View>

            {/* Dropoff Address */}
            <View style={styles.addressContainer}>
              <View style={styles.addressHeader}>
                <Ionicons name="flag" size={18} color="#4CAF50" />
                <Text style={styles.addressLabel}>Destination</Text>
              </View>
              <Text style={styles.addressText} numberOfLines={2}>
                {rideDetails.dropoff_address || "Dropoff Location"}
              </Text>
            </View>

            {/* Driver Info (if available) */}
            {rideDetails.driver_info && (
              <>
                <View style={styles.divider} />
                <View style={styles.driverInfoSection}>
                  <Text style={styles.sectionTitle}>Driver Info</Text>
                  
                  {rideDetails.driver_info.phone_number && (
                    <View style={styles.driverInfoRow}>
                      <Ionicons name="call-outline" size={16} color="#999" />
                      <Text style={styles.driverInfoText}>
                        {rideDetails.driver_info.phone_number}
                      </Text>
                    </View>
                  )}

                  {rideDetails.driver_info.rating && (
                    <View style={styles.driverInfoRow}>
                      <View style={styles.ratingContainer}>
                        {renderRating(rideDetails.driver_info.rating)}
                      </View>
                      <Text style={styles.ratingText}>
                        ({rideDetails.driver_info.rating})
                      </Text>
                    </View>
                  )}

                  {/* Vehicle Info */}
                  {rideDetails.driver_info.vehicle && 
                   Object.keys(rideDetails.driver_info.vehicle).length > 0 && (
                    <View style={styles.vehicleInfo}>
                      <Ionicons name="car-sport-outline" size={16} color="#999" />
                      <Text style={styles.driverInfoText}>
                        {rideDetails.driver_info.vehicle.make} {rideDetails.driver_info.vehicle.model}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* Status Badge */}
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, status === 'ride_started' && styles.activeDot]} />
        <Text style={styles.statusText}>
          {status === 'ride_created' ? 'Heading to pickup location' : 'Passenger on board'}
        </Text>
      </View>

      {/* Action Buttons */}
      {status === 'ride_created' && (
        <>
          <TouchableOpacity 
            style={[styles.primaryButton, isStarting && styles.buttonDisabled]}
            onPress={onStartRide}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator color="black" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="black" />
                <Text style={styles.primaryButtonText}>I Have Arrived</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('DriverMapScreen', { rideDetails })}
          >
            <Ionicons name="map" size={20} color="white" />
            <Text style={styles.secondaryButtonText}>View on Map</Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'ride_started' && (
        <>
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
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('DriverMapScreen', { rideDetails })}
          >
            <Ionicons name="map" size={20} color="white" />
            <Text style={styles.secondaryButtonText}>View on Map</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#facc15',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingText: {
    color: '#999',
    marginLeft: 8,
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    color: '#999',
    fontSize: 14,
  },
  value: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fareText: {
    color: '#facc15',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  addressLabel: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '600',
  },
  addressText: {
    color: '#ccc',
    fontSize: 14,
    paddingLeft: 24,
    lineHeight: 20,
  },
  driverInfoSection: {
    paddingTop: 8,
  },
  sectionTitle: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  driverInfoText: {
    color: '#ccc',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    color: '#999',
    fontSize: 13,
    marginLeft: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    alignSelf: 'flex-start',
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
  statusText: {
    color: '#ccc',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#facc15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#007aff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ActiveRideSection;