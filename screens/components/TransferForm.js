import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  useResolveAccount,
  useCreateTransferRecipient,
  useWithdrawFunds,
  useGetMyBalance
} from '../../services/funding.service';

// --- Supported Banks ---
const BANKS = [
  { name: 'GTBank', code: '058' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Access Bank', code: '044' },
  { name: 'UBA', code: '033' },
  { name: 'First Bank', code: '011' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank', code: '032' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'FCMB', code: '214' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Standard Chartered', code: '068' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Providus Bank', code: '101' },
];

const TransferForm = () => {

  const { data } = useGetMyBalance();
  const initialBalance = data?.balance ?? 0;
  const resolveAccountMutation = useResolveAccount();
  const createRecipientMutation = useCreateTransferRecipient();
  const withdrawMutation = useWithdrawFunds();

  // --- States ---
  const [balance, setBalance] = useState(initialBalance);
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState(BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ amount: '', accountNumber: '' });
  const [touched, setTouched] = useState({ amount: false, accountNumber: false });
  const [isFormValid, setIsFormValid] = useState(false);
  const [isAccountResolved, setIsAccountResolved] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBanks, setFilteredBanks] = useState(BANKS);

  // --- Error Modal ---
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleError = (msg) => {
    setErrorMessage(msg);
    setShowErrorModal(true);
  };

  // --- Filter banks ---
  useEffect(() => {
    if (searchQuery.trim() === '') setFilteredBanks(BANKS);
    else {
      setFilteredBanks(BANKS.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [searchQuery]);

  // --- Validation ---
  const validateAmount = (value) => {
    const num = parseFloat(value) || 0;
    if (!value.trim()) return 'Amount is required';
    if (num <= 0) return 'Amount must be greater than 0';
    if (num > balance) return `Amount exceeds balance of ₦${balance.toLocaleString()}`;
    if (num < 100) return 'Minimum withdrawal amount is ₦100';
    return '';
  };
  const validateAccountNumber = (value) => {
    if (!value.trim()) return 'Account number is required';
    if (value.length !== 10) return 'Account number must be 10 digits';
    if (!/^\d+$/.test(value)) return 'Account number must contain only numbers';
    return '';
  };
  const validateForm = () => {
    const newErrors = {
      amount: validateAmount(amount),
      accountNumber: validateAccountNumber(accountNumber),
    };
    setErrors(newErrors);
    setIsFormValid(Object.values(newErrors).every(e => e === '') && isAccountResolved);
  };
  useEffect(() => validateForm(), [amount, accountNumber, selectedBank, balance, isAccountResolved]);

  // --- Handlers ---
  const handleAmountChange = (text) => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1] && parts[1].length > 2) cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    if (parts[0] && parts[0].length > 10) cleaned = parts[0].slice(0, 10) + (parts[1] ? '.' + parts[1] : '');
    setAmount(cleaned);
  };
  const handleAccountNumberChange = (text) => {
    setAccountNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
    setIsAccountResolved(false);
  };
  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const resetForm = () => {
    setAmount('');
    setSelectedBank(BANKS[0]);
    setAccountNumber('');
    setAccountName('');
    setErrors({ amount: '', accountNumber: '' });
    setTouched({ amount: false, accountNumber: false });
    setIsAccountResolved(false);
  };

  // --- Resolve Account ---
  const resolveAccount = async () => {
  if (!accountNumber || accountNumber.length !== 10) {
    handleError("Please enter a valid 10-digit account number.");
    return;
  }

  setIsLoading(true);
  try {
    const res = await resolveAccountMutation.mutateAsync({
      account_number: accountNumber,
      bank_code: selectedBank.code
    });

    console.log("🔍 Raw response:", JSON.stringify(res, null, 2));
    
    // Try different response structures
    let resolvedName;
    
    // Check all possible structures
    if (res?.data?.account_name) {
      resolvedName = res.data.account_name;  // {data: {account_name: "NAME"}}
    } else if (res?.account_name) {
      resolvedName = res.account_name;       // {account_name: "NAME"}
    } else if (res?.data?.data?.account_name) {
      resolvedName = res.data.data.account_name; // {data: {data: {account_name: "NAME"}}}
    } else if (res?.data?.accountName) {
      resolvedName = res.data.accountName;   // camelCase
    } else if (typeof res === 'string') {
      // If response is a string, try to parse it
      try {
        const parsed = JSON.parse(res);
        resolvedName = parsed.data?.account_name || parsed.account_name;
      } catch (e) {
        console.log("Could not parse string response");
      }
    }

    console.log("Extracted account name:", resolvedName);

    if (!resolvedName) {
      console.log("Failed to extract account name. Full response:", res);
      throw new Error(`Account name not returned. Response structure: ${JSON.stringify(res)}`);
    }

    setAccountName(resolvedName);
    setIsAccountResolved(true);
    console.log("✅ Account resolved successfully:", resolvedName);
  } catch (err) {
    console.log("❌ Resolve Error:", err.message, "Full error:", err);
    handleError(err?.response?.data?.message || err.message || "Unable to resolve account");
    setIsAccountResolved(false);
  } finally {
    setIsLoading(false);
  }
};

  // --- Withdraw Funds ---
  const processWithdrawal = async () => {
    const amt = parseFloat(amount);
    setIsLoading(true);
    try {
      const recipientRes = await createRecipientMutation.mutateAsync({
        account_number: accountNumber,
        bank_code: selectedBank.code,
        account_name: accountName.trim()
      });

      const recipientCode = recipientRes.recipient_code;

      console.log("✅ Recipient code:", recipientCode);
      console.log("💰 Amount to withdraw:", amt);

       // Debug: Check what's being sent
    const withdrawPayload = {
      amount: amt,
      recipient_code: recipientCode
    };
    
    console.log("📦 Withdraw payload:", withdrawPayload);



      await withdrawMutation.mutateAsync({
        amount: amt,
        recipient_code: recipientCode
      });

      setBalance(prev => prev - amt);

      handleError(`₦${amt.toLocaleString()} has been withdrawn to ${accountName.trim()}`);
      resetForm();
    } catch (error) {
      const msg = error?.response?.data?.message || "Something went wrong";
      handleError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setTouched({ amount: true, accountNumber: true });
    validateForm();
    if (!isFormValid) {
      handleError('Please fix all errors before submitting.');
      return;
    }
    await processWithdrawal();
  };

  // --- Helpers ---
  const formatCurrency = (amt) => (amt || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 });
  const getInputStyle = (field) => [styles.input, touched[field] && errors[field] && styles.inputError, !errors[field] && touched[field] && styles.inputSuccess];

  // --- Bank Modal Component ---
  const BankModal = () => (
    <Modal
      visible={showBankModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowBankModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Bank</Text>
            <TouchableOpacity onPress={() => setShowBankModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search banks..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Bank List */}
          <FlatList
            data={filteredBanks}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.bankItem, selectedBank.code === item.code && styles.selectedBankItem]}
                onPress={() => {
                  setSelectedBank(item);
                  setShowBankModal(false);
                  setSearchQuery('');
                }}
              >
                <View style={styles.bankInfo}>
                  <View style={styles.bankIcon}><Text style={styles.bankIconText}>{item.name.charAt(0)}</Text></View>
                  <View style={styles.bankDetails}>
                    <Text style={styles.bankName}>{item.name}</Text>
                    <Text style={styles.bankCode}>Code: {item.code}</Text>
                  </View>
                </View>
                {selectedBank.code === item.code && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Balance */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <Text style={styles.balanceSubtext}>Minimum withdrawal: ₦100</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount <Text style={styles.required}>*</Text></Text>
          <View style={[styles.amountInputWrapper, touched.amount && errors.amount ? styles.amountInputWrapperError : touched.amount ? styles.amountInputWrapperSuccess : null]}>
            <View style={styles.currencyPrefix}><Text style={styles.currencySymbol}>₦</Text></View>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={handleAmountChange}
              onBlur={() => handleBlur('amount')}
              keyboardType="decimal-pad"
              editable={!isLoading}
            />
          </View>
          {touched.amount && errors.amount && (
            <View style={styles.fieldErrorContainer}>
              <MaterialIcons name="error-outline" size={16} color="#ff4444" />
              <Text style={styles.fieldErrorText}>{errors.amount}</Text>
            </View>
          )}
        </View>

        {/* Bank Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Bank <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.bankSelector} onPress={() => setShowBankModal(true)} disabled={isLoading}>
            <View style={styles.bankSelectorContent}>
              <View style={styles.selectedBankInfo}>
                <View style={styles.selectedBankIcon}><Text style={styles.selectedBankIconText}>{selectedBank.name.charAt(0)}</Text></View>
                <View style={styles.selectedBankDetails}>
                  <Text style={styles.selectedBankName}>{selectedBank.name}</Text>
                  <Text style={styles.selectedBankCode}>Code: {selectedBank.code}</Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={24} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Number & Resolve */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account Number <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={getInputStyle('accountNumber')}
            placeholder="Enter 10-digit account number"
            placeholderTextColor="#666"
            value={accountNumber}
            onChangeText={handleAccountNumberChange}
            onBlur={() => handleBlur('accountNumber')}
            keyboardType="number-pad"
            maxLength={10}
            editable={!isLoading}
          />
          {touched.accountNumber && errors.accountNumber && (
            <View style={styles.fieldErrorContainer}>
              <MaterialIcons name="error-outline" size={16} color="#ff4444" />
              <Text style={styles.fieldErrorText}>{errors.accountNumber}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.resolveButton, (isLoading || errors.accountNumber !== '') && styles.resolveButtonDisabled]}
            onPress={resolveAccount}
            disabled={isLoading || errors.accountNumber !== ''}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <><MaterialIcons name="account-balance" size={18} color="white" style={styles.resolveButtonIcon} /><Text style={styles.resolveButtonText}>Resolve Account</Text></>}
          </TouchableOpacity>
        </View>

        {/* Account Name (read-only) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account Name <Text style={styles.required}>*</Text></Text>
          <View style={styles.accountNameContainer}>
            <TextInput
              style={[getInputStyle('accountNumber'), styles.accountNameInput]}
              placeholder="Account name will appear here"
              placeholderTextColor="#666"
              value={accountName}
              editable={false}
            />
            {isAccountResolved && <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={20} color="#4CAF50" /></View>}
          </View>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid || isLoading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#04223A" /> : <><MaterialIcons name="send" size={20} color="#04223A" style={styles.submitButtonIcon} /><Text style={styles.submitButtonText}>Withdraw Funds</Text></>}
        </TouchableOpacity>

      </ScrollView>

      {/* Bank Modal */}
      <BankModal />

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.6)' }}>
          <View style={{ backgroundColor:'#111', padding:24, borderRadius:12, width:'80%' }}>
            <Text style={{ color:'white', fontSize:16, marginBottom:16 }}>{errorMessage}</Text>
            <TouchableOpacity
              onPress={() => setShowErrorModal(false)}
              style={{ backgroundColor:'#FFC107', padding:12, borderRadius:8, alignItems:'center' }}
            >
              <Text style={{ fontWeight:'700', color:'#04223A' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

// --- Styles (same as your previous ones) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  balanceContainer: { backgroundColor: '#04223A', padding: 20, borderRadius: 12, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: '#0a3a5a' },
  balanceLabel: { color: '#FFC107', fontSize: 16, fontWeight: '500', marginBottom: 8 },
  balanceAmount: { color: 'white', fontSize: 32, fontWeight: '700', marginBottom: 4 },
  balanceSubtext: { color: '#aaa', fontSize: 12, fontStyle: 'italic' },
  inputContainer: { marginBottom: 20 },
  label: { color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  required: { color: '#ff4444' },
  input: { backgroundColor: '#111', borderRadius: 10, borderWidth: 2, borderColor: '#333', color: 'white', fontSize: 16, paddingHorizontal: 16, paddingVertical: 16 },
  inputError: { borderColor: '#ff4444', backgroundColor: '#1a0000' },
  inputSuccess: { borderColor: '#4CAF50' },
  fieldErrorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  fieldErrorText: { color: '#ff4444', marginLeft: 4 },
  amountInputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 2, borderColor: '#333', backgroundColor: '#111' },
  amountInputWrapperError: { borderColor: '#ff4444', backgroundColor: '#1a0000' },
  amountInputWrapperSuccess: { borderColor: '#4CAF50' },
  currencyPrefix: { paddingHorizontal: 12 },
  currencySymbol: { color: 'white', fontSize: 18 },
  amountInput: { flex: 1, color: 'white', fontSize: 16, paddingVertical: 16 },
  bankSelector: { backgroundColor: '#111', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#333' },
  bankSelectorContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedBankInfo: { flexDirection: 'row', alignItems: 'center' },
  selectedBankIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFC107', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  selectedBankIconText: { fontWeight: '700', color: '#04223A' },
  selectedBankDetails: {},
  selectedBankName: { color: 'white', fontWeight: '600' },
  selectedBankCode: { color: '#aaa', fontSize: 12 },
  resolveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#FFC107', borderRadius: 10, marginTop: 12 },
  resolveButtonDisabled: { opacity: 0.6 },
  resolveButtonIcon: { marginRight: 8 },
  resolveButtonText: { fontWeight: '700', color: '#04223A' },
  accountNameContainer: { flexDirection: 'row', alignItems: 'center' },
  accountNameInput: { flex: 1, paddingVertical: 16 },
  verifiedBadge: { marginLeft: 8 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFC107', padding: 16, borderRadius: 10 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonIcon: { marginRight: 8 },
  submitButtonText: { fontWeight: '700', color: '#04223A', fontSize: 16 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center' },
  modalContainer: { width:'90%', backgroundColor:'#04223A', borderRadius:12, maxHeight:'80%' },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderBottomWidth:1, borderBottomColor:'#333' },
  modalTitle: { color:'white', fontSize:18, fontWeight:'700' },
  modalCloseButton: { padding:4 },
  searchContainer: { flexDirection:'row', alignItems:'center', backgroundColor:'#111', margin:16, borderRadius:10, paddingHorizontal:12 },
  searchIcon: { marginRight:8 },
  searchInput: { flex:1, color:'white', height:40 },
  bankItem: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#333' },
  bankInfo: { flexDirection:'row', alignItems:'center' },
  bankIcon: { width:40, height:40, borderRadius:20, backgroundColor:'#FFC107', justifyContent:'center', alignItems:'center', marginRight:12 },
  bankIconText: { color:'#04223A', fontWeight:'700' },
  bankDetails: {},
  bankName: { color:'white', fontWeight:'600' },
  bankCode: { color:'#aaa', fontSize:12 },
  selectedBankItem: { backgroundColor:'#1a1a1a' },
});

export default TransferForm;
