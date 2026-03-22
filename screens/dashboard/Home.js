import React, { useState, useContext, useEffect, useCallback } from "react";
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
  Switch,
  SafeAreaView,
  StatusBar,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Components
import DonutChart from "../components/DonutChart";
import UpgradeNotificationCard from "../components/UpgradeNotificationCard";
import TierOverlay from "../components/TierOverlay";
import RideOfferCard from "../components/RideOfferCard";
import CounterOfferItem from "../components/CounterOfferItem";
import HomeHeader from "../components/HomeHeader";
import StatusBadge from "../components/StatusBadge";
import ActiveRideSection from "../components/ActiveRideSection";
import CentralModal from "../components/CentralModal";

// Context & Services
import { useProfile } from "../../services/profile.service";
import { useDriverKycStatus } from "../../services/checkKyc.service";
import { useStartRide, useFinishRide } from "../../services/rides.service";
import { useGetMyBalance } from "../../services/funding.service";
import { SocketContext } from "../../context/WebSocketProvider";
import { useDriverRide } from "../../context/DriverRideContext";
import { useArriveRide } from "../../services/rides.service";
import { useActiveStatusEndPoint } from "../../services/auth.service";
import { api } from "../../services/api";
import { navigationRef } from '../context/NavigationContext';
import { DrawerActions } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get('window');

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
  const [onlineErrorModalVisible, setOnlineErrorModalVisible] = useState(false);
  const [onlineErrorMessage, setOnlineErrorMessage] = useState("");
  const [viewOfferModalVisible, setViewOfferModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [arrivalErrorModalVisible, setArrivalErrorModalVisible] = useState(false);
  const [arrivalErrorMessage, setArrivalErrorMessage] = useState("");
  const [acceptedRide, setAcceptedRide] = useState(null);
  const [acceptedModalVisible, setAcceptedModalVisible] = useState(false);
  const [rideCancelledModalVisible, setRideCancelledModalVisible] = useState(false);
  const [cancelledRideInfo, setCancelledRideInfo] = useState(null);
  const [rideDetails, setRideDetails] = useState(null);
  const [loadingRideDetails, setLoadingRideDetails] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declinedOffer, setDeclinedOffer] = useState(null);
  const [lowBalanceWarningVisible, setLowBalanceWarningVisible] = useState(false);
  const [showLowBalanceBanner, setShowLowBalanceBanner] = useState(true);

  // FIX: Single source of truth for the "is toggling" guard - prevents flicker
  const isTogglingOnlineRef = React.useRef(false);

  // console.log('selected', selectedOffer)

  const { token } = useAuth();

  const {
    handleWsEvent,
    status,
    rideId,
    riderId,
    startRide,
    finishRide,
    arrive,
    reset,
    loadPersisted,
    setNegotiationUpdates,
    negotiationUpdates
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
    toggleOnlineStatus,  // FIX: pulled from context
  } = useContext(SocketContext);

  const {
    data: profile,
    isPending: profileLoading,
    isError: profileError,
  } = useProfile(token);

  console.log('ride notessss===========', rideNotifications)

  const { data: kycData, isLoading } = useDriverKycStatus();
  const { data: balanceData, refetch: refetchBalance } = useGetMyBalance();

  const startRideMutation = useStartRide();
  const finishRideMutation = useFinishRide();
  const arriveRideMutation = useArriveRide();
  const activeStatusMutation = useActiveStatusEndPoint();

  // Responsive scaling
  const scaleFont = (size) => Math.round(size * Math.min(width / 375, 1.3));
  const scaleSize = (size) => Math.round(size * Math.min(width / 375, 1.2));

  // FIX: Guard against undefined balanceData - don't block offers while loading
  const hasSufficientBalance = () => {
    if (balanceData === undefined || balanceData === null) return true; // loading - don't block
    return (balanceData?.balance ?? 0) >= 1001;
  };

  const getBalanceWarningStatus = () => {
    if (balanceData === undefined || balanceData === null) return null; // still loading
    const balance = balanceData?.balance || 0;

    if (balance <= 1000) {
      return {
        type: 'critical',
        message: `Balance: ₦${balance.toLocaleString()}. You need ₦1,001+ to accept rides.`,
        buttonText: 'Add Funds Now',
        icon: 'alert-circle-outline',
        color: '#ff9800'
      };
    } else if (balance <= 2000) {
      return {
        type: 'warning',
        message: `Balance: ₦${balance.toLocaleString()}. Consider adding more funds soon.`,
        buttonText: 'Add Funds',
        icon: 'warning-outline',
        color: '#ffb74d'
      };
    }
    return null;
  };

  // --- MERGED TOGGLE HANDLER ---
  // FIX: This is the single function that handles BOTH the WebSocket toggle
  // AND the server-side status update. Previously these were split across two
  // functions (toggleOnlineStatus in context, handleToggleOnline in Home),
  // causing them to get out of sync. Now there is one call path.
  const handleToggleOnline = useCallback(async () => {
    if (isTogglingOnlineRef.current) {
      console.log("⚠️ [TOGGLE] Already toggling, ignoring");
      return;
    }
    isTogglingOnlineRef.current = true;

    const goingOnline = !isConnected;

    try {
      if (goingOnline) {
        // 1. Update server status FIRST so the server knows we're coming online
        try {
          await activeStatusMutation.mutateAsync({ is_online: true });
        } catch (error) {
          const message = error.response?.data?.message || "Unable to go online. Please try again.";
          setOnlineErrorMessage(message);
          setOnlineErrorModalVisible(true);
          // Server rejected going online - don't open the WebSocket
          return;
        }

        // 2. Open WebSocket (includes location permission check)
        await toggleOnlineStatus();
      } else {
        // 1. Close WebSocket first so we stop receiving rides immediately
        await toggleOnlineStatus();

        // 2. Then notify server (fire-and-forget, non-critical)
        activeStatusMutation.mutateAsync({ is_online: false }).catch((err) => {
          console.warn("⚠️ [TOGGLE] Server offline update failed (non-critical):", err);
        });
      }
    } finally {
      isTogglingOnlineRef.current = false;
    }
  }, [isConnected, toggleOnlineStatus, activeStatusMutation]);

  // --- Fetch Ride Details ---
  const fetchRideDetails = async (id) => {
    if (!id) return null;

    try {
      console.log(`🔍 Fetching ride details for: ${id}`);
      setLoadingRideDetails(true);

      const response = await api.get(`rides/${id}/details/`);
      const rideData = response.data?.data || response.data;
      console.log('ride data data', rideData)

      const mappedDetails = {
        id: rideData.id,
        pickup_address: rideData.pickup_address || rideData.ride_info?.start_address || "Pickup Location",
        dropoff_address: rideData.dropoff_address || rideData.ride_info?.end_address || "Dropoff Location",
        fare: rideData.fare ? parseFloat(rideData.fare) : 0,
        rider: rideData.rider || {},
        driver: rideData.driver || {},
        status: rideData.status,
        raw: rideData,
      };

      setRideDetails(mappedDetails);
      return mappedDetails;
    } catch (error) {
      console.error("❌ Fetch ride details error:", error);
      if (error.response?.status === 401) {
        setAlertData({ title: "Authentication Error", message: "Please log in again.", isError: true });
      } else if (error.response?.status === 404) {
        setAlertData({ title: "Error", message: "Ride not found.", isError: true });
      } else {
        setAlertData({
          title: "Error",
          message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch ride details",
          isError: true
        });
      }
      setAlertModalVisible(true);
      return null;
    } finally {
      setLoadingRideDetails(false);
    }
  };

  // const handleForceSetState = async ({ status, rideId, riderId }) => {
  //   try {
  //     const stateData = { status, rideId, riderId };
  //     await AsyncStorage.setItem("driverRideState", JSON.stringify(stateData));
  //     await loadPersisted();
  //     setAlertData({ title: "Success", message: `State set to: ${status}`, isError: false });
  //     setAlertModalVisible(true);
  //   } catch (error) {
  //     setAlertData({ title: "Error", message: "Failed to set state", isError: true });
  //     setAlertModalVisible(true);
  //   }
  // };

  // --- EFFECTS ---

  useEffect(() => {
    if (!isLoading && kycData?.kyc_status === "PENDING") {
      setUploadModalVisible(true);
    }
  }, [isLoading, kycData]);

  useEffect(() => {
    if (!rideId) {
      setRideDetails(null);
      return;
    }
    fetchRideDetails(rideId);
  }, [rideId]);

  useEffect(() => {
    console.log('current status', status)
    if (status === "ride_created") {
      setAcceptedModalVisible(true);
      setRideNotifications([]);
      setNegotiationUpdates({});
    }
  }, [status]);

  // FIX: REMOVED the second socket.addEventListener from Home entirely.
  //
  // Previously this added a second onmessage listener that duplicated what
  // WebSocketProvider already handled. Problems this caused:
  //   1. Double-firing handleWsEvent
  //   2. Binding to a stale socket reference after reconnects (the ref ws.current
  //      updates but the socket variable captured in context only updates on re-render,
  //      so addEventListener could be bound to a dead socket)
  //
  // All WebSocket message handling now lives exclusively in WebSocketProvider.
  // Home only reacts to state changes (rideNotifications, status, etc.) via context.
  //
  // The negotiation_update and other Home-specific events are handled below
  // by having WebSocketProvider forward ALL notify events via handleWsEvent,
  // and DriverRideContext/the context chain surfaces the results as state.
  //
  // If you need Home-specific handling of WS messages beyond what context
  // already provides, add it inside WebSocketProvider's onmessage handler
  // and expose the result as context state — never add a second listener here.

  // --- HANDLERS ---

  const handleOpenDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

  const onRefresh = async () => {
    setRefreshing(true);
    if (rideId) await fetchRideDetails(rideId);
    await refetchBalance();
    setRefreshing(false);
  };

  const handleSessionExpiredOk = () => clearSessionExpired();

  const handleViewOffer = (offer) => {
    setSelectedOffer(offer);
    setViewOfferModalVisible(true);
  };

  const removeRideNotification = (id) => {
    setRideNotifications(prev =>
      prev.filter(item =>
        item.ride_request_view_id !== id && item.ride_request_id !== id
      )
    );
  };

  const handleAcceptAsCounter = (offer) => {
    if (!hasSufficientBalance()) {
      setLowBalanceWarningVisible(true);
      return;
    }
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert("WebSocket not connected");
      return;
    }
    socket.send(JSON.stringify({
      type: "create_driver_offer",
      data: {
        ride_request_id: offer.ride_request_id,
        counter_offer: offer.offer_amount,
      },
    }));
    setViewOfferModalVisible(false);
    removeRideNotification(offer.ride_request_id);
  };

  const handleAccept = async (offer) => {
    if (!hasSufficientBalance()) {
      setLowBalanceWarningVisible(true);
      return;
    }
    const rideRequestId = offer?.ride_request_view_id ?? offer?.ride_request_id ?? null;
    if (!rideRequestId) { alert("Could not find ride ID"); return; }
    if (!socket || socket.readyState !== WebSocket.OPEN) { alert("WebSocket not connected"); return; }

    socket.send(JSON.stringify({
      type: "accept_ride",
      data: { ride_request_view_id: rideRequestId },
    }));

    clearNotification(offer.ride_request_id);
    if (offer.ride_request_view_id) clearNegotiationUpdate(offer.ride_request_view_id);
    setRideModalVisible(false);
  };

  const handleCounter = (offer) => {
    if (!hasSufficientBalance()) {
      setLowBalanceWarningVisible(true);
      return;
    }
    saveSentOffer(offer.ride_request_id, offer);
    setRideModalVisible(false);
    navigation.navigate("OrderScreen", {
      item: offer,
      onCounterSubmitted: () => removeRideNotification(offer.ride_request_id),
    });
  };

  const handleDecline = (offer) => {
    clearNotification(offer.ride_request_id);
    if (offer.ride_request_view_id) clearNegotiationUpdate(offer.ride_request_view_id);
  };

  const handleStartRide = async () => {
    if (!rideId || typeof rideId !== "string") {
      setAlertData({ title: "Error", message: "No valid ride ID found", isError: true });
      setAlertModalVisible(true);
      return;
    }
    try {
      await startRideMutation.mutateAsync(rideId);
      startRide();
    } catch (error) {
      console.error("❌ handleStartRide:", error);
    }
  };

  const handleCancelledRideOk = async () => {
    try {
      reset();
      setRideDetails(null);
      setCancelledRideInfo(null);
      setRideCancelledModalVisible(false);
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
      await arriveRideMutation.mutateAsync(rideId);
      arrive();
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.message) {
        const distanceMeters = error.response?.data?.distance_meters;
        setArrivalErrorMessage(
          distanceMeters
            ? `You are ${Math.round(distanceMeters)}m away from the pickup location. Please move closer to mark arrival.`
            : error.response.data.message
        );
        setArrivalErrorModalVisible(true);
      }
    }
  };

  const handleCounterSubmit = (ride_request_view_id) => {
    setNegotiationUpdates(prev => {
      const updated = { ...prev };
      delete updated[ride_request_view_id];
      return updated;
    });
    if (Object.keys(negotiationUpdates).length - 1 === 0) {
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
      await finishRideMutation.mutateAsync(rideId);
      finishRide();
      setCompletedRideInfo(rideDetails);
      setRideCompletedModalVisible(true);
    } catch (error) {
      console.error("❌ handleFinishRide:", error);
    }
  };

  const clearNegotiationUpdate = (viewId) => {
    setNegotiationUpdates(prev => {
      const updated = { ...prev };
      delete updated[viewId];
      return updated;
    });
  };

  const negotiationArray = Object.values(negotiationUpdates).sort(
    (a, b) => b.timestamp - a.timestamp
  );
  console.log('nego arrayy', negotiationArray)
  console.log('nego object', negotiationUpdates)

  // --- RENDER GUARDS ---
  if (profileLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color="#facc15" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (profileError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.errorText}>Error loading profile</Text>
      </SafeAreaView>
    );
  }

  const balanceWarning = getBalanceWarningStatus();

  // --- MAIN RENDER ---
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <HomeHeader
          profile={profile}
          notificationCount={rideNotifications.length + negotiationArray.length}
          onMenuPress={handleOpenDrawer}
          // FIX: Pass the merged toggle down so HomeHeader/StatusBadge
          // only ever calls ONE function to change online state
          onToggleOnline={handleToggleOnline}
          isConnected={isConnected}
        />

        <StatusBadge onToggleOnline={handleToggleOnline} />
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
          {/* Active Ride Section */}
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





          {/* Low Balance Banner */}
          {status === 'not_busy' && balanceWarning && showLowBalanceBanner && (
            <View style={[styles.sectionContainer, styles.lowBalanceWarning, { borderLeftColor: balanceWarning.color }]}>
              <View style={styles.balanceBannerHeader}>
                <View style={styles.balanceTitleRow}>
                  <Ionicons name={balanceWarning.icon} size={scaleSize(20)} color={balanceWarning.color} />
                  <Text style={[styles.balanceBannerTitle, { color: balanceWarning.color }]}>
                    {balanceWarning.type === 'critical' ? 'Low Balance' : 'Balance Warning'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowLowBalanceBanner(false)}>
                  <Ionicons name="close" size={scaleSize(18)} color="#666" />
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceWarningText}>{balanceWarning.message}</Text>
              <View style={styles.balanceBannerActions}>
                <TouchableOpacity
                  style={[styles.viewButton, { backgroundColor: balanceWarning.color }]}
                  onPress={() => navigation.navigate("Wallet")}
                >
                  <Text style={styles.viewButtonText}>{balanceWarning.buttonText}</Text>
                </TouchableOpacity>
                {balanceWarning.type === 'critical' && (
                  <TouchableOpacity style={styles.viewButtonOutline} onPress={() => navigation.navigate("Earnings")}>
                    <Text style={styles.viewButtonOutlineText}>View Earnings</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* KYC */}
          {kycData?.kyc_status !== "APPROVED" && kycData?.kyc_status !== "IN_REVIEW" && (
            <UpgradeNotificationCard status={kycData?.kyc_status} />
          )}

          {/* Ride Offers */}
          {status === 'not_busy' && (
            <>
              {rideNotifications.length > 0 ? (
                <View style={[styles.ordersContainer, { backgroundColor: 'transparent', padding: 0 }]}>
                  <View style={styles.ordersHeader}>
                    <View style={styles.ordersTitleRow}>
                      <Text style={styles.sectionTitle}>Available Orders</Text>
                      {!hasSufficientBalance() && (
                        <View style={styles.viewOnlyBadge}>
                          <Ionicons name="eye-outline" size={scaleSize(10)} color="#666" />
                          <Text style={styles.viewOnlyText}>View Only</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.ordersCount}>{rideNotifications.length} Active</Text>
                  </View>

                  {rideNotifications.map((item) => (
                    <RideOfferCard
                      key={item.ride_request_id}
                      item={item}
                      onAccept={handleAccept}
                      onCounter={handleViewOffer}
                      onDecline={handleDecline}
                      disabled={!hasSufficientBalance()}
                      disabledMessage="Add funds to accept rides"
                      showViewOnly={!hasSufficientBalance()}
                    />
                  ))}

                  {rideNotifications.length > 3 && (
                    <TouchableOpacity style={styles.seeMoreButton} onPress={() => setRideModalVisible(true)}>
                      <Text style={styles.seeMoreText}>See {rideNotifications.length - 3} More</Text>
                      <Ionicons name="chevron-down" size={scaleSize(14)} color="#facc15" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="car-outline" size={scaleSize(48)} color="#666" />
                  <Text style={styles.emptyText}>No ride orders available</Text>
                  <Text style={styles.emptySubtext}>
                    {isConnected ? "Waiting for new requests..." : "Go online to receive rides"}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Negotiation Updates */}
          {negotiationArray.length > 0 && status === 'not_busy' && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ride Updates ({negotiationArray.length})</Text>
                <TouchableOpacity onPress={() => setNegotiationUpdates({})}>
                  <Ionicons name="trash-outline" size={scaleSize(20)} color="#f44336" />
                </TouchableOpacity>
              </View>
              {!hasSufficientBalance() && (
                <View style={styles.updatesWarning}>
                  <Ionicons name="alert-circle-outline" size={scaleSize(16)} color="#ff9800" />
                  <Text style={styles.updatesWarningText}>Add funds to respond to offers</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: "#4CAF50" }, !hasSufficientBalance() && styles.disabledViewButton]}
                onPress={() => setUpdatesModalVisible(true)}
                disabled={!hasSufficientBalance()}
              >
                <Text style={styles.viewButtonText}>
                  {hasSufficientBalance() ? 'View Updates' : 'Add Funds to View'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Chart */}
          <View style={styles.chartContainer}>
            <DonutChart />
          </View>
        </ScrollView>
      </View>

      {/* Tier Overlay */}
      <TierOverlay visible={tierOverlayVisible} onClose={() => setTierOverlayVisible(false)} />

      {/* Session Expired Modal */}
      <Modal animationType="fade" transparent visible={sessionExpired} onRequestClose={handleSessionExpiredOk} statusBarTranslucent>
        <SafeAreaView style={styles.modalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.7)" />
          <View style={styles.alertBox}>
            <Ionicons name="time-outline" size={scaleSize(50)} color="#facc15" />
            <Text style={styles.alertTitle}>Session Expired</Text>
            <Text style={styles.alertMessage}>Your session has expired. Please log in again.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSessionExpiredOk}>
              <Text style={styles.primaryButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Upload Documents Modal */}
      <Modal animationType="fade" transparent visible={uploadModalVisible} onRequestClose={() => setUploadModalVisible(false)} statusBarTranslucent>
        <SafeAreaView style={styles.modalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.7)" />
          <View style={styles.alertBox}>
            <Ionicons name="document-text-outline" size={scaleSize(50)} color="#facc15" />
            <Text style={styles.alertTitle}>Not verified</Text>
            <Text style={styles.alertMessage}>Upload all documents for verification</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => { setUploadModalVisible(false); navigation.navigate("IDVerify"); }}>
              <Text style={styles.primaryButtonText}>Upload Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, { marginTop: 10 }]} onPress={() => setUploadModalVisible(false)}>
              <Text style={styles.secondaryButtonText}>Later</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Low Balance Warning Modal */}
      <CentralModal
        visible={lowBalanceWarningVisible}
        onClose={() => setLowBalanceWarningVisible(false)}
        title="Insufficient Balance"
        subText={`Your balance is ₦${balanceData?.balance?.toLocaleString()}. You need at least ₦1,001 to accept rides.`}
        icon="wallet-outline"
        confirmText="Add Funds"
        closeText="Cancel"
        onConfirm={() => { setLowBalanceWarningVisible(false); navigation.navigate("Wallet"); }}
        onCancel={() => setLowBalanceWarningVisible(false)}
        confirmButtonColor="#facc15"
        themeColor="#ff9800"
      />

      {/* Ride Orders Modal */}
      <Modal animationType="slide" transparent visible={rideModalVisible} onRequestClose={() => setRideModalVisible(false)} statusBarTranslucent>
        <SafeAreaView style={styles.fullScreenModal}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
          <View style={styles.fullScreenContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Ride Orders</Text>
              <TouchableOpacity onPress={() => setRideModalVisible(false)}>
                <Ionicons name="close" size={scaleSize(24)} color="white" />
              </TouchableOpacity>
            </View>

            {!hasSufficientBalance() && (
              <View style={[styles.sectionContainer, styles.modalLowBalanceWarning]}>
                <View style={styles.modalWarningHeader}>
                  <Ionicons name="eye-outline" size={scaleSize(18)} color="#ff9800" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#ff9800', fontWeight: 'bold', fontSize: scaleFont(14) }}>View Only Mode</Text>
                </View>
                <Text style={{ color: '#ffcc80', fontSize: scaleFont(12), marginBottom: 8 }}>
                  Balance: ₦{balanceData?.balance?.toLocaleString()}. Add ₦{1001 - (balanceData?.balance || 0)} to accept rides.
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#ff9800', padding: scaleSize(8), borderRadius: 6, alignSelf: 'flex-start' }}
                  onPress={() => { setRideModalVisible(false); navigation.navigate("Wallet"); }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: scaleFont(12) }}>Add Funds</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={rideNotifications}
              keyExtractor={(item) => item.ride_request_id}
              renderItem={({ item }) => (
                <RideOfferCard
                  item={item}
                  onAccept={handleAccept}
                  onCounter={handleViewOffer}
                  onDecline={handleDecline}
                  disabled={!hasSufficientBalance()}
                  disabledMessage="Add funds to accept rides"
                  showViewOnly={!hasSufficientBalance()}
                />
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<View style={styles.emptyList}><Text style={styles.emptyListText}>No orders available</Text></View>}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Counter Offers Modal */}
      <Modal animationType="slide" transparent visible={updatesModalVisible} onRequestClose={() => setUpdatesModalVisible(false)} statusBarTranslucent>
        <KeyboardAvoidingView style={styles.fullScreenModal} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <SafeAreaView style={[styles.fullScreenContent, { paddingTop: Platform.OS === 'ios' ? 0 : 50 }]}>
            <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setUpdatesModalVisible(false)}>
                <Ionicons name="arrow-back" size={scaleSize(24)} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Counter Offers</Text>
              <View style={{ width: scaleSize(24) }} />
            </View>

            <FlatList
              data={negotiationUpdates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <CounterOfferItem
                  item={item}
                  onClose={() => setUpdatesModalVisible(false)}
                  socket={socket}
                  onAccept={handleAccept}
                  onCounterSubmit={handleCounterSubmit}
                  disabled={!hasSufficientBalance()}
                  disabledMessage="Add funds to accept offers"
                  showViewOnly={!hasSufficientBalance()}
                />
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<View style={styles.emptyList}><Text style={styles.emptyListText}>No counter offers available</Text></View>}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Accepted Ride Modal */}
      <Modal animationType="fade" transparent visible={acceptedModalVisible} onRequestClose={() => setAcceptedModalVisible(false)} statusBarTranslucent>
        <SafeAreaView style={styles.modalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.7)" />
          <View style={styles.alertBox}>
            <Ionicons name="checkmark-circle" size={scaleSize(60)} color="#4CAF50" />
            <Text style={styles.alertTitle}>Ride Accepted!</Text>
            <Text style={styles.alertMessage}>
              {acceptedRide?.ride_request_id
                ? `Ride ID: ${acceptedRide.ride_request_id.slice(0, 16)}... accepted. Head to pickup!`
                : "Your ride has been accepted successfully."}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => { setAcceptedModalVisible(false); setAcceptedRide(null); }}>
              <Text style={styles.primaryButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Driver Offer Declined Modal */}
      <Modal animationType="fade" transparent visible={declineModalVisible} onRequestClose={() => setDeclineModalVisible(false)} statusBarTranslucent>
        <SafeAreaView style={styles.modalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.7)" />
          <View style={styles.alertBox}>
            <Ionicons name="close-circle" size={scaleSize(60)} color="#f44336" />
            <Text style={styles.alertTitle}>Offer Declined</Text>
            <Text style={styles.alertMessage}>
              {declinedOffer?.riderName || "Rider"} has declined your offer.{"\n"}Would you like to make another offer?
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { marginBottom: 10 }]}
              onPress={() => {
                setDeclineModalVisible(false);
                if (declinedOffer) navigation.navigate("OrderScreen", { item: declinedOffer, isRetry: true });
              }}
            >
              <Text style={styles.primaryButtonText}>Make Another Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => { setDeclineModalVisible(false); setDeclinedOffer(null); }}>
              <Text style={styles.secondaryButtonText}>Ignore</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* View Offer Modal */}
      <Modal animationType="slide" transparent visible={viewOfferModalVisible} onRequestClose={() => setViewOfferModalVisible(false)} statusBarTranslucent>
        <SafeAreaView style={styles.fullScreenModal}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
          <View style={[styles.fullScreenContent, { paddingTop: Platform.OS === 'ios' ? 0 : 20 }]}>
            <View style={styles.viewOfferHeader}>
              <TouchableOpacity onPress={() => setViewOfferModalVisible(false)} style={{ padding: scaleSize(5) }}>
                <Ionicons name="chevron-down" size={scaleSize(28)} color="#666" />
              </TouchableOpacity>
              <Text style={styles.viewOfferTitle}>Ride Request</Text>
              <View style={{ width: scaleSize(38) }} />
            </View>

            {!hasSufficientBalance() && (
              <View style={styles.viewOfferWarning}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="eye-outline" size={scaleSize(20)} color="#ff9800" style={{ marginRight: 10 }} />
                  <Text style={{ color: '#ff9800', fontWeight: 'bold', fontSize: scaleFont(16) }}>View Only</Text>
                </View>
                <Text style={{ color: '#ffcc80', fontSize: scaleFont(14), marginBottom: 10 }}>
                  Your balance is ₦{balanceData?.balance?.toLocaleString()}. Add ₦{1001 - (balanceData?.balance || 0)} to accept or counter.
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#ff9800', padding: scaleSize(12), borderRadius: 8, alignSelf: 'flex-start' }}
                  onPress={() => { setViewOfferModalVisible(false); navigation.navigate("Wallet"); }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: scaleFont(14) }}>Add Funds Now</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.viewOfferContent}>
              {selectedOffer && (
                <>
                  <View style={styles.riderProfileSection}>
                    <View style={[styles.riderAvatar, { width: scaleSize(80), height: scaleSize(80), borderRadius: scaleSize(40) }]}>
                      <Ionicons name="person" size={scaleSize(40)} color="#facc15" />
                    </View>
                    <Text style={[styles.riderName, { fontSize: scaleFont(24) }]}>{selectedOffer.rider_name}</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={scaleSize(14)} color="#facc15" />
                      <Text style={styles.ratingText}>{selectedOffer.rider_rating} Rating</Text>
                    </View>
                  </View>

                  <View style={styles.priceSection}>
                    <Text style={styles.priceLabel}>Offered Fare</Text>
                    <Text style={[styles.priceAmount, { fontSize: scaleFont(42) }]}>
                      ₦{(selectedOffer.offer_amount)?.toLocaleString()}
                    </Text>
                    <Text style={styles.priceEstimate}>Estimated: ₦{(selectedOffer.estimated_fare)?.toLocaleString()}</Text>
                  </View>

                  <View style={styles.routeDetails}>
                    <View style={styles.routePath}>
                      <View style={styles.routeIndicator}>
                        <View style={[styles.pickupDot, { width: scaleSize(12), height: scaleSize(12), borderRadius: scaleSize(6) }]} />
                        <View style={[styles.routeLine, { height: scaleSize(40) }]} />
                        <View style={[styles.dropoffDot, { width: scaleSize(12), height: scaleSize(12) }]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ marginBottom: 20, flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                          <View>
                            <Text style={styles.locationLabel}>PICKUP</Text>
                            <Text style={[styles.locationText, { fontSize: scaleFont(16), lineHeight: scaleFont(22) }]}>
                              {selectedOffer.pickup || "Pickup location"}
                            </Text>
                            <Text style={styles.timeToPickup}>
                              ~{selectedOffer.time_to_pickup ? Math.round(parseFloat(selectedOffer.time_to_pickup) / 60) : 0} mins away
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.locationLabel}>DROPOFF</Text>
                            <Text style={[styles.locationText, { fontSize: scaleFont(16), lineHeight: scaleFont(22) }]}>
                              {selectedOffer.dropoff || "Pickup location"}
                            </Text>
                          </View>

                        </View>
                      </View>
                    </View>

                    <View style={styles.routeStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="navigate-outline" size={scaleSize(20)} color="#888" />
                        <Text style={styles.statValue}>{selectedOffer.distance_km} km</Text>
                        <Text style={styles.statLabel}>Total Dist</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="wallet-outline" size={scaleSize(20)} color="#888" />
                        <Text style={styles.statValue}>Cash</Text>
                        <Text style={styles.statLabel}>Payment</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="car-sport-outline" size={scaleSize(20)} color="#888" />
                        <Text style={styles.statValue}>{selectedOffer.ride_type}</Text>
                        <Text style={styles.statLabel}>Type</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.viewOfferFooter}>
              <TouchableOpacity
                style={[styles.acceptButton, !hasSufficientBalance() && styles.disabledButton]}
                onPress={() => {
                  if (!hasSufficientBalance()) { setLowBalanceWarningVisible(true); return; }
                  if (selectedOffer) handleAcceptAsCounter(selectedOffer);
                }}
                disabled={!hasSufficientBalance()}
              >
                <Text style={[styles.buttonText, !hasSufficientBalance() && styles.disabledButtonText]}>
                  {hasSufficientBalance() ? 'Accept Offer' : 'Add Funds to Accept'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.counterButton, !hasSufficientBalance() && styles.disabledCounterButton]}
                onPress={() => {
                  if (!hasSufficientBalance()) { setLowBalanceWarningVisible(true); return; }
                  setViewOfferModalVisible(false);
                  handleCounter(selectedOffer);
                }}
                disabled={!hasSufficientBalance()}
              >
                <Text style={[styles.counterButtonText, !hasSufficientBalance() && styles.disabledCounterButtonText]}>
                  {hasSufficientBalance() ? 'Counter Offer' : 'Add Funds to Counter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Arrival Error */}
      <CentralModal
        visible={arrivalErrorModalVisible}
        onClose={() => setArrivalErrorModalVisible(false)}
        title="Too Far From Pickup"
        subText={arrivalErrorMessage}
        icon="location-outline"
        confirmText="Got it"
        themeColor="#ff9800"
      />

      {/* Ride Cancelled */}
      <CentralModal
        visible={rideCancelledModalVisible}
        onClose={handleCancelledRideOk}
        title="Ride Cancelled"
        subText={
          cancelledRideInfo?.reason
            ? `Reason: ${cancelledRideInfo.reason}\n\nYou're now available for new ride requests.`
            : "The ride has been cancelled.\n\nYou're now available for new ride requests."
        }
        icon="alert-circle"
        confirmText="Got it"
        themeColor="#ff9800"
      />

      {/* Ride Completed */}
      <Modal
        animationType="fade"
        transparent
        visible={rideCompletedModalVisible}
        onRequestClose={() => { setRideCompletedModalVisible(false); setRideDetails(null); setCompletedRideInfo(null); setRideNotifications([]); }}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.7)" />
          <View style={styles.alertBox}>
            <Ionicons name="checkmark-circle" size={scaleSize(60)} color="#4CAF50" />
            <Text style={styles.alertTitle}>Ride Completed! 🎉</Text>
            {completedRideInfo && (
              <View style={styles.rideDetailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Passenger:</Text>
                  <Text style={styles.detailValue}>{completedRideInfo.rider?.name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fare:</Text>
                  <Text style={[styles.detailValue, { color: '#4CAF50', fontWeight: 'bold' }]}>
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(completedRideInfo.fare || 0)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>From:</Text>
                  <Text style={[styles.detailValue, { flex: 1 }]} numberOfLines={2}>{completedRideInfo.pickup_address || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>To:</Text>
                  <Text style={[styles.detailValue, { flex: 1 }]} numberOfLines={2}>{completedRideInfo.dropoff_address || 'N/A'}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => { setRideCompletedModalVisible(false); setRideDetails(null); setCompletedRideInfo(null); setRideNotifications([]); }}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Online Error */}
      <CentralModal
        visible={onlineErrorModalVisible}
        onClose={() => setOnlineErrorModalVisible(false)}
        title="Cannot Go Online"
        subText={onlineErrorMessage}
        icon="alert-circle"
        confirmText="Upload Documents"
        closeText="Later"
        onConfirm={() => { setOnlineErrorModalVisible(false); navigation.navigate("DocumentUploads"); }}
        onCancel={() => setOnlineErrorModalVisible(false)}
        confirmButtonColor="#facc15"
        themeColor="#ff9800"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#000" },
  scrollContainer: { flex: 1 },
  scrollContentContainer: { flexGrow: 1, paddingBottom: 20 },
  container: { flex: 1, paddingHorizontal: Math.max(16, width * 0.04), paddingTop: 8, paddingBottom: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
  detailLabel: { color: '#999', fontSize: Math.max(12, width * 0.032), marginRight: 10 },
  detailValue: { color: 'white', fontSize: Math.max(12, width * 0.032) },
  loadingContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  loadingText: { color: "white", marginTop: 10, fontSize: Math.max(14, width * 0.037) },
  errorContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  errorText: { color: "#f44336", fontSize: Math.max(16, width * 0.042) },
  chartContainer: { marginBottom: Math.max(16, height * 0.02), alignItems: "center" },
  sectionContainer: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: Math.max(12, width * 0.04), marginBottom: Math.max(12, height * 0.015) },
  lowBalanceWarning: { backgroundColor: '#332211', borderLeftWidth: 4 },
  balanceBannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  balanceTitleRow: { flexDirection: 'row', alignItems: 'center' },
  balanceBannerTitle: { fontSize: Math.max(16, width * 0.042), fontWeight: "bold", marginLeft: 8 },
  balanceWarningText: { marginBottom: 10, textAlign: 'left', color: '#ffcc80', fontSize: Math.max(12, width * 0.032) },
  balanceBannerActions: { flexDirection: 'row', gap: 10 },
  viewButtonOutline: { backgroundColor: 'transparent', paddingVertical: Math.max(10, height * 0.012), paddingHorizontal: 15, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: '#facc15', flex: 1 },
  viewButtonOutlineText: { color: "#facc15", fontWeight: "bold", fontSize: Math.max(12, width * 0.032) },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: Math.max(16, width * 0.042), fontWeight: "bold", color: "white" },
  ordersContainer: { backgroundColor: 'transparent', padding: 0 },
  ordersHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 },
  ordersTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewOnlyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  viewOnlyText: { color: '#666', fontSize: Math.max(9, width * 0.024), fontWeight: '600' },
  ordersCount: { color: '#666', fontSize: Math.max(10, width * 0.027) },
  seeMoreButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', marginTop: 5, paddingVertical: 8, paddingHorizontal: 15, backgroundColor: 'rgba(250, 204, 21, 0.1)', borderRadius: 20 },
  seeMoreText: { color: "#facc15", fontSize: Math.max(10, width * 0.027), fontWeight: "600", marginRight: 4 },
  viewButton: { backgroundColor: "#facc15", paddingVertical: Math.max(10, height * 0.012), paddingHorizontal: 20, borderRadius: 8, alignItems: "center", marginTop: 10 },
  disabledViewButton: { backgroundColor: '#666', opacity: 0.7 },
  updatesWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#332211', padding: 8, borderRadius: 6, marginBottom: 10, gap: 6 },
  updatesWarningText: { color: '#ffcc80', fontSize: Math.max(11, width * 0.029) },
  viewButtonText: { color: "black", fontWeight: "bold", fontSize: Math.max(14, width * 0.037) },
  emptyContainer: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: Math.max(20, height * 0.025), alignItems: "center", justifyContent: "center", marginBottom: Math.max(12, height * 0.015) },
  emptyText: { color: "white", fontSize: Math.max(16, width * 0.042), fontWeight: "600", marginTop: 10, textAlign: 'center' },
  emptySubtext: { color: "#999", fontSize: Math.max(12, width * 0.032), marginTop: 5, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "center", alignItems: "center", paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  alertBox: { backgroundColor: "#1a1a1a", borderRadius: 15, padding: Math.max(20, width * 0.08), width: Math.min(width * 0.85, 350), alignItems: "center" },
  alertTitle: { fontSize: Math.max(18, width * 0.048), fontWeight: "bold", color: "white", marginBottom: 10, marginTop: 10, textAlign: 'center' },
  alertMessage: { color: "#ccc", textAlign: "center", marginBottom: 25, fontSize: Math.max(14, width * 0.037), lineHeight: Math.max(20, width * 0.053) },
  primaryButton: { backgroundColor: "#facc15", paddingVertical: Math.max(12, height * 0.014), paddingHorizontal: 30, borderRadius: 8, width: "100%" },
  primaryButtonText: { color: "black", fontWeight: "bold", textAlign: "center", fontSize: Math.max(14, width * 0.037) },
  secondaryButton: { backgroundColor: "#333", paddingVertical: Math.max(12, height * 0.014), paddingHorizontal: 30, borderRadius: 8, width: "100%" },
  secondaryButtonText: { color: "white", fontWeight: "bold", textAlign: "center", fontSize: Math.max(14, width * 0.037) },
  fullScreenModal: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.9)", justifyContent: "flex-end", paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  fullScreenContent: { backgroundColor: "#000", borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "90%", paddingHorizontal: Math.max(16, width * 0.04), paddingTop: Math.max(16, height * 0.02) },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Math.max(16, height * 0.02), paddingHorizontal: 5 },
  modalTitle: { fontSize: Math.max(18, width * 0.048), fontWeight: "bold", color: "white", textAlign: 'center', flex: 1 },
  modalLowBalanceWarning: { backgroundColor: '#332211', margin: 15, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#ff9800', padding: Math.max(12, width * 0.04) },
  modalWarningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  listContent: { paddingBottom: Math.max(20, height * 0.025) },
  emptyList: { padding: Math.max(20, height * 0.025), alignItems: "center" },
  emptyListText: { color: "#999", fontSize: Math.max(14, width * 0.037) },
  viewOfferHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Math.max(16, height * 0.02) },
  viewOfferTitle: { color: 'white', fontSize: Math.max(18, width * 0.048), fontWeight: 'bold', textAlign: 'center', flex: 1 },
  viewOfferWarning: { backgroundColor: '#332211', borderRadius: 10, padding: Math.max(12, width * 0.04), marginBottom: Math.max(16, height * 0.02), borderLeftWidth: 4, borderLeftColor: '#ff9800' },
  viewOfferContent: { paddingBottom: Math.max(20, height * 0.025) },
  riderProfileSection: { alignItems: 'center', marginBottom: Math.max(20, height * 0.025) },
  riderAvatar: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: '#facc15' },
  riderName: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5, backgroundColor: '#222', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ratingText: { color: '#ccc', marginLeft: 5, fontWeight: '600', fontSize: Math.max(12, width * 0.032) },
  priceSection: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: Math.max(16, width * 0.06), marginBottom: Math.max(16, height * 0.02), alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  priceLabel: { color: '#888', fontSize: Math.max(12, width * 0.032), textTransform: 'uppercase', letterSpacing: 1 },
  priceAmount: { color: '#facc15', fontWeight: 'bold', marginVertical: 5 },
  priceEstimate: { color: '#666', fontSize: Math.max(10, width * 0.027) },
  routeDetails: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: Math.max(16, width * 0.06), marginBottom: Math.max(16, height * 0.02) },
  routePath: { flexDirection: 'row', marginBottom: 20 },
  routeIndicator: { alignItems: 'center', marginRight: 15, paddingTop: 5 },
  pickupDot: { backgroundColor: '#facc15' },
  routeLine: { width: 2, backgroundColor: '#333', marginVertical: 5 },
  dropoffDot: { borderRadius: 0, backgroundColor: '#fff' },
  locationLabel: { color: '#888', fontSize: Math.max(10, width * 0.027), marginBottom: 4 },
  locationText: { color: 'white', lineHeight: 22 },
  timeToPickup: { color: '#facc15', fontSize: Math.max(10, width * 0.027), marginTop: 4 },
  routeStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15, justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { color: 'white', fontWeight: 'bold', marginTop: 5, fontSize: Math.max(12, width * 0.032) },
  statLabel: { color: '#666', fontSize: Math.max(9, width * 0.024) },
  viewOfferFooter: { paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 10 },
  acceptButton: { backgroundColor: '#facc15', borderRadius: 12, paddingVertical: Math.max(14, height * 0.017), alignItems: 'center', marginBottom: 12 },
  disabledButton: { backgroundColor: '#666', opacity: 0.7 },
  counterButton: { backgroundColor: 'transparent', borderRadius: 12, paddingVertical: Math.max(14, height * 0.017), alignItems: 'center', borderWidth: 2, borderColor: '#facc15' },
  disabledCounterButton: { borderColor: '#666', opacity: 0.7 },
  buttonText: { color: 'black', fontWeight: 'bold', fontSize: Math.max(16, width * 0.042) },
  disabledButtonText: { color: '#ccc' },
  counterButtonText: { color: '#facc15', fontWeight: 'bold', fontSize: Math.max(16, width * 0.042) },
  disabledCounterButtonText: { color: '#666' },
  rideDetailsContainer: { width: '100%', marginVertical: 20 },
});