import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDriverRide } from "../../context/DriverRideContext";

const CounterOfferItem = ({ item, onClose, socket, onCounterSubmit }) => {
  console.log('counter thing----', item);

  const [counterAmount, setCounterAmount] = useState(Number(item.counter_offer));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualText, setManualText] = useState('');
  const { setNegotiationUpdates } = useDriverRide()

  const originalOffer = Number(item.counter_offer);
  const difference = counterAmount - originalOffer;
  const hasAdjusted = counterAmount !== originalOffer;

  const handleIncrease = () => setCounterAmount((prev) => Number(prev) + 100);
  const handleDecrease = () => setCounterAmount((prev) => Math.max(100, Number(prev) - 100));

  const handleSubmitCounter = async () => {
    if (counterAmount <= 0) {
      alert("Please enter a valid counter offer");
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert("WebSocket not connected");
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
      socket.send(JSON.stringify(message));
      console.log("✅ Counter offer sent:", message);
      setNegotiationUpdates((prev) => prev.filter((note) => note.ride_request_id !== item.ride_request_id));

      if (onCounterSubmit) {
        onCounterSubmit(item.ride_request_view_id);
      }

      setTimeout(() => onClose(), 300);
    } catch (err) {
      console.error("❌ Failed to submit counter offer:", err);
      alert("Failed to submit counter offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header with Rider Name */}
      <View style={styles.headerSection}>
        <Ionicons name="person-circle" size={40} color="#facc15" />
        <View style={styles.riderInfo}>
          <Text style={styles.riderName}>{item.rider || "N/A"}</Text>
          {item.rider_rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#facc15" />
              <Text style={styles.ratingText}>{item.rider_rating}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Title */}
      <Text style={styles.titleText}>
        {item.rider}'s Counter Offer
      </Text>

      {/* Price & Controls (+ / -) */}
      <View style={styles.priceControlRow}>
        <TouchableOpacity
          onPress={handleDecrease}
          style={[styles.circleButton, (isSubmitting || counterAmount <= 100) && styles.disabledButton]}
          disabled={isSubmitting || counterAmount <= 100}
        >
          <Ionicons name="remove" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.priceContainer}>
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
                ₦{counterAmount?.toLocaleString()}
              </Text>
              <Text style={styles.tapHint}>Tap to type amount</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleIncrease}
          style={[styles.circleButton, isSubmitting && styles.disabledButton]}
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
          {difference > 0 ? '+' : ''}₦{Math.abs(difference)?.toLocaleString()} from rider's offer
        </Text>
      )}

      {/* Submit Button */}
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
            {hasAdjusted ? 'Submit New Counter Offer' : 'Accept Offer'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        onPress={onClose}
        disabled={isSubmitting}
        style={[styles.cancelButton, isSubmitting && styles.disabledButton]}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },

  // --- Header Section ---
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  riderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  riderName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "#facc15",
    fontSize: 14,
    marginLeft: 4,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: "#333",
    marginBottom: 20,
  },

  // --- Title ---
  titleText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 24,
    fontWeight: '600',
    textAlign: 'center',
  },

  // --- Price Controls ---
  priceControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 10,
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
  priceContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
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

  // --- Buttons ---
  submitButton: {
    backgroundColor: '#facc15',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: "#facc15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'white',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
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

export default CounterOfferItem;