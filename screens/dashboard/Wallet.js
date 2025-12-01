// screens/HomeScreen.js
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import BalanceCard from '../components/BalanceCard';
import ActionButtons from '../components/ActionButtons';
import TransactionHistory from '../components/TransactionHistory';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { useFundWalletEndPoint } from '../../services/funding.service';
 
export default function Wallet() {
  const navigation = useNavigation();
  const [addFundsModalVisible, setAddFundsModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const fundWalletMutation = useFundWalletEndPoint();

  const goToBankTransfer = () => {
    setAddFundsModalVisible(true);
  }

  const goToTopUp = () => {
    navigation.navigate('TopUp');
  }

  const handleAddFunds = async () => {
    if (!amount || amount.trim() === '') {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      console.log('💳 Initiating fund wallet with amount:', numAmount);
      const response = await fundWalletMutation.mutateAsync({
        amount: numAmount,
        channel: 'card',
      });

      console.log('✅ Fund wallet response:', response);

    
      const paystackUrl = response.data?.data?.authorization_url;
      if (paystackUrl) {
        console.log('🔗 Redirecting to Paystack:', paystackUrl);
        setAddFundsModalVisible(false);
        setAmount('');
        navigation.navigate('PaystackWebView', { url: paystackUrl });
      } else {
        Alert.alert('Error', 'No checkout URL received from server');
      }
    } catch (error) {
      console.error('❌ Fund wallet error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to process payment';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <BalanceCard />

      <View style={{marginTop:30, gap:15}}>
       <ActionButtons
        label="Add funds"
        icon={<MaterialIcons name="credit-card" size={18} color="#FFC107" />}
        onPress={goToBankTransfer}
      />
      <ActionButtons
        label="Top up"
        icon={<Entypo name="plus" size={20} color="#FFC107" />}
        onPress={goToTopUp}

      />
      </View>

      <TransactionHistory />

      {/* Add Funds Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addFundsModalVisible}
        onRequestClose={() => setAddFundsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Funds</Text>
              <TouchableOpacity onPress={() => setAddFundsModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Enter Amount (₦)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!fundWalletMutation.isPending}
            />

            <Text style={styles.amountNote}>
              Payment will be processed through Paystack
            </Text>

            <TouchableOpacity
              style={[
                styles.fundButton,
                fundWalletMutation.isPending && styles.fundButtonDisabled,
              ]}
              onPress={handleAddFunds}
              disabled={fundWalletMutation.isPending || !amount}
            >
              {fundWalletMutation.isPending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.fundButtonText}>Add Funds</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setAddFundsModalVisible(false);
                setAmount('');
              }}
              disabled={fundWalletMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:20,
    paddingTop:50,
    backgroundColor: '#000000',
    gap:30,
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