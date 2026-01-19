import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import BalanceCard from '../components/BalanceCard';
import ActionButtons from '../components/ActionButtons';
import TransactionHistory from '../components/TransactionHistory';
import { MaterialIcons, Entypo } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { Text } from 'react-native';
import { useGetMyBalance, useGetMyTransactions } from '../../services/funding.service';

export default function Wallet() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);


  const { 
    data: balanceData, 
    isLoading: isBalanceLoading, 
    isError: isBalanceError,
    refetch: refetchBalance 
  } = useGetMyBalance();

  const { 
    data: transactionsData, 
    isLoading: isTxLoading, 
    isError: isTxError,
    refetch: refetchTransactions 
  } = useGetMyTransactions();

  // 2. Create the refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refetch both simultaneously and wait for them to finish
    await Promise.all([
      refetchBalance(), 
      refetchTransactions()
    ]);
    setRefreshing(false);
  }, [refetchBalance, refetchTransactions]);

  const goToBankTransfer = () => {
    navigation.navigate("PaystackWebView")
  }

  const goToTopUp = () => {
    navigation.navigate('TopUp');
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      // 3. Attach the RefreshControl
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor="#FFC107" // Match your theme color
        />
      }
    >
      {/* 4. Pass data and state down as props */}
      <BalanceCard 
        balanceData={balanceData}
        isLoading={isBalanceLoading}
        isError={isBalanceError}
      />

      {balanceData?.balance < 1000 && (
        <View style={styles.errorBanner}>
          <MaterialIcons name="warning" size={20} color="#fff" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.errorBannerTitle}>Low Balance</Text>
            <Text style={styles.errorBannerText}>Your wallet balance is too low to receive ride orders.</Text>
          </View>
        </View>
      )}

      <View style={{marginTop:30, gap:15}}>
       <ActionButtons
        label="Add funds"
        icon={<MaterialIcons name="credit-card" size={18} color="#FFC107" />}
        onPress={goToBankTransfer}
      />
      <ActionButtons
        label="Top up"
        icon={<Entypo name="plus" size={20} color="#FFC107" />}
        // onPress={goToTopUp}
      />
      </View>

      {/* 5. Pass transaction data down */}
      <TransactionHistory 
        data={transactionsData}
        isLoading={isTxLoading}
        isError={isTxError}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding:20,
    paddingTop:50,
    backgroundColor: '#000000',
    gap:30,
  },
  errorBanner: {
    backgroundColor: '#660000',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorBannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
  },
  text: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  amountInput: {
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: '#FFC107',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  amountNote: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  fundButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  fundButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  fundButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});