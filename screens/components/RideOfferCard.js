import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RideOfferCard = ({ item, onAccept, onCounter, onDecline }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const isDecliningRef = useRef(false);

  const handleDecline = () => {
    if (isDecliningRef.current) return; // prevent double-tap during animation
    isDecliningRef.current = true;

    onDecline?.(item);

    Animated.timing(opacity, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.riderName} numberOfLines={1}>
          {item.rider_name}
        </Text>

        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#facc15" />
          <Text style={styles.ratingText}>{item.rider_rating}</Text>
        </View>
      </View>

      {/* Price */}
      <View style={styles.priceContainer}>
        <Text style={styles.fareValue}>
          NGN {item.offer_amount?.toLocaleString()}
        </Text>
      </View>

      {/* Details */}
      <View style={styles.detailsRow}>
        <Text style={styles.tinyDetail}>
          {item.distance_km ? `${item.distance_km.toFixed(1)}km` : "--"} •
          {item.time_to_pickup
            ? ` ~${Math.round(item.time_to_pickup / 60)}min`
            : "--"} •
          {item.address
            ? ` ${item.address.substring(0, 30)}...`
            : " Pickup"}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewOfferButton}
          onPress={() => onCounter(item)}
          activeOpacity={0.85}
        >
          <Text style={styles.viewOfferText}>View Offer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#181818",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.3)",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  riderName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "500",
    maxWidth: "70%",
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  ratingText: {
    color: "#ffffff",
    fontSize: 11,
    marginLeft: 3,
    fontWeight: "600",
  },

  priceContainer: {
    paddingVertical: 6,
  },

  fareValue: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  detailsRow: {
    marginBottom: 12,
  },

  tinyDetail: {
    color: "#666",
    fontSize: 11,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  viewOfferButton: {
    flex: 1,
    backgroundColor: "#facc15",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  viewOfferText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },

  declineButton: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
});


export default RideOfferCard;
