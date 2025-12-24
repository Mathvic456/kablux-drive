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
import AsyncStorage from "@react-native-async-storage/async-storage";
import DebugStateModal from "../components/DebugStateModal";
import CentralModal from "../components/CentralModal";

// Components
import DonutChart from "../components/DonutChart";
import UpgradeNotificationCard from "../components/UpgradeNotificationCard";
import TierOverlay from "../components/TierOverlay";
import RideOfferCard from "../components/RideOfferCard";
import CounterOfferItem from "../components/CounterOfferItem";
import HomeHeader from "../components/HomeHeader";
import StatusBadge from "../components/StatusBadge";
import ActiveRideSection from "../components/ActiveRideSection";

// Context & Services
import { useProfile } from "../../services/profile.service";
import { useDriverKycStatus } from "../../services/checkKyc.service";
import { useStartRide, useFinishRide } from "../../services/rides.service";
import { useGetMyBalance } from "../../services/funding.service";
import { SocketContext } from "../../context/WebSocketProvider";
import { useDriverRide } from "../../context/DriverRideContext";
import { useArriveRide } from "../../services/rides.service";
import { api } from "../../services/api";

export default function Home() {
  const navigation = useNavigation();
  

  const [tierOverlayVisible, setTierOverlayVisible] = useState(false);
  const [rideModalVisible, setRideModalVisible] = useState(false);
  const [updatesModalVisible, setUpdatesModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', isError: false });
  const [rideCompletedModalVisible, setRideCompletedModalVisible] = useState(false);
const [completedRideInfo, setCompletedRideInfo] = useState(null);

  const [negotiationUpdates, setNegotiationUpdates] = useState({});
  const [acceptedRide, setAcceptedRide] = useState(null);
  const [acceptedModalVisible, setAcceptedModalVisible] = useState(false);
  const [rideCancelledModalVisible, setRideCancelledModalVisible] = useState(false);
const [cancelledRideInfo, setCancelledRideInfo] = useState(null);
  const [rideDetails, setRideDetails] = useState(null);
  const [loadingRideDetails, setLoadingRideDetails] = useState(false);
  const [debugModalVisible, setDebugModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
const [declinedOffer, setDeclinedOffer] = useState(null);



const {
  handleWsEvent,
  status,
  rideId,
  riderId,
  startRide,
  finishRide,
  arrive,
  reset,
  loadPersisted
} = useDriverRide();

  
  const {
    socket,
    currentLocation,
    isConnected,
    sessionExpired,
    clearSessionExpired,
    rideNotifications,
    setRideNotifications,
    clearNotification,
    clearAllNotifications,
    saveSentOffer,
    sentOffers,
    getSentOffer,
  } = useContext(SocketContext);

  const {
    data: profile,
    isPending: profileLoading,
    isError: profileError,
  } = useProfile();

  const { data: kycData, isLoading } = useDriverKycStatus();

  const startRideMutation = useStartRide();
  const finishRideMutation = useFinishRide();
  const arriveRideMutation = useArriveRide();

  // -- Helper: Fetch Ride Details --
const fetchRideDetails = async (id) => {
    if (!id) {
      console.warn("⚠️ fetchRideDetails: No ride ID provided");
      return null;
    }
    
    try {
      console.log(`🔍 Fetching ride details for ID: ${id}`);
      setLoadingRideDetails(true);
      
      const response = await api.get(`rides/${id}/details/`);
      
      console.log("✅ Ride details fetched successfully");
      console.log("📦 Response data:", JSON.stringify(response.data, null, 2));
      
      // Extract the nested data structure (handling both data.data and direct data)
      const rideData = response.data?.data || response.data;
      
      // Map the API response to match your Component structure
      const mappedDetails = {
        id: rideData.id,
        // Match JSON: keys are at the root, not inside 'ride_info'
        pickup_address: rideData.pickup_address || rideData.ride_info?.start_address || "Pickup Location",
        dropoff_address: rideData.dropoff_address || rideData.ride_info?.end_address || "Dropoff Location",
        // Match JSON: 'fare' is a string in the JSON
        fare: rideData.fare ? parseFloat(rideData.fare) : 0,
        // Match JSON: 'rider' object exists in JSON
        rider: rideData.rider || {}, 
        driver: rideData.driver || {},
        status: rideData.status,
        raw: rideData, 
      };
      
      console.log("🗺️ Mapped ride details:", mappedDetails);
      
      setRideDetails(mappedDetails);
      return mappedDetails;
      
    } catch (error) {
      console.error("❌ Fetch ride details error:", error);
      
      if (error.response?.status === 401) {
        setAlertData({ title: "Authentication Error", message: "Please log in again.", isError: true });
      } else if (error.response?.status === 404) {
        setAlertData({ title: "Error", message: "Ride not found.", isError: true });
      } else {
        const errorMessage = error.response?.data?.detail || 
                             error.response?.data?.message || 
                             "Failed to fetch ride details";
        setAlertData({ title: "Error", message: errorMessage, isError: true });
      }
      setAlertModalVisible(true);
      
      return null;
    } finally {
      setLoadingRideDetails(false);
    }
  };

  const handleForceSetState = async ({ status, rideId, riderId }) => {
  try {
    console.log("🔧 [DEBUG] Force setting state:", { status, rideId, riderId });
    
    // Directly update AsyncStorage
    const stateData = {
      status,
      rideId,
      riderId,
    };
    
    await AsyncStorage.setItem("driverRideState", JSON.stringify(stateData));
    
    // Force reload the persisted state in context
    await loadPersisted();
    
    setAlertData({ title: "Success", message: `State set to: ${status}`, isError: false });
    setAlertModalVisible(true);
  } catch (error) {
    console.error("❌ Error forcing state:", error);
    setAlertData({ title: "Error", message: "Failed to set state", isError: true });
    setAlertModalVisible(true);
  }
};


useEffect(() => {
  if (!isLoading && kycData?.kyc_status === "PENDING") {
    setUploadModalVisible(true);
  }
}, [isLoading, kycData]);


  
  useEffect(() => {
    if (!rideId) {
      console.log("⚠️ No rideId, clearing ride details");
      setRideDetails(null);
      return;
    }
    
    console.log("🔄 rideId changed, fetching details:", rideId);
    fetchRideDetails(rideId);
  }, [rideId]);

  useEffect(() => {
    if (status === "ride_created") {
      setAcceptedModalVisible(true);
    }
  }, [status]);
  useEffect(() => {
    if (!socket) return;

    const onMessage = (ev) => {
      try {
        const raw = typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data);
        const msg = JSON.parse(raw);

        console.log("📩 [DRIVER HOME] Incoming message:", msg);

        handleWsEvent(msg);

        // Handle negotiation updates
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

        if (msg.type === "notify" && msg.event === "ride_created") {
          console.log("✅ [DRIVER] Ride created event detected!");
          const rideInfo = msg.payload || { ride_request_id: msg.ride_request_id };
          setAcceptedRide(rideInfo);
          setAcceptedModalVisible(true);
        }

      if (msg.type === "notify" && msg.data?.type === "DRIVER_OFFER_DECLINED") {
        console.log("❌ Driver offer declined:", msg.data);
        console.log(`🔑 Looking for ride_request_id: ${msg.data.ride_request_id}`);
        
        const rideId = msg.data.ride_request_id;
        const savedOffer = getSentOffer(rideId);
        
        if (savedOffer) {
          console.log(`✅ Found saved offer, showing modal`);
          setDeclinedOffer({
            ...savedOffer,
            riderName: msg.data.name,
            message: msg.data.message,
          });
          setDeclineModalVisible(true);
        } else {
          console.warn("⚠️ No saved offer found for declined ride:", rideId);
        }
      }
          if (msg.event === "ride_cancelled" && msg.payload) {
      console.log("❌ Ride cancelled:", msg.payload);
      
      const { ride_id, reason, timestamp } = msg.payload;
      
      // Only show modal if this is the current active ride
      if (ride_id === rideId) {
        setCancelledRideInfo({
          reason: reason || "No reason provided",
          timestamp: timestamp,
        });
        setRideCancelledModalVisible(true);
      }
    }
      } catch (err) {
        console.error("❌ [DRIVER HOME] Failed to parse message:", err);
      }
    };

    socket.addEventListener?.("message", onMessage);
    return () => {
      socket.removeEventListener?.("message", onMessage);
    };
  }, [socket, handleWsEvent]);

  // -- Handlers --

  const handleOpenDrawer = () => {
    navigation.getParent()?.getParent("DrawerNavigator")?.openDrawer();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (rideId) {
      await fetchRideDetails(rideId);
    }
    setRefreshing(false);
  };

  const handleSessionExpiredOk = () => {
    clearSessionExpired();
  };

  const handleAccept = async (offer) => {
    try {
      const rideRequestId = offer?.ride_request_view_id ?? offer?.ride_request_id ?? null;

      if (!rideRequestId) {
        alert("Could not find ride ID");
        return;
      }
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("WebSocket not connected");
        return;
      }
      
      console.log("Accepting ride:", rideRequestId);
      
      const data = {
        type: "accept_ride",
        data: {
          ride_request_view_id: rideRequestId,
        },
      };

      socket.send(JSON.stringify(data));

      clearNotification(offer.ride_request_id);
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
    console.log(`🚨🚨🚨 handleCounter CALLED! 🚨🚨🚨`);
    console.log(`🎯 About to save offer with ride_request_id: ${offer.ride_request_id}`);
    console.log(`📦 Full offer object:`, JSON.stringify(offer, null, 2));
    
    saveSentOffer(offer.ride_request_id, offer);
    
    setRideModalVisible(false);

    navigation.navigate("OrderScreen", {
      item: offer,
      onCounterSubmitted: () => removeRideNotification(offer.ride_request_id),
    });
  };

  const handleDecline = (offer) => {
    clearNotification(offer.ride_request_id);
    if (offer.ride_request_view_id) {
      clearNegotiationUpdate(offer.ride_request_view_id);
    }
  };

const handleStartRide = async () => {
  if (!rideId || typeof rideId !== "string") {
    setAlertData({ title: "Error", message: "No valid ride ID found", isError: true });
    setAlertModalVisible(true);
    return;
  }



  try {
    console.log("🚗 Starting ride flow for:", rideId);

    await startRideMutation.mutateAsync(rideId);

    // 🔥 IMMEDIATELY update local + persisted state
    startRide();

    console.log("✅ Ride started locally (no WS wait)");
  } catch (error) {
    console.error("❌ Error in handleStartRide:", error);
  }
};

  const handleCancelledRideOk = async () => {
  try {
    console.log("🔄 Resetting state after ride cancellation");

    reset();
    
    // Clear local state
    setRideDetails(null);
    setCancelledRideInfo(null);
    setRideCancelledModalVisible(false);
    
    console.log("✅ State reset to not_busy");
  } catch (error) {
    console.error("❌ Error resetting state:", error);
  }
};


const handleArrived = async () => {
  if (!rideId || typeof rideId !== "string") {
    setAlertData({ title: "Error", message: "No valid ride ID found", isError: true });
    setAlertModalVisible(true);
    return;
  }

  try {
    console.log("📍 Marking driver as arrived for:", rideId);

    await arriveRideMutation.mutateAsync(rideId);

    // LOCAL state update only AFTER API success
    arrive();

    console.log("✅ Arrival flow completed");
  } catch (error) {
    console.error("❌ Error in handleArrived:", error);
  }
};

const removeRideNotification = (id) => {
  setRideNotifications(prev =>
    prev.filter(item =>
      item.ride_request_view_id !== id && item.ride_request_id !== id
    )
  );
};

{/*This is for ride updates */}
const handleCounterSubmit = (ride_request_view_id) => {
  console.log("🗑️ Clearing negotiation update:", ride_request_view_id);
  

  setNegotiationUpdates((prev) => {
    const updated = { ...prev };
    delete updated[ride_request_view_id];
    return updated;
  });
  
  const remainingUpdates = Object.keys(negotiationUpdates).length - 1;
  if (remainingUpdates === 0) {
    setUpdatesModalVisible(false);
  }
};


const handleFinishRide = async () => {
  if (!rideId || typeof rideId !== 'string') {
    setAlertData({ title: "Error", message: "No valid ride ID found", isError: true });
    setAlertModalVisible(true);
    return;
  }

  try {
    console.log("🏁 Finishing ride:", rideId);
    await finishRideMutation.mutateAsync(rideId);
    finishRide();

    // Save ride details before clearing
    setCompletedRideInfo(rideDetails);
    setRideCompletedModalVisible(true);

    console.log("✅ Ride finish completed successfully");

  } catch (error) {
    console.error("❌ Error in handleFinishRide:", error);
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

  // -- Render Loading/Error --

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#facc15" />
        <Text style={styles.loadingText}>Loading profile...</Text>
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

  // -- Render Main --

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

          <TouchableOpacity 
  style={styles.debugResetButton} 
  onPress={() => setDebugModalVisible(true)}
>
  <Ionicons name="settings" size={18} color="white" />
  <Text style={styles.debugResetButtonText}>Debug State</Text>
</TouchableOpacity>

          <StatusBadge />

          {/* Active Ride Section - Pure Component */}
        <ActiveRideSection
          status={status}
          rideId={rideId}
          riderId={riderId}
          rideDetails={rideDetails}
          onArrived={handleArrived}
          onStartRide={handleStartRide}
          onFinishRide={handleFinishRide}
          isArriving={arriveRideMutation.isPending}
          isStarting={startRideMutation.isPending}
          isFinishing={finishRideMutation.isPending}
          isLoadingDetails={loadingRideDetails}
        />


          <View style={styles.chartContainer}>
            <DonutChart />
          </View>

          <UpgradeNotificationCard />

          {/* Ride Orders Section - Only show when not busy */}
       {status === 'not_busy' && (
  <>
    {/* 1. If KYC is Pending: Show CTA to upload documents */}
    {kycData?.kyc_status === "PENDING" ? (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ride Orders Restricted</Text>
          <Ionicons name="lock-closed-outline" size={20} color="#facc15" />
        </View>
        <Text style={[styles.emptySubtext, { marginBottom: 15, textAlign: 'left' }]}>
          Complete KYC to receive ride orders and start earning.
        </Text>
        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: "#facc15" }]}
          onPress={() => navigation.navigate("DocumentUploads")}
        >
          <Text style={styles.viewButtonText}>Complete KYC</Text>
        </TouchableOpacity>
      </View>
    ) : (

      <>
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
      </>
    )}
  </>
)}
          {/* Ride Updates Section */}
          {negotiationArray.length > 0 && status === 'not_busy' && (
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

      <DebugStateModal
  visible={debugModalVisible}
  onClose={() => setDebugModalVisible(false)}
  onSetState={handleForceSetState}
    />

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
                navigation.navigate("DocumentUploads");
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
              keyExtractor={(item) => item.ride_request_id}
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
      onCounterSubmit={handleCounterSubmit}
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
              {acceptedRide?.ride_request_id
                ? `Ride ID: ${acceptedRide.ride_request_id.slice(0, 16)}... has been accepted. Head to the pickup location!`
                : "Your ride has been accepted successfully."}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setAcceptedModalVisible(false);
                setAcceptedRide(null);
              }}
            >
              <Text style={styles.primaryButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Driver Offer Declined Modal */}
<Modal
  animationType="fade"
  transparent={true}
  visible={declineModalVisible}
  onRequestClose={() => setDeclineModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.alertBox}>
      <Ionicons name="close-circle" size={60} color="#f44336" />
      <Text style={styles.alertTitle}>Offer Declined</Text>
      <Text style={styles.alertMessage}>
        {declinedOffer?.riderName || "Rider"} has declined your offer.
        {"\n"}Would you like to make another offer?
      </Text>
      
      <TouchableOpacity
        style={[styles.primaryButton, { marginBottom: 10 }]}
        onPress={() => {
          setDeclineModalVisible(false);
          if (declinedOffer) {
            navigation.navigate("OrderScreen", {
              item: declinedOffer,
              isRetry: true, // Flag to show it's a retry
            });
          }
        }}
      >
        <Text style={styles.primaryButtonText}>Make Another Offer</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          setDeclineModalVisible(false);
          setDeclinedOffer(null);
        }}
      >
        <Text style={styles.secondaryButtonText}>Ignore</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Ride Cancelled Modal */}
<Modal
  animationType="fade"
  transparent={true}
  visible={rideCancelledModalVisible}
  onRequestClose={handleCancelledRideOk}
>
  <View style={styles.modalOverlay}>
    <View style={styles.alertBox}>
      <Ionicons name="alert-circle" size={60} color="#ff9800" />
      <Text style={styles.alertTitle}>Ride Cancelled</Text>
      <Text style={styles.alertMessage}>
        {cancelledRideInfo?.reason
          ? `Reason: ${cancelledRideInfo.reason}`
          : "The ride has been cancelled."}
        {"\n\n"}You're now available for new ride requests.
      </Text>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleCancelledRideOk}
      >
        <Text style={styles.primaryButtonText}>Got it</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Ride Completed Modal */}
<Modal
  animationType="fade"
  transparent={true}
  visible={rideCompletedModalVisible}
  onRequestClose={() => {
    setRideCompletedModalVisible(false);
    setRideDetails(null);
    setCompletedRideInfo(null);
    setRideNotifications([]);
  }}
>
  <View style={styles.modalOverlay}>
    <View style={styles.alertBox}>
      <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
      <Text style={styles.alertTitle}>Ride Completed! 🎉</Text>
      
      {completedRideInfo && (
        <View style={{ width: '100%', marginVertical: 20 }}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passenger:</Text>
            <Text style={styles.detailValue}>{completedRideInfo.rider?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fare:</Text>
            <Text style={[styles.detailValue, { color: '#4CAF50', fontWeight: 'bold' }]}>
              {new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN',
                minimumFractionDigits: 0,
              }).format(completedRideInfo.fare || 0)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={[styles.detailValue, { flex: 1 }]} numberOfLines={2}>
              {completedRideInfo.pickup_address || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To:</Text>
            <Text style={[styles.detailValue, { flex: 1 }]} numberOfLines={2}>
              {completedRideInfo.dropoff_address || 'N/A'}
            </Text>
          </View>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          setRideCompletedModalVisible(false);
          setRideDetails(null);
          setCompletedRideInfo(null);
          setRideNotifications([]);
        }}
      >
        <Text style={styles.primaryButtonText}>Done</Text>
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
  detailRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#333',
},
detailLabel: {
  color: '#999',
  fontSize: 14,
  marginRight: 10,
},
detailValue: {
  color: 'white',
  fontSize: 14,
},
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
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
  debugResetButton: {
    flexDirection: "row",
    backgroundColor: "#d32f2f",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  debugResetButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  walletButton: {
    backgroundColor: "#facc15",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  walletButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});