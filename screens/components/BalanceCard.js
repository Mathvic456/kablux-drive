import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  useWindowDimensions,
  Dimensions 
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
export default function BalanceCard({ balanceData, isLoading, isError }) {
  const navigation = useNavigation();
  const [balanceVisible, setBalanceVisible] = useState(false);
  
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;
  
  // Calculate responsive sizes
  const cardPadding = isSmallScreen ? width * 0.04 : width * 0.05;
  const cardGap = isSmallScreen ? height * 0.03 : height * 0.04;
  const iconSize = isSmallScreen ? 18 : 20;
  const balanceFontSize = isSmallScreen ? 24 : 28;
  const buttonFontSize = isSmallScreen ? 14 : 16;
  
  // No hook call here anymore!
  const balance = balanceData?.balance ?? 0;
  
  const handleWithdraw = () => {
    navigation.navigate('Withdraw'); 
  };

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  const renderBalanceContent = () => {
    if (isLoading) {
      return (
        <View style={styles.amountRow}>
          <ActivityIndicator size={isSmallScreen ? "small" : "large"} color="white" />
          <Text style={[
            styles.loadingText,
            isSmallScreen && styles.loadingTextSmall,
            isLargeScreen && styles.loadingTextLarge
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
            isLargeScreen && styles.errorTextLarge
          ]}>Error loading balance</Text>
          <Entypo name="warning" size={isSmallScreen ? 18 : 22} color="red" />
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
              isLargeScreen && styles.amountLarge
            ]}>
              {formatCurrency(balance)}
            </Text>
          ) : (
            <View style={styles.hiddenBalance}>
              <Text style={[
                styles.hiddenText,
                isSmallScreen && styles.hiddenTextSmall,
                isLargeScreen && styles.hiddenTextLarge
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
              size={isSmallScreen ? 20 : 24} 
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
      {
        padding: cardPadding,
        gap: cardGap,
        borderRadius: isSmallScreen ? 12 : 16,
        marginHorizontal: isTablet ? 'auto' : 0,
        maxWidth: isTablet ? 500 : '100%',
      }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.balanceRow}>
          <MaterialIcons 
            name="monetization-on" 
            size={iconSize} 
            color="#FFC107" 
          />
          <Text style={[
            styles.balanceLabel,
            isSmallScreen && styles.balanceLabelSmall,
            isLargeScreen && styles.balanceLabelLarge
          ]}>
            Available Balance
          </Text>
        </View>
        <Entypo 
          name="help-with-circle" 
          size={isSmallScreen ? 16 : 18} 
          color="#FFC107" 
        />
      </View>

      {renderBalanceContent()}

      {/* Withdraw Button */}
      <TouchableOpacity 
        style={[
          styles.button,
          (isLoading || isError) && styles.buttonDisabled,
          {
            paddingVertical: isSmallScreen ? 12 : 14,
            borderRadius: isSmallScreen ? 8 : 10,
          }
        ]}
        onPress={handleWithdraw}
        disabled={isLoading || isError} 
      >
        <Text style={[
          styles.buttonText,
          isSmallScreen && styles.buttonTextSmall,
          isLargeScreen && styles.buttonTextLarge,
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
    padding: width * 0.05,
    gap: height * 0.04,
    borderRadius: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.015,
  },
  balanceLabel: {
    color: 'white',
    fontSize: width * 0.037,
    fontWeight: '500',
  },
  balanceLabelSmall: {
    fontSize: width * 0.035,
  },
  balanceLabelLarge: {
    fontSize: width * 0.04,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: height * 0.02,
    width: '100%',
  },
  balanceContainer: {
    flex: 1,
  },
  amount: {
    color: 'white',
    fontSize: width * 0.07,
    fontWeight: '700',
  },
  amountSmall: {
    fontSize: width * 0.065,
  },
  amountLarge: {
    fontSize: width * 0.075,
  },
  hiddenBalance: {
    paddingVertical: 5,
  },
  hiddenText: {
    color: 'white',
    fontSize: width * 0.065,
    fontWeight: '700',
    letterSpacing: 2,
  },
  hiddenTextSmall: {
    fontSize: width * 0.06,
    letterSpacing: 1.5,
  },
  hiddenTextLarge: {
    fontSize: width * 0.07,
    letterSpacing: 2.5,
  },
  balanceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.04,
  },
  visibilityButton: {
    padding: 5,
  },
  loadingText: {
    color: 'white',
    fontSize: width * 0.04,
    fontWeight: '500',
    marginLeft: width * 0.02,
  },
  loadingTextSmall: {
    fontSize: width * 0.038,
  },
  loadingTextLarge: {
    fontSize: width * 0.042,
  },
  errorText: {
    color: 'red',
    fontSize: width * 0.04,
    fontWeight: '500',
  },
  errorTextSmall: {
    fontSize: width * 0.038,
  },
  errorTextLarge: {
    fontSize: width * 0.042,
  },
  button: {
    backgroundColor: '#FFC107',
    paddingVertical: height * 0.016,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    minHeight: height * 0.06,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  buttonText: {
    color: '#04223A',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  buttonTextSmall: {
    fontSize: width * 0.038,
  },
  buttonTextLarge: {
    fontSize: width * 0.042,
  },
  buttonTextDisabled: {
    color: '#999',
  },
});