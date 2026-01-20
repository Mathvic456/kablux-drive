import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  SafeAreaView, 
  StatusBar, 
  Platform,
  useWindowDimensions,
  Dimensions 
} from 'react-native';
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
  
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;
  const screenHeight = Dimensions.get('window').height;
  const isShortScreen = screenHeight < 700;

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

  // Get the actual balance value
  const userBalance = balanceData?.balance ?? 0;

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'black' }]}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <ScrollView 
        contentContainerStyle={[
          styles.container,
          isSmallScreen && styles.containerSmall,
          isLargeScreen && styles.containerLarge,
          isTablet && styles.containerTablet,
          isShortScreen && styles.containerShort
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#FFC107"
            colors={['#FFC107']}
            progressBackgroundColor="#111"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Pass the actual balance to BalanceCard */}
        <BalanceCard 
          balanceData={balanceData}
          isLoading={isBalanceLoading}
          isError={isBalanceError}
          userBalance={userBalance} // Pass the actual balance value
        />

        {/* Rest of the component remains the same... */}

        {balanceData?.balance < 1000 && (
          <View style={[
            styles.errorBanner,
            isSmallScreen && styles.errorBannerSmall,
            isLargeScreen && styles.errorBannerLarge,
            isShortScreen && styles.errorBannerShort
          ]}>
            <MaterialIcons 
              name="warning" 
              size={isSmallScreen ? 18 : isShortScreen ? 16 : 20} 
              color="#fff" 
            />
            <View style={[
              styles.errorBannerContent,
              isShortScreen && styles.errorBannerContentShort
            ]}>
              <Text style={[
                styles.errorBannerTitle,
                isSmallScreen && styles.errorBannerTitleSmall,
                isLargeScreen && styles.errorBannerTitleLarge,
                isShortScreen && styles.errorBannerTitleShort
              ]}>Low Balance</Text>
              <Text style={[
                styles.errorBannerText,
                isSmallScreen && styles.errorBannerTextSmall,
                isLargeScreen && styles.errorBannerTextLarge,
                isShortScreen && styles.errorBannerTextShort
              ]}>Your wallet balance is too low to receive ride orders.</Text>
            </View>
          </View>
        )}

        <View style={[
          styles.actionsContainer,
          isShortScreen && styles.actionsContainerShort
        ]}>
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
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    padding: Math.min(width * 0.05, 20),
    paddingTop: Platform.OS === 'ios' ? 20 : 30,
    backgroundColor: '#000000',
    gap: Math.min(height * 0.03, 24),
    paddingBottom: Math.min(height * 0.05, 40),
    minHeight: height,
  },
  containerSmall: {
    padding: Math.min(width * 0.04, 16),
    paddingTop: Platform.OS === 'ios' ? 15 : 25,
    gap: Math.min(height * 0.025, 20),
    paddingBottom: Math.min(height * 0.04, 32),
  },
  containerLarge: {
    padding: Math.min(width * 0.06, 24),
    paddingTop: Platform.OS === 'ios' ? 25 : 35,
    gap: Math.min(height * 0.035, 28),
    paddingBottom: Math.min(height * 0.06, 48),
  },
  containerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 30 : 40,
  },
  containerShort: {
    padding: Math.min(width * 0.035, 14),
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    gap: Math.min(height * 0.02, 16),
    paddingBottom: Math.min(height * 0.03, 24),
  },
  errorBanner: {
    backgroundColor: '#660000',
    borderRadius: Math.min(width * 0.03, 12),
    padding: Math.min(width * 0.04, 16),
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorBannerSmall: {
    borderRadius: Math.min(width * 0.025, 10),
    padding: Math.min(width * 0.035, 14),
  },
  errorBannerLarge: {
    borderRadius: Math.min(width * 0.035, 14),
    padding: Math.min(width * 0.045, 18),
  },
  errorBannerShort: {
    borderRadius: Math.min(width * 0.02, 8),
    padding: Math.min(width * 0.03, 12),
  },
  errorBannerContent: {
    flex: 1,
    marginLeft: Math.min(width * 0.03, 12),
  },
  errorBannerContentShort: {
    marginLeft: Math.min(width * 0.025, 10),
  },
  errorBannerTitle: {
    color: '#fff',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: 'bold',
    marginBottom: Math.min(height * 0.004, 4),
  },
  errorBannerTitleSmall: {
    fontSize: Math.min(width * 0.038, 14),
  },
  errorBannerTitleLarge: {
    fontSize: Math.min(width * 0.042, 18),
  },
  errorBannerTitleShort: {
    fontSize: Math.min(width * 0.036, 13),
  },
  errorBannerText: {
    color: '#fff',
    fontSize: Math.min(width * 0.035, 14),
    lineHeight: Math.min(width * 0.04, 18),
  },
  errorBannerTextSmall: {
    fontSize: Math.min(width * 0.033, 12),
    lineHeight: Math.min(width * 0.038, 16),
  },
  errorBannerTextLarge: {
    fontSize: Math.min(width * 0.037, 16),
    lineHeight: Math.min(width * 0.042, 20),
  },
  errorBannerTextShort: {
    fontSize: Math.min(width * 0.031, 11),
    lineHeight: Math.min(width * 0.036, 15),
  },
  actionsContainer: {
    gap: Math.min(height * 0.015, 15),
  },
  actionsContainerShort: {
    gap: Math.min(height * 0.01, 10),
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