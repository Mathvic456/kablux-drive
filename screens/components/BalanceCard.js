import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// 1. Import the hook
import { useGetMyBalance } from "../../services/funding.service"

// Helper function to format the balance
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '0.00';
  return amount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  });
};

export default function BalanceCard() {
  const navigation = useNavigation();

  const { 
    data: balanceData, 
    isLoading: isBalanceLoading, 
    isError: isBalanceError 
  } = useGetMyBalance();
  
  const balance = balanceData?.balance ?? 0;
  
  const handleWithdraw = () => {
    navigation.navigate('Withdraw'); 
  };

  const renderBalanceContent = () => {
    if (isBalanceLoading) {
      return (
        <View style={styles.amountRow}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Fetching Balance...</Text>
        </View>
      );
    }

    if (isBalanceError) {
      return (
        <View style={styles.amountRow}>
          <Text style={styles.errorText}>Error loading balance</Text>
          <Entypo name="warning" size={22} color="red" />
        </View>
      );
    }
    
    return (
      <View style={styles.amountRow}>
        <Text style={styles.amount}>{formatCurrency(balance)}</Text>
        <Entypo name="chevron-right" size={22} color="white" />
      </View>
    );
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

      {renderBalanceContent()}

      {/* Withdraw Button */}
      <TouchableOpacity 
        style={styles.button}
        onPress={handleWithdraw}
        // Disable if balance is loading, or on error
        disabled={isBalanceLoading || isBalanceError} 
      >
        <Text style={styles.buttonText}>Withdraw</Text>
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
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FFC107',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#04223A',
    fontSize: 16,
    fontWeight: '600',
  },
});