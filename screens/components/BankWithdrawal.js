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
    ActivityIndicator
} from 'react-native';
import { MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons';
import { banks } from '../../constants/banks';
import { useFetch } from '../../utils/fetch-handler';
import { useAuth } from '../../context/AuthContext';
import CentralModal from './CentralModal';

export default function BankWithdrawal() {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [account, setAccount] = useState();
    const { request } = useFetch();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errState, setErrState] = useState({ errMessage: '', showModal: false })

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
        setAmount('');
        setReason('');
    }
    useEffect(() => {
        clearForm();
    }, []);
    useEffect(() => {
        getAccounts()
    }, [])




    const handleProceed = async () => {
        setLoading(true);

        // Proceed with transfer logic
        console.log('Transfer details:', {
            reason,
            amount
        });
        try {
            const res = await request('wallets/withdraw/', {
                method: 'POST',
                body: {
                    "amount": amount,
                    "reason": reason,
                },
                token
            });
            console.log("Transfer response", res);
            clearForm();
            // alert('Transfer initiated successfully!');
        } catch (error) {
            console.error("Transfer error", error)
            setErrState((prev) => { return { ...prev, errMessage: error || '', showModal: true } })
        } finally {
            setLoading(false);
        }

    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Beneficiary Info - ALWAYS SHOWING */}
                <Text style={styles.subLabel}>Beneficiary</Text>
                <View style={styles.beneficiaryRow}>
                    <View style={styles.beneficiaryInfo}>
                        <View style={styles.icon}>
                            <FontAwesome name="bank" size={18} color="#4e3f13" />
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
                                {account?.account_number} • {account?.bank_code}
                            </Text>
                        </View>
                    </View>
                    <View />
                </View>

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
                {/* Reason Input */}
                <Text style={styles.subLabel}>Enter Reason</Text>
                <TextInput
                    style={styles.amountInput}
                    placeholder="Enter reason for withdrawal"
                    placeholderTextColor="#888"
                    value={reason}
                    onChangeText={setReason}
                    keyboardType="default"
                    selectionColor="#FFC107"
                />



                {/* Proceed Button */}
                <TouchableOpacity
                    style={[
                        styles.proceedButton,
                        (!amount || !reason) && styles.proceedButtonDisabled
                    ]}
                    onPress={handleProceed}
                    disabled={!amount || !reason}
                >
                    <Text style={styles.proceedText}>
                        {loading ? <ActivityIndicator size="small" color="#FFC107" /> : (!amount || !reason ? 'Please fill all fields' : 'Proceed')}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
            {/* Error Modal */}
            <CentralModal
                visible={errState.showModal}
                onClose={() => setShowErrorModal(false)}
                title="Attention Required"
                subText={errState.errMessage}
                icon="alert-circle"
                confirmText="Okay"
                closeText=""
                onConfirm={() => setErrState((prev) => { return { ...prev, showModal: false } })}
                confirmButtonColor="#F44336"
                themeColor="#F44336"
            />
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