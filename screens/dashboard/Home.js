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
  Pressable
} from "react-native";
import DonutChart from "../components/DonutChart";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import UpgradeNotificationCard from "../components/UpgradeNotificationCard";
import RideOrders from "../components/RideOrders";
import TierOverlay from "../components/TierOverlay";
import { useNavigation } from "@react-navigation/native";
import { useProfile } from '../../services/profile.service';
import { SocketContext } from "../../context/WebSocketProvider";
import { useNotifications } from "../../services/notification.service";

export default function Home() {
  const navigation = useNavigation();
  const [tierOverlayVisible, setTierOverlayVisible] = useState(false);
  const [rideModalVisible, setRideModalVisible] = useState(false);
  
  const { rideOffers, currentLocation, isConnected } = useContext(SocketContext);
  const { data: profile, isPending: profileLoading, isError: profileError } = useProfile();  
  const { data: notifications, isPending: notificationsLoading } = useNotifications();

  const handleOpenDrawer = () => {
    navigation.getParent("DrawerNavigator").openDrawer();
  };
  useEffect(() => {
    console.log(notifications);
  }, [notifications])
  const unreadCount = notifications?.data?.filter(n => !n.is_read).length || 0;

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

          {/* Right Section - Menu with Notification Badge */}
          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={handleOpenDrawer}
          >
            <MaterialCommunityIcons name="menu" size={24} color="white" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
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

        {/* Notifications Section */}
        {notificationsLoading ? (
          <ActivityIndicator size="small" color="#facc15" style={styles.loader} />
        ) : notifications?.data && notifications.data.length > 0 ? (
          <View style={styles.notificationsSection}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            {notifications.data.slice(0, 3).map((notification) => (
              <View key={notification.id} style={styles.notificationCard}>
                <View style={styles.notificationHeader}>
                  <Ionicons 
                    name={notification.type === "RIDE_REQUESTED" ? "car" : "notifications"} 
                    size={20} 
                    color="#facc15" 
                  />
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {new Date(notification.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Ride Orders */}
        <RideOrders />

        {/* Active Ride Offers */}
        {rideOffers.length > 0 && (
          <View style={styles.rideOffersSection}>
            <Text style={styles.sectionTitle}>Active Ride Offers ({rideOffers.length})</Text>
            <TouchableOpacity 
              style={styles.viewOffersButton}
              onPress={() => setRideModalVisible(true)}
            >
              <Text style={styles.viewOffersButtonText}>View Offers</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tier Overlay */}
        <TierOverlay
          visible={tierOverlayVisible}
          onClose={() => setTierOverlayVisible(false)}
        />

        {/* Ride Offers Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={rideModalVisible}
          onRequestClose={() => setRideModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Available Ride Offers</Text>
                <TouchableOpacity onPress={() => setRideModalVisible(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={rideOffers}
                keyExtractor={(item) => item.ride_id}
                renderItem={({ item }) => (
                  <View style={styles.offerCard}>
                    <Text style={styles.offerLabel}>Ride ID:</Text>
                    <Text style={styles.offerValue}>{item.ride_id}</Text>
                    
                    <Text style={styles.offerLabel}>Pickup:</Text>
                    <Text style={styles.offerValue}>
                      {item.pickup.lat.toFixed(4)}, {item.pickup.long.toFixed(4)}
                    </Text>
                    
                    <Text style={styles.offerLabel}>Destination:</Text>
                    <Text style={styles.offerValue}>
                      {item.destination.lat.toFixed(4)}, {item.destination.long.toFixed(4)}
                    </Text>
                    
                    <View style={styles.fareContainer}>
                      <Text style={styles.fareLabel}>Fare:</Text>
                      <Text style={styles.fareValue}>₦{item.estimated_fare.toLocaleString()}</Text>
                    </View>

                    <View style={styles.offerActions}>
                      <TouchableOpacity style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.declineButton}>
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.offersList}
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
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { 
    color: "white", 
    fontSize: 10, 
    fontWeight: "bold" 
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
  loader: {
    marginVertical: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    width: "90%",
  },
  notificationsSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  notificationCard: {
    width: "90%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#facc15",
  },
  notificationMessage: {
    color: "#ccc",
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  notificationTime: {
    color: "#666",
    fontSize: 11,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#404040",
  },
  fareLabel: {
    color: "#999",
    fontSize: 14,
    marginRight: 8,
  },
  fareValue: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "bold",
  },
  offerActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  declineButton: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  declineButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});