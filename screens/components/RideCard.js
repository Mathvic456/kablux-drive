import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import RideCard from '../components/RideCard';
import { useRideHistory } from '../../services/rideHistory.service';

export default function Bookings() {
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState("all");
  
  // Fetch ride history
const { data: rideHistoryResponse, isPending, isError, isLoading } = useRideHistory(true);


  const tabs = [
    { id: 'all', label: 'All Rides' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  // Filter rides based on date
  const filterRidesByDate = (rides, filterType) => {
    // SAFETY CHECK: Ensure rides is an array
    if (!Array.isArray(rides)) return [];
    if (filterType === "all") return rides;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return rides.filter(ride => {
      if (!ride?.start_time) return false;
      const rideDate = new Date(ride.start_time);
      
      switch (filterType) {
        case "today":
          const rideDay = new Date(rideDate.getFullYear(), rideDate.getMonth(), rideDate.getDate());
          return rideDay.getTime() === today.getTime();
        
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return rideDate >= weekAgo;
        
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return rideDate >= monthAgo;
        
        default:
          return true;
      }
    });
  };

  const getFilteredRides = () => {
    // CRITICAL FIX: Add multiple safety checks
    if (!rideHistoryResponse) return [];
    if (!rideHistoryResponse.results) return [];
    if (!Array.isArray(rideHistoryResponse.results)) return [];

    const rides = rideHistoryResponse.results;

    // First filter by status (tab)
    let filteredRides;
    switch (activeTab) {
      case 'completed':
        filteredRides = rides.filter(ride => ride?.status?.toLowerCase() === 'completed');
        break;
      case 'cancelled':
        filteredRides = rides.filter(ride => ride?.status?.toLowerCase() === 'cancelled');
        break;
      case 'all':
      default:
        filteredRides = rides;
    }

    // Then filter by date
    return filterRidesByDate(filteredRides, filter);
  };

  // Format date from start_time
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      const time = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return `${month} ${day}, ${time}`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Map ride to card props
  const mapRideToCardProps = (ride) => {
    return {
      status: ride?.status || 'unknown',
      price: ride?.fare || 0,
      date: formatDate(ride?.start_time),
      from: ride?.pickup_address || 'Unknown location',
      to: ride?.dropoff_address || 'Unknown destination',
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
    
    // SAFETY CHECK: Verify rides is an array before mapping
    if (!Array.isArray(rides) || rides.length === 0) {
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
      const key = ride?.id || `ride-${index}`; 
      
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

      {/* Filter Button */}
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#111",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#FFC107",
            alignSelf: "flex-start",
          }}
          onPress={() => {
            const filters = ["all", "today", "week", "month"];
            const currentIndex = filters.indexOf(filter);
            const nextIndex = (currentIndex + 1) % filters.length;
            setFilter(filters[nextIndex]);
          }}
        >
          <Text style={{
            color: "#FFC107",
            marginLeft: 6,
            fontSize: 14,
            fontWeight: "600",
          }}>
            📅 {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
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