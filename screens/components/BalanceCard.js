import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  useWindowDimensions,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { MaterialIcons, Entypo, Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Helper function to format the balance
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '0.00';
  return amount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  });
};

// Accept props now
export default function BalanceCard({ balanceData, isLoading, isError, userBalance = 0 }) {
  const navigation = useNavigation();
  const [balanceVisible, setBalanceVisible] = useState(false);
  
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375; // iPhone SE, small Android
  const isMediumScreen = width >= 375 && width <= 414; // iPhone 12-15, most Android
  const isLargeScreen = width > 414; // iPhone Plus/Pro Max
  const isTablet = width > 768;
  const screenHeight = Dimensions.get('window').height;
  const isShortScreen = screenHeight < 700; // Small height devices
  
  // Use actualBalance prop or fallback to balanceData
  const balance = userBalance;
  const handleWithdraw = () => {
    // Pass the user's actual balance to Withdraw screen
    navigation.navigate('Withdraw', { userBalance: balance }); 
  };
  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  const renderBalanceContent = () => {
    if (isLoading) {
      return (
        <View style={styles.amountRow}>
          <ActivityIndicator 
            size={isSmallScreen ? "small" : isShortScreen ? "small" : "large"} 
            color="white" 
          />
          <Text style={[
            styles.loadingText,
            isSmallScreen && styles.loadingTextSmall,
            isLargeScreen && styles.loadingTextLarge,
            isShortScreen && styles.loadingTextShort
          ]}>Fetching Balance...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.amountRow}>
          <Text style={[
            styles.errorText,
            isSmallScreen && styles.errorTextSmall,
            isLargeScreen && styles.errorTextLarge,
            isShortScreen && styles.errorTextShort
          ]}>Error loading balance</Text>
          <Entypo 
            name="warning" 
            size={isSmallScreen ? 16 : isShortScreen ? 14 : 22} 
            color="red" 
          />
        </View>
      );
    }
    
    return (
      <View style={styles.amountRow}>
        <View style={styles.balanceContainer}>
          {balanceVisible ? (
            <Text style={[
              styles.amount,
              isSmallScreen && styles.amountSmall,
              isLargeScreen && styles.amountLarge,
              isShortScreen && styles.amountShort
            ]}>
              {formatCurrency(balance)}
            </Text>
          ) : (
            <View style={styles.hiddenBalance}>
              <Text style={[
                styles.hiddenText,
                isSmallScreen && styles.hiddenTextSmall,
                isLargeScreen && styles.hiddenTextLarge,
                isShortScreen && styles.hiddenTextShort
              ]}>
                ●●●●●●●●●●
              </Text>
            </View>
          )}
        </View>
        <View style={styles.balanceActions}>
          <TouchableOpacity 
            onPress={toggleBalanceVisibility}
            style={styles.visibilityButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={balanceVisible ? "eye-off-outline" : "eye-outline"} 
              size={isSmallScreen ? 18 : isShortScreen ? 16 : 24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[
      styles.card,
      isSmallScreen && styles.cardSmall,
      isLargeScreen && styles.cardLarge,
      isTablet && styles.cardTablet,
      isShortScreen && styles.cardShort
    ]}>
      {/* Header */}
      <View style={[
        styles.header,
        isShortScreen && styles.headerShort
      ]}>
        <View style={[
          styles.balanceRow,
          isShortScreen && styles.balanceRowShort
        ]}>
          <MaterialIcons 
            name="monetization-on" 
            size={isSmallScreen ? 16 : isShortScreen ? 14 : 20} 
            color="#FFC107" 
          />
          <Text style={[
            styles.balanceLabel,
            isSmallScreen && styles.balanceLabelSmall,
            isLargeScreen && styles.balanceLabelLarge,
            isShortScreen && styles.balanceLabelShort
          ]}>
            Available Balance
          </Text>
        </View>
        <Entypo 
          name="help-with-circle" 
          size={isSmallScreen ? 14 : isShortScreen ? 12 : 18} 
          color="#FFC107" 
        />
      </View>

      {renderBalanceContent()}

      {/* Withdraw Button */}
      <TouchableOpacity 
        style={[
          styles.button,
          (isLoading || isError) && styles.buttonDisabled,
          isSmallScreen && styles.buttonSmall,
          isLargeScreen && styles.buttonLarge,
          isTablet && styles.buttonTablet,
          isShortScreen && styles.buttonShort
        ]}
        onPress={handleWithdraw}
        disabled={isLoading || isError} 
      >
        <Text style={[
          styles.buttonText,
          isSmallScreen && styles.buttonTextSmall,
          isLargeScreen && styles.buttonTextLarge,
          isShortScreen && styles.buttonTextShort,
          (isLoading || isError) && styles.buttonTextDisabled
        ]}>
          Withdraw
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#04223A',
    padding: Math.min(width * 0.05, 20),
    gap: Math.min(height * 0.04, 24),
    borderRadius: Math.min(width * 0.04, 16),
    width: '100%',
    borderWidth: 1,
    borderColor: '#0a3a5a',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardSmall: {
    padding: Math.min(width * 0.04, 16),
    gap: Math.min(height * 0.03, 20),
    borderRadius: Math.min(width * 0.035, 14),
  },
  cardLarge: {
    padding: Math.min(width * 0.06, 24),
    gap: Math.min(height * 0.05, 28),
    borderRadius: Math.min(width * 0.045, 18),
  },
  cardTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    padding: Math.min(width * 0.04, 24),
    borderRadius: Math.min(width * 0.04, 20),
  },
  cardShort: {
    padding: Math.min(width * 0.035, 14),
    gap: Math.min(height * 0.025, 18),
    borderRadius: Math.min(width * 0.03, 12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerShort: {
    marginBottom: -2,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.min(width * 0.015, 8),
  },
  balanceRowShort: {
    gap: Math.min(width * 0.012, 6),
  },
  balanceLabel: {
    color: 'white',
    fontSize: Math.min(width * 0.037, 16),
    fontWeight: '500',
  },
  balanceLabelSmall: {
    fontSize: Math.min(width * 0.035, 14),
  },
  balanceLabelLarge: {
    fontSize: Math.min(width * 0.04, 18),
  },
  balanceLabelShort: {
    fontSize: Math.min(width * 0.033, 13),
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Math.min(height * 0.01, 8),
    width: '100%',
    minHeight: Math.min(height * 0.06, 40),
  },
  balanceContainer: {
    flex: 1,
  },
  amount: {
    color: 'white',
    fontSize: Math.min(width * 0.07, 32),
    fontWeight: '700',
  },
  amountSmall: {
    fontSize: Math.min(width * 0.065, 28),
  },
  amountLarge: {
    fontSize: Math.min(width * 0.075, 36),
  },
  amountShort: {
    fontSize: Math.min(width * 0.06, 26),
  },
  hiddenBalance: {
    paddingVertical: 5,
  },
  hiddenText: {
    color: 'white',
    fontSize: Math.min(width * 0.065, 30),
    fontWeight: '700',
    letterSpacing: 2,
  },
  hiddenTextSmall: {
    fontSize: Math.min(width * 0.06, 26),
    letterSpacing: 1.5,
  },
  hiddenTextLarge: {
    fontSize: Math.min(width * 0.07, 34),
    letterSpacing: 2.5,
  },
  hiddenTextShort: {
    fontSize: Math.min(width * 0.055, 24),
    letterSpacing: 1.2,
  },
  balanceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.min(width * 0.04, 16),
  },
  visibilityButton: {
    padding: 5,
  },
  loadingText: {
    color: 'white',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '500',
    marginLeft: Math.min(width * 0.02, 8),
  },
  loadingTextSmall: {
    fontSize: Math.min(width * 0.038, 14),
  },
  loadingTextLarge: {
    fontSize: Math.min(width * 0.042, 18),
  },
  loadingTextShort: {
    fontSize: Math.min(width * 0.036, 13),
  },
  errorText: {
    color: 'red',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '500',
  },
  errorTextSmall: {
    fontSize: Math.min(width * 0.038, 14),
  },
  errorTextLarge: {
    fontSize: Math.min(width * 0.042, 18),
  },
  errorTextShort: {
    fontSize: Math.min(width * 0.036, 13),
  },
  button: {
    backgroundColor: '#FFC107',
    paddingVertical: Math.min(height * 0.016, 14),
    borderRadius: Math.min(width * 0.025, 10),
    alignItems: 'center',
    width: '100%',
    minHeight: Math.min(height * 0.06, 48),
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonSmall: {
    paddingVertical: Math.min(height * 0.014, 12),
    borderRadius: Math.min(width * 0.022, 8),
    minHeight: Math.min(height * 0.055, 44),
  },
  buttonLarge: {
    paddingVertical: Math.min(height * 0.018, 16),
    borderRadius: Math.min(width * 0.028, 12),
    minHeight: Math.min(height * 0.065, 52),
  },
  buttonTablet: {
    paddingVertical: Math.min(height * 0.02, 18),
    borderRadius: Math.min(width * 0.03, 14),
    minHeight: Math.min(height * 0.07, 56),
  },
  buttonShort: {
    paddingVertical: Math.min(height * 0.012, 10),
    borderRadius: Math.min(width * 0.02, 8),
    minHeight: Math.min(height * 0.05, 40),
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  buttonText: {
    color: '#04223A',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '600',
  },
  buttonTextSmall: {
    fontSize: Math.min(width * 0.038, 14),
  },
  buttonTextLarge: {
    fontSize: Math.min(width * 0.042, 18),
  },
  buttonTextShort: {
    fontSize: Math.min(width * 0.036, 13),
  },
  buttonTextDisabled: {
    color: '#999',
  },
});