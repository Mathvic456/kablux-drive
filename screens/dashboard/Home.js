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
  const [updatesModalVisible, setUpdatesModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [negotiationUpdates, setNegotiationUpdates] = useState({});
  const [busyMap, setBusyMap] = useState({});
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
    clearAllNotifications 
  } = useContext(SocketContext);
  
  const { data: profile, isPending: profileLoading, isError: profileError } = useProfile();

  useEffect(() => {
    setUploadModalVisible(true);
  }, [profileLoading]);

  // Listen for negotiation updates
  useEffect(() => {
    if (!socket) return;

    const onMessage = (ev) => {
      try {
        const raw = typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data);
        const msg = JSON.parse(raw);
        
        console.log("📩 [DRIVER HOME] Incoming message:", msg);

        if (msg.type === "negotiation_update" && msg.data) {
          const payload = msg.data;
          const viewId = payload.ride_request_view_id;
          
          console.log("🔄 [DRIVER] Received negotiation update:", payload);

          setNegotiationUpdates(prev => ({
            ...prev,
            [viewId]: {
              ride_request_view_id: viewId,
              counter_offer: Number(payload.counter_offer),
              action: payload.action,
              notification_type: payload.notification_type,
              rider_name: payload.rider_name || "Rider",
              timestamp: Date.now(),
            }
          }));
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

  useEffect(() => {
  if (!socket) return;

  const onMessage = (ev) => {
    try {
      const raw = typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data);
      const msg = JSON.parse(raw);

      console.log("📩 [DRIVER HOME] Incoming message:", msg);

      // Negotiation updates
      if (msg.type === "negotiation_update" && msg.data) {
        const payload = msg.data;
        const viewId = payload.ride_request_view_id;

        setNegotiationUpdates(prev => ({
          ...prev,
          [viewId]: {
            ride_request_view_id: viewId,
            counter_offer: Number(payload.counter_offer),
            action: payload.action,
            notification_type: payload.notification_type,
            rider_name: payload.rider_name || "Rider",
            timestamp: Date.now(),
          }
        }));
      }

      // Accept ride
      if (msg.type === "accept_ride" && msg.data) {
        setAcceptedRide(msg.data);
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
    navigation.getParent("DrawerNavigator").openDrawer();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSessionExpiredOk = () => {
    clearSessionExpired();
  };

const handleAccept = async (offer) => {
  try {
    // Note: setBusy is not defined in Home.js, but assuming its purpose
    // setBusy(true); 

    const rideId =
      offer?.ride_request_view_id ??
      offer?.ride_id ??
      null;

    if (!rideId) {
      console.log("No valid ride ID found in offer:", offer);
      return alert("Could not find ride ID");
    }

    const data = {
      type: "accept_ride",
      ride_request_view_id: rideId,
    };

    socket.send(JSON.stringify(data));

    alert("Your offer has been accepted!");
    
    // Clear the notification/update after accepting
    clearNotification(offer.ride_id); 
    clearNegotiationUpdate(offer.ride_request_view_id); 


  } catch (error) {
    console.log("Error accepting offer:", error);
  } finally {
    // setBusy(false);
  }
};



  const handleCounter = (offer) => {
    console.log("💰 Counter offer:", offer);
    setRideModalVisible(false);

    navigation.navigate('OrderScreen', { item: offer, socket });
  };

  const handleDecline = (offer) => {
    console.log("❌ Declined offer:", offer);
    clearNotification(offer.ride_id);
  };




  const clearNegotiationUpdate = (viewId) => {
    setNegotiationUpdates(prev => {
      const updated = { ...prev };
      delete updated[viewId];
      return updated;
    });
  };

  const negotiationArray = Object.values(negotiationUpdates).sort((a, b) => b.timestamp - a.timestamp);

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
          <View style={styles.leftSection}>
            <Image
              source={require("../../assets/Profileimg.png")}
              style={styles.profileImage}
            />
            <Text style={styles.greeting}>Hello {profile?.first_name}</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={handleOpenDrawer}
          >
            <MaterialCommunityIcons name="menu" size={24} color="white" />
            {(rideNotifications.length > 0 || negotiationArray.length > 0) && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {rideNotifications.length + negotiationArray.length}
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

        {/* Ride Updates Section (NEW) */}
        {negotiationArray.length > 0 && (
          <View style={styles.rideOffersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Ride Updates ({negotiationArray.length})
              </Text>
              <TouchableOpacity onPress={() => setNegotiationUpdates({})}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[styles.viewOffersButton, { backgroundColor: "#4CAF50" }]}
              onPress={() => setUpdatesModalVisible(true)}
            >
              <Text style={styles.viewOffersButtonText}>View Updates</Text>
            </TouchableOpacity>
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

        {/* Upload documents modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={uploadModalVisible}
          onRequestClose={() => setUploadModalVisible(false)}
        >
          <View style={styles.sessionModalOverlay}>
            <View style={styles.sessionModalContent}>
              <View style={styles.sessionIconContainer}>
                <Ionicons name="time-outline" size={60} color="#facc15" />
              </View>
              
              <Text style={styles.sessionModalTitle}>Not verified</Text>
              <Text style={styles.sessionModalMessage}>
                Upload all documents for verification
              </Text>

              <TouchableOpacity
                style={styles.sessionModalButton}
                onPress={() => navigation.navigate('KycScreenOne')}
              >
                <Text style={styles.sessionModalButtonText}>OK</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sessionModalButton, { backgroundColor: 'red', marginTop: 30}]}
                onPress={() => setUploadModalVisible(false)}
              >
                <Text style={styles.sessionModalButtonText}>Later</Text>
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
                keyExtractor={(item) => item.ride_request_view_id}
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

        {/* Ride Updates Modal*/}
       <Modal
  animationType="slide"
  transparent={true}
  visible={updatesModalVisible}
  onRequestClose={() => setUpdatesModalVisible(false)}
>
  <KeyboardAvoidingView
    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <TouchableOpacity onPress={() => setUpdatesModalVisible(false)} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Counter Offer</Text>
        <View style={{ width: 32 }} /> {/* placeholder */}
      </View>

      {negotiationArray.map((item) => {
        const [counterAmount, setCounterAmount] = useState(item.counter_offer);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const difference = counterAmount - item.counter_offer;

        const handleIncrease = () => setCounterAmount(prev => prev + 100);
        const handleDecrease = () => setCounterAmount(prev => Math.max(0, prev - 100));

        const handleSubmitCounter = async () => {
          if (counterAmount <= 0) return alert("Please enter a valid counter offer");
          if (!socket || socket.readyState !== WebSocket.OPEN) return alert("WebSocket not connected");

          setIsSubmitting(true);
          try {
            const message = {
              type: "create_driver_offer",
              data: { ride_request_id: item.ride_request_view_id, counter_offer: counterAmount },
            };
            socket.send(JSON.stringify(message));
            setTimeout(() => setUpdatesModalVisible(false), 300);
          } catch (err) {
            alert("Failed to submit counter offer");
            setIsSubmitting(false);
          }
        };

        return (
          <View key={item.ride_request_view_id} style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#4CAF50',
          }}>
            {/* Rider Info */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="person-circle" size={50} color="#facc15" />
              <View style={{ marginLeft: 16 }}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{item.rider_name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="star" size={16} color="#facc15" />
                  <Text style={{ color: '#facc15', fontSize: 16, marginLeft: 6 }}>{item.rider_rating}</Text>
                </View>
              </View>
            </View>

            {/* Amount Adjuster */}
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 8 }}>Your Counter Offer</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity onPress={handleDecrease} disabled={isSubmitting || counterAmount <= 0} style={{ marginHorizontal: 10, padding: 12, backgroundColor: '#f44336', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="remove" size={28} color="white" />
                <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 5 }}>₦100</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#facc15', marginHorizontal: 10 }}>₦{counterAmount.toLocaleString()}</Text>
              <TouchableOpacity onPress={handleIncrease} disabled={isSubmitting} style={{ marginHorizontal: 10, padding: 12, backgroundColor: '#facc15', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="add" size={28} color="black" />
                <Text style={{ color: 'black', fontWeight: 'bold', marginLeft: 5 }}>₦100</Text>
              </TouchableOpacity>
            </View>

            {/* Difference */}
            {difference !== 0 && (
              <Text style={{ color: difference > 0 ? '#4CAF50' : '#f44336', textAlign: 'center', marginBottom: 16 }}>
                Difference: {difference > 0 ? '+' : ''}₦{Math.abs(difference).toLocaleString()}
              </Text>
            )}

            {/* Submit & Cancel */}
            <TouchableOpacity onPress={handleSubmitCounter} disabled={isSubmitting || counterAmount <= 0} style={{ backgroundColor: '#facc15', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 }}>
              {isSubmitting ? <ActivityIndicator color="black" /> : <Text style={{ color: 'black', fontWeight: 'bold' }}>Submit Counter Offer</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setUpdatesModalVisible(false)} disabled={isSubmitting} style={{ backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  </KeyboardAvoidingView>
</Modal>

<Modal
  animationType="fade"
  transparent={true}
  visible={acceptedModalVisible}
  onRequestClose={() => setAcceptedModalVisible(false)}
>
  <View style={styles.sessionModalOverlay}>
    <View style={styles.sessionModalContent}>
      <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
      <Text style={styles.sessionModalTitle}>Ride Accepted!</Text>
      <Text style={styles.sessionModalMessage}>
        Ride with ID: {acceptedRide?.ride_id ?? "N/A"} has been accepted.
      </Text>
      <TouchableOpacity
        style={styles.sessionModalButton}
        onPress={() => setAcceptedModalVisible(false)}
      >
        <Text style={styles.sessionModalButtonText}>OK</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // General Styles
  scrollContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    fontSize: 18,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#facc15',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  notificationContainer: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#f44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Status
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 15,
    backgroundColor: '#333',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  onlineDot: {
    backgroundColor: '#4CAF50',
  },
  offlineDot: {
    backgroundColor: '#f44336',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
  },
  locationText: {
    color: '#aaa',
    fontSize: 12,
  },

  // Chart
  chartContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },

  // Ride Offers Section
  rideOffersSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  viewOffersButton: {
    backgroundColor: '#facc15',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  viewOffersButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noOrdersContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noOrdersText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  noOrdersSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },

  // Modals
  sessionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },
  sessionIconContainer: {
    marginBottom: 20,
  },
  sessionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  sessionModalMessage: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 25,
  },
  sessionModalButton: {
    backgroundColor: '#facc15',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
  },
  sessionModalButtonText: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },

  // Ride Offers Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  offersList: {
    paddingBottom: 20,
  },
  offerCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  riderInfoContainer: {
    marginBottom: 10,
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderDetails: {
    marginLeft: 10,
    flex: 1,
  },
  riderName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    color: '#facc15',
    fontSize: 14,
    marginLeft: 4,
  },
  rideTypeBadge: {
    backgroundColor: '#facc15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rideTypeText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 10,
  },
  offerLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  offerValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  fareLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fareValue: {
    color: '#facc15',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  estimatedFareContainer: {
    alignItems: 'flex-end',
  },
  estimatedLabel: {
    color: '#666',
    fontSize: 12,
  },
  estimatedValue: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  offerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  acceptButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  counterButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  counterButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  declineButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    color: '#999',
    fontSize: 16,
  },
  
  // Update Modal Styles (Negotiation)
  updateCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  updateSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 10,
  },
  center: {
    alignItems: 'center',
  },
  negotiatedLabel: {
    color: '#999',
    fontSize: 14,
  },
  negotiatedPrice: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#facc15',
    marginVertical: 5,
  },
  controls: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 15,
    justifyContent: 'center',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  controlText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  sendButton: {
    backgroundColor: '#facc15',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  sendButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  dismissButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  dismissButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});