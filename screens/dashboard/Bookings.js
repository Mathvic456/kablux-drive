// screens/Bookings.js
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import TripCard from '../components/TripCard';
import { useRideHistory } from '../../services/rideHistory.service';

export default function Bookings() {
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch ride history
  const { data: rideHistory, isPending, isError } = useRideHistory(true);

  const tabs = [
    { id: 'all', label: 'All Rides' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  // Filter rides based on active tab
  const getFilteredRides = () => {
    if (!rideHistory?.results) return [];

    const rides = rideHistory.results;

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

  // Map API data to TripCard props
  const mapRideToCardProps = (ride) => {
    // Format date from createdAt or use date field
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      const time = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      return `${month} ${day} - ${time}`;
    };

    return {
      status: ride.status?.toLowerCase() || 'unknown',
      isReturn: ride.type?.toLowerCase() === 'return' || ride.type?.toLowerCase() === 'round_trip',
      rating: ride.rating || 0,
      date: formatDate(ride.createdAt || ride.date),
      from: ride.pickupLocation || 'Unknown location',
      to: ride.dropoffLocation || 'Unknown destination'
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
            No {activeTab === 'cancelled' ? 'cancelled' : activeTab === 'completed' ? 'completed' : ''} rides found
          </Text>
        </View>
      );
    }

    return rides.map((ride) => {
      const cardProps = mapRideToCardProps(ride);
      return (
        <TripCard
          key={ride.id}
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
    borderWidth: 1,
    borderColor: '#333',
    gap: 10,
    borderRadius: 25,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 15,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#0B2633',
  },
  tabText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  ridesContainer: {
    flex: 1,
  },
  ridesContent: {
    paddingBottom: 20,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  },
  emptyStateText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});