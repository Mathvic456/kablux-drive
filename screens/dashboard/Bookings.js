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
  const isSmallScreen = width < 375; // iPhone SE, small Android
  const isMediumScreen = width >= 375 && width <= 414; // iPhone 12-15, most Android
  const isLargeScreen = width > 414; // iPhone Plus/Pro Max
  const isTablet = width > 768;
  const screenHeight = Dimensions.get('window').height;
  const isShortScreen = screenHeight < 700; // Small height devices

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
    const serviceType = "Standard Ride"; 

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ride Waybill - ${ride.id || 'N/A'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Helvetica, sans-serif; line-height: 1.6; color: #333; padding: 20px; background-color: #f5f5f5; }
          .receipt-container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 30px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .header h1 { font-size: 24px; font-weight: bold; }
          .header h2 { color: #FFC107; font-size: 18px; margin-top: 5px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
          .label { color: #666; font-weight: bold; }
          .value { text-align: right; max-width: 60%; }
          .total-section { background-color: #FFF8E1; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>KABLUX DRIVER</h1>
            <h2>Trip Summary</h2>
            <div style="color:#888; font-size:12px; margin-top:5px;">ID: ${ride.id || 'N/A'}</div>
          </div>
          
          <div class="info-row">
            <span class="label">Date</span>
            <span class="value">${formattedDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Pickup</span>
            <span class="value">${ride.pickup_address || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Drop-off</span>
            <span class="value">${ride.dropoff_address || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Rider</span>
            <span class="value">${ride.rider_name || 'Kablux Rider'}</span>
          </div>
          <div class="info-row">
            <span class="label">Status</span>
            <span class="value" style="text-transform:uppercase;">${ride.status}</span>
          </div>

          <div class="total-section">
            <div class="total-row">
              <span>EARNINGS</span>
              <span>${formattedFare}</span>
            </div>
          </div>
          
          <div class="footer">
            Generated via Kablux Driver App
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
      const safeId = String(ride.id || Date.now()).replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `Kablux_Trip_${safeId}.pdf`;

      const { uri: tempUri } = await Print.printToFileAsync({ html, base64: true });

      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              'application/pdf'
            );
            const fileString = await FileSystem.readAsStringAsync(tempUri, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.writeAsStringAsync(newFileUri, fileString, { encoding: FileSystem.EncodingType.Base64 });
            Alert.alert('Success', 'Receipt saved to Downloads');
            return;
          }
        } catch (e) {
          console.log("SAF failed, falling back to share");
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Trip Summary',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing not available');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const openReceiptModal = (ride) => {
    console.log('Opening receipt modal for ride:', ride.id);
    setSelectedReceipt(ride);
    setShowReceiptModal(true);
  };

  const closeReceiptModal = () => {
    console.log('Closing receipt modal');
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

  // --- RENDER ITEM COMPONENT ---

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
        <View style={[styles.centerContainer, { height: height }]}>
          <ActivityIndicator 
            size={isSmallScreen ? "large" : "large"} 
            color="#FFC107" 
          />
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
          confirmText="Download Waybill"
          closeText="Close"
          containerStyle={styles.bookingDetailsContainer}
          confirmButtonColor="#FFC107"
          themeColor="#FFC107"
          onConfirm={() => downloadReceipt(selectedReceipt)}
          maxHeight={isShortScreen ? '65%' : '70%'}
        >
          {selectedReceipt && (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.receiptScrollContent,
                isShortScreen && styles.receiptScrollContentShort
              ]}
            >
              {/* Trip ID & Status */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trip ID</Text>
                  <Text style={styles.detailValue}>#{selectedReceipt.id || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[
                    styles.statusBadge,
                    selectedReceipt.status === 'completed' ? styles.statusCompleted : 
                    selectedReceipt.status === 'cancelled' ? styles.statusCancelled :
                    { backgroundColor: 'rgba(247, 183, 49, 0.2)' }
                  ]}>
                    <Text style={styles.statusText}>{(selectedReceipt.status || "unknown").toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              {/* Date */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(selectedReceipt.start_time)}</Text>
              </View>

              {/* Pickup Location */}
              <View style={styles.detailSection}>
                <View style={styles.locationHeader}>
                  <Ionicons name="ellipse" size={10} color="#4CAF50" />
                  <Text style={styles.detailLabel}>Pickup Location</Text>
                </View>
                <Text style={styles.detailValue}>{selectedReceipt.pickup_address || 'N/A'}</Text>
              </View>

              {/* Dropoff Location */}
              <View style={styles.detailSection}>
                <View style={styles.locationHeader}>
                  <Ionicons name="location" size={10} color="#FF5252" />
                  <Text style={styles.detailLabel}>Drop-off Location</Text>
                </View>
                <Text style={styles.detailValue}>{selectedReceipt.dropoff_address || 'N/A'}</Text>
              </View>

              {/* Rider */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Rider</Text>
                <Text style={styles.detailValue}>{selectedReceipt.rider_name || 'Rider'}</Text>
              </View>

              {/* Total Earnings */}
              <View style={[styles.detailSection, styles.totalSection]}>
                <Text style={styles.totalLabel}>Total Earnings</Text>
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
  // Header
  header: {
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bookingDetailsContainer:{
    borderWidth:1,
    borderColor:'#444',
    height:'fit-content',
    padding: 5
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
  headerTitleSmall: {
    fontSize: Math.min(width * 0.065, 24),
  },
  headerTitleLarge: {
    fontSize: Math.min(width * 0.075, 32),
  },
  headerTitleShort: {
    fontSize: Math.min(width * 0.06, 22),
  },
  // Tabs
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
  tabSmall: {
    paddingVertical: height * 0.01,
    borderRadius: 18,
  },
  tabLarge: {
    paddingVertical: height * 0.014,
    borderRadius: 22,
  },
  tabShort: {
    paddingVertical: height * 0.008,
    borderRadius: 18,
  },
  tabActive: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#888',
    fontSize: Math.min(width * 0.037, 16),
    fontWeight: '600',
  },
  tabTextSmall: {
    fontSize: Math.min(width * 0.035, 14),
  },
  tabTextLarge: {
    fontSize: Math.min(width * 0.039, 18),
  },
  tabTextShort: {
    fontSize: Math.min(width * 0.034, 13),
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  // Filter
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
  filterContainerShort: {
    marginBottom: height * 0.008,
  },
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
  filterTextSmall: {
    fontSize: Math.min(width * 0.034, 14),
    marginLeft: width * 0.01,
  },
  filterTextLarge: {
    fontSize: Math.min(width * 0.038, 16),
    marginLeft: width * 0.02,
  },
  filterTextShort: {
    fontSize: Math.min(width * 0.033, 13),
    marginLeft: width * 0.008,
  },
  // Rides List
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
  // Loading & Empty States
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
  loadingTextSmall: {
    fontSize: Math.min(width * 0.038, 15),
    marginTop: height * 0.008,
  },
  loadingTextLarge: {
    fontSize: Math.min(width * 0.042, 18),
    marginTop: height * 0.012,
  },
  loadingTextShort: {
    fontSize: Math.min(width * 0.036, 14),
    marginTop: height * 0.006,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: height * 0.05,
    flex: 1,
  },
  emptyStateSmall: {
    padding: height * 0.04,
  },
  emptyStateLarge: {
    padding: height * 0.06,
  },
  emptyStateShort: {
    padding: height * 0.03,
  },
  emptyStateText: {
    color: '#666',
    fontSize: Math.min(width * 0.04, 16),
    marginTop: height * 0.01,
    textAlign: 'center',
  },
  emptyStateTextSmall: {
    fontSize: Math.min(width * 0.038, 15),
    marginTop: height * 0.008,
  },
  emptyStateTextLarge: {
    fontSize: Math.min(width * 0.042, 18),
    marginTop: height * 0.012,
  },
  emptyStateTextShort: {
    fontSize: Math.min(width * 0.036, 14),
    marginTop: height * 0.006,
  },
  // Card Styles
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
  cardTablet: {
    maxWidth: 500,
    alignSelf: 'center',
  },
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
  cardHeaderSmall: {
    marginBottom: height * 0.01,
    paddingBottom: height * 0.01,
  },
  cardHeaderLarge: {
    marginBottom: height * 0.015,
    paddingBottom: height * 0.015,
  },
  cardHeaderShort: {
    marginBottom: height * 0.008,
    paddingBottom: height * 0.008,
  },
  dateText: {
    color: '#888',
    fontSize: Math.min(width * 0.035, 14),
    flex: 1,
  },
  dateTextSmall: {
    fontSize: Math.min(width * 0.033, 13),
  },
  dateTextLarge: {
    fontSize: Math.min(width * 0.037, 15),
  },
  dateTextShort: {
    fontSize: Math.min(width * 0.032, 12),
  },
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
  statusCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  statusText: {
    color: '#fff',
    fontSize: Math.min(width * 0.03, 12),
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  statusTextSmall: {
    fontSize: Math.min(width * 0.028, 11),
  },
  statusTextLarge: {
    fontSize: Math.min(width * 0.032, 13),
  },
  statusTextShort: {
    fontSize: Math.min(width * 0.027, 10),
  },
  locationsContainer: {
    marginBottom: height * 0.012,
  },
  locationsContainerShort: {
    marginBottom: height * 0.008,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.004,
    minHeight: height * 0.02,
  },
  locationRowSmall: {
    marginBottom: height * 0.003,
    minHeight: height * 0.018,
  },
  locationRowShort: {
    marginBottom: height * 0.002,
    minHeight: height * 0.016,
  },
  dot: {
    width: Math.min(width * 0.018, 8),
    height: Math.min(width * 0.018, 8),
    borderRadius: Math.min(width * 0.009, 4),
    marginRight: width * 0.025,
  },
  greenDot: {
    backgroundColor: '#4CAF50',
  },
  redDot: {
    backgroundColor: '#FF5252',
  },
  verticalLine: {
    height: height * 0.015,
    width: 1,
    backgroundColor: '#444',
    marginLeft: width * 0.008,
    marginVertical: height * 0.002,
  },
  verticalLineSmall: {
    height: height * 0.012,
  },
  verticalLineShort: {
    height: height * 0.01,
  },
  addressText: {
    color: 'white',
    fontSize: Math.min(width * 0.038, 15),
    flex: 1,
  },
  addressTextSmall: {
    fontSize: Math.min(width * 0.036, 14),
  },
  addressTextLarge: {
    fontSize: Math.min(width * 0.04, 16),
  },
  addressTextShort: {
    fontSize: Math.min(width * 0.034, 13),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: height * 0.008,
    paddingTop: height * 0.012,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cardFooterSmall: {
    marginTop: height * 0.006,
    paddingTop: height * 0.01,
  },
  cardFooterLarge: {
    marginTop: height * 0.01,
    paddingTop: height * 0.015,
  },
  cardFooterShort: {
    marginTop: height * 0.004,
    paddingTop: height * 0.008,
  },
  priceLabel: {
    color: '#888',
    fontSize: Math.min(width * 0.035, 14),
  },
  priceLabelSmall: {
    fontSize: Math.min(width * 0.033, 13),
  },
  priceLabelLarge: {
    fontSize: Math.min(width * 0.037, 15),
  },
  priceLabelShort: {
    fontSize: Math.min(width * 0.032, 12),
  },
  priceText: {
    color: '#FFC107',
    fontSize: Math.min(width * 0.045, 18),
    fontWeight: 'bold',
  },
  priceTextSmall: {
    fontSize: Math.min(width * 0.042, 17),
  },
  priceTextLarge: {
    fontSize: Math.min(width * 0.048, 20),
  },
  priceTextShort: {
    fontSize: Math.min(width * 0.04, 16),
  },
  // Modal Styles
  receiptScrollContent: {
    paddingBottom: 20,
  },
  receiptScrollContentShort: {
    paddingBottom: 10,
  },
  detailSection: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderWidth: 2,
    // borderColor: '',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  totalSection: {
    backgroundColor: '#FFC107',
    alignItems: 'center',
    borderRadius: 8,
    // borderRadius: 8,
    // padding: 8,
    // alignItems: 'center',
    // marginTop: 5,
    // marginBottom: 0,
  },
  totalLabel: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  totalValue: {
    color: '#000',
    fontSize: 24,
    fontWeight: '800',
  },
});