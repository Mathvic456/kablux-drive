import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  FlatList,
  ScrollView 
} from 'react-native';
import { MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons';

export default function TransferForm() {
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('NGN30,000');
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // Sample bank data
  const banks = [
    { id: '1', name: 'Access Bank', code: '044' },
    { id: '2', name: 'First Bank', code: '011' },
    { id: '3', name: 'Guaranty Trust Bank', code: '058' },
    { id: '4', name: 'Zenith Bank', code: '057' },
    { id: '5', name: 'United Bank for Africa', code: '033' },
    { id: '6', name: 'Ecobank Nigeria', code: '050' },
    { id: '7', name: 'Fidelity Bank', code: '070' },
    { id: '8', name: 'Stanbic IBTC Bank', code: '039' },
    { id: '9', name: 'Sterling Bank', code: '232' },
    { id: '10', name: 'Union Bank', code: '032' },
  ];

  const handleAccountNumberChange = (text) => {
    // Remove non-numeric characters
    const numericText = text.replace(/[^0-9]/g, '');
    setAccountNumber(numericText);
    
    // Simulate account name lookup when account number is complete (10 digits)
    if (numericText.length === 10 && selectedBank) {
      // In a real app, you would call an API here to validate account number
      simulateAccountNameLookup(numericText, selectedBank);
    } else {
      setAccountName('');
    }
  };

  const simulateAccountNameLookup = (accNumber, bank) => {
    // Simulate API call delay
    setTimeout(() => {
      // Mock account name based on bank and account number
      const mockNames = {
        'Access Bank': 'John Adebayo',
        'First Bank': 'Chioma Nwosu', 
        'Guaranty Trust Bank': 'Michael Okoro',
        'Zenith Bank': 'Funke Adeleke',
        'United Bank for Africa': 'David Chukwu',
        'Ecobank Nigeria': 'Grace Okafor',
        'Fidelity Bank': 'Samuel Ibrahim',
        'Stanbic IBTC Bank': 'Temitope Lawal',
        'Sterling Bank': 'Aisha Mohammed',
        'Union Bank': 'Peter Eze',
      };
      
      setAccountName(mockNames[bank.name] || 'Account Name Not Found');
    }, 1000);
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setShowBankDropdown(false);
    
    // If account number is already entered, trigger account name lookup
    if (accountNumber.length === 10) {
      simulateAccountNameLookup(accountNumber, bank);
    }
  };

  const handleProceed = () => {
    // Validate form before proceeding
    if (!accountNumber || !selectedBank || !accountName || !amount) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (accountNumber.length !== 10) {
      alert('Please enter a valid 10-digit account number');
      return;
    }
    
    // Proceed with transfer logic
    console.log('Transfer details:', {
      accountNumber,
      bank: selectedBank.name,
      accountName,
      amount
    });
    
    alert('Transfer initiated successfully!');
  };

  // Get display values for beneficiary section
  const getBeneficiaryName = () => {
    return accountName || 'Not available';
  };

  const getBeneficiaryNumber = () => {
    return accountNumber || 'Not available';
  };

  const getBankName = () => {
    return selectedBank ? selectedBank.name : 'Not selected';
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Number Input */}
        <View style={styles.inputContainer}>
          <View style={styles.iconLabel}>
            <MaterialIcons name="credit-card" size={20} color="#FFC107" />
            <Text style={styles.labelText}>Account Number</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter 10-digit account number"
            placeholderTextColor="#888"
            value={accountNumber}
            onChangeText={handleAccountNumberChange}
            keyboardType="numeric"
            maxLength={10}
            selectionColor="#FFC107"
          />
        </View>

        {/* Bank Dropdown */}
        <TouchableOpacity 
          style={styles.inputButton}
          onPress={() => setShowBankDropdown(true)}
        >
          <View style={styles.iconLabel}>
            <FontAwesome name="bank" size={18} color="#FFC107" />
            <Text style={styles.labelText}>
              {selectedBank ? selectedBank.name : 'Select Bank'}
            </Text>
          </View>
          <Entypo 
            name={showBankDropdown ? "chevron-up" : "chevron-right"} 
            size={18} 
            color="white" 
          />
        </TouchableOpacity>

        {/* Account Name Display */}
        {accountName ? (
          <View style={styles.accountNameContainer}>
            <View style={styles.iconLabel}>
              <FontAwesome name="user" size={16} color="#FFC107" />
              <Text style={styles.labelText}>Account Name</Text>
            </View>
            <Text style={styles.accountNameText}>{accountName}</Text>
          </View>
        ) : null}

        {/* Amount Input */}
        <Text style={styles.subLabel}>Enter Amount</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="NGN0.00"
          placeholderTextColor="#888"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          selectionColor="#FFC107"
        />

        {/* Beneficiary Info - ALWAYS SHOWING */}
        <Text style={styles.subLabel}>Beneficiary</Text>
        <View style={styles.beneficiaryRow}>
          <View style={styles.beneficiaryInfo}>
            <View style={styles.icon}>
              <FontAwesome name="bank" size={18} color="#FFC107" />
            </View>
            <View>
              <Text style={[
                styles.beneficiaryName,
                !accountName && styles.placeholderText
              ]}>
                {getBeneficiaryName()}
              </Text>
              <Text style={[
                styles.beneficiaryNumber,
                (!accountNumber || !selectedBank) && styles.placeholderText
              ]}>
                {getBeneficiaryNumber()} • {getBankName()}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[
              styles.payButton,
              (!accountNumber || !selectedBank || !accountName) && styles.payButtonDisabled
            ]}
            disabled={!accountNumber || !selectedBank || !accountName}
          >
            <Text style={styles.payText}>Pay</Text>
          </TouchableOpacity>
        </View>

        {/* Proceed Button */}
        <TouchableOpacity 
          style={[
            styles.proceedButton,
            (!accountNumber || !selectedBank || !accountName) && styles.proceedButtonDisabled
          ]}
          onPress={handleProceed}
          disabled={!accountNumber || !selectedBank || !accountName}
        >
          <Text style={styles.proceedText}>
            {accountNumber && !accountName ? 'Validating...' : 'Proceed'}
          </Text>
        </TouchableOpacity>

        {/* Bank Selection Modal */}
        <Modal
          visible={showBankDropdown}
          transparent
          animationType="slide"
          onRequestClose={() => setShowBankDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Bank</Text>
                <TouchableOpacity 
                  onPress={() => setShowBankDropdown(false)}
                  style={styles.closeButton}
                >
                  <Entypo name="cross" size={24} color="#FFC107" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={banks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bankItem}
                    onPress={() => handleBankSelect(item)}
                  >
                    <Text style={styles.bankName}>{item.name}</Text>
                    <Text style={styles.bankCode}>{item.code}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
  },
  inputContainer: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  textInput: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
    padding: 0,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  accountNameContainer: {
    backgroundColor: '#04223A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountNameText: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: '600',
  },
  subLabel: {
    color: 'white',
    marginVertical: 10,
    fontSize: 14,
    fontWeight: '400',
  },
  amountInput: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  beneficiaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  beneficiaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  icon: {
    borderWidth: 1,
    borderColor: '#FFC107',
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#04223A',
  },
  beneficiaryName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  beneficiaryNumber: {
    color: '#aaa',
    fontSize: 13,
  },
  placeholderText: {
    color: '#666',
    fontStyle: 'italic',
  },
  payButton: {
    backgroundColor: '#04223A',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  payButtonDisabled: {
    backgroundColor: '#333',
    borderColor: '#666',
    opacity: 0.6,
  },
  payText: {
    color: 'white',
    fontWeight: '600',
  },
  proceedButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  proceedButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  proceedText: {
    color: '#04223A',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bankName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  bankCode: {
    color: '#FFC107',
    fontSize: 14,
  },
});