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
      {/* Rider Header */}
      <View style={styles.header}>
        <View style={styles.riderInfo}>
          <Ionicons name="person-circle" size={44} color="#facc15" />
          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>{item.rider_name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#facc15" />
              <Text style={styles.ratingText}>{item.rider_rating}</Text>
            </View>
          </View>
        </View>
        {item.ride_type && (
          <View style={styles.rideTypeBadge}>
            <Text style={styles.rideTypeText}>
              {item.ride_type.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* Ride Details */}
      <View style={styles.detailsGrid}>
        <DetailItem
          label="Ride ID"
          value={item.ride_id?.slice(0, 16) + "..."}
        />
        {item.distance_km && (
          <DetailItem
            label="Distance"
            value={`${item.distance_km.toFixed(1)} km`}
          />
        )}
        {item.time_to_pickup && (
          <DetailItem
            label="Time"
            value={`~${Math.round(parseFloat(item.time_to_pickup) / 60)} min`}
          />
        )}
        {item.address && <DetailItem label="Pickup" value={item.address} />}
      </View>

      {/* Fare Section */}
      <View style={styles.fareSection}>
        <View style={styles.fareMain}>
          <Text style={styles.fareLabel}>Rider Offer</Text>
          <Text style={styles.fareValue}>
            ₦{item.offer_amount?.toLocaleString()}
          </Text>
        </View>
        {item.estimated_fare && (
          <View style={styles.fareSecondary}>
            <Text style={styles.estimatedLabel}>Estimated</Text>
            <Text style={styles.estimatedValue}>
              ₦{item.estimated_fare.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => onAccept(item)}
        >
          <Ionicons name="checkmark-circle" size={18} color="white" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.counterButton]}
          onPress={() => onCounter(item)}
        >
          <Ionicons name="cash-outline" size={18} color="white" />
          <Text style={styles.counterButtonText}>Counter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => onDecline(item)}
        >
          <Ionicons name="close-circle" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  riderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  riderDetails: {
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
  rideTypeBadge: {
    backgroundColor: "#facc15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rideTypeText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    minWidth: "40%",
  },
  detailLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  fareSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  fareMain: {
    flex: 1,
  },
  fareLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  fareValue: {
    color: "#facc15",
    fontSize: 24,
    fontWeight: "bold",
  },
  fareSecondary: {
    alignItems: "flex-end",
  },
  estimatedLabel: {
    color: "#666",
    fontSize: 12,
  },
  estimatedValue: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  counterButton: {
    backgroundColor: "#2196F3",
  },
  declineButton: {
    backgroundColor: "#333",
    flex: 0.3,
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 14,
  },
  counterButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 14,
  },
});

export default RideOfferCard;



