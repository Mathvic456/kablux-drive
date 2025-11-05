import React, { useState, useEffect, useRef, useContext } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  FlatList,
  Pressable
} from "react-native";
import DonutChart from "../components/DonutChart";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import UpgradeNotificationCard from "../components/UpgradeNotificationCard";
import RideOrders from "../components/RideOrders";
import TierOverlay from "../components/TierOverlay";
import { useNavigation } from "@react-navigation/native";
import { useProfile } from '../../services/profile.service';
import { SocketContext } from "../../context/WebSocketProvider";


export default function Home() {
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(false);
  const [tierOverlayVisible, setTierOverlayVisible] = useState(false);
  const [onlineModalVisible, setOnlineModalVisible] = useState(false);
  const { data: profile, isPending, isError } = useProfile();  
  const [modalVisible, setModalVisible] = useState();
  const { rideOffers, currentLocation, isConnected } = useContext(SocketContext);
    

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;




  useEffect(() => {
    if (rideOffers.length === 1) setModalVisible(true);
    const randomDelay = Math.floor(Math.random() * 2000) + 3000;
    const timer = setTimeout(() => setTierOverlayVisible(true), randomDelay);
    return () => clearTimeout(timer);
  }, [rideOffers]);

   const openDrawer = () => {
    navigation.navigate("Drawer");
  };

  function handleOpenNavigator() {
    navigation.getParent("DrawerNavigator").openDrawer();
  }

      if (isPending) return <ActivityIndicator size="large" color="#facc15" />;
  
    if (isError) return <Text>Error loading profile</Text>;

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
            <Text style={styles.greeting}>Hello {profile.first_name}</Text>
          </View>

          {/* Middle Section - Status Toggle 
          <TouchableOpacity
            style={[styles.toggleContainer, isOnline && styles.toggleActive]}
            onPress={handleToggleOnline}
          >
            <View
              style={[
                styles.toggleCircle,
                isOnline
                  ? { alignSelf: "flex-end" }
                  : { alignSelf: "flex-start" },
              ]}
            >
              <Text style={styles.toggleText}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </TouchableOpacity>*/}

          {/* Right Section - Notification */}
          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={handleOpenNavigator}
          >
            <MaterialCommunityIcons name="menu" size={24} color="white" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Donut Chart Section */}
        <View style={styles.chartContainer}>
          <DonutChart />
        </View>

        {/* Upgrade Notification */}
        <UpgradeNotificationCard />

        {/* Ride Orders */}
        <RideOrders />

        {/* Tier Overlay */}
        <TierOverlay
          visible={tierOverlayVisible}
          onClose={() => setTierOverlayVisible(false)}
        />

        {/* Online Status Modal 
        <Modal
          transparent={true}
          visible={onlineModalVisible}
          animationType="none"
          onRequestClose={hideModal}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              </View>
              <Text style={styles.modalTitle}>You are online</Text>
              <Text style={styles.modalSubtitle}>Ready to accept rides</Text>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={hideModal}
              >
                <Text style={styles.modalCloseButtonText}>OK</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>*/}
      </View>
          <View style={styles.container}>
      <Text style={styles.header}>
        Driver Status: {isConnected ? "🟢 Online" : "🔴 Offline"}
      </Text>

      {currentLocation && (
        <Text>Current Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</Text>
      )}

      <Text style={styles.subHeader}>Ride Offers:</Text>
      {rideOffers.length === 0 ? (
        <Text>No offers yet</Text>
      ) : (
        <FlatList
          data={rideOffers}
          keyExtractor={(item) => item.ride_id}
          renderItem={({ item }) => (
            <View style={styles.offerCard}>
              <Text style={styles.offerText}>Ride ID: {item.ride_id}</Text>
              <Text style={styles.offerText}>Pickup: {item.pickup.lat}, {item.pickup.lng}</Text>
              <Text style={styles.offerText}>Destination: {item.destination.lat}, {item.destination.lng}</Text>
              <Text style={styles.offerText}>Fare: ₦{item.estimated_fare}</Text>
            </View>
          )}
        />
      )}
    </View>
    {rideOffers.length === 1 &&
      <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
          <View style={styles.offerCard}>
              <Text style={styles.offerText}>Ride ID: {rideOffers[0].ride_id}</Text>
              <Text style={styles.offerText}>Pickup: {rideOffers[0].pickup.lat}, {rideOffers[0].pickup.lng}</Text>
              <Text style={styles.offerText}>Destination: {rideOffers[0].destination.lat}, {rideOffers[0].destination.lng}</Text>
              <Text style={styles.offerText}>Fare: ₦{rideOffers[0].estimated_fare}</Text>
            </View>
            
              <Pressable
                style={[styles.button]}
                onPress={() => setModalVisible(!modalVisible)}>
                <Text style={styles.textStyle}>Hide Modal</Text>
              </Pressable>
            </View>
          </View>
        </Modal>}
    </ScrollView>

    



  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: "black" },
  scrollContentContainer: { flexGrow: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "black",
    paddingTop: 35,
    paddingBottom: 20,
    gap: 10,
    minHeight: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignItems: "center",
    marginBottom: 20,
  },
  leftSection: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 35, height: 35, borderRadius: 20, marginRight: 10 },
  greeting: { color: "white", fontSize: 16, fontWeight: "500" },
  toggleContainer: {
    width: 100,
    height: 35,
    backgroundColor: "#1c1c1c",
    borderRadius: 20,
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  toggleActive: { backgroundColor: "#2d2d2d" },
  toggleCircle: {
    width: "50%",
    height: "100%",
    backgroundColor: "#333",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: { color: "white", fontSize: 12, fontWeight: "500" },
  notificationContainer: { position: "relative" },
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
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  chartContainer: { marginTop: 20, justifyContent: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2d2d2d",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    width: "80%",
    maxWidth: 300,
    borderWidth: 1,
    borderColor: "#404040",
  },
   container: {flex: 1, padding: 16 },
  header: { color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  subHeader: { color: "white", fontSize: 16, fontWeight: "bold", marginTop: 16 },
  offerCard: { 
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#1a1a1a"
  },
  offerText: {
    color: "white",
    fontSize: 14,
    marginBottom: 4
  },
  modalIconContainer: { marginBottom: 15 },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
  },
  modalCloseButtonText: { color: "white", fontSize: 16, fontWeight: "600" },

   centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
});
