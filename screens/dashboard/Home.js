import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Pressable
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Components
import DonutChart from "../components/DonutChart";
import UpgradeNotificationCard from "../components/UpgradeNotificationCard";
import TierOverlay from "../components/TierOverlay";
import RideOfferCard from "../components/RideOfferCard";
import HomeHeader from "../components/HomeHeader";
import StatusBadge from "../components/StatusBadge";
import ActiveRideSection from "../components/ActiveRideSection";
import CentralModal from "../components/CentralModal";
import ViewOfferModal from "../components/ViewOfferModal";
import RideOrdersModal from "../components/RideOrdersModal";
import CounterOffersModal from "../components/CounterOffersModal";

// Context & Services
import { useProfile } from "../../services/profile.service";
import { useDriverKycStatus } from "../../services/checkKyc.service";
import { useStartRide, useFinishRide, useArriveRide, useCancelRide } from "../../services/rides.service";
import { useGetMyBalance } from "../../services/funding.service";
import { SocketContext } from "../../context/WebSocketProvider";
import { useDriverRide } from "../../context/DriverRideContext";
import { useActiveStatusEndPoint } from "../../services/auth.service";
import { api } from "../../services/api";
import { navigationRef } from '../context/NavigationContext';

import { useAuth } from "../../context/AuthContext";
import { scaleSize } from "../../utils/scaling";
import { mapNotificationToAction } from "../../utils/notificationMapper";
import { ensureDriverPermissions } from "../../services/driverPermissions";

const { width, height } = Dimensions.get('window');

export default function Home() {
  const navigation = useNavigation();
  const route = useRoute();

  const [tierOverlayVisible, setTierOverlayVisible] = useState(false);
  const [rideModalVisible, setRideModalVisible] = useState(false);
  const [updatesModalVisible, setUpdatesModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const hasShownUploadModalRef = useRef(false);
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
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState(null);

  const cancelReasons = [
    "Passenger didn't show up",
    "Passenger requested cancellation",
    "Vehicle issue",
    "Emergency",
    "Other",
  ];

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
    negotiationUpdates,
    rideAcceptedAt,
    expectedArrivalMinutes,
    setStatus,
    cancellationNotice,
    dismissCancellation,
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
    toggleOnlineStatus,
    pendingOfferRideId,
    consumePendingOfferRideId,
  } = useContext(SocketContext);

  const {
    data: profile,
    isPending: profileLoading,
    isError: profileError,
  } = useProfile(token);

  console.log('ride notessss===========', rideNotifications)

  const { data: kycData, isLoading } = useDriverKycStatus();
  console.log('kyc dtae=====', kycData)
  const { data: balanceData, refetch: refetchBalance } = useGetMyBalance();

  const startRideMutation = useStartRide();
  const finishRideMutation = useFinishRide();
  const arriveRideMutation = useArriveRide();
  const cancelRideMutation = useCancelRide();
  const activeStatusMutation = useActiveStatusEndPoint();

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

  // Handles both WebSocket toggle and server-side status update
  const handleToggleOnline = useCallback(async () => {
    if (isTogglingOnlineRef.current) {
      console.log("⚠️ [TOGGLE] Already toggling, ignoring");
      return;
    }
    isTogglingOnlineRef.current = true;

    const goingOnline = !isConnected;

    try {
      if (goingOnline) {
        // Prompt for the bubble + full-screen-intent permissions before
        // committing to going online. Non-blocking — driver can skip.
        await ensureDriverPermissions();

        // 1. Update server status FIRST so the server knows we're coming online
        try {
          const res = await activeStatusMutation.mutateAsync({ is_online: true });
          console.log('response from going online', res)
        } catch (error) {
          console.log('going online error', error)
          const message = error.response?.data?.message || "Unable to login Please upload your credentials.";
          setOnlineErrorMessage(message);
          // setOnlineErrorModalVisible(true);
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

  useFocusEffect(
    useCallback(() => {
      if (!isLoading && kycData?.kyc_status === "PENDING" && !hasShownUploadModalRef.current) {
        setUploadModalVisible(true);
        hasShownUploadModalRef.current = true;
      }
      return () => {
        hasShownUploadModalRef.current = false;
      };
    }, [isLoading, kycData])
  );

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

  useEffect(() => {
    if (!cancellationNotice) return;
    setCancelledRideInfo({ reason: cancellationNotice.reason });
    setRideCancelledModalVisible(true);
  }, [cancellationNotice]);

  useEffect(() => {
    const notificationData = route.params?.notificationData;
    if (!notificationData) return;

    const action = mapNotificationToAction(notificationData);

    if (action) {
      switch (action.type) {
        case "RIDE_REQUESTED": {
          const fcmRideId = notificationData.ride_id;
          const fcmRequestId = notificationData.ride_request_id;
          const existing = rideNotifications.find(
            (n) =>
              (fcmRequestId && n.ride_request_id === fcmRequestId) ||
              (fcmRideId && (n.ride_request_id === fcmRideId || n.ride_id === fcmRideId))
          );
          setSelectedOffer(existing || action.data);
          setViewOfferModalVisible(true);
          break;
        }
      }
    }

    navigation.setParams({ notificationData: undefined });
  }, [route.params?.notificationData]);

  // All WS message handling lives in WebSocketProvider; Home reacts via context state.

  // --- HANDLERS ---

  const handleOpenMenu = () => navigation.navigate('Account');

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPersisted();
      if (rideId) await fetchRideDetails(rideId);
      await refetchBalance();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSessionExpiredOk = () => clearSessionExpired();

  const handleViewOffer = (offer) => {
    setSelectedOffer(offer);
    setViewOfferModalVisible(true);
  };

  // When the app was launched/foregrounded by an incoming ride request,
  // WebSocketProvider sets pendingOfferRideId. Find the matching offer in
  // rideNotifications and open the View Offer modal automatically.
  useEffect(() => {
    if (!pendingOfferRideId) return;
    const offer = rideNotifications.find(
      (n) => n.ride_request_id === pendingOfferRideId,
    );
    if (!offer) return; // wait for the WS payload to be parsed into rideNotifications
    console.log("📲 [HOME] Auto-opening View Offer for ride", pendingOfferRideId);
    handleViewOffer(offer);
    consumePendingOfferRideId?.();
  }, [pendingOfferRideId, rideNotifications]);

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
      if (cancellationNotice) {
        dismissCancellation();
      } else {
        reset();
      }
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

  const handleCancelRide = () => {
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancelReason || !rideId) return;
    try {
      const cancelResponse = await cancelRideMutation.mutateAsync({ rideId, reason: selectedCancelReason });
      setCancelModalVisible(false);
      setSelectedCancelReason(null);
      reset();
      setRideDetails(null);
      setCancelledRideInfo({
        reason: cancelResponse?.reason || cancelResponse?.message || null,
      });
      setRideCancelledModalVisible(true);
    } catch (error) {
      console.error("❌ handleConfirmCancel:", error);
      setAlertData({
        title: "Cancellation Failed",
        message: error?.response?.data?.message || error?.message || "Unable to cancel ride.",
        isError: true,
      });
      setAlertModalVisible(true);
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
          onMenuPress={handleOpenMenu}
          isConnected={isConnected}
        />

        <StatusBadge status={profile?.is_online} onToggleOnline={handleToggleOnline} />
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
            onCancelRide={handleCancelRide}
            isArriving={arriveRideMutation.isPending}
            isStarting={startRideMutation.isPending}
            isFinishing={finishRideMutation.isPending}
            isCancelling={cancelRideMutation.isPending}
            isLoadingDetails={loadingRideDetails}
            rideAcceptedAt={rideAcceptedAt}
            expectedArrivalMinutes={expectedArrivalMinutes}
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
                  <TouchableOpacity style={[styles.viewButton, { backgroundColor: '#facc15' }]} onPress={() => navigation.navigate("Earnings")}>
                    <Text style={styles.viewButtonText}>View Earnings</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}


          {(kycData?.kyc_status === "PENDING" || kycData?.kyc_status === "IN_REVIEW") && (
            <UpgradeNotificationCard status={kycData ? kycData : null} />
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
      <CentralModal
        visible={sessionExpired}
        onClose={handleSessionExpiredOk}
        title="Session Expired"
        subText="Your session has expired. Please log in again."
        icon="time-outline"
        confirmText="OK"
        themeColor="#facc15"
        hideCloseButton
      />

      {/* Upload Documents Modal */}
      <CentralModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        title="Not verified"
        subText="Upload all documents for verification"
        icon="document-text-outline"
        confirmText="Upload Now"
        closeText="Later"
        onConfirm={() => { setUploadModalVisible(false); navigation.navigate("IDVerify"); }}
        themeColor="#facc15"
      />

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
        confirmButtonColor="#facc15"
        themeColor="#ff9800"
      />

      {/* Ride Orders Modal */}
      <RideOrdersModal
        visible={rideModalVisible}
        onClose={() => setRideModalVisible(false)}
        rideNotifications={rideNotifications}
        onAccept={handleAccept}
        onViewOffer={handleViewOffer}
        onDecline={handleDecline}
        hasSufficientBalance={hasSufficientBalance()}
        balance={balanceData?.balance}
        onAddFunds={() => { setRideModalVisible(false); navigation.navigate("Wallet"); }}
      />

      {/* Counter Offers Modal */}
      <CounterOffersModal
        visible={updatesModalVisible}
        onClose={() => setUpdatesModalVisible(false)}
        negotiationArray={negotiationArray}
        socket={socket}
        onAccept={handleAccept}
        onCounterSubmit={handleCounterSubmit}
        hasSufficientBalance={hasSufficientBalance()}
      />

      {/* Accepted Ride Modal */}
      <CentralModal
        visible={acceptedModalVisible}
        onClose={() => { setAcceptedModalVisible(false); setAcceptedRide(null); }}
        title="Ride Accepted!"
        subText={
          acceptedRide?.ride_request_id
            ? `Ride ID: ${acceptedRide.ride_request_id.slice(0, 16)}... accepted. Head to pickup!`
            : "Your ride has been accepted successfully."
        }
        icon="checkmark-circle"
        iconColor="#4CAF50"
        confirmText="Got it!"
        themeColor="#facc15"
        hideCloseButton
      />
      {/* Driver Offer Declined Modal */}
      <CentralModal
        visible={declineModalVisible}
        onClose={() => { setDeclineModalVisible(false); setDeclinedOffer(null); }}
        title="Offer Declined"
        subText={`${declinedOffer?.riderName || "Rider"} has declined your offer.\nWould you like to make another offer?`}
        icon="close-circle"
        iconColor="#f44336"
        confirmText="Make Another Offer"
        closeText="Ignore"
        onConfirm={() => {
          setDeclineModalVisible(false);
          if (declinedOffer) navigation.navigate("OrderScreen", { item: declinedOffer, isRetry: true });
        }}
        themeColor="#f44336"
        confirmButtonColor="#facc15"
      />

      {/* View Offer Modal */}
      <ViewOfferModal
        visible={viewOfferModalVisible}
        onClose={() => setViewOfferModalVisible(false)}
        offer={selectedOffer}
        onAccept={handleAcceptAsCounter}
        onCounter={(offer) => { setViewOfferModalVisible(false); handleCounter(offer); }}
        hasSufficientBalance={hasSufficientBalance()}
        balance={balanceData?.balance}
        onAddFunds={() => { setViewOfferModalVisible(false); navigation.navigate("Wallet"); }}
        onLowBalanceWarning={() => setLowBalanceWarningVisible(true)}
      />

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
      <CentralModal
        visible={rideCompletedModalVisible}
        onClose={() => { setRideCompletedModalVisible(false); setRideDetails(null); setCompletedRideInfo(null); setRideNotifications([]); }}
        title="Ride Completed! 🎉"
        icon="checkmark-circle"
        iconColor="#4CAF50"
        confirmText="Done"
        themeColor="#4CAF50"
        hideCloseButton
        contentMode="custom"
      >
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
      </CentralModal>

      {/* Online Error */}
      <CentralModal
        visible={onlineErrorModalVisible}
        onClose={() => setOnlineErrorModalVisible(false)}
        title="Cannot Go Online"
        subText={onlineErrorMessage || 'Unable to go online. Please upload your credentials.'}
        icon="alert-circle"
        confirmText="Proceed"
        closeText="Later"
        onConfirm={() => { setOnlineErrorModalVisible(false); navigation.navigate("IDVerify"); }}
        confirmButtonColor="#facc15"
        themeColor="#ff9800"
      />

      {/* Cancel Ride Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !cancelRideMutation.isPending && setCancelModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !cancelRideMutation.isPending && setCancelModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => { }}>
            <Text style={styles.modalTitle}>Cancel Ride</Text>
            <Text style={styles.modalSubtitle}>Select a reason</Text>
            {cancelReasons.map((reason) => {
              const selected = selectedCancelReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                  onPress={() => setSelectedCancelReason(reason)}
                  disabled={cancelRideMutation.isPending}
                >
                  <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#333" }]}
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelRideMutation.isPending}
              >
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: "#e74c3c",
                    opacity: !selectedCancelReason || cancelRideMutation.isPending ? 0.6 : 1,
                  },
                ]}
                onPress={handleConfirmCancel}
                disabled={!selectedCancelReason || cancelRideMutation.isPending}
              >
                {cancelRideMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  rideDetailsContainer: { width: '100%', marginVertical: 20 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", paddingHorizontal: 24 },
  modalCard: { backgroundColor: "#181818", borderRadius: 16, padding: 20 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  modalSubtitle: { color: "#aaa", fontSize: 13, marginTop: 4, marginBottom: 14 },
  reasonRow: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#222", marginBottom: 8, borderWidth: 1, borderColor: "#222" },
  reasonRowSelected: { backgroundColor: "rgba(231,76,60,0.15)", borderColor: "#e74c3c" },
  reasonText: { color: "#ddd", fontSize: 14 },
  reasonTextSelected: { color: "#fff", fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});