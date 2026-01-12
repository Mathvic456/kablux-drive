import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SocketContext } from "../../context/WebSocketProvider";

const StatusBadge = () => {
  const { isConnected, currentLocation, locationPermission, goOnline } = useContext(SocketContext);

  // State 1: No permission yet - show call-to-action button
 if (locationPermission !== 'granted') {
  return (
    <TouchableOpacity 
      style={styles.connectButton} 
      onPress={goOnline}
      activeOpacity={0.8}
    >
      <Text style={styles.connectText}>ENABLE LOCATION TRACKING</Text>
    </TouchableOpacity>
  );
}

  // State 2: Permission granted but not connected - show connecting state
if (locationPermission === 'granted' && !isConnected) {
  return (
    <View style={[styles.statusContainer, styles.centerContent]}>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Connecting...</Text>
      </View>
    </View>
  );
}

  // State 3: Connected - show status with location
return (
  <View style={styles.statusContainer}>
    <View style={styles.statusBadge}>
      <View
        style={[
          styles.statusDot,
          isConnected ? styles.onlineDot : styles.offlineDot,
        ]}
      />
      <Text style={styles.statusText}>Location Active</Text>
    </View>
    {currentLocation && (
      <Text style={styles.locationText}>
        {currentLocation.lat.toFixed(4)}, {currentLocation.long.toFixed(4)}
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
  centerContent: {
    justifyContent: 'center',
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
  connectButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  connectText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default StatusBadge;