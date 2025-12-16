import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RideCard = ({ status, date, from, to, price }) => {
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#4CAF50'; // Green
      case 'cancelled': return '#F44336'; // Red
      default: return '#FFC107';          // Yellow
    }
  };

  return (
    <View style={styles.card}>
      {/* Header: Date and Price */}
      <View style={styles.header}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.price}>{formatCurrency(price)}</Text>
      </View>

      {/* Route Line */}
      <View style={styles.routeContainer}>
        {/* Pickup */}
        <View style={styles.locationRow}>
          <View style={[styles.dot, styles.greenDot]} />
          <Text style={styles.address} numberOfLines={1}>{from}</Text>
        </View>
        
        {/* Connector Line */}
        <View style={styles.line} />

        {/* Dropoff */}
        <View style={styles.locationRow}>
          <View style={[styles.dot, styles.redDot]} />
          <Text style={styles.address} numberOfLines={1}>{to}</Text>
        </View>
      </View>

      {/* Footer: Status */}
      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
            {status?.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A', // Dark card background
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  date: {
    color: '#888',
    fontSize: 14,
  },
  price: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeContainer: {
    marginVertical: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  greenDot: {
    backgroundColor: '#4CAF50',
  },
  redDot: {
    backgroundColor: '#F44336',
  },
  line: {
    height: 12,
    width: 1,
    backgroundColor: '#444',
    marginLeft: 3.5, // Center with dot
    marginVertical: 2,
  },
  address: {
    color: '#E0E0E0',
    fontSize: 14,
    flex: 1,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RideCard;