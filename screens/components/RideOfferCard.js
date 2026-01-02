import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const RideOfferCard = ({ item, onAccept, onCounter, onDecline }) => {
  return (
    <View style={styles.container}>
      {/* Header: Name and Rating */}
      <View style={styles.header}>
        <Text style={styles.riderName} numberOfLines={1}>{item.rider_name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#facc15" />
          <Text style={styles.ratingText}>{item.rider_rating}</Text>
        </View>
      </View>

      {/* Center: Price */}
      <View style={styles.priceContainer}>
        <Text style={styles.fareValue}>
          NGN {(item.offer_amount)?.toLocaleString()}
        </Text>
      </View>

      {/* Footer: Tiny Details */}
      <View style={styles.detailsRow}>
        <Text style={styles.tinyDetail}>
           {item.distance_km ? `${item.distance_km.toFixed(1)}km` : '--'} • 
           {item.time_to_pickup ? ` ~${Math.round(parseFloat(item.time_to_pickup) / 60)}min` : '--'} • 
           {item.address ? ` ${item.address.substring(0, 30)}...` : 'Pickup'}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => onCounter(item)}
        >
          <Text style={styles.counterButtonText}>Counter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => onDecline(item)}
        >
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
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
    maxWidth: '70%',
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#181818',
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
    paddingVertical: 5,
  },
  fareValue: {
    color: "#ffffff",
    fontSize: 26, // Big and bold
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
    alignItems: 'center',
    gap: 10,
  },
  counterButton: {
    flex: 1,
    backgroundColor: "#1a1a1a", // Dark background
    borderWidth: 1,
    borderColor: "#facc15", // Yellow border
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  counterButtonText: {
    color: "#facc15", // Yellow text
    fontWeight: "600",
    fontSize: 13,
  },
  declineButton: {
    padding: 8,
    alignItems: "center",
    justifyContent: 'center',
  },
});

export default RideOfferCard;



