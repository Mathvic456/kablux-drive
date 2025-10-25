import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Button 
} from 'react-native';
import DonutChart from '../components/DonutChart';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from 'react';
import UpgradeNotificationCard from '../components/UpgradeNotificationCard';
import RideOrders from '../components/RideOrders';
import OrderCard from '../components/OrderCard';
import TierOverlay from '../components/TierOverlay';
import { useNavigation } from "@react-navigation/native";


export default function Home() {
  
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(false);
  const [tierOverlayVisible, setTierOverlayVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Left Section - Profile + Greeting */}
        <View style={styles.leftSection}>
          <Image
            source={require('../../assets/Profileimg.png')}
            style={styles.profileImage}
          />
          <Text style={styles.greeting}>Hello Victor</Text>
        </View>

        {/* Middle Section - Status Toggle */}
        <TouchableOpacity
          style={[styles.toggleContainer, isOnline && styles.toggleActive]}
          onPress={() => setIsOnline(!isOnline)}
        >
          <View
            style={[
              styles.toggleCircle,
              isOnline ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
            ]}
          >
            <Text style={styles.toggleText}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Section - Notification */}
        <TouchableOpacity style={styles.notificationContainer} onPress={() => navigation.openDrawer()}>
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

      {/* Tier Overlay Trigger Button */}
      <TouchableOpacity 
        style={styles.tierButton}
        onPress={() => setTierOverlayVisible(true)}
      >
        <Text style={styles.tierButtonText}>Show Tier Overlay</Text>
      </TouchableOpacity>

      {/* Tier Overlay */}
      <TierOverlay 
        visible={tierOverlayVisible} 
        onClose={() => setTierOverlayVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'black',
    paddingTop: 35,
    paddingBottom: 20,
    gap: 10,
  },
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '90%', 
    alignItems: 'center', 
    marginBottom: 20
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 10,
  },
  greeting: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  toggleContainer: {
    width: 100,
    height: 35,
    backgroundColor: "#1c1c1c",
    borderRadius: 20,
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  toggleActive: {
    backgroundColor: "#2d2d2d",
  },
  toggleCircle: {
    width: "50%",
    height: "100%",
    backgroundColor: "#333",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  notificationContainer: {
    position: "relative",
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
    fontWeight: "bold",
  },
  chartContainer: {
    marginTop: 20,
    justifyContent: 'center',
  },
  tierButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 10,
  },
  tierButtonText: {
    color: "#1C1C1E",
    fontSize: 16,
    fontWeight: "700",
  },
});