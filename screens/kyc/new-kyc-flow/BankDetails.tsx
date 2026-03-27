import { Ionicons } from "@expo/vector-icons";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

const { width, height } = Dimensions.get("window");

const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
};

const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
};

export default function BankDetails() {
    const navigation = useNavigation();

    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);

    const [errors, setErrors] = useState({
        accountName: "",
        accountNumber: "",
        pin: "",
        confirmPin: "",
    });

    const validateForm = () => {
        let valid = true;
        const newErrors = { accountName: "", accountNumber: "", pin: "", confirmPin: "" };

        if (!accountName.trim()) {
            newErrors.accountName = "Account name is required";
            valid = false;
        } else if (accountName.trim().length < 3) {
            newErrors.accountName = "Enter a valid account name";
            valid = false;
        }

        if (!accountNumber.trim()) {
            newErrors.accountNumber = "Account number is required";
            valid = false;
        } else if (!/^\d{10}$/.test(accountNumber)) {
            newErrors.accountNumber = "Account number must be 10 digits";
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

    const handleSubmit = () => {
        if (!validateForm()) return;
        console.log({ accountName, accountNumber, pin });
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate("IDVerify" as never)} style={styles.backBtn}>
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

                        {/* Account Name */}
                        <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                            <Ionicons
                                name="person-outline"
                                size={scaleSize(20)}
                                color="#aaa"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { height: scaleSize(50) }]}
                                placeholder="Account Name"
                                placeholderTextColor="#aaa"
                                value={accountName}
                                onChangeText={(t) => {
                                    setAccountName(t);
                                    setErrors((e) => ({ ...e, accountName: "" }));
                                }}
                                autoCapitalize="words"
                                returnKeyType="next"
                            />
                        </View>
                        {errors.accountName ? (
                            <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                {errors.accountName}
                            </Text>
                        ) : null}

                        {/* Account Number */}
                        <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                            <Ionicons
                                name="card-outline"
                                size={scaleSize(20)}
                                color="#aaa"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { height: scaleSize(50) }]}
                                placeholder="Account Number"
                                placeholderTextColor="#aaa"
                                value={accountNumber}
                                onChangeText={(t) => {
                                    setAccountNumber(t.replace(/[^0-9]/g, ""));
                                    setErrors((e) => ({ ...e, accountNumber: "" }));
                                }}
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

                        {/* Transaction PIN */}
                        <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                            <Ionicons
                                name="keypad-outline"
                                size={scaleSize(20)}
                                color="#aaa"
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
                            <TouchableOpacity
                                onPress={() => setShowPin((v) => !v)}
                                style={styles.eyeBtn}
                            >
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
                                color="#aaa"
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
        letterSpacing: 0,
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
});