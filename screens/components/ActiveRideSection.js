import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  rideAcceptedAt = null,
  expectedArrivalMinutes = 15,
  onUpdateFare,
  isUpdatingFare = false,
}) => {

  const navigation = useNavigation();

  const isPickupPhase = status === 'ride_created' || status === 'driver_on_way';

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!rideAcceptedAt || !isPickupPhase) {
      setElapsedSeconds(0);
      return;
    }

    // Calculate elapsed immediately
    const calcElapsed = () => Math.floor((Date.now() - rideAcceptedAt) / 1000);
    setElapsedSeconds(calcElapsed());

    const interval = setInterval(() => {
      setElapsedSeconds(calcElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [rideAcceptedAt, isPickupPhase]);

  const [manualFare, setManualFare] = useState('');
  const [showFareInput, setShowFareInput] = useState(false);

  const handleFareSubmit = () => {
    const fareValue = parseFloat(manualFare);
    if (isNaN(fareValue) || fareValue <= 0) {
      Alert.alert("Invalid Fare", "Please enter a valid positive amount.");
      return;
    }
    if (fareValue > 999999) {
      Alert.alert("Invalid Fare", "Fare amount is too high.");
      return;
    }

    Alert.alert(
      "Confirm Fare Update",
      `Set ride fare to ₦${fareValue.toLocaleString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            onUpdateFare?.(fareValue);
            setShowFareInput(false);
            setManualFare('');
          },
        },
      ]
    );
  };

  const expectedSeconds = expectedArrivalMinutes * 60;
  const remainingSeconds = Math.max(0, expectedSeconds - elapsedSeconds);
  const isLate = elapsedSeconds > expectedSeconds && isPickupPhase;
  const overtimeSeconds = isLate ? elapsedSeconds - expectedSeconds : 0;

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'not_busy') return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
      {/* HEADER STATUS BAR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, !isPickupPhase && styles.activeDot]} />
          <Text style={styles.headerTitle}>
            {isPickupPhase ? 'Heading to Passenger' : 'Ride in Progress'}
          </Text>
        </View>
        <Text style={styles.rideId}>#{rideId ? rideId.slice(0, 5) : '...'}</Text>
      </View>

      {/* Late Arrival Timer */}
      {isPickupPhase && rideAcceptedAt && (
        <View style={[styles.timerContainer, isLate && styles.timerContainerLate]}>
          <Ionicons
            name={isLate ? "warning" : "time-outline"}
            size={18}
            color={isLate ? "#f44336" : "#facc15"}
          />
          <View style={styles.timerTextContainer}>
            <Text style={[styles.timerLabel, isLate && styles.timerLabelLate]}>
              {isLate ? 'LATE BY' : 'ARRIVE WITHIN'}
            </Text>
            <Text style={[styles.timerValue, isLate && styles.timerValueLate]}>
              {isLate ? formatTime(overtimeSeconds) : formatTime(remainingSeconds)}
            </Text>
          </View>
        </View>
      )}

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
              <Image source={{ uri: rideDetails.rider.profile_image }} style={styles.avatarImage} />
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

      {rideDetails?.fare !== undefined && (
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Est. Fare.</Text>
          <Text style={styles.fareValue}>{formatCurrency(rideDetails.fare)}</Text>
        </View>
      )}

      {/* Manual Fare Input */}
      {(status === 'ride_started' || status === 'started') && onUpdateFare && (
        <>
          {showFareInput ? (
            <View style={styles.fareInputContainer}>
              <View style={styles.fareInputRow}>
                <Text style={styles.fareInputPrefix}>₦</Text>
                <TextInput
                  style={styles.fareInput}
                  placeholder="Enter fare"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={manualFare}
                  onChangeText={(text) => {
                    // Allow digits and one decimal point, max 2 decimal places
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    if (parts.length > 2) return;
                    if (parts[1] && parts[1].length > 2) return;
                    setManualFare(cleaned);
                  }}
                  maxLength={10}
                />
                <TouchableOpacity
                  style={[styles.fareSubmitButton, isUpdatingFare && styles.buttonDisabled]}
                  onPress={handleFareSubmit}
                  disabled={isUpdatingFare || !manualFare}
                >
                  {isUpdatingFare ? (
                    <ActivityIndicator size="small" color="black" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="black" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fareCancelButton}
                  onPress={() => { setShowFareInput(false); setManualFare(''); }}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.setFareButton}
              onPress={() => setShowFareInput(true)}
            >
              <Ionicons name="create-outline" size={16} color="#facc15" style={{ marginRight: 6 }} />
              <Text style={styles.setFareButtonText}>Set Manual Fare</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={styles.actionsContainer}>

        {/* Main Action Button */}
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

        {(status === 'ride_started' || status === 'started') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.finishButton, isFinishing && styles.buttonDisabled]}
            onPress={onFinishRide}
            disabled={isFinishing}
          >
            {renderButtonContent(isFinishing, "flag", "Complete Ride")}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => navigation.navigate('DriverChat', {
            riderName: rideDetails?.rider?.name || "Passenger"
          })}
        >
          <Ionicons name="chatbubble-outline" size={24} color="white" />
        </TouchableOpacity>


        {/* Map Button */}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => { console.log('ride detsss', rideDetails); navigation.navigate('DriverMapScreen', { rideDetails }) }}
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

  /* TIMER */
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#facc15',
  },
  timerContainerLate: {
    backgroundColor: '#2a1a1a',
    borderColor: '#f44336',
  },
  timerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  timerLabel: {
    color: '#facc15',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  timerLabelLate: {
    color: '#f44336',
  },
  timerValue: {
    color: '#facc15',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timerValueLate: {
    color: '#f44336',
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

  /* FARE INPUT */
  fareInputContainer: {
    marginBottom: 16,
  },
  fareInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#facc15',
    paddingHorizontal: 12,
  },
  fareInputPrefix: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  fareInput: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    height: 48,
    paddingHorizontal: 4,
  },
  fareSubmitButton: {
    backgroundColor: '#facc15',
    borderRadius: 6,
    padding: 8,
    marginLeft: 8,
  },
  fareCancelButton: {
    padding: 8,
    marginLeft: 4,
  },
  setFareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  setFareButtonText: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '600',
  },

  /* BUTTONS */
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
  chatButton: {
    width: 54,
    height: 54,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
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
  },
});

export default ActiveRideSection;
