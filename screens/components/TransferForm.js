import React, { use, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
  Dimensions
} from 'react-native';
import { MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons';
import { banks } from '../../constants/banks';
import { useFetch } from '../../utils/fetch-handler';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import useSearch from '../../hooks/useSearch';

const { width, height } = Dimensions.get('window');


export default function TransferForm() {
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState();
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const { request } = useFetch();
  const { token } = useAuth();
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState()

  const { filteredMessages, handleSearch } = useSearch(banks);

  const displayMessages =
    searchText && searchText.trim().length > 0
      ? filteredMessages
      : banks;

  const getAccounts = async () => {
    try {
      const res = await request('wallets/transfer_recipient/', { method: 'GET', token })
      console.log('transfer recp', res)
      setAccount(res)
    } catch (error) {
      console.log('error getting accounts', error)
    }
  }

  const clearForm = () => {
    setAccountNumber('');
    setSelectedBank(null);
    setAccountName('');
    setAmount('');
  }
  useEffect(() => {
    clearForm();
  }, []);
  useEffect(() => {
    getAccounts()
  }, [])


  const handleAccountNumberChange = (text) => {
    // Remove non-numeric characters
    const numericText = text.replace(/[^0-9]/g, '');
    setAccountNumber(numericText);
  };

  const accountNameLookup = async (accNumber, bank) => {
    // Simulate API call delay
    console.log('resolve payload', { 'account_number': accNumber, 'bank_code': bank.code })
    try {
      const res = await request('wallets/resolve-account/', {
        method: 'POST',
        body: {
          "account_number": accNumber,
          "bank_code": bank.code
        },
        token
      });
      if (res && res.data && res.data.account_name) {
        setAccountName(res.data.account_name);
      }
      console.log("resolve response", res);
    } catch (error) {
      console.log("resolve error", error)
    }

  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setShowBankDropdown(false);

    // If account number is already entered, trigger account name lookup
    if (accountNumber.length === 10) {
      accountNameLookup(accountNumber, bank);
    }
  };

  // Responsive scaling functions
  const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  };

  const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  };

  const handleProceed = async () => {
    // Validate form before proceeding
    if (!accountNumber || !selectedBank || !accountName) {
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
    });
    try {
      const res = await request('wallets/create_transfer_recipient/', {
        method: 'POST',
        body: {
          "account_number": accountNumber,
          "bank_code": selectedBank.code,
          "account_name": accountName,
        },
        token
      });
      console.log("Transfer response", res);
      navigation.navigate('BankTransfer', { recipient: res });
      // alert('Transfer initiated successfully!');
    } catch (error) {
      console.error("Transfer error", error)
      alert('Transfer initiated failed!');
    }

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
          onPress={() => { setShowBankDropdown(true); setSearchText(''); handleSearch('') }}
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
                !account?.account_name && styles.placeholderText
              ]}>
                {account?.account_name}
              </Text>
              <Text style={[
                styles.beneficiaryNumber,
                (!account) && styles.placeholderText
              ]}>
                {account?.account_number}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.payButton,
              (!account) && styles.payButtonDisabled
            ]}
            disabled={!account}
            onPress={() => navigation.navigate('BankTransfer')}
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


              <View style={[
                styles.inputContainerS,
                {
                  height: scaleSize(50),
                  marginTop: scaleSize(10)
                }
              ]}>
                <MaterialIcons
                  name="search"
                  size={scaleSize(20)}
                  color="#aaa"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.inputS,
                    { fontSize: scaleFont(14) }
                  ]}
                  placeholder="Search"
                  placeholderTextColor="#aaa"
                  keyboardType="Search for bank"
                  autoCapitalize="none"
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text)
                    handleSearch(text)
                  }}
                  // editable={!isPending}
                  returnKeyType="next"
                />
              </View>


              <FlatList
                data={displayMessages}
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
  inputContainerS: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    marginBottom: 5,
    paddingHorizontal: Math.max(12, width * 0.03),
    borderWidth: 1,
    borderColor: '#222',
  },
  inputS: {
    flex: 1,
    color: "#fff",
    paddingHorizontal: Math.max(8, width * 0.02),
  },
});