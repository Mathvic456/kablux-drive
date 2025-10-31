import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Animated
} from 'react-native';
import DonutChart from '../components/DonutChart';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from 'react';
import UpgradeNotificationCard from '../components/UpgradeNotificationCard';
import RideOrders from '../components/RideOrders';
import OrderCard from '../components/OrderCard';
import TierOverlay from '../components/TierOverlay';
import { useNavigation } from "@react-navigation/native";

export default function Home() {
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(false);
  const [tierOverlayVisible, setTierOverlayVisible] = useState(false);
  const [onlineModalVisible, setOnlineModalVisible] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const randomDelay = Math.floor(Math.random() * 2000) + 3000;
    
    const timer = setTimeout(() => {
      setTierOverlayVisible(true);
    }, randomDelay);

    return () => clearTimeout(timer);
  }, []);

  const handleToggleOnline = () => {
    const newOnlineStatus = !isOnline;
    setIsOnline(newOnlineStatus);
    
    if (newOnlineStatus) {
      // Show modal only when going online
      setOnlineModalVisible(true);
      
      // Animate the modal in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 2 seconds
      setTimeout(() => {
        hideModal();
      }, 2000);
    }
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOnlineModalVisible(false);
    });
  };

  const openDrawer = () => {
    navigation.navigate('Drawer');
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
              source={require('../../assets/Profileimg.png')}
              style={styles.profileImage}
            />
            <Text style={styles.greeting}>Hello Victor</Text>
          </View>

          {/* Middle Section - Status Toggle */}
          <TouchableOpacity
            style={[styles.toggleContainer, isOnline && styles.toggleActive]}
            onPress={handleToggleOnline}
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
          <TouchableOpacity style={styles.notificationContainer} onPress={() => {
            navigation.getParent("DrawerNavigator")?.openDrawer();
            console.log("opened")
          }}>
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

        {/* Ride Orders - This will now be scrollable within the main scroll view */}
        <RideOrders />

        {/* Tier Overlay */}
        <TierOverlay 
          visible={tierOverlayVisible} 
          onClose={() => setTierOverlayVisible(false)} 
        />

        {/* Online Status Modal */}
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
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
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
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'black',
    paddingTop: 35,
    paddingBottom: 20,
    gap: 10,
    minHeight: '100%',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#404040',
  },
  modalIconContainer: {
    marginBottom: 15,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});