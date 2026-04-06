import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RideOfferCard from "./RideOfferCard";
import { scaleFont, scaleSize } from "../../utils/scaling";

const { width, height } = Dimensions.get("window");

export default function RideOrdersModal({
  visible,
  onClose,
  rideNotifications,
  onAccept,
  onViewOffer,
  onDecline,
  hasSufficientBalance,
  balance,
  onAddFunds,
}) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.fullScreenModal}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
        <View style={styles.fullScreenContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Available Ride Orders</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={scaleSize(24)} color="white" />
            </TouchableOpacity>
          </View>

          {!hasSufficientBalance && (
            <View style={[styles.sectionContainer, styles.modalLowBalanceWarning]}>
              <View style={styles.modalWarningHeader}>
                <Ionicons name="eye-outline" size={scaleSize(18)} color="#ff9800" style={{ marginRight: 8 }} />
                <Text style={{ color: "#ff9800", fontWeight: "bold", fontSize: scaleFont(14) }}>View Only Mode</Text>
              </View>
              <Text style={{ color: "#ffcc80", fontSize: scaleFont(12), marginBottom: 8 }}>
                Balance: ₦{balance?.toLocaleString()}. Add ₦{1001 - (balance || 0)} to accept rides.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: "#ff9800", padding: scaleSize(8), borderRadius: 6, alignSelf: "flex-start" }}
                onPress={onAddFunds}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: scaleFont(12) }}>Add Funds</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={rideNotifications}
            keyExtractor={(item) => item.ride_request_id}
            renderItem={({ item }) => (
              <RideOfferCard
                item={item}
                onAccept={onAccept}
                onCounter={onViewOffer}
                onDecline={onDecline}
                disabled={!hasSufficientBalance}
                disabledMessage="Add funds to accept rides"
                showViewOnly={!hasSufficientBalance}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>No orders available</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenModal: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.9)", justifyContent: "flex-end", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  fullScreenContent: { backgroundColor: "#000", borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "90%", paddingHorizontal: Math.max(16, width * 0.04), paddingTop: Math.max(16, height * 0.02) },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Math.max(16, height * 0.02), paddingHorizontal: 5 },
  modalTitle: { fontSize: Math.max(18, width * 0.048), fontWeight: "bold", color: "white", textAlign: "center", flex: 1 },
  sectionContainer: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: Math.max(12, width * 0.04), marginBottom: Math.max(12, height * 0.015) },
  modalLowBalanceWarning: { backgroundColor: "#332211", margin: 15, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: "#ff9800", padding: Math.max(12, width * 0.04) },
  modalWarningHeader: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  listContent: { paddingBottom: Math.max(20, height * 0.025) },
  emptyList: { padding: Math.max(20, height * 0.025), alignItems: "center" },
  emptyListText: { color: "#999", fontSize: Math.max(14, width * 0.037) },
});
