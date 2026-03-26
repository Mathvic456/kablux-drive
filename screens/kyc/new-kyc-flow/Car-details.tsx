import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

const { width, height } = Dimensions.get("window");

const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
};

const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
};

// ─── File Picker Row ──────────────────────────────────────────────────────────
const FilePicker = ({ icon, placeholder, value, onPress, error }) => (
    <View style={{ marginTop: Math.max(10, height * 0.012) }}>
        <TouchableOpacity
            style={[
                styles.inputContainer,
                { minHeight: scaleSize(50) },
                error && { borderColor: "#ff4444" },
            ]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <Feather
                name={icon}
                size={scaleSize(20)}
                color={value ? "#fcbf24" : "#aaa"}
                style={styles.inputIcon}
            />
            <Text
                style={[
                    styles.filePickerText,
                    { fontSize: scaleFont(14) },
                    value && styles.filePickerTextFilled,
                ]}
                numberOfLines={1}
            >
                {value || placeholder}
            </Text>
            <Feather
                name={value ? "check-circle" : "upload"}
                size={scaleSize(16)}
                color={value ? "#4CAF50" : "#555"}
            />
        </TouchableOpacity>
        {error ? (
            <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                {error}
            </Text>
        ) : null}
    </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CarDetails() {
    const navigation = useNavigation();

    const [plateNumber, setPlateNumber] = useState("");
    const [carModel, setCarModel] = useState("");
    const [year, setYear] = useState("");
    const [carDocument, setCarDocument] = useState(null);
    const [driversLicense, setDriversLicense] = useState(null);
    const [carColor, setCarColor] = useState("");

    const [errors, setErrors] = useState({
        plateNumber: "",
        carModel: "",
        year: "",
        carDocument: "",
        driversLicense: "",
        carColor: "",
    });

    const validateForm = () => {
        let valid = true;
        const newErrors = {
            plateNumber: "",
            carModel: "",
            year: "",
            carDocument: "",
            driversLicense: "",
            carColor: "",
        };

        if (!plateNumber.trim()) {
            newErrors.plateNumber = "Plate number is required";
            valid = false;
        }
        if (!carModel.trim()) {
            newErrors.carModel = "Car model is required";
            valid = false;
        }
        if (!year.trim()) {
            newErrors.year = "Year is required";
            valid = false;
        } else if (!/^\d{4}$/.test(year) || +year < 1990 || +year > new Date().getFullYear()) {
            newErrors.year = "Enter a valid year";
            valid = false;
        }
        if (!carDocument) {
            newErrors.carDocument = "Car document is required";
            valid = false;
        }
        if (!driversLicense) {
            newErrors.driversLicense = "Driver's license photo is required";
            valid = false;
        }
        if (!carColor.trim()) {
            newErrors.carColor = "Car color is required";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "image/*"],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.length > 0) {
                setCarDocument(result.assets[0].name);
                setErrors((e) => ({ ...e, carDocument: "" }));
            }
        } catch (err) {
            console.error("Document pick error:", err);
        }
    };

    const pickLicensePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                alert("Permission to access photos is required.");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });
            if (!result.canceled && result.assets?.length > 0) {
                const uri = result.assets[0].uri;
                const fileName = uri.split("/").pop();
                setDriversLicense(fileName);
                setErrors((e) => ({ ...e, driversLicense: "" }));
            }
        } catch (err) {
            console.error("Image pick error:", err);
        }
    };

    const handleSubmit = () => {
        // if (!validateForm()) return;
        // console.log({ plateNumber, carModel, year, carDocument, driversLicense, carColor });
        navigation.navigate("AddPhotos" as never);
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
                                Tier 1 Upgrade
                            </Text>
                            <Text style={[styles.subtitle, { fontSize: scaleFont(13) }]}>
                                Verify your identity by providing the necessary information
                                below to upgrade to tier 2.
                            </Text>
                        </View>

                        {/* Plate Number */}
                        <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                            <MaterialCommunityIcons
                                name="card-text-outline"
                                size={scaleSize(20)}
                                color="#aaa"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { height: scaleSize(50) }]}
                                placeholder="Plate Number"
                                placeholderTextColor="#aaa"
                                value={plateNumber}
                                onChangeText={(t) => {
                                    setPlateNumber(t.toUpperCase());
                                    setErrors((e) => ({ ...e, plateNumber: "" }));
                                }}
                                autoCapitalize="characters"
                                returnKeyType="next"
                            />
                        </View>
                        {errors.plateNumber ? (
                            <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                {errors.plateNumber}
                            </Text>
                        ) : null}

                        {/* Car Model + Year — side by side */}
                        <View style={styles.row}>
                            <View style={{ flex: 1.6 }}>
                                <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                                    <Ionicons
                                        name="car"
                                        size={scaleSize(20)}
                                        color="#aaa"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, { height: scaleSize(50) }]}
                                        placeholder="Car Model"
                                        placeholderTextColor="#aaa"
                                        value={carModel}
                                        onChangeText={(t) => {
                                            setCarModel(t);
                                            setErrors((e) => ({ ...e, carModel: "" }));
                                        }}
                                        returnKeyType="next"
                                    />
                                </View>
                                {errors.carModel ? (
                                    <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                        {errors.carModel}
                                    </Text>
                                ) : null}
                            </View>

                            <View style={{ flex: 1 }}>
                                <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                                    <Feather
                                        name="calendar"
                                        size={scaleSize(18)}
                                        color="#aaa"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={[styles.input, { height: scaleSize(50) }]}
                                        placeholder="Year"
                                        placeholderTextColor="#aaa"
                                        value={year}
                                        onChangeText={(t) => {
                                            setYear(t);
                                            setErrors((e) => ({ ...e, year: "" }));
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        returnKeyType="next"
                                    />
                                </View>
                                {errors.year ? (
                                    <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                        {errors.year}
                                    </Text>
                                ) : null}
                            </View>
                        </View>

                        {/* Car Document */}
                        <FilePicker
                            icon="file-text"
                            placeholder="Car Document (PDF / Image)"
                            value={carDocument}
                            onPress={pickDocument}
                            error={errors.carDocument}
                        />

                        {/* Driver's License */}
                        <FilePicker
                            icon="camera"
                            placeholder="Driver's License (Photo)"
                            value={driversLicense}
                            onPress={pickLicensePhoto}
                            error={errors.driversLicense}
                        />

                        {/* Car Color — last field */}
                        <View style={[styles.inputContainer, { marginTop: Math.max(10, height * 0.012) }]}>
                            <MaterialCommunityIcons
                                name="palette-outline"
                                size={scaleSize(20)}
                                color="#aaa"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { height: scaleSize(50) }]}
                                placeholder="Car Color"
                                placeholderTextColor="#aaa"
                                value={carColor}
                                onChangeText={(t) => {
                                    setCarColor(t);
                                    setErrors((e) => ({ ...e, carColor: "" }));
                                }}
                                autoCapitalize="words"
                                returnKeyType="done"
                            />
                        </View>
                        {errors.carColor ? (
                            <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                                {errors.carColor}
                            </Text>
                        ) : null}

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.proceedBtn, { marginTop: Math.max(24, height * 0.03) }]}
                            onPress={handleSubmit}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.proceedText, { fontSize: scaleFont(16) }]}>
                                Proceed
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
        marginHorizontal: Math.max(20, width * 0.05),
    },
    titleBlock: {
        alignItems: "center",
        gap: 10,
        marginBottom: 6,
    },
    title: {
        color: "#fff",
        fontFamily: "Poppins-Bold",
        fontWeight: "700",
        letterSpacing: 0,
    },
    subtitle: {
        color: "#ccc",
        fontFamily: "Poppins-Regular",
        fontWeight: "400",
        textAlign: "center",
        lineHeight: 20,
    },
    row: {
        flexDirection: "row",
        gap: Math.max(10, width * 0.025),
        alignItems: "flex-start",
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
    filePickerText: {
        flex: 1,
        color: "#aaa",
        fontFamily: "Poppins-Regular",
    },
    filePickerTextFilled: {
        color: "#fff",
        fontWeight: "600",
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