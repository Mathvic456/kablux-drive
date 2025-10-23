// components/TripCard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function TripCard({ 
  status = 'completed', 
  isReturn = false, 
  rating = 4, 
  date = 'Oct 25 - 14:30', 
  from = 'Abraham Adesanya Estate', 
  to = 'Sunview Estate Ajah Lagos' 
}) {
  
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#FFC107';
      case 'cancelled':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#FFC107';
    }
  };

  const renderStars = () => {
    if (status === 'cancelled') {
      return (
        <Text style={styles.cancelledText}>Cancelled</Text>
      );
    }

    return (
      <View style={styles.stars}>
        {[...Array(5)].map((_, i) => (
          <FontAwesome 
            key={i} 
            name="star" 
            size={14} 
            color={i < rating ? "#FFC107" : "#666"} 
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={[styles.statusTag, { borderColor: getStatusColor(), backgroundColor: 'rgba(255, 193, 7, 0.2)' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {status}
          </Text>
        </View>
        {isReturn && status !== 'cancelled' && (
          <View style={styles.returnRow}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.returnText}>Return</Text>
          </View>
        )}
      </View>

      {/* Trip Info with Icons */}
      <View style={styles.routeContainer}>
        {/* Pickup Location */}
        <View style={styles.locationRow}>
          <View style={styles.locationIconContainer}>
            <FontAwesome name="location-arrow" size={16} color="white" />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationAddress}>{from}</Text>
          </View>
        </View>

        {/* Connector Line */}
        <View style={styles.verticalConnector}>
          <View style={styles.connectorDot} />
          <View style={styles.connectorLine} />
          <View style={styles.connectorDot} />
        </View>

        {/* Dropoff Location */}
        <View style={styles.locationRow}>
          <View style={styles.locationIconContainer}>
            <MaterialIcons name="location-pin" size={16} color="white" />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationAddress}>{to}</Text>
          </View>
        </View>
      </View>

      {/* Footer with Date and Rating */}
      <View style={styles.footer}>
        <Text style={styles.date}>{date}</Text>
        {renderStars()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: 'capitalize',
  },
  returnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  returnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: '600',
  },
  routeContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  locationAddress: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  verticalConnector: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
    marginBottom: 8,
  },
  connectorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFC107',
  },
  connectorLine: {
    width: 2,
    height: 16,
    backgroundColor: '#FFC107',
    marginVertical: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  date: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "500",
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  cancelledText: {
    color: '#F44336',
    fontSize: 13,
    fontWeight: '600',
  },
});