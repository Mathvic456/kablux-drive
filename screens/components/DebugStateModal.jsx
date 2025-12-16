import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDriverRide } from "../../context/DriverRideContext";

export default function DebugStateModal({ visible, onClose, onSetState }) {
  const { rideId: currentRideId, riderId: currentRiderId } = useDriverRide();

  const [selectedState, setSelectedState] = useState("not_busy");
  const [manualRideId, setManualRideId] = useState("");
  const [manualRiderId, setManualRiderId] = useState("");

  const states = [
    { value: "not_busy", label: "Not Busy", icon: "car-outline", color: "#4CAF50" },
    { value: "ride_created", label: "Ride Created", icon: "add-circle-outline", color: "#2196F3" },
    { value: "arrived", label: "Arrived", icon: "location-outline", color: "#FF9800" },
    { value: "ride_started", label: "Ride Started", icon: "speedometer-outline", color: "#9C27B0" },
  ];

  useEffect(() => {
    if (visible && currentRideId) setManualRideId(currentRideId);
    if (visible && currentRiderId) setManualRiderId(currentRiderId);
  }, [visible, currentRideId, currentRiderId]);

  const handleApply = () => {
    onSetState({
      status: selectedState,
      rideId: manualRideId || null,
      riderId: manualRiderId || null,
    });
    onClose();
  };

  const handleQuickSet = (stateValue) => {
    setSelectedState(stateValue);

    if (stateValue !== "not_busy") {
      if (!manualRideId && currentRideId) {
        setManualRideId(currentRideId);
      }
      if (!manualRiderId && currentRiderId) {
        setManualRiderId(currentRiderId);
      }
    } else {
      setManualRideId("");
      setManualRiderId("");
    }
  };


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🔧 Debug State Control</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Select State:</Text>

          {states.map((state) => (
            <TouchableOpacity
              key={state.value}
              style={[
                styles.stateButton,
                selectedState === state.value && styles.stateButtonActive,
                { borderColor: state.color },
              ]}
              onPress={() => handleQuickSet(state.value)}
            >
              <Ionicons
                name={state.icon}
                size={24}
                color={selectedState === state.value ? state.color : "#666"}
              />
              <Text
                style={[
                  styles.stateButtonText,
                  selectedState === state.value && { color: state.color },
                ]}
              >
                {state.label}
              </Text>
              {selectedState === state.value && (
                <Ionicons name="checkmark-circle" size={20} color={state.color} />
              )}
            </TouchableOpacity>
          ))}

          {selectedState !== "not_busy" && (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Ride ID:</Text>
              <TextInput
                style={styles.input}
                value={manualRideId}
                onChangeText={setManualRideId}
                placeholder="Auto-generated or enter custom"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Rider ID:</Text>
              <TextInput
                style={styles.input}
                value={manualRiderId}
                onChangeText={setManualRiderId}
                placeholder="Auto-generated or enter custom"
                placeholderTextColor="#666"
              />
            </View>
          )}

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Ionicons name="checkmark" size={20} color="black" />
            <Text style={styles.applyButtonText}>Apply State</Text>
          </TouchableOpacity>

          <Text style={styles.warning}>
            ⚠️ This will forcefully override the current state
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginBottom: 12,
  },
  stateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  stateButtonActive: {
    backgroundColor: "#1a1a1a",
  },
  stateButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#999",
    fontWeight: "600",
  },
  inputSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "white",
    fontSize: 14,
  },
  applyButton: {
    flexDirection: "row",
    backgroundColor: "#facc15",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  applyButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  warning: {
    fontSize: 12,
    color: "#ff9800",
    textAlign: "center",
    marginTop: 12,
  },
});