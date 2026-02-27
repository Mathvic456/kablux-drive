import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  useWindowDimensions,
  Dimensions,
  ScrollView,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { useRideHistory } from '../../services/rideHistory.service';
import { Ionicons } from "@expo/vector-icons";
import CentralModal from '../components/CentralModal';

// Expo Imports
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function Bookings() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width <= 414;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;
  const screenHeight = Dimensions.get('window').height;
  const isShortScreen = screenHeight < 700;

  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Receipt/Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: rideHistoryResponse,
    isPending,
    isError,
    refetch
  } = useRideHistory(true);

  const tabs = [
    { id: 'all', label: 'All Rides' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  // --- HELPER FUNCTIONS ---

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return dateString; }
  };

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(num);
  };

  // --- PDF GENERATION LOGIC ---

  const generateReceiptHTML = (ride) => {
    const formattedDate = formatDate(ride.start_time);
    const formattedFare = formatCurrency(ride.fare);
    const statusColor = ride.status === 'completed' ? '#4CAF50' : ride.status === 'cancelled' ? '#F44336' : '#FFC107';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kablux Trip Receipt - ${ride.id || 'N/A'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f0f0f0;
            padding: 30px 20px;
          }
          .receipt-container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          }
          /* Header Banner */
          .header-banner {
            background-color: #1a1a1a;
            padding: 28px 30px 24px;
            text-align: center;
          }
          .brand-name {
            color: #FFC107;
            font-size: 26px;
            font-weight: 900;
            letter-spacing: 3px;
            text-transform: uppercase;
          }
          .brand-sub {
            color: #aaa;
            font-size: 13px;
            margin-top: 4px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .receipt-title {
            color: #fff;
            font-size: 16px;
            margin-top: 12px;
            font-weight: 600;
            background-color: #333;
            display: inline-block;
            padding: 4px 14px;
            border-radius: 20px;
          }
          /* Body */
          .body { padding: 28px 30px; }
          /* Trip ID Row */
          .trip-id-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 2px dashed #e0e0e0;
          }
          .trip-id-label { color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .trip-id-value { color: #333; font-size: 14px; font-weight: 700; }
          .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #fff;
            background-color: ${statusColor};
          }
          /* Info Sections */
          .section {
            margin-bottom: 16px;
          }
          .section-title {
            color: #999;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .section-value {
            color: #222;
            font-size: 14px;
            font-weight: 500;
          }
          .divider {
            height: 1px;
            background-color: #f0f0f0;
            margin: 16px 0;
          }
          /* Route */
          .route-container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 16px;
          }
          .route-row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }
          .route-icon-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 3px;
          }
          .dot-green {
            width: 10px; height: 10px;
            border-radius: 50%;
            background-color: #4CAF50;
            flex-shrink: 0;
          }
          .dot-red {
            width: 10px; height: 10px;
            border-radius: 50%;
            background-color: #F44336;
            flex-shrink: 0;
          }
          .route-line {
            width: 2px;
            height: 24px;
            background-color: #ccc;
            margin: 3px 0;
          }
          .route-text-col { flex: 1; }
          .route-label { color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .route-value { color: #222; font-size: 13px; font-weight: 500; margin-top: 2px; margin-bottom: 16px; }
          /* Earnings Block */
          .earnings-block {
            background-color: #1a1a1a;
            border-radius: 12px;
            padding: 20px 24px;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .earnings-label {
            color: #aaa;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
          }
          .earnings-amount {
            color: #FFC107;
            font-size: 28px;
            font-weight: 900;
          }
          /* Footer */
          .footer {
            text-align: center;
            padding: 20px 30px;
            background-color: #fafafa;
            border-top: 1px solid #eee;
          }
          .footer-text { color: #bbb; font-size: 11px; }
          .footer-brand { color: #FFC107; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="receipt-container">

          <!-- Header -->
          <div class="header-banner">
            <div class="brand-name">Kablux</div>
            <div class="brand-sub">Driver App</div>
            <div class="receipt-title">Trip Receipt</div>
          </div>

          <!-- Body -->
          <div class="body">

            <!-- Trip ID & Status -->
            <div class="trip-id-row">
              <div>
                <div class="trip-id-label">Trip ID</div>
                <div class="trip-id-value">#${ride.id || 'N/A'}</div>
              </div>
              <div class="status-badge">${(ride.status || 'unknown').toUpperCase()}</div>
            </div>

            <!-- Date & Rider -->
            <div style="display:flex; gap:16px; margin-bottom:16px;">
              <div class="section" style="flex:1;">
                <div class="section-title">Date & Time</div>
                <div class="section-value">${formattedDate}</div>
              </div>
              <div class="section" style="flex:1;">
                <div class="section-title">Rider</div>
                <div class="section-value">${ride.rider_name || 'Kablux Rider'}</div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Route -->
            <div class="route-container">
              <div class="route-row">
                <div class="route-icon-col">
                  <div class="dot-green"></div>
                  <div class="route-line"></div>
                  <div class="dot-red"></div>
                </div>
                <div class="route-text-col">
                  <div>
                    <div class="route-label">Pickup</div>
                    <div class="route-value">${ride.pickup_address || 'N/A'}</div>
                  </div>
                  <div>
                    <div class="route-label">Drop-off</div>
                    <div class="route-value" style="margin-bottom:0;">${ride.dropoff_address || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Earnings -->
            <div class="earnings-block">
              <div class="earnings-label">Total Earnings</div>
              <div class="earnings-amount">${formattedFare}</div>
            </div>

          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-text">Generated by <span class="footer-brand">Kablux Driver</span> &nbsp;•&nbsp; ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>

        </div>
      </body>
      </html>
    `;
  };

  const downloadReceipt = async (ride) => {
    if (!ride) return;

    try {
      setIsDownloading(true);

      const html = generateReceiptHTML(ride);

      // Generate PDF to temp file
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Share directly from the temp uri — no copy needed
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save or Share Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Could not download receipt.');
    } finally {
      setIsDownloading(false);
    }
  };

  const openReceiptModal = (ride) => {
    console.log('selected ride---------------', ride)
    setSelectedReceipt(ride);
    setShowReceiptModal(true);
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setSelectedReceipt(null);
  };

  // --- LOGIC ---

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, [refetch]);

  const filteredRides = useMemo(() => {
    const rides = rideHistoryResponse?.results || [];
    if (!Array.isArray(rides)) return [];

    let result = rides;

    if (activeTab !== 'all') {
      result = result.filter(r => r?.status?.toLowerCase() === activeTab);
    }

    if (filter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter(ride => {
        if (!ride?.start_time) return false;
        const rideDate = new Date(ride.start_time);

        if (filter === 'today') {
          const rideDay = new Date(rideDate.getFullYear(), rideDate.getMonth(), rideDate.getDate());
          return rideDay.getTime() === today.getTime();
        }
        if (filter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return rideDate >= weekAgo;
        }
        if (filter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return rideDate >= monthAgo;
        }
        return true;
      });
    }
    return result;
  }, [rideHistoryResponse, activeTab, filter]);

  // --- RENDER ITEM ---

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSmallScreen && styles.cardSmall,
          isLargeScreen && styles.cardLarge,
          isTablet && styles.cardTablet,
          isShortScreen && styles.cardShort
        ]}
        activeOpacity={0.7}
        onPress={() => openReceiptModal(item)}
      >
        <View style={[
          styles.cardHeader,
          isSmallScreen && styles.cardHeaderSmall,
          isLargeScreen && styles.cardHeaderLarge,
          isShortScreen && styles.cardHeaderShort
        ]}>
          <Text style={[
            styles.dateText,
            isSmallScreen && styles.dateTextSmall,
            isLargeScreen && styles.dateTextLarge,
            isShortScreen && styles.dateTextShort
          ]} numberOfLines={1}>
            {formatDate(item.start_time)}
          </Text>
          <View style={[
            styles.statusBadge,
            item.status === 'cancelled' ? styles.statusCancelled : styles.statusCompleted,
            isSmallScreen && styles.statusBadgeSmall,
            isLargeScreen && styles.statusBadgeLarge,
            isShortScreen && styles.statusBadgeShort
          ]}>
            <Text style={[
              styles.statusText,
              isSmallScreen && styles.statusTextSmall,
              isLargeScreen && styles.statusTextLarge,
              isShortScreen && styles.statusTextShort
            ]}>{item.status}</Text>
          </View>
        </View>

        <View style={[
          styles.locationsContainer,
          isShortScreen && styles.locationsContainerShort
        ]}>
          <View style={[
            styles.locationRow,
            isSmallScreen && styles.locationRowSmall,
            isShortScreen && styles.locationRowShort
          ]}>
            <View style={[styles.dot, styles.greenDot]} />
            <Text style={[
              styles.addressText,
              isSmallScreen && styles.addressTextSmall,
              isLargeScreen && styles.addressTextLarge,
              isShortScreen && styles.addressTextShort
            ]} numberOfLines={1}>
              {item.pickup_address || "Unknown Pickup"}
            </Text>
          </View>

          <View style={[
            styles.verticalLine,
            isSmallScreen && styles.verticalLineSmall,
            isShortScreen && styles.verticalLineShort
          ]} />

          <View style={[
            styles.locationRow,
            isSmallScreen && styles.locationRowSmall,
            isShortScreen && styles.locationRowShort
          ]}>
            <View style={[styles.dot, styles.redDot]} />
            <Text style={[
              styles.addressText,
              isSmallScreen && styles.addressTextSmall,
              isLargeScreen && styles.addressTextLarge,
              isShortScreen && styles.addressTextShort
            ]} numberOfLines={1}>
              {item.dropoff_address || "Unknown Destination"}
            </Text>
          </View>
        </View>

        <View style={[
          styles.cardFooter,
          isSmallScreen && styles.cardFooterSmall,
          isLargeScreen && styles.cardFooterLarge,
          isShortScreen && styles.cardFooterShort
        ]}>
          <Text style={[
            styles.priceLabel,
            isSmallScreen && styles.priceLabelSmall,
            isLargeScreen && styles.priceLabelLarge,
            isShortScreen && styles.priceLabelShort
          ]}>Total Fare</Text>
          <Text style={[
            styles.priceText,
            isSmallScreen && styles.priceTextSmall,
            isLargeScreen && styles.priceTextLarge,
            isShortScreen && styles.priceTextShort
          ]}>{formatCurrency(item.fare)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isPending && !refreshing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'black' }]}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFC107" />
          <Text style={[
            styles.loadingText,
            isSmallScreen && styles.loadingTextSmall,
            isLargeScreen && styles.loadingTextLarge,
            isShortScreen && styles.loadingTextShort
          ]}>Loading rides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.container}>
        <View style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isLargeScreen && styles.headerLarge,
          isTablet && styles.headerTablet,
          isShortScreen && styles.headerShort
        ]}>
          <Text style={[
            styles.headerTitle,
            isSmallScreen && styles.headerTitleSmall,
            isLargeScreen && styles.headerTitleLarge,
            isShortScreen && styles.headerTitleShort
          ]}>Bookings</Text>
        </View>

        <View style={[
          styles.tabsContainer,
          isSmallScreen && styles.tabsContainerSmall,
          isLargeScreen && styles.tabsContainerLarge,
          isTablet && styles.tabsContainerTablet,
          isShortScreen && styles.tabsContainerShort
        ]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isSmallScreen && styles.tabSmall,
                isLargeScreen && styles.tabLarge,
                isShortScreen && styles.tabShort,
                activeTab === tab.id && styles.tabActive
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                isSmallScreen && styles.tabTextSmall,
                isLargeScreen && styles.tabTextLarge,
                isShortScreen && styles.tabTextShort,
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FILTER BUTTON */}
        <View style={[
          styles.filterContainer,
          isSmallScreen && styles.filterContainerSmall,
          isLargeScreen && styles.filterContainerLarge,
          isTablet && styles.filterContainerTablet,
          isShortScreen && styles.filterContainerShort
        ]}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              isSmallScreen && styles.filterButtonSmall,
              isLargeScreen && styles.filterButtonLarge,
              isTablet && styles.filterButtonTablet,
              isShortScreen && styles.filterButtonShort
            ]}
            onPress={() => {
              const filters = ["all", "today", "week", "month"];
              const next = (filters.indexOf(filter) + 1) % filters.length;
              setFilter(filters[next]);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="filter"
              size={isSmallScreen ? 14 : isShortScreen ? 12 : 16}
              color="#FFC107"
            />
            <Text style={[
              styles.filterText,
              isSmallScreen && styles.filterTextSmall,
              isLargeScreen && styles.filterTextLarge,
              isShortScreen && styles.filterTextShort
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredRides}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
          contentContainerStyle={[
            styles.ridesContent,
            isSmallScreen && styles.ridesContentSmall,
            isLargeScreen && styles.ridesContentLarge,
            isTablet && styles.ridesContentTablet,
            isShortScreen && styles.ridesContentShort,
            filteredRides.length === 0 && styles.emptyRidesContent
          ]}
          ListHeaderComponent={<View style={{ height: isShortScreen ? 2 : 5 }} />}
          ListFooterComponent={<View style={{ height: isShortScreen ? 10 : 20 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFC107"
              colors={['#FFC107']}
              progressBackgroundColor="#1E1E1E"
            />
          }
          ListEmptyComponent={
            <View style={[
              styles.emptyState,
              isSmallScreen && styles.emptyStateSmall,
              isLargeScreen && styles.emptyStateLarge,
              isShortScreen && styles.emptyStateShort
            ]}>
              <Ionicons name="car-outline" size={isSmallScreen ? 40 : isShortScreen ? 36 : 48} color="#666" />
              <Text style={[
                styles.emptyStateText,
                isSmallScreen && styles.emptyStateTextSmall,
                isLargeScreen && styles.emptyStateTextLarge,
                isShortScreen && styles.emptyStateTextShort
              ]}>No rides found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={isShortScreen ? 5 : 8}
          maxToRenderPerBatch={isShortScreen ? 5 : 10}
          windowSize={isShortScreen ? 5 : 10}
        />

        {/* --- RECEIPT MODAL --- */}
        <CentralModal
          visible={showReceiptModal}
          onClose={closeReceiptModal}
          title="Trip Details"
          icon="document-text-outline"
          contentMode="custom"
          confirmText={isDownloading ? "Generating..." : "Download Receipt"}
          closeText="Close"
          containerStyle={styles.bookingDetailsContainer}
          confirmButtonColor="#FFC107"
          themeColor="#FFC107"
          onConfirm={() => !isDownloading && downloadReceipt(selectedReceipt)}
          maxHeight={isShortScreen ? 0.65 : 0.70}
        >
          {selectedReceipt && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.receiptScrollContent,
                isShortScreen && styles.receiptScrollContentShort
              ]}
              style={{ width: '100%', paddingHorizontal: 10 }}
            >
              {/* Trip ID & Status */}
              <View style={{ ...styles.detailSection, width: '100%' }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trip ID</Text>
                  <Text style={styles.detailValue}>#{selectedReceipt.id || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[
                    styles.modalStatusBadge,
                    selectedReceipt.status === 'completed' ? styles.statusCompleted :
                      selectedReceipt.status === 'cancelled' ? styles.statusCancelled :
                        styles.statusPending
                  ]}>
                    <Text style={styles.modalStatusText}>
                      {(selectedReceipt.status || 'unknown').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Date */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={[styles.detailValue, styles.detailValueWide]}>
                    {formatDate(selectedReceipt.start_time)}
                  </Text>
                </View>
              </View>

              {/* Pickup Location */}
              <View style={styles.detailSection}>
                <View style={styles.locationHeader}>
                  <Ionicons name="ellipse" size={10} color="#4CAF50" />
                  <Text style={[styles.detailLabel, { marginLeft: 6 }]}>Pickup</Text>
                </View>
                <Text style={styles.detailValueFull}>{selectedReceipt.pickup_address || 'N/A'}</Text>
              </View>

              {/* Dropoff Location */}
              <View style={styles.detailSection}>
                <View style={styles.locationHeader}>
                  <Ionicons name="location" size={10} color="#FF5252" />
                  <Text style={[styles.detailLabel, { marginLeft: 6 }]}>Drop-off</Text>
                </View>
                <Text style={styles.detailValueFull}>{selectedReceipt.dropoff_address || 'N/A'}</Text>
              </View>

              {/* Rider */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rider</Text>
                  <Text style={styles.detailValue}>{selectedReceipt.rider_name || 'Rider'}</Text>
                </View>
              </View>

              {/* Total Earnings */}
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>TOTAL EARNINGS</Text>
                <Text style={styles.totalValue}>{formatCurrency(selectedReceipt.fare)}</Text>
              </View>
            </ScrollView>
          )}
        </CentralModal>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerSmall: {
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.015,
    paddingTop: Platform.OS === 'ios' ? 8 : 15,
  },
  headerLarge: {
    paddingHorizontal: width * 0.06,
    paddingBottom: height * 0.025,
  },
  headerTablet: {
    paddingHorizontal: width * 0.08,
    paddingBottom: height * 0.03,
  },
  headerShort: {
    paddingBottom: height * 0.012,
    paddingTop: Platform.OS === 'ios' ? 5 : 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: Math.min(width * 0.07, 28),
    fontWeight: '700',
  },
  headerTitleSmall: { fontSize: Math.min(width * 0.065, 24) },
  headerTitleLarge: { fontSize: Math.min(width * 0.075, 32) },
  headerTitleShort: { fontSize: Math.min(width * 0.06, 22) },

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: width * 0.05,
    marginTop: height * 0.01,
    marginBottom: height * 0.02,
    borderWidth: 1,
    borderColor: '#333',
    gap: width * 0.01,
    borderRadius: 25,
    padding: 4,
    backgroundColor: '#111',
  },
  tabsContainerSmall: {
    marginHorizontal: width * 0.04,
    marginTop: height * 0.008,
    marginBottom: height * 0.015,
    borderRadius: 20,
    padding: 3,
    gap: width * 0.008,
  },
  tabsContainerLarge: {
    marginHorizontal: width * 0.06,
    marginTop: height * 0.012,
    marginBottom: height * 0.025,
    borderRadius: 30,
    padding: 5,
    gap: width * 0.012,
  },
  tabsContainerTablet: {
    maxWidth: 500,
    alignSelf: 'center',
    width: width * 0.9,
  },
  tabsContainerShort: {
    marginTop: height * 0.005,
    marginBottom: height * 0.012,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: height * 0.012,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabSmall: { paddingVertical: height * 0.01, borderRadius: 18 },
  tabLarge: { paddingVertical: height * 0.014, borderRadius: 22 },
  tabShort: { paddingVertical: height * 0.008, borderRadius: 18 },
  tabActive: { backgroundColor: '#333' },
  tabText: {
    color: '#888',
    fontSize: Math.min(width * 0.037, 16),
    fontWeight: '600',
  },
  tabTextSmall: { fontSize: Math.min(width * 0.035, 14) },
  tabTextLarge: { fontSize: Math.min(width * 0.039, 18) },
  tabTextShort: { fontSize: Math.min(width * 0.034, 13) },
  tabTextActive: { color: 'white', fontWeight: '700' },

  // ─── Filter ───────────────────────────────────────────────────────────────
  filterContainer: {
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
  },
  filterContainerSmall: {
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.012,
  },
  filterContainerLarge: {
    paddingHorizontal: width * 0.06,
    marginBottom: height * 0.018,
  },
  filterContainerTablet: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  filterContainerShort: { marginBottom: height * 0.008 },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFC107",
    alignSelf: "flex-start",
    minHeight: height * 0.04,
  },
  filterButtonSmall: {
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.006,
    minHeight: height * 0.035,
    borderRadius: 18,
  },
  filterButtonLarge: {
    paddingHorizontal: width * 0.035,
    paddingVertical: height * 0.01,
    minHeight: height * 0.045,
    borderRadius: 22,
  },
  filterButtonTablet: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.012,
    minHeight: height * 0.05,
    borderRadius: 25,
  },
  filterButtonShort: {
    paddingVertical: height * 0.005,
    minHeight: height * 0.035,
  },
  filterText: {
    color: "#FFC107",
    marginLeft: width * 0.015,
    fontSize: Math.min(width * 0.036, 15),
    fontWeight: "600",
  },
  filterTextSmall: { fontSize: Math.min(width * 0.034, 14), marginLeft: width * 0.01 },
  filterTextLarge: { fontSize: Math.min(width * 0.038, 16), marginLeft: width * 0.02 },
  filterTextShort: { fontSize: Math.min(width * 0.033, 13), marginLeft: width * 0.008 },

  // ─── Rides List ───────────────────────────────────────────────────────────
  ridesContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: Platform.OS === 'ios' ? height * 0.04 : height * 0.02,
    flexGrow: 1,
  },
  ridesContentSmall: {
    paddingHorizontal: width * 0.04,
    paddingBottom: Platform.OS === 'ios' ? height * 0.03 : height * 0.015,
  },
  ridesContentLarge: {
    paddingHorizontal: width * 0.06,
    paddingBottom: Platform.OS === 'ios' ? height * 0.05 : height * 0.025,
  },
  ridesContentTablet: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  ridesContentShort: {
    paddingHorizontal: width * 0.04,
    paddingBottom: Platform.OS === 'ios' ? height * 0.02 : height * 0.01,
  },
  emptyRidesContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // ─── Loading & Empty ──────────────────────────────────────────────────────
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: '#888',
    fontSize: Math.min(width * 0.04, 16),
    marginTop: height * 0.01,
  },
  loadingTextSmall: { fontSize: Math.min(width * 0.038, 15), marginTop: height * 0.008 },
  loadingTextLarge: { fontSize: Math.min(width * 0.042, 18), marginTop: height * 0.012 },
  loadingTextShort: { fontSize: Math.min(width * 0.036, 14), marginTop: height * 0.006 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: height * 0.05,
    flex: 1,
  },
  emptyStateSmall: { padding: height * 0.04 },
  emptyStateLarge: { padding: height * 0.06 },
  emptyStateShort: { padding: height * 0.03 },
  emptyStateText: {
    color: '#666',
    fontSize: Math.min(width * 0.04, 16),
    marginTop: height * 0.01,
    textAlign: 'center',
  },
  emptyStateTextSmall: { fontSize: Math.min(width * 0.038, 15), marginTop: height * 0.008 },
  emptyStateTextLarge: { fontSize: Math.min(width * 0.042, 18), marginTop: height * 0.012 },
  emptyStateTextShort: { fontSize: Math.min(width * 0.036, 14), marginTop: height * 0.006 },

  // ─── Cards ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: Math.min(width * 0.03, 12),
    padding: width * 0.04,
    marginBottom: height * 0.016,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
    minHeight: height * 0.15,
  },
  cardSmall: {
    borderRadius: Math.min(width * 0.025, 10),
    padding: width * 0.035,
    marginBottom: height * 0.012,
    minHeight: height * 0.14,
  },
  cardLarge: {
    borderRadius: Math.min(width * 0.035, 14),
    padding: width * 0.045,
    marginBottom: height * 0.02,
    minHeight: height * 0.16,
  },
  cardTablet: { maxWidth: 500, alignSelf: 'center' },
  cardShort: {
    marginBottom: height * 0.01,
    padding: width * 0.03,
    minHeight: height * 0.14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.012,
    paddingBottom: height * 0.012,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cardHeaderSmall: { marginBottom: height * 0.01, paddingBottom: height * 0.01 },
  cardHeaderLarge: { marginBottom: height * 0.015, paddingBottom: height * 0.015 },
  cardHeaderShort: { marginBottom: height * 0.008, paddingBottom: height * 0.008 },
  dateText: {
    color: '#888',
    fontSize: Math.min(width * 0.035, 14),
    flex: 1,
  },
  dateTextSmall: { fontSize: Math.min(width * 0.033, 13) },
  dateTextLarge: { fontSize: Math.min(width * 0.037, 15) },
  dateTextShort: { fontSize: Math.min(width * 0.032, 12) },

  // ─── Status Badge (card) ──────────────────────────────────────────────────
  statusBadge: {
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.005,
    borderRadius: 4,
  },
  statusBadgeSmall: {
    paddingHorizontal: width * 0.018,
    paddingVertical: height * 0.004,
  },
  statusBadgeLarge: {
    paddingHorizontal: width * 0.022,
    paddingVertical: height * 0.006,
  },
  statusBadgeShort: {
    paddingHorizontal: width * 0.015,
    paddingVertical: height * 0.003,
  },
  statusCompleted: { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
  statusCancelled: { backgroundColor: 'rgba(244, 67, 54, 0.15)' },
  statusText: {
    color: '#fff',
    fontSize: Math.min(width * 0.03, 12),
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  statusTextSmall: { fontSize: Math.min(width * 0.028, 11) },
  statusTextLarge: { fontSize: Math.min(width * 0.032, 13) },
  statusTextShort: { fontSize: Math.min(width * 0.027, 10) },

  // ─── Locations ────────────────────────────────────────────────────────────
  locationsContainer: { marginBottom: height * 0.012 },
  locationsContainerShort: { marginBottom: height * 0.008 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.004,
    minHeight: height * 0.02,
  },
  locationRowSmall: { marginBottom: height * 0.003, minHeight: height * 0.018 },
  locationRowShort: { marginBottom: height * 0.002, minHeight: height * 0.016 },
  dot: {
    width: Math.min(width * 0.018, 8),
    height: Math.min(width * 0.018, 8),
    borderRadius: Math.min(width * 0.009, 4),
    marginRight: width * 0.025,
  },
  greenDot: { backgroundColor: '#4CAF50' },
  redDot: { backgroundColor: '#FF5252' },
  verticalLine: {
    height: height * 0.015,
    width: 1,
    backgroundColor: '#444',
    marginLeft: width * 0.008,
    marginVertical: height * 0.002,
  },
  verticalLineSmall: { height: height * 0.012 },
  verticalLineShort: { height: height * 0.01 },
  addressText: {
    color: 'white',
    fontSize: Math.min(width * 0.038, 15),
    flex: 1,
  },
  addressTextSmall: { fontSize: Math.min(width * 0.036, 14) },
  addressTextLarge: { fontSize: Math.min(width * 0.04, 16) },
  addressTextShort: { fontSize: Math.min(width * 0.034, 13) },

  // ─── Card Footer ──────────────────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: height * 0.008,
    paddingTop: height * 0.012,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cardFooterSmall: { marginTop: height * 0.006, paddingTop: height * 0.01 },
  cardFooterLarge: { marginTop: height * 0.01, paddingTop: height * 0.015 },
  cardFooterShort: { marginTop: height * 0.004, paddingTop: height * 0.008 },
  priceLabel: { color: '#888', fontSize: Math.min(width * 0.035, 14) },
  priceLabelSmall: { fontSize: Math.min(width * 0.033, 13) },
  priceLabelLarge: { fontSize: Math.min(width * 0.037, 15) },
  priceLabelShort: { fontSize: Math.min(width * 0.032, 12) },
  priceText: {
    color: '#FFC107',
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: 'bold',
  },
  priceTextSmall: { fontSize: Math.min(width * 0.042, 17) },
  priceTextLarge: { fontSize: Math.min(width * 0.048, 20) },
  priceTextShort: { fontSize: Math.min(width * 0.04, 16) },

  // ─── Modal ────────────────────────────────────────────────────────────────
  // FIX: removed `height: 'fit-content'` (invalid in RN — caused the Yoga crash)
  bookingDetailsContainer: {
    borderWidth: 1,
    borderColor: '#444',
    padding: 5,
  },
  receiptScrollContent: { paddingBottom: 20 },
  receiptScrollContentShort: { paddingBottom: 10 },

  detailSection: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  // For values shown inline in a detailRow (right-aligned, bounded width)
  detailValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  // Wider value for things like date that need more room
  detailValueWide: {
    maxWidth: '70%',
  },
  // For values shown below a label (full width, left-aligned)
  detailValueFull: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },

  // ─── Modal Status Badge (separate from card badge to avoid duplicate key) ─
  modalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: 'rgba(247, 183, 49, 0.2)',
  },
  modalStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // ─── Total Section ────────────────────────────────────────────────────────
  totalSection: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    padding: 5,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  totalLabel: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  totalValue: {
    color: '#000',
    fontSize: 26,
    fontWeight: '900',
  },
});