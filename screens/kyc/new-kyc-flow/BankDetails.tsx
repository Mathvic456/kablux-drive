import { Ionicons, MaterialIcons, FontAwesome, Entypo } from "@expo/vector-icons";
import {
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    Modal,
    FlatList,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Bank, banks } from "../../../constants/banks";
import { useFetch } from "../../../utils/fetch-handler";
import { useAuth } from "../../../context/AuthContext";
import useSearch from "../../../hooks/useSearch";
import { api } from "../../../services/api";

const { width, height } = Dimensions.get("window");

const scaleFont = (size: number) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
};

const scaleSize = (size: number) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
};

export default function BankDetails() {
    const navigation = useNavigation();
    const { request } = useFetch();
    const { token } = useAuth();

    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [bankSearchText, setBankSearchText] = useState("");
    const [isResolvingAccount, setIsResolvingAccount] = useState(false);

    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);

    const [errors, setErrors] = useState({
        accountName: "",
        accountNumber: "",
        bank: "",
        pin: "",
        confirmPin: "",
    });

    const { filteredMessages, handleSearch } = useSearch(banks);
    const displayBanks =
        bankSearchText && bankSearchText.trim().length > 0 ? filteredMessages : banks;

    // ── Account name resolution (copied from TransferForm) ──────────────────
    const accountNameLookup = async (accNumber: string, bank: any) => {
        setIsResolvingAccount(true);
        setAccountName("");
        try {
            const res = await api.post("wallets/resolve-account/", {
                account_number: accNumber,
                bank_code: bank?.code,
            });
            console.log('resloved', res.data.data)
            if (res && res.data && res.data.data.account_name) {
                setAccountName(res.data.data.account_name);
                setErrors((e) => ({ ...e, accountName: "" }));
            }
        } catch (error) {
            console.log("resolve error", error);
        } finally {
            setIsResolvingAccount(false);
        }
    };

    const handleAccountNumberChange = (text: string) => {
        const numeric = text.replace(/[^0-9]/g, "");
        setAccountNumber(numeric);
        setErrors((e) => ({ ...e, accountNumber: "" }));
        if (numeric.length === 10 && selectedBank) {
            accountNameLookup(numeric, selectedBank);
        } else {
            setAccountName("");
        }
    };

    const handleBankSelect = (bank: Bank) => {
        setSelectedBank(bank);
        setShowBankDropdown(false);
        setErrors((e) => ({ ...e, bank: "" }));
        if (accountNumber.length === 10) {
            accountNameLookup(accountNumber, bank);
        }
    };
    // ────────────────────────────────────────────────────────────────────────

    const validateForm = () => {
        let valid = true;
        const newErrors = {
            accountName: "",
            accountNumber: "",
            bank: "",
            pin: "",
            confirmPin: "",
        };

        if (!accountNumber.trim()) {
            newErrors.accountNumber = "Account number is required";
            valid = false;
        } else if (!/^\d{10}$/.test(accountNumber)) {
            newErrors.accountNumber = "Account number must be 10 digits";
            valid = false;
        }

        if (!selectedBank) {
            newErrors.bank = "Please select a bank";
            valid = false;
        }

        if (!accountName.trim()) {
            newErrors.accountName = "Account name could not be resolved";
            valid = false;
        }

        if (!pin) {
            newErrors.pin = "Transaction PIN is required";
            valid = false;
        } else if (!/^\d{4,6}$/.test(pin)) {
            newErrors.pin = "PIN must be 4–6 digits";
            valid = false;
        }

        if (!confirmPin) {
            newErrors.confirmPin = "Please confirm your PIN";
            valid = false;
        } else if (pin !== confirmPin) {
            newErrors.confirmPin = "PINs do not match";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            console.log("Submitting bank details:", {
                account_number: accountNumber,
                bank_code: selectedBank?.code,
                account_name: accountName,
                transaction_pin: pin,
            });
            const res = await api.post("users/create_transfer_recipient/", {
                account_number: accountNumber,
                bank_code: selectedBank?.code,
                account_name: accountName,
                transaction_pin: pin,
            });
            console.log("Bank details saved:", res);
            navigation.navigate("IDVerify" as never);
        } catch (error: any) {
            console.log("Error saving bank details:", error);
            Alert.alert(
                "Error",
                error?.data?.message ||
                "An error occurred while saving your bank details. Please try again."
            );
        }
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={scaleFont(20)} color="#000" />
                </TouchableOpacity>
                <View />
                <View />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                    overScrollMode="never"
                >
                    <View style={styles.container}>

                        {/* Title block */}
                        <View style={styles.titleBlock}>
                            <Text style={[styles.title, { fontSize: scaleFont(24) }]}>
                                Set Your Payment Info
                            </Text>
                            <Text style={[styles.subtitle, { fontSize: scaleFont(12) }]}>
                                Add your bank info for withdrawals.
                            </Text>
                        </View>

                        {/* Account Number */}
                        <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                            <Ionicons
                                name="card-outline"
                                size={scaleSize(20)}
                                color="#fcbf24"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { height: scaleSize(50) }]}
                                placeholder="Account Number"
                                placeholderTextColor="#aaa"
                                value={accountNumber}
                                onChangeText={handleAccountNumberChange}
                                keyboardType="number-pad"
                                maxLength={10}
                                returnKeyType="next"
                            />
                        </View>
                        {errors.accountNumber ? (
                            <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                {errors.accountNumber}
                            </Text>
                        ) : null}

                        {/* Bank Selector */}
                        <TouchableOpacity
                            style={[styles.inputContainer, { height: scaleSize(50), marginTop: Math.max(10, height * 0.012) }]}
                            onPress={() => {
                                setBankSearchText("");
                                handleSearch("");
                                setShowBankDropdown(true);
                            }}
                            activeOpacity={0.8}
                        >
                            <FontAwesome
                                name="bank"
                                size={scaleSize(18)}
                                color="#fcbf24"
                                style={styles.inputIcon}
                            />
                            <Text
                                style={[
                                    styles.input,
                                    { lineHeight: scaleSize(50) },
                                    !selectedBank && { color: "#aaa" },
                                ]}
                            >
                                {selectedBank ? selectedBank.name : "Select Bank"}
                            </Text>
                            <Entypo
                                name="chevron-down"
                                size={scaleSize(18)}
                                color="#aaa"
                                style={{ marginLeft: 4 }}
                            />
                        </TouchableOpacity>
                        {errors.bank ? (
                            <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                {errors.bank}
                            </Text>
                        ) : null}

                        {/* Resolved Account Name (read-only) */}
                        <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                            <Ionicons
                                name="person-outline"
                                size={scaleSize(20)}
                                color="#fcbf24"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { height: scaleSize(50) }]}
                                placeholder={
                                    isResolvingAccount
                                        ? "Resolving account..."
                                        : "Account Name (auto-filled)"
                                }
                                placeholderTextColor="#aaa"
                                value={accountName}
                                editable={false}
                            />
                            {isResolvingAccount && (
                                <Ionicons
                                    name="sync-outline"
                                    size={scaleSize(18)}
                                    color="#fcbf24"
                                    style={{ marginLeft: 4 }}
                                />
                            )}
                        </View>
                        {errors.accountName ? (
                            <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                {errors.accountName}
                            </Text>
                        ) : null}

                        {/* Transaction PIN */}
                        <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                            <Ionicons
                                name="keypad-outline"
                                size={scaleSize(20)}
                                color="#fcbf24"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { height: scaleSize(50) }]}
                                placeholder="Transaction PIN"
                                placeholderTextColor="#aaa"
                                value={pin}
                                onChangeText={(t) => {
                                    setPin(t.replace(/[^0-9]/g, ""));
                                    setErrors((e) => ({ ...e, pin: "" }));
                                }}
                                keyboardType="number-pad"
                                secureTextEntry={!showPin}
                                maxLength={6}
                                returnKeyType="next"
                            />
                            <TouchableOpacity onPress={() => setShowPin((v) => !v)} style={styles.eyeBtn}>
                                <Ionicons
                                    name={showPin ? "eye-outline" : "eye-off-outline"}
                                    size={scaleSize(20)}
                                    color="#aaa"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.pin ? (
                            <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                {errors.pin}
                            </Text>
                        ) : null}

                        {/* Confirm Transaction PIN */}
                        <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={scaleSize(20)}
                                color="#fcbf24"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { height: scaleSize(50) }]}
                                placeholder="Confirm Transaction PIN"
                                placeholderTextColor="#aaa"
                                value={confirmPin}
                                onChangeText={(t) => {
                                    setConfirmPin(t.replace(/[^0-9]/g, ""));
                                    setErrors((e) => ({ ...e, confirmPin: "" }));
                                }}
                                keyboardType="number-pad"
                                secureTextEntry={!showConfirmPin}
                                maxLength={6}
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPin((v) => !v)}
                                style={styles.eyeBtn}
                            >
                                <Ionicons
                                    name={showConfirmPin ? "eye-outline" : "eye-off-outline"}
                                    size={scaleSize(20)}
                                    color="#aaa"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPin ? (
                            <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                {errors.confirmPin}
                            </Text>
                        ) : null}

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.proceedBtn, { marginTop: Math.max(28, height * 0.035) }]}
                            onPress={handleSubmit}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.proceedText, { fontSize: scaleFont(16) }]}>
                                Save & Continue
                            </Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

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
                                <Entypo name="cross" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Bank Search */}
                        <View style={[styles.searchContainer, { height: scaleSize(50) }]}>
                            <MaterialIcons
                                name="search"
                                size={scaleSize(20)}
                                color="#aaa"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.searchInput, { fontSize: scaleFont(14) }]}
                                placeholder="Search bank"
                                placeholderTextColor="#aaa"
                                autoCapitalize="none"
                                value={bankSearchText}
                                onChangeText={(text) => {
                                    setBankSearchText(text);
                                    handleSearch(text);
                                }}
                                returnKeyType="search"
                            />
                        </View>

                        <FlatList
                            data={displayBanks}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginVertical: 16,
    },
    backBtn: {
        padding: 6,
        borderRadius: 100,
        backgroundColor: "#fff",
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
    },
    container: {
        flex: 1,
        backgroundColor: "#000",
        borderRadius: 20,
        padding: Math.max(20, width * 0.05),
        margin: Math.max(20, width * 0.05),
    },
    titleBlock: {
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    title: {
        color: "#fff",
        fontFamily: "Poppins-Bold",
        fontWeight: "700",
        textAlign: "center",
    },
    subtitle: {
        color: "#ccc",
        fontFamily: "Poppins-Regular",
        fontWeight: "400",
        textAlign: "center",
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        borderRadius: 10,
        marginBottom: 5,
        paddingHorizontal: Math.max(12, width * 0.03),
        borderWidth: 1,
        borderColor: "#fff",
    },
    inputIcon: {
        marginRight: Math.max(8, width * 0.02),
    },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: Math.max(14, width * 0.037),
        paddingHorizontal: Math.max(4, width * 0.01),
        fontFamily: "Poppins-Regular",
    },
    eyeBtn: {
        padding: Math.max(8, width * 0.02),
        marginLeft: Math.max(4, width * 0.01),
    },
    errorText: {
        color: "#ff4444",
        marginBottom: Math.max(4, height * 0.006),
        marginLeft: Math.max(12, width * 0.03),
        marginTop: 2,
        fontFamily: "Poppins-Regular",
    },
    proceedBtn: {
        backgroundColor: "#fcbf24",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        minHeight: Math.max(50, height * 0.06),
        paddingVertical: Math.max(14, height * 0.017),
    },
    proceedText: {
        color: "#000",
        fontWeight: "bold",
        fontFamily: "Poppins-Bold",
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#121212",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: "70%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#333",
    },
    modalTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: "Poppins-Bold",
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        borderRadius: 10,
        marginBottom: 12,
        paddingHorizontal: Math.max(12, width * 0.03),
        borderWidth: 1,
        borderColor: "#222",
    },
    searchInput: {
        flex: 1,
        color: "#fff",
        paddingHorizontal: Math.max(8, width * 0.02),
        fontFamily: "Poppins-Regular",
    },
    bankItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#333",
    },
    bankName: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "500",
        fontFamily: "Poppins-Regular",
    },
    bankCode: {
        color: "#fcbf24",
        fontSize: 14,
        fontFamily: "Poppins-Regular",
    },
});