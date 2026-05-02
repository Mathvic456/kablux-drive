import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SocketContext } from "../../context/WebSocketProvider";

const StatusBadge = ({ onToggleOnline, status }) => {
  const { isConnected, currentLocation, locationPermission } = useContext(SocketContext);
  const [isLoading, setIsLoading] = useState(false);
  const [badgeHeight, setBadgeHeight] = useState(56);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggleOnline();
    } catch (error) {
      console.error("Failed to toggle online status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // State 1: No location permission yet
  if (locationPermission !== 'granted') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Go Online</Text>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.permissionContainer}>
          <Ionicons name="location-outline" size={24} color="#FFC107" />
          <Text style={styles.permissionText}>
            Location permission required to go online
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.permissionButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // State 2: Connecting state
  if (locationPermission === 'granted' && !isConnected && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Go Online</Text>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <Ionicons name="location-outline" size={20} color="#888" />
            <Text style={styles.switchLabel}>Tap to start receiving rides</Text>
          </View>

          <TouchableOpacity
            style={styles.offlineSwitch}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.offlineSwitchText}>Go Online</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // State 3: Loading/Connecting
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Go Online</Text>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <ActivityIndicator size="small" color="#FFC107" />
            <Text style={styles.switchLabel}>Connecting to server...</Text>
          </View>

          <View style={styles.disabledSwitch}>
            <Text style={styles.disabledSwitchText}>Connecting</Text>
          </View>
        </View>
      </View>
    );
  }
  // State 4: Connected and online
  if (isConnected && status) {
    return (
      <View style={styles.container}>  {/* just normal container, no absolute */}
        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <View style={styles.locationInfo}>
              <View style={[styles.statusDot, styles.onlineDot]} />
              <Text style={styles.onlineStatus}>Online & Receiving Rides</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.switchToggle}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <View style={styles.toggleTrack}>
              <View style={styles.toggleThumbOnline} />
            </View>
            <Text style={styles.toggleText}>Online</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: 10 }}>
          <Text style={styles.emptySubtext}>
            Your location is shared with riders while a trip is in progress, even when the app is running in the background. Going offline will stop location sharing.
          </Text>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",


  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoButton: {
    padding: 4,
  },
  // Permission Required State
  permissionContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  permissionText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 12,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  // Switch Container
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchInfo: {
    flex: 1,
    flexDirection: "row",
  },
  switchLabel: {
    color: "#888",
    fontSize: 14,
    marginLeft: 8,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  onlineDot: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  onlineStatus: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
  },
  locationText: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  // Offline Switch (Button Style)
  offlineSwitch: {
    backgroundColor: "#FFC107",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
  },
  offlineSwitchText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  // Disabled Switch (Loading State)
  disabledSwitch: {
    backgroundColor: "#666",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
    opacity: 0.7,
  },
  disabledSwitchText: {
    color: "#aaa",
    fontWeight: "600",
    fontSize: 14,
  },
  // Online Switch (Toggle Style)
  switchToggle: {
    alignItems: "center",
    minWidth: 80,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    backgroundColor: "#4CAF50",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 3,
    marginBottom: 4,
  },
  toggleThumbOnline: {
    width: 22,
    height: 22,
    backgroundColor: "white",
    borderRadius: 11,
  },
  toggleText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  emptySubtext: { color: "#999", fontSize: 12, marginTop: 5, textAlign: 'center' },

});

export default StatusBadge;