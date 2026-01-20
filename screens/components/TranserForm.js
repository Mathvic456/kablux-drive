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
    Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TransferForm = ({ userBalance = 0 }) => {
    console.log('TransferForm received userBalance:', userBalance); // Debug log
    
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    
    // Calculate values
    const amountNum = parseFloat(amount) || 0;
    const insufficientBalance = amountNum > userBalance;
    const remainingBalance = userBalance - amountNum;

    // Validate the form
    const validateForm = () => {
        const newErrors = {};
        
        // Amount validation
        if (!amount.trim()) {
            newErrors.amount = 'Amount is required';
        } else if (isNaN(amountNum)) {
            newErrors.amount = 'Please enter a valid number';
        } else if (amountNum <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        } else if (amountNum < 100) {
            newErrors.amount = 'Minimum withdrawal is ₦100';
        } else if (amountNum > userBalance) {
            newErrors.amount = `Cannot withdraw ₦${amountNum.toLocaleString()} (balance: ₦${userBalance.toLocaleString()})`;
        }
        
        // Bank name validation
        if (!bankName.trim()) {
            newErrors.bankName = 'Bank name is required';
        }
        
        // Account number validation
        if (!accountNumber.trim()) {
            newErrors.accountNumber = 'Account number is required';
        } else if (accountNumber.length !== 10) {
            newErrors.accountNumber = 'Account number must be 10 digits';
        } else if (!/^\d+$/.test(accountNumber)) {
            newErrors.accountNumber = 'Account number must contain only numbers';
        }
        
        // Account name validation
        if (!accountName.trim()) {
            newErrors.accountName = 'Account name is required';
        }
        
        setErrors(newErrors);
        
        // Form is valid if no errors and sufficient balance
        const isValid = Object.keys(newErrors).length === 0 && !insufficientBalance;
        setIsFormValid(isValid);
    };

    // Validate when inputs change
    useEffect(() => {
        validateForm();
    }, [amount, bankName, accountNumber, accountName, userBalance]);

    const handleAmountChange = (text) => {
        // Only allow numbers and one decimal point
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        
        if (parts.length > 2) return; // Only one decimal point allowed
        if (parts[1] && parts[1].length > 2) return; // Max 2 decimal places
        
        setAmount(cleaned);
    };

    const handleAccountNumberChange = (text) => {
        // Only allow numbers, max 10 digits
        const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
        setAccountNumber(cleaned);
    };

    const handleSubmit = () => {
        // Final validation
        validateForm();
        
        if (!isFormValid) {
            if (insufficientBalance) {
                Alert.alert(
                    'Insufficient Balance',
                    `You cannot withdraw ₦${amountNum.toLocaleString()}.\n\nYour balance: ₦${userBalance.toLocaleString()}\nYou need ₦${(amountNum - userBalance).toLocaleString()} more.`,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Validation Error',
                    'Please fix all errors before submitting.',
                    [{ text: 'OK' }]
                );
            }
            return;
        }

        // Confirm withdrawal
        Alert.alert(
            'Confirm Withdrawal',
            `Withdraw ₦${amountNum.toLocaleString()} to ${accountName}?\n\nAccount: ${accountNumber}\nBank: ${bankName}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: processWithdrawal
                }
            ]
        );
    };

    const processWithdrawal = async () => {
        setIsLoading(true);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            Alert.alert(
                'Success!',
                `₦${amountNum.toLocaleString()} withdrawal to ${accountName} has been initiated.`,
                [{ text: 'OK', onPress: resetForm }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setAmount('');
        setBankName('');
        setAccountNumber('');
        setAccountName('');
        setErrors({});
    };

    const formatCurrency = (amount) => {
        return amount.toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Balance Display */}
                <View style={[
                    styles.balanceContainer,
                    insufficientBalance && styles.insufficientBalanceContainer
                ]}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(userBalance)}</Text>
                    
                    {insufficientBalance && (
                        <View style={styles.warningBox}>
                            <MaterialIcons name="warning" size={20} color="#FFC107" />
                            <Text style={styles.warningText}>
                                Insufficient funds for withdrawal
                            </Text>
                        </View>
                    )}
                </View>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Amount to Withdraw</Text>
                    <View style={[
                        styles.amountInputContainer,
                        errors.amount && styles.inputErrorContainer,
                        insufficientBalance && styles.insufficientInputContainer
                    ]}>
                        <Text style={styles.currencySymbol}>₦</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0.00"
                            value={amount}
                            onChangeText={handleAmountChange}
                            keyboardType="decimal-pad"
                            editable={!isLoading}
                        />
                    </View>
                    
                    {/* Balance Summary */}
                    {amountNum > 0 && (
                        <View style={styles.balanceSummary}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Your Balance:</Text>
                                <Text style={styles.summaryValue}>₦{userBalance.toLocaleString()}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Withdrawal:</Text>
                                <Text style={[
                                    styles.summaryValue,
                                    insufficientBalance && styles.summaryValueNegative
                                ]}>
                                    -₦{amountNum.toLocaleString()}
                                </Text>
                            </View>
                            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                                <Text style={styles.summaryLabel}>Remaining:</Text>
                                <Text style={[
                                    styles.summaryValue,
                                    insufficientBalance ? styles.summaryValueNegative : styles.summaryValuePositive
                                ]}>
                                    ₦{remainingBalance.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    )}
                    
                    {errors.amount && (
                        <Text style={styles.errorText}>{errors.amount}</Text>
                    )}
                </View>

                {/* Bank Details */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bank Name</Text>
                    <TextInput
                        style={[
                            styles.input,
                            errors.bankName && styles.inputError
                        ]}
                        placeholder="Enter your bank name"
                        value={bankName}
                        onChangeText={setBankName}
                        editable={!isLoading}
                    />
                    {errors.bankName && (
                        <Text style={styles.errorText}>{errors.bankName}</Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Account Number</Text>
                    <TextInput
                        style={[
                            styles.input,
                            errors.accountNumber && styles.inputError
                        ]}
                        placeholder="10-digit account number"
                        value={accountNumber}
                        onChangeText={handleAccountNumberChange}
                        keyboardType="number-pad"
                        maxLength={10}
                        editable={!isLoading}
                    />
                    {errors.accountNumber && (
                        <Text style={styles.errorText}>{errors.accountNumber}</Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Account Name</Text>
                    <TextInput
                        style={[
                            styles.input,
                            errors.accountName && styles.inputError
                        ]}
                        placeholder="Account holder name"
                        value={accountName}
                        onChangeText={setAccountName}
                        editable={!isLoading}
                        autoCapitalize="words"
                    />
                    {errors.accountName && (
                        <Text style={styles.errorText}>{errors.accountName}</Text>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!isFormValid || isLoading) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={!isFormValid || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#04223A" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {insufficientBalance 
                                ? 'Insufficient Balance' 
                                : 'Withdraw Funds'
                            }
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Validation Summary */}
                {Object.keys(errors).length > 0 && (
                    <View style={styles.validationBox}>
                        <Text style={styles.validationTitle}>Please fix the following:</Text>
                        {errors.amount && <Text style={styles.validationItem}>• {errors.amount}</Text>}
                        {errors.bankName && <Text style={styles.validationItem}>• {errors.bankName}</Text>}
                        {errors.accountNumber && <Text style={styles.validationItem}>• {errors.accountNumber}</Text>}
                        {errors.accountName && <Text style={styles.validationItem}>• {errors.accountName}</Text>}
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    balanceContainer: {
        backgroundColor: '#04223A',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0a3a5a',
    },
    insufficientBalanceContainer: {
        backgroundColor: '#332200',
        borderColor: '#FFC107',
    },
    balanceLabel: {
        color: '#FFC107',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    balanceAmount: {
        color: 'white',
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 12,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    warningText: {
        color: '#FFC107',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#333',
        paddingHorizontal: 16,
    },
    insufficientInputContainer: {
        borderColor: '#FFC107',
        backgroundColor: '#332200',
    },
    inputErrorContainer: {
        borderColor: '#ff4444',
        backgroundColor: '#1a0000',
    },
    currencySymbol: {
        color: 'white',
        fontSize: 24,
        fontWeight: '600',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        color: 'white',
        fontSize: 24,
        fontWeight: '600',
        paddingVertical: 16,
    },
    balanceSummary: {
        backgroundColor: '#111',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryRowTotal: {
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 8,
        marginTop: 4,
    },
    summaryLabel: {
        color: '#aaa',
        fontSize: 14,
    },
    summaryValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    summaryValuePositive: {
        color: '#4CAF50',
    },
    summaryValueNegative: {
        color: '#ff4444',
    },
    input: {
        backgroundColor: '#111',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#333',
        color: 'white',
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    inputError: {
        borderColor: '#ff4444',
        backgroundColor: '#1a0000',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 6,
        marginLeft: 4,
    },
    submitButton: {
        backgroundColor: '#FFC107',
        paddingVertical: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    submitButtonDisabled: {
        backgroundColor: '#444',
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#04223A',
        fontSize: 18,
        fontWeight: '700',
    },
    validationBox: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
    },
    validationTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    validationItem: {
        color: '#ff4444',
        fontSize: 14,
        marginBottom: 6,
        marginLeft: 8,
    },
});

export default TransferForm;