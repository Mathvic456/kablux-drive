// screens/Bookings.js
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import TripCard from '../components/TripCard';





export default function Bookings() {
  const [activeTab, setActiveTab] = useState('all');

  // Sample data for different ride types
  const rideData = {
    all: [
      {
        id: 1,
        status: 'completed',
        isReturn: true,
        rating: 5,
        date: 'Oct 25 - 14:30',
        from: 'Abraham Adesanya Estate',
        to: 'Sunview Estate Ajah Lagos'
      },
      {
        id: 2,
        status: 'completed',
        isReturn: false,
        rating: 4,
        date: 'Oct 24 - 09:15',
        from: 'Lekki Phase 1',
        to: 'Victoria Island'
      },
      {
        id: 3,
        status: 'cancelled',
        isReturn: false,
        rating: 0,
        date: 'Oct 23 - 16:45',
        from: 'Ikoyi',
        to: 'Airport'
      },
      {
        id: 4,
        status: 'completed',
        isReturn: true,
        rating: 5,
        date: 'Oct 22 - 11:20',
        from: 'Yaba',
        to: 'Surulere'
      }
    ],
    completed: [
      {
        id: 1,
        status: 'completed',
        isReturn: true,
        rating: 5,
        date: 'Oct 25 - 14:30',
        from: 'Abraham Adesanya Estate',
        to: 'Sunview Estate Ajah Lagos'
      },
      {
        id: 2,
        status: 'completed',
        isReturn: false,
        rating: 4,
        date: 'Oct 24 - 09:15',
        from: 'Lekki Phase 1',
        to: 'Victoria Island'
      },
      {
        id: 4,
        status: 'completed',
        isReturn: true,
        rating: 5,
        date: 'Oct 22 - 11:20',
        from: 'Yaba',
        to: 'Surulere'
      }
    ],
    cancelled: [
      {
        id: 3,
        status: 'cancelled',
        isReturn: false,
        rating: 0,
        date: 'Oct 23 - 16:45',
        from: 'Ikoyi',
        to: 'Airport'
      }
    ]
  };

  const tabs = [
    { id: 'all', label: 'All Rides' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  const renderRides = () => {
    const rides = rideData[activeTab];
    
    if (rides.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No {activeTab === 'cancelled' ? 'cancelled' : 'completed'} rides found
          </Text>
        </View>
      );
    }

    return rides.map((ride) => (
      <TripCard
        key={ride.id}
        status={ride.status}
        isReturn={ride.isReturn}
        rating={ride.rating}
        date={ride.date}
        from={ride.from}
        to={ride.to}
      />
    ));
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
    // borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    // textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#333',
    gap: 10,
    borderRadius: 25,
    // marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 15,
    marginHorizontal: 4,
    // backgroundColor: '#04223A',
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