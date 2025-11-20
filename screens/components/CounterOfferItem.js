import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CounterOfferItem = ({ item, onClose, socket, onAccept }) => {
  const [counterAmount, setCounterAmount] = useState(item.counter_offer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const difference = counterAmount - item.counter_offer;

  const handleIncrease = () => setCounterAmount((prev) => prev + 100);
  const handleDecrease = () =>
    setCounterAmount((prev) => Math.max(0, prev - 100));

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
      setTimeout(() => onClose(), 300);
    } catch (err) {
      console.error("❌ Failed to submit counter offer:", err);
      alert("Failed to submit counter offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.updateCard}>
      {/* Rider Info */}
      <View style={styles.riderHeader}>
        <Ionicons name="person-circle" size={50} color="#facc15" />
        <View style={styles.riderInfo}>
          <Text style={styles.riderName}>{item.rider_name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#facc15" />
            <Text style={styles.ratingText}>{item.rider_rating || "N/A"}</Text>
          </View>
        </View>
      </View>

      {/* Original Offer */}
      <View style={styles.divider} />
      <Text style={styles.offerLabel}>Rider's Counter Offer:</Text>
      <Text style={styles.originalPrice}>
        ₦{item.counter_offer?.toLocaleString()}
      </Text>

      {/* Amount Adjuster */}
      <Text style={styles.counterLabel}>Your Counter Offer</Text>
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={handleDecrease}
          disabled={isSubmitting || counterAmount <= 0}
          style={[styles.controlBtn, styles.decreaseBtn]}
        >
          <Ionicons name="remove" size={24} color="white" />
          <Text style={styles.controlText}>₦100</Text>
        </TouchableOpacity>

        <Text style={styles.counterPrice}>
          ₦{counterAmount.toLocaleString()}
        </Text>

        <TouchableOpacity
          onPress={handleIncrease}
          disabled={isSubmitting}
          style={[styles.controlBtn, styles.increaseBtn]}
        >
          <Ionicons name="add" size={24} color="black" />
          <Text style={[styles.controlText, styles.increaseText]}>₦100</Text>
        </TouchableOpacity>
      </View>

      {/* Difference */}
      {difference !== 0 && (
        <Text
          style={[
            styles.differenceText,
            difference > 0 ? styles.higher : styles.lower,
          ]}
        >
          Difference: {difference > 0 ? "+" : ""}₦
          {Math.abs(difference).toLocaleString()}
        </Text>
      )}

      {/* Submit & Cancel */}
      <TouchableOpacity
        onPress={() => onAccept(item)}
        disabled={isSubmitting}
        style={[styles.acceptButton, { marginBottom: 10 }]}
      >
        <Ionicons name="checkmark-circle" size={20} color="white" />
        <Text style={styles.acceptButtonText}>Accept Counter Offer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSubmitCounter}
        disabled={isSubmitting || counterAmount <= 0}
        style={[
          styles.sendButton,
          (isSubmitting || counterAmount <= 0) && styles.disabledButton,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={styles.sendButtonText}>Submit New Counter Offer</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onClose}
        disabled={isSubmitting}
        style={styles.dismissButton}
      >
        <Text style={styles.dismissButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  updateCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  riderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  riderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  riderName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    color: "#facc15",
    fontSize: 16,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 16,
  },
  offerLabel: {
    color: "#888",
    fontSize: 14,
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#facc15",
    marginBottom: 16,
  },
  counterLabel: {
    color: "white",
    fontSize: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginHorizontal: 8,
  },
  decreaseBtn: {
    backgroundColor: "#f44336",
  },
  increaseBtn: {
    backgroundColor: "#facc15",
  },
  controlText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 14,
  },
  increaseText: {
    color: "black",
  },
  counterPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#facc15",
    marginHorizontal: 16,
    minWidth: 120,
    textAlign: "center",
  },
  differenceText: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
    fontWeight: "600",
  },
  higher: {
    color: "#4CAF50",
  },
  lower: {
    color: "#f44336",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#facc15",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  sendButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  dismissButton: {
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  dismissButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CounterOfferItem;



