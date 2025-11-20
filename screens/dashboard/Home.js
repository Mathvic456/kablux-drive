import React, { useState, useContext, useEffect } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";


import DonutChart from "../components/DonutChart";
import UpgradeNotificationCard from "../components/UpgradeNotificationCard";
import TierOverlay from "../components/TierOverlay";
import RideOfferCard from "../components/RideOfferCard";
import CounterOfferItem from "../components/CounterOfferItem";
import HomeHeader from "../components/HomeHeader";
import StatusBadge from "../components/StatusBadge";

// Context & Services
import { useProfile } from "../../services/profile.service";
import { SocketContext } from "../../context/WebSocketProvider";

export default function Home() {
  const navigation = useNavigation();
  const [tierOverlayVisible, setTierOverlayVisible] = useState(false);
  const [rideModalVisible, setRideModalVisible] = useState(false);
  const [updatesModalVisible, setUpdatesModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [negotiationUpdates, setNegotiationUpdates] = useState({});
  const [acceptedRide, setAcceptedRide] = useState(null);
  const [acceptedModalVisible, setAcceptedModalVisible] = useState(false);

  const {
    socket,
    currentLocation,
    isConnected,
    sessionExpired,
    clearSessionExpired,
    rideNotifications,
    clearNotification,
    clearAllNotifications,
  } = useContext(SocketContext);

  const {
    data: profile,
    isPending: profileLoading,
    isError: profileError,
  } = useProfile();

  useEffect(() => {
    if (profile && !profile.is_verified) {
      setUploadModalVisible(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (ev) => {
      try {
        const raw =
          typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data);
        const msg = JSON.parse(raw);

        console.log("📩 [DRIVER HOME] Incoming message:", msg);

        if (msg.type === "negotiation_update" && msg.data) {
          const payload = msg.data;
          const viewId = payload.ride_request_view_id;

          setNegotiationUpdates((prev) => ({
            ...prev,
            [viewId]: {
              ride_request_view_id: viewId,
              counter_offer: Number(payload.counter_offer),
              action: payload.action,
              notification_type: payload.notification_type,
              rider_name: payload.rider_name || "Rider",
              rider_rating: payload.rider_rating || "N/A",
              timestamp: Date.now(),
              ride_request_id: payload.ride_request_id,
            },
          }));
        }

        const eventType = msg.type || msg.event;

        if (eventType === "accept_ride_success") {
          setAcceptedRide(msg.data || msg.ride_id);
          setAcceptedModalVisible(true);
        }
      } catch (err) {
        console.error("❌ [DRIVER HOME] Failed to parse message:", err);
      }
    };

    socket.addEventListener?.("message", onMessage);
    return () => {
      socket.removeEventListener?.("message", onMessage);
    };
  }, [socket]);

  const handleOpenDrawer = () => {
    // Try standard drawer methods
    navigation.getParent()?.getParent("DrawerNavigator")?.openDrawer();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSessionExpiredOk = () => {
    clearSessionExpired();
  };

  const handleAccept = async (offer) => {
    try {
      const rideId = offer?.ride_request_view_id ?? offer?.ride_id ?? null;

      if (!rideId) {
        alert("Could not find ride ID");
        return;
      }

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("WebSocket not connected");
        return;
      }

      const data = {
        type: "accept_ride",
        data: {
          ride_request_view_id: rideId,
        },
      };

      socket.send(JSON.stringify(data));

      clearNotification(offer.ride_id);
      if (offer.ride_request_view_id) {
        clearNegotiationUpdate(offer.ride_request_view_id);
      }

      setRideModalVisible(false);
    } catch (error) {
      console.error("❌ Error accepting offer:", error);
      alert("Failed to accept ride");
    }
  };

  const handleCounter = (offer) => {
    setRideModalVisible(false);
    navigation.navigate("OrderScreen", { item: offer, socket });
  };

  const handleDecline = (offer) => {
    clearNotification(offer.ride_id);
    if (offer.ride_request_view_id) {
      clearNegotiationUpdate(offer.ride_request_view_id);
    }
  };

  const clearNegotiationUpdate = (viewId) => {
    setNegotiationUpdates((prev) => {
      const updated = { ...prev };
      delete updated[viewId];
      return updated;
    });
  };

  const negotiationArray = Object.values(negotiationUpdates).sort(
    (a, b) => b.timestamp - a.timestamp,
  );

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (profileError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#facc15"
            colors={["#facc15"]}
          />
        }
      >
        <View style={styles.container}>
          <HomeHeader
            profile={profile}
            notificationCount={
              rideNotifications.length + negotiationArray.length
            }
            onMenuPress={handleOpenDrawer}
          />

          <StatusBadge
            isConnected={isConnected}
            currentLocation={currentLocation}
          />

          <View style={styles.chartContainer}>
            <DonutChart />
          </View>

          <UpgradeNotificationCard />

          {/* Ride Orders Section */}
          {rideNotifications.length > 0 ? (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Available Ride Orders ({rideNotifications.length})
                </Text>
                <TouchableOpacity onPress={clearAllNotifications}>
                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => setRideModalVisible(true)}
              >
                <Text style={styles.viewButtonText}>View Orders</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No ride orders available</Text>
              <Text style={styles.emptySubtext}>
                {isConnected ? "Waiting for new requests..." : "Connecting..."}
              </Text>
            </View>
          )}

          {/* Ride Updates Section */}
          {negotiationArray.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Ride Updates ({negotiationArray.length})
                </Text>
                <TouchableOpacity onPress={() => setNegotiationUpdates({})}>
                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: "#4CAF50" }]}
                onPress={() => setUpdatesModalVisible(true)}
              >
                <Text style={styles.viewButtonText}>View Updates</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Tier Overlay */}
      <TierOverlay
        visible={tierOverlayVisible}
        onClose={() => setTierOverlayVisible(false)}
      />

      {/* Session Expired Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sessionExpired}
        onRequestClose={handleSessionExpiredOk}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Ionicons name="time-outline" size={50} color="#facc15" />
            <Text style={styles.alertTitle}>Session Expired</Text>
            <Text style={styles.alertMessage}>
              Your session has expired. Please log in again.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSessionExpiredOk}
            >
              <Text style={styles.primaryButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload documents modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={uploadModalVisible}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Ionicons name="document-text-outline" size={50} color="#facc15" />
            <Text style={styles.alertTitle}>Not verified</Text>
            <Text style={styles.alertMessage}>
              Upload all documents for verification
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setUploadModalVisible(false);
                navigation.navigate("KycScreenOne");
              }}
            >
              <Text style={styles.primaryButtonText}>Upload Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 10 }]}
              onPress={() => setUploadModalVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ride Orders Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rideModalVisible}
        onRequestClose={() => setRideModalVisible(false)}
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.fullScreenContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Ride Orders</Text>
              <TouchableOpacity onPress={() => setRideModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={rideNotifications}
              keyExtractor={(item) => item.ride_request_view_id || item.ride_id}
              renderItem={({ item }) => (
                <RideOfferCard
                  item={item}
                  onAccept={handleAccept}
                  onCounter={handleCounter}
                  onDecline={handleDecline}
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
        </View>
      </Modal>

      {/* Ride Updates Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={updatesModalVisible}
        onRequestClose={() => setUpdatesModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.fullScreenModal}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.fullScreenContent, { paddingTop: 50 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setUpdatesModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Counter Offers</Text>
              <View style={{ width: 24 }} />
            </View>

            <FlatList
              data={negotiationArray}
              keyExtractor={(item) => item.ride_request_view_id}
              renderItem={({ item }) => (
                <CounterOfferItem
                  item={item}
                  onClose={() => setUpdatesModalVisible(false)}
                  socket={socket}
                  onAccept={handleAccept}
                />
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>
                    No counter offers available
                  </Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Accepted Ride Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={acceptedModalVisible}
        onRequestClose={() => setAcceptedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.alertTitle}>Ride Accepted!</Text>
            <Text style={styles.alertMessage}>
              {acceptedRide?.ride_id
                ? `Ride with ID: ${acceptedRide.ride_id.slice(0, 16)}... has been accepted.`
                : "Your ride has been accepted successfully."}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setAcceptedModalVisible(false);
                setAcceptedRide(null);
              }}
            >
              <Text style={styles.primaryButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#f44336",
    fontSize: 18,
  },
  chartContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  sectionContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  viewButton: {
    backgroundColor: "#facc15",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  viewButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 30,
    width: "80%",
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    marginTop: 10,
  },
  alertMessage: {
    color: "#ccc",
    textAlign: "center",
    marginBottom: 25,
  },
  primaryButton: {
    backgroundColor: "#facc15",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
  },
  primaryButtonText: {
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
  },
  secondaryButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "flex-end",
  },
  fullScreenContent: {
    backgroundColor: "#000",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyList: {
    padding: 20,
    alignItems: "center",
  },
  emptyListText: {
    color: "#999",
    fontSize: 16,
  },
});



