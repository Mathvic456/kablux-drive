import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert, Platform, ScrollView } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { useRideHistory } from '../../services/rideHistory.service';
import { Ionicons } from "@expo/vector-icons";

// Expo Imports
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function Bookings() {
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
    // Handle string or number input safely
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
    // Driver app usually doesn't have "car type" in history, handled gracefully
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
      // Use index fallback if ID is missing to prevent filename errors
      const safeId = String(ride.id || Date.now()).replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `Kablux_Trip_${safeId}.pdf`;

      const { uri: tempUri } = await Print.printToFileAsync({ html, base64: true });

      // Android Storage Access Framework (SDK 30+)
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

      // iOS / Fallback
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
    setSelectedReceipt(ride);
    setShowReceiptModal(true);
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

  // --- RENDER ---

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => openReceiptModal(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formatDate(item.start_time)}</Text>
          <View style={[
            styles.statusBadge, 
            item.status === 'cancelled' ? styles.statusCancelled : styles.statusCompleted
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.locationsContainer}>
          <View style={styles.locationRow}>
            <View style={[styles.dot, styles.greenDot]} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickup_address || "Unknown Pickup"}
            </Text>
          </View>
          
          <View style={styles.verticalLine} />

          <View style={styles.locationRow}>
            <View style={[styles.dot, styles.redDot]} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.dropoff_address || "Unknown Destination"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.priceLabel}>Total Fare</Text>
          <Text style={styles.priceText}>{formatCurrency(item.fare)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isPending && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>Loading rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* FILTER BUTTON */}
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const filters = ["all", "today", "week", "month"];
            const next = (filters.indexOf(filter) + 1) % filters.length;
            setFilter(filters[next]);
          }}
        >
           <Ionicons name="filter" size={16} color="#FFC107" />
          <Text style={styles.filterText}>
             {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRides}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
        contentContainerStyle={styles.ridesContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFC107"
          />
        }
        ListEmptyComponent={
           <View style={styles.emptyState}>
             <Text style={styles.emptyStateText}>No rides found</Text>
           </View>
        }
      />

      {/* --- RECEIPT MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReceiptModal}
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReceipt && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Trip Details</Text>
                  <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.receiptScroll}>
                  <View style={styles.receiptDetail}>
                    
                    {/* ID & Status */}
                    <View style={styles.receiptHeader}>
                      <Text style={styles.receiptId}>Trip #{selectedReceipt.id || 'N/A'}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: selectedReceipt.status === 'completed' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(247, 183, 49, 0.2)' }
                      ]}>
                        <Text style={styles.statusText}>{(selectedReceipt.status || "unknown").toUpperCase()}</Text>
                      </View>
                    </View>

                    {/* Details List */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedReceipt.start_time)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Pickup</Text>
                      <Text style={styles.detailValue}>{selectedReceipt.pickup_address || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Drop-off</Text>
                      <Text style={styles.detailValue}>{selectedReceipt.dropoff_address || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rider</Text>
                      <Text style={styles.detailValue}>{selectedReceipt.rider_name || 'Rider'}</Text>
                    </View>

                    <View style={styles.totalSection}>
                      <Text style={styles.totalLabel}>TOTAL EARNINGS</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(selectedReceipt.fare)}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Download Button */}
                <TouchableOpacity 
                  style={styles.downloadButton}
                  onPress={() => downloadReceipt(selectedReceipt)}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Ionicons name="download" size={20} color="#000" />
                      <Text style={styles.downloadButtonText}>Download Waybill</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    gap: 5,
    borderRadius: 25,
    padding: 4,
    backgroundColor: '#111',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  ridesContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  // --- CARD STYLES ---
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dateText: {
    color: '#888',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
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
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  locationsContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  greenDot: {
    backgroundColor: '#4CAF50',
  },
  redDot: {
    backgroundColor: '#FF5252',
  },
  verticalLine: {
    height: 10,
    width: 1,
    backgroundColor: '#444',
    marginLeft: 3.5,
    marginVertical: 2,
  },
  addressText: {
    color: 'white',
    fontSize: 15,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  priceLabel: {
    color: '#888',
    fontSize: 14,
  },
  priceText: {
    color: '#FFC107',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // --- NEW STYLES FOR FILTER & MODAL ---
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFC107",
    alignSelf: "flex-start",
  },
  filterText: {
    color: "#FFC107",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  receiptScroll: {
    flex: 1,
  },
  receiptDetail: {
    padding: 20,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  receiptId: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  detailLabel: {
    color: '#888',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  totalSection: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  totalLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
  },
  totalValue: {
    color: '#000',
    fontSize: 26,
    fontWeight: '800',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC107',
    padding: 16,
    margin: 20,
    borderRadius: 16,
    gap: 8,
  },
  downloadButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});