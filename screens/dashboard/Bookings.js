import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import RideCard from '../components/RideCard'; // Make sure path matches your structure
import { useRideHistory } from '../../services/rideHistory.service';

export default function Bookings() {
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch ride history
  const { data: rideHistoryResponse, isPending, isError } = useRideHistory(true);

  const tabs = [
    { id: 'all', label: 'All Rides' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  // Filter rides based on active tab
  const getFilteredRides = () => {
    // Access .results safely
    const rides = rideHistoryResponse?.results || [];

    switch (activeTab) {
      case 'completed':
        return rides.filter(ride => ride.status?.toLowerCase() === 'completed');
      case 'cancelled':
        return rides.filter(ride => ride.status?.toLowerCase() === 'cancelled');
      case 'all':
      default:
        return rides;
    }
  };

  // CORRECTED MAPPING FUNCTION
  const mapRideToCardProps = (ride) => {
    // Format date from start_time
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      const time = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return `${month} ${day}, ${time}`;
    };

    return {
      status: ride.status || 'unknown',
      // Map API 'fare' to prop 'price'
      price: ride.fare || 0,
      // Map API 'start_time' to prop 'date'
      date: formatDate(ride.start_time),
      // Map API 'pickup_address' to prop 'from'
      from: ride.pickup_address || 'Unknown location',
      // Map API 'dropoff_address' to prop 'to'
      to: ride.dropoff_address || 'Unknown destination',
    };
  };

  const renderRides = () => {
    if (isPending) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFC107" />
          <Text style={styles.loadingText}>Loading rides...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load ride history</Text>
        </View>
      );
    }

    const rides = getFilteredRides();
    
    if (rides.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No {activeTab === 'all' ? '' : activeTab} rides found
          </Text>
        </View>
      );
    }

    return rides.map((ride, index) => {
      const cardProps = mapRideToCardProps(ride);
      // Using index as key fallback since ID is missing in your specific JSON log
      const key = ride.id || index; 
      
      return (
        <RideCard
          key={key}
          {...cardProps}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rides List */}
      <ScrollView 
        style={styles.ridesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ridesContent}
      >
        {renderRides()}
      </ScrollView>
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
    backgroundColor: '#333', // Adjusted specifically for dark mode contrast
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
  ridesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ridesContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});