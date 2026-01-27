import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useCreateTransferRecipient, useWithdrawFunds } from "../services/wallet.service";

// --- Supported Banks ---
const BANKS = [
  { name: 'GTBank', code: '058' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Access Bank', code: '044' },
  { name: 'UBA', code: '033' },
  { name: 'First Bank', code: '011' },
];

const TransferForm = ({ userBalance }) => {
  const createRecipientMutation = useCreateTransferRecipient();
  const withdrawMutation = useWithdrawFunds();

  const [amount, setAmount] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState(BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ amount: '', accountNumber: '', accountName: '' });
  const [touched, setTouched] = useState({ amount: false, accountNumber: false, accountName: false });
  const [isFormValid, setIsFormValid] = useState(false);

  // --- Validation functions ---
  const validateAmount = (value) => {
    const num = parseFloat(value) || 0;
    if (!value.trim()) return 'Amount is required';
    if (num <= 0) return 'Amount must be greater than 0';
    if (num > userBalance) return `Amount exceeds balance of ₦${userBalance.toLocaleString()}`;
    if (num < 100) return 'Minimum withdrawal amount is ₦100';
    return '';
  };

  const validateAccountNumber = (value) => {
    if (!value.trim()) return 'Account number is required';
    if (value.length !== 10) return 'Account number must be 10 digits';
    if (!/^\d+$/.test(value)) return 'Account number must contain only numbers';
    return '';
  };

  const validateAccountName = (value) => {
    if (!value.trim()) return 'Account name is required';
    if (value.trim().length < 2) return 'Account name is too short';
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Account name can only contain letters and spaces';
    return '';
  };

  const validateForm = () => {
    const newErrors = {
      amount: validateAmount(amount),
      accountNumber: validateAccountNumber(accountNumber),
      accountName: validateAccountName(accountName)
    };
    setErrors(newErrors);
    setIsFormValid(Object.values(newErrors).every(e => e === ''));
  };

  useEffect(() => { validateForm(); }, [amount, accountNumber, accountName, selectedBankCode, userBalance]);

  // --- Handlers ---
  const handleAmountChange = (text) => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1] && parts[1].length > 2) cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    if (parts[0] && parts[0].length > 10) cleaned = parts[0].slice(0, 10) + (parts[1] ? '.' + parts[1] : '');
    setAmount(cleaned);
  };

  const handleAccountNumberChange = (text) => setAccountNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
  const handleAccountNameChange = (text) => setAccountName(text.replace(/[^a-zA-Z\s]/g, ''));
  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const resetForm = () => {
    setAmount('');
    setSelectedBankCode(BANKS[0].code);
    setAccountNumber('');
    setAccountName('');
    setErrors({ amount: '', accountNumber: '', accountName: '' });
    setTouched({ amount: false, accountNumber: false, accountName: false });
  };

  // --- Withdrawal ---
  const processWithdrawal = async () => {
    const amt = parseFloat(amount);
    setIsLoading(true);

    try {
      // Create recipient (backend resolves account automatically)
      const recipientRes = await createRecipientMutation.mutateAsync({
        account_number: accountNumber,
        bank_code: selectedBankCode,
        account_name: accountName.trim(),
      });

      const recipientCode = recipientRes.data.data.recipient_code;

      // Withdraw funds
      await withdrawMutation.mutateAsync({
        amount: amt,
        recipient_code: recipientCode,
      });

      Alert.alert(
        "Withdrawal Successful",
        `₦${amt.toLocaleString()} has been withdrawn to ${accountName.trim()}`,
        [{ text: "OK", onPress: resetForm }]
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Something went wrong";
      Alert.alert("Withdrawal Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setTouched({ amount: true, accountNumber: true, accountName: true });
    validateForm();

    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting.');
      return;
    }

    await processWithdrawal();
  };

  const formatCurrency = (amt) => amt.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 });
  const getInputStyle = (field) => [
    styles.input,
    touched[field] && errors[field] && styles.inputError,
    !errors[field] && touched[field] && styles.inputSuccess
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Balance */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(userBalance)}</Text>
          <Text style={styles.balanceSubtext}>Minimum withdrawal: ₦100</Text>
        </View>

        {/* Amount */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount <Text style={styles.required}>*</Text></Text>
          <View style={[
            styles.amountInputWrapper,
            touched.amount && errors.amount && styles.amountInputWrapperError,
            touched.amount && !errors.amount && styles.amountInputWrapperSuccess
          ]}>
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

        {/* Bank Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Bank <Text style={styles.required}>*</Text></Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedBankCode}
              onValueChange={setSelectedBankCode}
              mode="dropdown"
              style={styles.picker}
            >
              {BANKS.map(bank => <Picker.Item key={bank.code} label={bank.name} value={bank.code} />)}
            </Picker>
          </View>
        </View>

        {/* Account Number */}
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
        </View>

        {/* Account Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={getInputStyle('accountName')}
            placeholder="Enter account name as it appears"
            placeholderTextColor="#666"
            value={accountName}
            onChangeText={handleAccountNameChange}
            onBlur={() => handleBlur('accountName')}
            editable={!isLoading}
            autoCapitalize="words"
          />
          {touched.accountName && errors.accountName && (
            <View style={styles.fieldErrorContainer}>
              <MaterialIcons name="error-outline" size={16} color="#ff4444" />
              <Text style={styles.fieldErrorText}>{errors.accountName}</Text>
            </View>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid || isLoading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#04223A" /> :
            <Text style={styles.submitButtonText}>
              {!isFormValid ? 'Fill All Fields Correctly' : 'Withdraw Funds'}
            </Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  scrollContent: { paddingBottom: 40 },
  balanceContainer: { backgroundColor: '#04223A', padding: 20, borderRadius: 12, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: '#0a3a5a' },
  balanceLabel: { color: '#FFC107', fontSize: 16, fontWeight: '500', marginBottom: 8 },
  balanceAmount: { color: 'white', fontSize: 32, fontWeight: '700', marginBottom: 4 },
  balanceSubtext: { color: '#aaa', fontSize: 12, fontStyle: 'italic' },
  inputContainer: { marginBottom: 16 },
  label: { color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  required: { color: '#ff4444' },
  amountInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, borderWidth: 2, borderColor: '#333', overflow: 'hidden' },
  amountInputWrapperError: { borderColor: '#ff4444', backgroundColor: '#1a0000' },
  amountInputWrapperSuccess: { borderColor: '#4CAF50' },
  currencyPrefix: { backgroundColor: '#222', paddingHorizontal: 16, paddingVertical: 16, borderRightWidth: 1, borderRightColor: '#333' },
  currencySymbol: { color: 'white', fontSize: 24, fontWeight: '700' },
  amountInput: { flex: 1, color: 'white', fontSize: 24, fontWeight: '600', paddingVertical: 16, paddingHorizontal: 16 },
  input: { backgroundColor: '#111', borderRadius: 10, borderWidth: 2, borderColor: '#333', color: 'white', fontSize: 16, paddingHorizontal: 16, paddingVertical: 16 },
  inputError: { borderColor: '#ff4444', backgroundColor: '#1a0000' },
  inputSuccess: { borderColor: '#4CAF50' },
  fieldErrorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  fieldErrorText: { color: '#ff4444', fontSize: 13, fontWeight: '500', marginLeft: 6, flex: 1 },
  submitButton: { backgroundColor: '#FFC107', paddingVertical: 18, borderRadius: 10, alignItems: 'center', marginTop: 24, marginBottom: 16 },
  submitButtonDisabled: { backgroundColor: '#444', opacity: 0.6 },
  submitButtonText: { color: '#04223A', fontSize: 18, fontWeight: '700' },
  pickerWrapper: { backgroundColor: '#111', borderRadius: 10, borderWidth: 2, borderColor: '#333' },
  picker: { color: 'white', width: '100%' },
});

export default TransferForm;
