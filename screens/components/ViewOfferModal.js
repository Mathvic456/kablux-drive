import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scaleFont, scaleSize } from "../../utils/scaling";

const { width, height } = Dimensions.get("window");

export default function ViewOfferModal({
  visible,
  onClose,
  offer,
  onAccept,
  onCounter,
  hasSufficientBalance,
  balance,
  onAddFunds,
  onLowBalanceWarning,
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
        <View style={[styles.fullScreenContent, { paddingTop: Platform.OS === "ios" ? 0 : 20 }]}>
          <View style={styles.viewOfferHeader}>
            <TouchableOpacity onPress={onClose} style={{ padding: scaleSize(5) }}>
              <Ionicons name="chevron-down" size={scaleSize(28)} color="#666" />
            </TouchableOpacity>
            <Text style={styles.viewOfferTitle}>Ride Request</Text>
            <View style={{ width: scaleSize(38) }} />
          </View>

          {!hasSufficientBalance && (
            <View style={styles.viewOfferWarning}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Ionicons name="eye-outline" size={scaleSize(20)} color="#ff9800" style={{ marginRight: 10 }} />
                <Text style={{ color: "#ff9800", fontWeight: "bold", fontSize: scaleFont(16) }}>View Only</Text>
              </View>
              <Text style={{ color: "#ffcc80", fontSize: scaleFont(14), marginBottom: 10 }}>
                Your balance is ₦{balance?.toLocaleString()}. Add ₦{1001 - (balance || 0)} to accept or counter.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: "#ff9800", padding: scaleSize(12), borderRadius: 8, alignSelf: "flex-start" }}
                onPress={onAddFunds}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: scaleFont(14) }}>Add Funds Now</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.viewOfferContent}>
            {offer && (
              <>
                <View style={styles.riderProfileSection}>
                  <View style={[styles.riderAvatar, { width: scaleSize(80), height: scaleSize(80), borderRadius: scaleSize(40) }]}>
                    <Ionicons name="person" size={scaleSize(40)} color="#facc15" />
                  </View>
                  <Text style={[styles.riderName, { fontSize: scaleFont(24) }]}>{offer.rider_name}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={scaleSize(14)} color="#facc15" />
                    <Text style={styles.ratingText}>{offer.rider_rating} Rating</Text>
                  </View>
                </View>

                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>Offered Fare</Text>
                  <Text style={[styles.priceAmount, { fontSize: scaleFont(42) }]}>
                    ₦{offer.offer_amount?.toLocaleString()}
                  </Text>
                  <Text style={styles.priceEstimate}>Estimated: ₦{offer.estimated_fare?.toLocaleString()}</Text>
                </View>

                <View style={styles.routeDetails}>
                  <View style={styles.routePath}>
                    <View style={styles.routeIndicator}>
                      <View style={[styles.pickupDot, { width: scaleSize(12), height: scaleSize(12), borderRadius: scaleSize(6) }]} />
                      <View style={[styles.routeLine, { height: scaleSize(40) }]} />
                      <View style={[styles.dropoffDot, { width: scaleSize(12), height: scaleSize(12) }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ marginBottom: 20, flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
                        <View>
                          <Text style={styles.locationLabel}>PICKUP</Text>
                          <Text style={[styles.locationText, { fontSize: scaleFont(16), lineHeight: scaleFont(22) }]}>
                            {offer.pickup || "Pickup location"}
                          </Text>
                          <Text style={styles.timeToPickup}>
                            ~{offer.time_to_pickup ? Math.round(parseFloat(offer.time_to_pickup) / 60) : 0} mins away
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.locationLabel}>DROPOFF</Text>
                          <Text style={[styles.locationText, { fontSize: scaleFont(16), lineHeight: scaleFont(22) }]}>
                            {offer.dropoff || "Dropoff location"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.routeStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="navigate-outline" size={scaleSize(20)} color="#888" />
                      <Text style={styles.statValue}>{offer.distance_km} km</Text>
                      <Text style={styles.statLabel}>Total Dist</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="wallet-outline" size={scaleSize(20)} color="#888" />
                      <Text style={styles.statValue}>Cash</Text>
                      <Text style={styles.statLabel}>Payment</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="car-sport-outline" size={scaleSize(20)} color="#888" />
                      <Text style={styles.statValue}>{offer.ride_type}</Text>
                      <Text style={styles.statLabel}>Type</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.viewOfferFooter}>
            <TouchableOpacity
              style={[styles.acceptButton, !hasSufficientBalance && styles.disabledButton]}
              onPress={() => {
                if (!hasSufficientBalance) { onLowBalanceWarning(); return; }
                if (offer) onAccept(offer);
              }}
              disabled={!hasSufficientBalance}
            >
              <Text style={[styles.buttonText, !hasSufficientBalance && styles.disabledButtonText]}>
                {hasSufficientBalance ? "Accept Offer" : "Add Funds to Accept"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.counterButton, !hasSufficientBalance && styles.disabledCounterButton]}
              onPress={() => {
                if (!hasSufficientBalance) { onLowBalanceWarning(); return; }
                onCounter(offer);
              }}
              disabled={!hasSufficientBalance}
            >
              <Text style={[styles.counterButtonText, !hasSufficientBalance && styles.disabledCounterButtonText]}>
                {hasSufficientBalance ? "Counter Offer" : "Add Funds to Counter"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenModal: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.9)", justifyContent: "flex-end", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  fullScreenContent: { backgroundColor: "#000", borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "90%", paddingHorizontal: Math.max(16, width * 0.04), paddingTop: Math.max(16, height * 0.02) },
  viewOfferHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Math.max(16, height * 0.02) },
  viewOfferTitle: { color: "white", fontSize: Math.max(18, width * 0.048), fontWeight: "bold", textAlign: "center", flex: 1 },
  viewOfferWarning: { backgroundColor: "#332211", borderRadius: 10, padding: Math.max(12, width * 0.04), marginBottom: Math.max(16, height * 0.02), borderLeftWidth: 4, borderLeftColor: "#ff9800" },
  viewOfferContent: { paddingBottom: Math.max(20, height * 0.025) },
  riderProfileSection: { alignItems: "center", marginBottom: Math.max(20, height * 0.025) },
  riderAvatar: { backgroundColor: "#333", justifyContent: "center", alignItems: "center", marginBottom: 15, borderWidth: 2, borderColor: "#facc15" },
  riderName: { color: "white", fontWeight: "bold", textAlign: "center" },
  ratingContainer: { flexDirection: "row", alignItems: "center", marginTop: 5, backgroundColor: "#222", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ratingText: { color: "#ccc", marginLeft: 5, fontWeight: "600", fontSize: Math.max(12, width * 0.032) },
  priceSection: { backgroundColor: "#1a1a1a", borderRadius: 16, padding: Math.max(16, width * 0.06), marginBottom: Math.max(16, height * 0.02), alignItems: "center", borderWidth: 1, borderColor: "#333" },
  priceLabel: { color: "#888", fontSize: Math.max(12, width * 0.032), textTransform: "uppercase", letterSpacing: 1 },
  priceAmount: { color: "#facc15", fontWeight: "bold", marginVertical: 5 },
  priceEstimate: { color: "#666", fontSize: Math.max(10, width * 0.027) },
  routeDetails: { backgroundColor: "#1a1a1a", borderRadius: 16, padding: Math.max(16, width * 0.06), marginBottom: Math.max(16, height * 0.02) },
  routePath: { flexDirection: "row", marginBottom: 20 },
  routeIndicator: { alignItems: "center", marginRight: 15, paddingTop: 5 },
  pickupDot: { backgroundColor: "#facc15" },
  routeLine: { width: 2, backgroundColor: "#333", marginVertical: 5 },
  dropoffDot: { borderRadius: 0, backgroundColor: "#fff" },
  locationLabel: { color: "#888", fontSize: Math.max(10, width * 0.027), marginBottom: 4 },
  locationText: { color: "white", lineHeight: 22 },
  timeToPickup: { color: "#facc15", fontSize: Math.max(10, width * 0.027), marginTop: 4 },
  routeStats: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 15, justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { color: "white", fontWeight: "bold", marginTop: 5, fontSize: Math.max(12, width * 0.032) },
  statLabel: { color: "#666", fontSize: Math.max(9, width * 0.024) },
  viewOfferFooter: { paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 20 : 10 },
  acceptButton: { backgroundColor: "#facc15", borderRadius: 12, paddingVertical: Math.max(14, height * 0.017), alignItems: "center", marginBottom: 12 },
  disabledButton: { backgroundColor: "#666", opacity: 0.7 },
  counterButton: { backgroundColor: "transparent", borderRadius: 12, paddingVertical: Math.max(14, height * 0.017), alignItems: "center", borderWidth: 2, borderColor: "#facc15" },
  disabledCounterButton: { borderColor: "#666", opacity: 0.7 },
  buttonText: { color: "black", fontWeight: "bold", fontSize: Math.max(16, width * 0.042) },
  disabledButtonText: { color: "#ccc" },
  counterButtonText: { color: "#facc15", fontWeight: "bold", fontSize: Math.max(16, width * 0.042) },
  disabledCounterButtonText: { color: "#666" },
});
