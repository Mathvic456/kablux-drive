import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert, Platform, ScrollView, useWindowDimensions, Dimensions } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { useRideHistory } from '../../services/rideHistory.service';
import { Ionicons } from "@expo/vector-icons";

// Expo Imports
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function Bookings() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;

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
          isTablet && styles.cardTablet
        ]} 
        activeOpacity={0.7}
        onPress={() => openReceiptModal(item)}
      >
        <View style={[
          styles.cardHeader,
          isSmallScreen && styles.cardHeaderSmall,
          isLargeScreen && styles.cardHeaderLarge
        ]}>
          <Text style={[
            styles.dateText,
            isSmallScreen && styles.dateTextSmall,
            isLargeScreen && styles.dateTextLarge
          ]}>{formatDate(item.start_time)}</Text>
          <View style={[
            styles.statusBadge, 
            item.status === 'cancelled' ? styles.statusCancelled : styles.statusCompleted,
            isSmallScreen && styles.statusBadgeSmall,
            isLargeScreen && styles.statusBadgeLarge
          ]}>
            <Text style={[
              styles.statusText,
              isSmallScreen && styles.statusTextSmall,
              isLargeScreen && styles.statusTextLarge
            ]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.locationsContainer}>
          <View style={[
            styles.locationRow,
            isSmallScreen && styles.locationRowSmall
          ]}>
            <View style={[styles.dot, styles.greenDot]} />
            <Text style={[
              styles.addressText,
              isSmallScreen && styles.addressTextSmall,
              isLargeScreen && styles.addressTextLarge
            ]} numberOfLines={1}>
              {item.pickup_address || "Unknown Pickup"}
            </Text>
          </View>
          
          <View style={[
            styles.verticalLine,
            isSmallScreen && styles.verticalLineSmall
          ]} />

          <View style={[
            styles.locationRow,
            isSmallScreen && styles.locationRowSmall
          ]}>
            <View style={[styles.dot, styles.redDot]} />
            <Text style={[
              styles.addressText,
              isSmallScreen && styles.addressTextSmall,
              isLargeScreen && styles.addressTextLarge
            ]} numberOfLines={1}>
              {item.dropoff_address || "Unknown Destination"}
            </Text>
          </View>
        </View>

        <View style={[
          styles.cardFooter,
          isSmallScreen && styles.cardFooterSmall,
          isLargeScreen && styles.cardFooterLarge
        ]}>
          <Text style={[
            styles.priceLabel,
            isSmallScreen && styles.priceLabelSmall,
            isLargeScreen && styles.priceLabelLarge
          ]}>Total Fare</Text>
          <Text style={[
            styles.priceText,
            isSmallScreen && styles.priceTextSmall,
            isLargeScreen && styles.priceTextLarge
          ]}>{formatCurrency(item.fare)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isPending && !refreshing) {
    return (
      <View style={[styles.centerContainer, { height }]}>
        <ActivityIndicator 
          size={isSmallScreen ? "large" : "large"} 
          color="#FFC107" 
        />
        <Text style={[
          styles.loadingText,
          isSmallScreen && styles.loadingTextSmall,
          isLargeScreen && styles.loadingTextLarge
        ]}>Loading rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.header,
        isSmallScreen && styles.headerSmall,
        isLargeScreen && styles.headerLarge,
        isTablet && styles.headerTablet
      ]}>
        <Text style={[
          styles.headerTitle,
          isSmallScreen && styles.headerTitleSmall,
          isLargeScreen && styles.headerTitleLarge
        ]}>Bookings</Text>
      </View>

      <View style={[
        styles.tabsContainer,
        isSmallScreen && styles.tabsContainerSmall,
        isLargeScreen && styles.tabsContainerLarge,
        isTablet && styles.tabsContainerTablet
      ]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isSmallScreen && styles.tabSmall,
              isLargeScreen && styles.tabLarge,
              activeTab === tab.id && styles.tabActive
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              isSmallScreen && styles.tabTextSmall,
              isLargeScreen && styles.tabTextLarge,
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
        isTablet && styles.filterContainerTablet
      ]}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            isSmallScreen && styles.filterButtonSmall,
            isLargeScreen && styles.filterButtonLarge,
            isTablet && styles.filterButtonTablet
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
            size={isSmallScreen ? 14 : 16} 
            color="#FFC107" 
          />
          <Text style={[
            styles.filterText,
            isSmallScreen && styles.filterTextSmall,
            isLargeScreen && styles.filterTextLarge
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
          isTablet && styles.ridesContentTablet
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFC107"
          />
        }
        ListEmptyComponent={
           <View style={[
             styles.emptyState,
             isSmallScreen && styles.emptyStateSmall,
             isLargeScreen && styles.emptyStateLarge
           ]}>
             <Ionicons name="car-outline" size={isSmallScreen ? 40 : 48} color="#666" />
             <Text style={[
               styles.emptyStateText,
               isSmallScreen && styles.emptyStateTextSmall,
               isLargeScreen && styles.emptyStateTextLarge
             ]}>No rides found</Text>
           </View>
        }
      />

      {/* --- RECEIPT MODAL --- */}
      {showReceiptModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showReceiptModal}
          onRequestClose={closeReceiptModal}
          statusBarTranslucent={true}
        >
          <View style={[
            styles.modalOverlay,
            isTablet && styles.modalOverlayTablet
          ]}>
            <View style={[
              styles.modalContent,
              isSmallScreen && styles.modalContentSmall,
              isLargeScreen && styles.modalContentLarge,
              isTablet && styles.modalContentTablet
            ]}>
              {selectedReceipt && (
                <>
                  <View style={[
                    styles.modalHeader,
                    isSmallScreen && styles.modalHeaderSmall,
                    isLargeScreen && styles.modalHeaderLarge
                  ]}>
                    <Text style={[
                      styles.modalTitle,
                      isSmallScreen && styles.modalTitleSmall,
                      isLargeScreen && styles.modalTitleLarge
                    ]}>Trip Details</Text>
                    <TouchableOpacity onPress={closeReceiptModal}>
                      <Ionicons 
                        name="close" 
                        size={isSmallScreen ? 24 : 28} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    style={styles.receiptScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.receiptScrollContent,
                      isSmallScreen && styles.receiptScrollContentSmall
                    ]}
                  >
                    <View style={[
                      styles.receiptDetail,
                      isSmallScreen && styles.receiptDetailSmall,
                      isLargeScreen && styles.receiptDetailLarge
                    ]}>
                      
                      {/* ID & Status */}
                      <View style={[
                        styles.receiptHeader,
                        isSmallScreen && styles.receiptHeaderSmall,
                        isLargeScreen && styles.receiptHeaderLarge
                      ]}>
                        <Text style={[
                          styles.receiptId,
                          isSmallScreen && styles.receiptIdSmall,
                          isLargeScreen && styles.receiptIdLarge
                        ]}>Trip #{selectedReceipt.id || 'N/A'}</Text>
                        <View style={[
                          styles.statusBadge,
                          selectedReceipt.status === 'completed' ? styles.statusCompleted : 
                          selectedReceipt.status === 'cancelled' ? styles.statusCancelled :
                          { backgroundColor: 'rgba(247, 183, 49, 0.2)' },
                          isSmallScreen && styles.statusBadgeSmall,
                          isLargeScreen && styles.statusBadgeLarge
                        ]}>
                          <Text style={[
                            styles.statusText,
                            isSmallScreen && styles.statusTextSmall,
                            isLargeScreen && styles.statusTextLarge
                          ]}>{(selectedReceipt.status || "unknown").toUpperCase()}</Text>
                        </View>
                      </View>

                      {/* Details List */}
                      <View style={[
                        styles.detailRow,
                        isSmallScreen && styles.detailRowSmall,
                        isLargeScreen && styles.detailRowLarge
                      ]}>
                        <Text style={[
                          styles.detailLabel,
                          isSmallScreen && styles.detailLabelSmall,
                          isLargeScreen && styles.detailLabelLarge
                        ]}>Date</Text>
                        <Text style={[
                          styles.detailValue,
                          isSmallScreen && styles.detailValueSmall,
                          isLargeScreen && styles.detailValueLarge
                        ]} numberOfLines={2}>
                          {formatDate(selectedReceipt.start_time)}
                        </Text>
                      </View>

                      <View style={[
                        styles.detailRow,
                        isSmallScreen && styles.detailRowSmall,
                        isLargeScreen && styles.detailRowLarge
                      ]}>
                        <Text style={[
                          styles.detailLabel,
                          isSmallScreen && styles.detailLabelSmall,
                          isLargeScreen && styles.detailLabelLarge
                        ]}>Pickup</Text>
                        <Text style={[
                          styles.detailValue,
                          isSmallScreen && styles.detailValueSmall,
                          isLargeScreen && styles.detailValueLarge
                        ]} numberOfLines={2}>
                          {selectedReceipt.pickup_address || 'N/A'}
                        </Text>
                      </View>

                      <View style={[
                        styles.detailRow,
                        isSmallScreen && styles.detailRowSmall,
                        isLargeScreen && styles.detailRowLarge
                      ]}>
                        <Text style={[
                          styles.detailLabel,
                          isSmallScreen && styles.detailLabelSmall,
                          isLargeScreen && styles.detailLabelLarge
                        ]}>Drop-off</Text>
                        <Text style={[
                          styles.detailValue,
                          isSmallScreen && styles.detailValueSmall,
                          isLargeScreen && styles.detailValueLarge
                        ]} numberOfLines={2}>
                          {selectedReceipt.dropoff_address || 'N/A'}
                        </Text>
                      </View>

                      <View style={[
                        styles.detailRow,
                        isSmallScreen && styles.detailRowSmall,
                        isLargeScreen && styles.detailRowLarge
                      ]}>
                        <Text style={[
                          styles.detailLabel,
                          isSmallScreen && styles.detailLabelSmall,
                          isLargeScreen && styles.detailLabelLarge
                        ]}>Rider</Text>
                        <Text style={[
                          styles.detailValue,
                          isSmallScreen && styles.detailValueSmall,
                          isLargeScreen && styles.detailValueLarge
                        ]}>
                          {selectedReceipt.rider_name || 'Rider'}
                        </Text>
                      </View>

                      <View style={[
                        styles.totalSection,
                        isSmallScreen && styles.totalSectionSmall,
                        isLargeScreen && styles.totalSectionLarge
                      ]}>
                        <Text style={[
                          styles.totalLabel,
                          isSmallScreen && styles.totalLabelSmall,
                          isLargeScreen && styles.totalLabelLarge
                        ]}>TOTAL EARNINGS</Text>
                        <Text style={[
                          styles.totalValue,
                          isSmallScreen && styles.totalValueSmall,
                          isLargeScreen && styles.totalValueLarge
                        ]}>
                          {formatCurrency(selectedReceipt.fare)}
                        </Text>
                      </View>
                      
                      <View style={[
                        styles.noteSection,
                        isSmallScreen && styles.noteSectionSmall,
                        isLargeScreen && styles.noteSectionLarge
                      ]}>
                        <Text style={[
                          styles.noteText,
                          isSmallScreen && styles.noteTextSmall,
                          isLargeScreen && styles.noteTextLarge
                        ]}>
                          Tap "Download Waybill" below to save a PDF receipt of this trip.
                        </Text>
                      </View>
                    </View>
                  </ScrollView>

                  {/* Download Button */}
                  <TouchableOpacity 
                    style={[
                      styles.downloadButton,
                      isSmallScreen && styles.downloadButtonSmall,
                      isLargeScreen && styles.downloadButtonLarge,
                      isTablet && styles.downloadButtonTablet
                    ]}
                    onPress={() => downloadReceipt(selectedReceipt)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <ActivityIndicator 
                        color="#000" 
                        size={isSmallScreen ? "small" : "small"} 
                      />
                    ) : (
                      <>
                        <Ionicons 
                          name="download" 
                          size={isSmallScreen ? 18 : 20} 
                          color="#000" 
                        />
                        <Text style={[
                          styles.downloadButtonText,
                          isSmallScreen && styles.downloadButtonTextSmall,
                          isLargeScreen && styles.downloadButtonTextLarge
                        ]}>Download Waybill</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  header: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
    borderBottomColor: '#333',
  },
  headerSmall: {
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.015,
  },
  headerLarge: {
    paddingHorizontal: width * 0.06,
    paddingBottom: height * 0.025,
  },
  headerTablet: {
    paddingHorizontal: width * 0.08,
    paddingBottom: height * 0.03,
  },
  headerTitle: {
    color: 'white',
    fontSize: width * 0.06,
    fontWeight: '700',
  },
  headerTitleSmall: {
    fontSize: width * 0.055,
  },
  headerTitleLarge: {
    fontSize: width * 0.065,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: width * 0.05,
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
    marginBottom: height * 0.015,
    borderRadius: 20,
    padding: 3,
    gap: width * 0.008,
  },
  tabsContainerLarge: {
    marginHorizontal: width * 0.06,
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
  tabActive: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#888',
    fontSize: width * 0.037,
    fontWeight: '600',
  },
  tabTextSmall: {
    fontSize: width * 0.035,
  },
  tabTextLarge: {
    fontSize: width * 0.039,
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '700',
  },
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
  ridesContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.04,
  },
  ridesContentSmall: {
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.03,
  },
  ridesContentLarge: {
    paddingHorizontal: width * 0.06,
    paddingBottom: height * 0.05,
  },
  ridesContentTablet: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: width * 0.04,
    marginTop: height * 0.01,
  },
  loadingTextSmall: {
    fontSize: width * 0.038,
    marginTop: height * 0.008,
  },
  loadingTextLarge: {
    fontSize: width * 0.042,
    marginTop: height * 0.012,
  },
  emptyState: {
    alignItems: 'center',
    padding: height * 0.05,
    marginTop: height * 0.05,
  },
  emptyStateSmall: {
    padding: height * 0.04,
    marginTop: height * 0.03,
  },
  emptyStateLarge: {
    padding: height * 0.06,
    marginTop: height * 0.07,
  },
  emptyStateText: {
    color: '#666',
    fontSize: width * 0.04,
    marginTop: height * 0.01,
  },
  emptyStateTextSmall: {
    fontSize: width * 0.038,
    marginTop: height * 0.008,
  },
  emptyStateTextLarge: {
    fontSize: width * 0.042,
    marginTop: height * 0.012,
  },
  // --- CARD STYLES ---
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: width * 0.03,
    padding: width * 0.04,
    marginBottom: height * 0.016,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
  },
  cardSmall: {
    borderRadius: width * 0.025,
    padding: width * 0.035,
    marginBottom: height * 0.012,
  },
  cardLarge: {
    borderRadius: width * 0.035,
    padding: width * 0.045,
    marginBottom: height * 0.02,
  },
  cardTablet: {
    maxWidth: 500,
    alignSelf: 'center',
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
  dateText: {
    color: '#888',
    fontSize: width * 0.035,
  },
  dateTextSmall: {
    fontSize: width * 0.033,
  },
  dateTextLarge: {
    fontSize: width * 0.037,
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
  statusCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  statusText: {
    color: '#fff',
    fontSize: width * 0.03,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  statusTextSmall: {
    fontSize: width * 0.028,
  },
  statusTextLarge: {
    fontSize: width * 0.032,
  },
  locationsContainer: {
    marginBottom: height * 0.012,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.004,
  },
  locationRowSmall: {
    marginBottom: height * 0.003,
  },
  dot: {
    width: width * 0.018,
    height: width * 0.018,
    borderRadius: width * 0.009,
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
  addressText: {
    color: 'white',
    fontSize: width * 0.038,
    flex: 1,
  },
  addressTextSmall: {
    fontSize: width * 0.036,
  },
  addressTextLarge: {
    fontSize: width * 0.04,
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
  priceLabel: {
    color: '#888',
    fontSize: width * 0.035,
  },
  priceLabelSmall: {
    fontSize: width * 0.033,
  },
  priceLabelLarge: {
    fontSize: width * 0.037,
  },
  priceText: {
    color: '#FFC107',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  priceTextSmall: {
    fontSize: width * 0.042,
  },
  priceTextLarge: {
    fontSize: width * 0.048,
  },
  // --- FILTER STYLES ---
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
  filterText: {
    color: "#FFC107",
    marginLeft: width * 0.015,
    fontSize: width * 0.036,
    fontWeight: "600",
  },
  filterTextSmall: {
    fontSize: width * 0.034,
    marginLeft: width * 0.01,
  },
  filterTextLarge: {
    fontSize: width * 0.038,
    marginLeft: width * 0.02,
  },
  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
  },
  modalOverlayTablet: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#1E1E1E',
    borderRadius: width * 0.05,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalContentSmall: {
    borderRadius: width * 0.04,
    maxHeight: '95%',
  },
  modalContentLarge: {
    borderRadius: width * 0.06,
    maxHeight: '85%',
  },
  modalContentTablet: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "85%",
    borderRadius: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: width * 0.05,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalHeaderSmall: {
    padding: width * 0.04,
  },
  modalHeaderLarge: {
    padding: width * 0.06,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#fff',
  },
  modalTitleSmall: {
    fontSize: width * 0.045,
  },
  modalTitleLarge: {
    fontSize: width * 0.055,
  },
  receiptScroll: {
    flex: 1,
  },
  receiptScrollContent: {
    paddingBottom: height * 0.02,
  },
  receiptScrollContentSmall: {
    paddingBottom: height * 0.015,
  },
  receiptDetail: {
    padding: width * 0.05,
  },
  receiptDetailSmall: {
    padding: width * 0.04,
  },
  receiptDetailLarge: {
    padding: width * 0.06,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    paddingBottom: height * 0.016,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  receiptHeaderSmall: {
    marginBottom: height * 0.015,
    paddingBottom: height * 0.012,
  },
  receiptHeaderLarge: {
    marginBottom: height * 0.025,
    paddingBottom: height * 0.02,
  },
  receiptId: {
    color: '#888',
    fontSize: width * 0.035,
    fontWeight: '600',
  },
  receiptIdSmall: {
    fontSize: width * 0.033,
  },
  receiptIdLarge: {
    fontSize: width * 0.037,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.016,
    paddingBottom: height * 0.016,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  detailRowSmall: {
    marginBottom: height * 0.012,
    paddingBottom: height * 0.012,
  },
  detailRowLarge: {
    marginBottom: height * 0.02,
    paddingBottom: height * 0.02,
  },
  detailLabel: {
    color: '#888',
    fontSize: width * 0.035,
    flex: 1,
  },
  detailLabelSmall: {
    fontSize: width * 0.033,
  },
  detailLabelLarge: {
    fontSize: width * 0.037,
  },
  detailValue: {
    color: '#fff',
    fontSize: width * 0.038,
    fontWeight: '600',
    textAlign: 'right',
    flex: 2,
    marginLeft: width * 0.02,
  },
  detailValueSmall: {
    fontSize: width * 0.036,
  },
  detailValueLarge: {
    fontSize: width * 0.04,
  },
  totalSection: {
    backgroundColor: '#FFC107',
    borderRadius: width * 0.03,
    padding: width * 0.05,
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
  },
  totalSectionSmall: {
    borderRadius: width * 0.025,
    padding: width * 0.04,
    marginTop: height * 0.015,
    marginBottom: height * 0.015,
  },
  totalSectionLarge: {
    borderRadius: width * 0.035,
    padding: width * 0.06,
    marginTop: height * 0.025,
    marginBottom: height * 0.025,
  },
  totalLabel: {
    color: '#000',
    fontSize: width * 0.035,
    fontWeight: '700',
    marginBottom: height * 0.005,
  },
  totalLabelSmall: {
    fontSize: width * 0.033,
  },
  totalLabelLarge: {
    fontSize: width * 0.037,
  },
  totalValue: {
    color: '#000',
    fontSize: width * 0.065,
    fontWeight: '800',
  },
  totalValueSmall: {
    fontSize: width * 0.06,
  },
  totalValueLarge: {
    fontSize: width * 0.07,
  },
  noteSection: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: width * 0.02,
    padding: width * 0.03,
    marginTop: height * 0.01,
    marginBottom: height * 0.01,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  noteSectionSmall: {
    borderRadius: width * 0.015,
    padding: width * 0.025,
  },
  noteSectionLarge: {
    borderRadius: width * 0.025,
    padding: width * 0.035,
  },
  noteText: {
    color: '#FFC107',
    fontSize: width * 0.032,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noteTextSmall: {
    fontSize: width * 0.03,
  },
  noteTextLarge: {
    fontSize: width * 0.034,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC107',
    padding: height * 0.016,
    margin: width * 0.05,
    borderRadius: width * 0.04,
    gap: width * 0.02,
    minHeight: height * 0.06,
  },
  downloadButtonSmall: {
    padding: height * 0.014,
    margin: width * 0.04,
    borderRadius: width * 0.035,
    minHeight: height * 0.055,
  },
  downloadButtonLarge: {
    padding: height * 0.018,
    margin: width * 0.06,
    borderRadius: width * 0.045,
    minHeight: height * 0.065,
  },
  downloadButtonTablet: {
    maxWidth: 400,
    alignSelf: 'center',
  },
  downloadButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: width * 0.04,
  },
  downloadButtonTextSmall: {
    fontSize: width * 0.038,
  },
  downloadButtonTextLarge: {
    fontSize: width * 0.042,
  },
});