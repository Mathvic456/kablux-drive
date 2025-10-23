import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BalanceCard() {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleWithdraw = async () => {
    // Set loading state
    setIsLoading(true);
    
    // Simulate API call or processing delay
    setTimeout(() => {
      // Reset loading state
      setIsLoading(false);
      
      // Navigate to withdrawal screen
      navigation.navigate('Withdraw');
    }, 2000); // 2 second delay to simulate processing
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.balanceRow}>
          <MaterialIcons name="monetization-on" size={20} color="#FFC107" />
          <Text style={styles.balanceLabel}>Available Balance</Text>
        </View>
        <Entypo name="help-with-circle" size={18} color="#FFC107" />
      </View>

      {/* Balance */}
      <View style={styles.amountRow}>
        <Text style={styles.amount}>NGN5,396</Text>
        <Entypo name="chevron-right" size={22} color="white" />
      </View>

      {/* Withdraw Button */}
      <TouchableOpacity 
        style={[
          styles.button,
          isLoading && styles.buttonDisabled
        ]}
        onPress={handleWithdraw}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#04223A" />
            <Text style={styles.buttonText}>Processing...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Withdraw</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#04223A',
    borderRadius: 16,
    padding: 20,
    gap: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  amount: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#FFC107',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#FFC10799', // Semi-transparent when disabled
    opacity: 0.7,
  },
  buttonText: {
    color: '#04223A',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});