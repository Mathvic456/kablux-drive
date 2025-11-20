import React from "react";
import { View, Text, StyleSheet } from "react-native";

const StatusBadge = ({ isConnected, currentLocation }) => {
  return (
    <View style={styles.statusContainer}>
      <View style={styles.statusBadge}>
        <View
          style={[
            styles.statusDot,
            isConnected ? styles.onlineDot : styles.offlineDot,
          ]}
        />
        <Text style={styles.statusText}>
          {isConnected ? "Online" : "Offline"}
        </Text>
      </View>
      {currentLocation && (
        <Text style={styles.locationText}>
          Location: {currentLocation.lat.toFixed(4)},{" "}
          {currentLocation.long.toFixed(4)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 15,
    backgroundColor: "#333",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  onlineDot: {
    backgroundColor: "#4CAF50",
  },
  offlineDot: {
    backgroundColor: "#f44336",
  },
  statusText: {
    color: "white",
    fontWeight: "600",
  },
  locationText: {
    color: "#aaa",
    fontSize: 12,
  },
});

export default StatusBadge;



