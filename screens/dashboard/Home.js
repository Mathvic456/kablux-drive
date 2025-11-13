import React, { useState, useContext, useEffect } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  RefreshControl,
} from "react-native";
import DonutChart from "../components/DonutChart";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import UpgradeNotificationCard from "../components/UpgradeNotificationCard";
import TierOverlay from "../components/TierOverlay";
import { useNavigation } from "@react-navigation/native";
import { useProfile } from '../../services/profile.service';
import { SocketContext } from "../../context/WebSocketProvider";

export default function Home() {
  const navigation = useNavigation();
  const [tierOverlayVisible, setTierOverlayVisible] = useState(false);
  const [rideModalVisible, setRideModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    currentLocation, 
    isConnected, 
    sessionExpired, 
    clearSessionExpired,
    rideNotifications,
    clearNotification,
    clearAllNotifications 
  } = useContext(SocketContext);
  
  const { data: profile, isPending: profileLoading, isError: profileError } = useProfile();

  const handleOpenDrawer = () => {
    navigation.getParent("DrawerNavigator").openDrawer();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app you might want to reconnect WS or fetch additional data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSessionExpiredOk = () => {
    clearSessionExpired();
  };

  const handleAccept = (offer: any) => {
    console.log("✅ Accepted offer:", offer);
    // TODO: Send acceptance to backend via WebSocket or API
    // ws.send(JSON.stringify({ type: "accept_ride", ride_id: offer.ride_id }));
    
    // Clear this notification after accepting
    clearNotification(offer.ride_id);
    setRideModalVisible(false);
  };

  const handleCounter = (offer: any) => {
    console.log("💰 Counter offer:", offer);
    // Close modal and navigate to order screen
    setRideModalVisible(false);
    navigation.navigate('OrderScreen', { item: offer });
  };

  const handleDecline = (offer: any) => {
    console.log("❌ Declined offer:", offer);
    // Just remove from the list
    clearNotification(offer.ride_id);
  };

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
        {/* Header Section */}
        <View style={styles.header}>
          {/* Left Section - Profile + Greeting */}
          <View style={styles.leftSection}>
            <Image
              source={require("../../assets/Profileimg.png")}
              style={styles.profileImage}
            />
            <Text style={styles.greeting}>Hello {profile?.first_name}</Text>
          </View>

          {/* Right Section - Menu */}
          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={handleOpenDrawer}
          >
            <MaterialCommunityIcons name="menu" size={24} color="white" />
            {rideNotifications.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {rideNotifications.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, isConnected ? styles.onlineDot : styles.offlineDot]} />
            <Text style={styles.statusText}>
              {isConnected ? "Online" : "Offline"}
            </Text>
          </View>
          {currentLocation && (
            <Text style={styles.locationText}>
              Location: {currentLocation.lat.toFixed(4)}, {currentLocation.long.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Donut Chart Section */}
        <View style={styles.chartContainer}>
          <DonutChart />
        </View>

        {/* Upgrade Notification */}
        <UpgradeNotificationCard />

        {/* Ride Orders Section */}
        {rideNotifications.length > 0 ? (
          <View style={styles.rideOffersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Available Ride Orders ({rideNotifications.length})
              </Text>
              <TouchableOpacity onPress={clearAllNotifications}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.viewOffersButton}
              onPress={() => setRideModalVisible(true)}
            >
              <Text style={styles.viewOffersButtonText}>View Orders</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noOrdersContainer}>
            <Ionicons name="car-outline" size={48} color="#666" />
            <Text style={styles.noOrdersText}>No ride orders available</Text>
            <Text style={styles.noOrdersSubtext}>
              {isConnected ? "Waiting for new requests..." : "Connecting..."}
            </Text>
          </View>
        )}

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
          <View style={styles.sessionModalOverlay}>
            <View style={styles.sessionModalContent}>
              <View style={styles.sessionIconContainer}>
                <Ionicons name="time-outline" size={60} color="#facc15" />
              </View>
              
              <Text style={styles.sessionModalTitle}>Session Expired</Text>
              <Text style={styles.sessionModalMessage}>
                Your session has expired. Please log in again to continue.
              </Text>

              <TouchableOpacity
                style={styles.sessionModalButton}
                onPress={handleSessionExpiredOk}
              >
                <Text style={styles.sessionModalButtonText}>OK</Text>
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Available Ride Orders</Text>
                <TouchableOpacity onPress={() => setRideModalVisible(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={rideNotifications}
                keyExtractor={(item) => item.ride_id}
                renderItem={({ item }) => (
                  <View style={styles.offerCard}>
                    <View style={styles.riderInfoContainer}>
                      <View style={styles.riderHeader}>
                        <Ionicons name="person-circle" size={40} color="#facc15" />
                        <View style={styles.riderDetails}>
                          <Text style={styles.riderName}>{item.rider_name}</Text>
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#facc15" />
                            <Text style={styles.ratingText}>{item.rider_rating}</Text>
                          </View>
                        </View>
                        <View style={styles.rideTypeBadge}>
                          <Text style={styles.rideTypeText}>{item.ride_type?.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.divider} />
                    
                    <Text style={styles.offerLabel}>Ride ID:</Text>
                    <Text style={styles.offerValue}>{item.ride_id.slice(0, 16)}...</Text>
                    
                    {item.distance_km && (
                      <>
                        <Text style={styles.offerLabel}>Distance to Pickup:</Text>
                        <Text style={styles.offerValue}>{item.distance_km.toFixed(2)} km away</Text>
                      </>
                    )}

                    {item.time_to_pickup && (
                      <>
                        <Text style={styles.offerLabel}>Time to Pickup:</Text>
                        <Text style={styles.offerValue}>
                          ~{Math.round(parseFloat(item.time_to_pickup) / 60)} minutes
                        </Text>
                      </>
                    )}

                    {item.address && (
                      <>
                        <Text style={styles.offerLabel}>Pickup Address:</Text>
                        <Text style={styles.offerValue}>{item.address}</Text>
                      </>
                    )}
                    
                    <View style={styles.fareContainer}>
                      <View>
                        <Text style={styles.fareLabel}>Rider Offer:</Text>
                        <Text style={styles.fareValue}>₦{item.offer_amount?.toLocaleString()}</Text>
                      </View>
                      {item.estimated_fare && (
                        <View style={styles.estimatedFareContainer}>
                          <Text style={styles.estimatedLabel}>Estimated:</Text>
                          <Text style={styles.estimatedValue}>₦{item.estimated_fare.toLocaleString()}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.offerActions}>
                      <TouchableOpacity 
                        style={styles.acceptButton} 
                        onPress={() => handleAccept(item)}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.counterButton} 
                        onPress={() => handleCounter(item)}
                      >
                        <Ionicons name="cash-outline" size={20} color="white" />
                        <Text style={styles.counterButtonText}>Counter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.declineButton} 
                        onPress={() => handleDecline(item)}
                      >
                        <Ionicons name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.offersList}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyListText}>No orders available</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    flex: 1, 
    backgroundColor: "black" 
  },
  scrollContentContainer: { 
    flexGrow: 1 
  },
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "black",
    paddingTop: 35,
    paddingBottom: 20,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignItems: "center",
    marginBottom: 10,
  },
  leftSection: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  profileImage: { 
    width: 35, 
    height: 35, 
    borderRadius: 20, 
    marginRight: 10 
  },
  greeting: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "500" 
  },
  notificationContainer: { 
    position: "relative" 
  },
  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#f44336",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  statusContainer: {
    width: "90%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
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
    fontSize: 14,
    fontWeight: "600",
  },
  locationText: {
    color: "#999",
    fontSize: 12,
  },
  chartContainer: { 
    marginTop: 10, 
    justifyContent: "center" 
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  rideOffersSection: {
    width: "90%",
    marginTop: 10,
  },
  viewOffersButton: {
    backgroundColor: "#facc15",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  viewOffersButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
  },
  noOrdersContainer: {
    width: "90%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginTop: 10,
  },
  noOrdersText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  noOrdersSubtext: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
  },
  sessionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  sessionModalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 30,
    width: "85%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  sessionIconContainer: {
    marginBottom: 20,
  },
  sessionModalTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  sessionModalMessage: {
    color: "#999",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  sessionModalButton: {
    backgroundColor: "#facc15",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 50,
    width: "100%",
    alignItems: "center",
  },
  sessionModalButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderColor: "#333",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  offersList: {
    padding: 20,
  },
  offerCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#404040",
  },
  riderInfoContainer: {
    marginBottom: 12,
  },
  riderHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  riderDetails: {
    marginLeft: 12,
    flex: 1,
  },
  riderName: {
    color: "white",
    fontSize: 16,
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
    fontWeight: "600",
  },
  rideTypeBadge: {
    backgroundColor: "#facc15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rideTypeText: {
    color: "black",
    fontSize: 11,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#404040",
    marginVertical: 12,
  },
  offerLabel: {
    color: "#999",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  offerValue: {
    color: "white",
    fontSize: 14,
    marginBottom: 4,
  },
  fareContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#404040",
  },
  fareLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 4,
  },
  fareValue: {
    color: "#facc15",
    fontSize: 20,
    fontWeight: "bold",
  },
  estimatedFareContainer: {
    alignItems: "flex-end",
  },
  estimatedLabel: {
    color: "#666",
    fontSize: 11,
    marginBottom: 2,
  },
  estimatedValue: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
  },
  offerActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  counterButton: {
    flex: 1,
    backgroundColor: "#facc15",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  counterButtonText: {
    color: "black",
    fontSize: 14,
    fontWeight: "600",
  },
  declineButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    width: 44,
  },
  emptyList: {
    padding: 40,
    alignItems: "center",
  },
  emptyListText: {
    color: "#666",
    fontSize: 14,
  },
});