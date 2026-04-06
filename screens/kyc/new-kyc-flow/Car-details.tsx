import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState, useCallback, useMemo } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useUploadFile } from "../../../services/fileUpload.service";
import { useUpdateProfile } from "../../../services/profile.service";
import { useSubmitKycDocument } from "../../../services/useSubmitKyc.service";
import { useCreateVehicle } from "../../../services/createVehicle.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

// FIX: Removed module-level Dimensions.get() — causes stale-value flicker.
// scaleFont/scaleSize now use useWindowDimensions() inside the component.

// ─── File Picker Row ──────────────────────────────────────────────────────────
const FilePicker = ({ icon, placeholder, value, onPress, error, loading }) => (
    <View style={{ marginTop: 10 }}>
        <TouchableOpacity
            style={[
                styles.inputContainer,
                { minHeight: 50 },
                error && { borderColor: "#ff4444" },
                loading && { opacity: 0.7 },
            ]}
            onPress={onPress}
            activeOpacity={0.75}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color="#fcbf24"
                    style={styles.inputIcon}
                />
            ) : (
                <Feather
                    name={icon}
                    size={20}
                    color={value ? "#fcbf24" : "#aaa"}
                    style={styles.inputIcon}
                />
            )}
            <Text
                style={[
                    styles.filePickerText,
                    value && styles.filePickerTextFilled,
                ]}
                numberOfLines={1}
            >
                {loading ? "Uploading…" : value || placeholder}
            </Text>
            {!loading && (
                <Feather
                    name={value ? "check-circle" : "upload"}
                    size={16}
                    color={value ? "#4CAF50" : "#555"}
                />
            )}
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CarDetails() {
    const navigation = useNavigation();
    const { width, height } = useWindowDimensions();

    const scaleFont = useCallback(
        (size: number) => Math.round(size * Math.min(width / 375, 1.3)),
        [width]
    );
    const scaleSize = useCallback(
        (size: number) => Math.round(size * Math.min(width / 375, 1.2)),
        [width]
    );

    // Memoize dynamic margins to prevent layout flicker
    const inputMarginTop = useMemo(
        () => Math.max(10, height * 0.012),
        [height]
    );
    const submitMarginTop = useMemo(
        () => Math.max(24, height * 0.03),
        [height]
    );

    const [plateNumber, setPlateNumber] = useState("");
    const [carModel, setCarModel] = useState("");
    const [year, setYear] = useState("");
    const [carDocument, setCarDocument] = useState<{ id: string, name: string } | null>(null);
    const [driversLicense, setDriversLicense] = useState<{ id: string, name: string } | null>(null);
    const [carColor, setCarColor] = useState("");

    // Independent loading states per field so spinners are scoped correctly
    const [isUploadingDocument, setIsUploadingDocument] = useState(false);
    const [isUploadingLicense, setIsUploadingLicense] = useState(false);

    const [errors, setErrors] = useState({
        plateNumber: "",
        carModel: "",
        year: "",
        carDocument: "",
        driversLicense: "",
        carColor: "",
    });

    const { mutateAsync: uploadFile } = useUploadFile();
    const { mutateAsync: createVehicle } = useCreateVehicle();
    const { mutateAsync: submitKycDocument } = useSubmitKycDocument();

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

    // ── Pick car document (DocumentPicker — kept as-is) then upload ───────────
    const pickDocument = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "image/*"],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];

            // Show filename immediately as optimistic feedback
            setCarDocument((prev) => ({ ...prev, name: asset.name }));
            setErrors((e) => ({ ...e, carDocument: "" }));
            setIsUploadingDocument(true);

            try {
                const formData = new FormData();
                formData.append("files", {
                    uri: asset.uri,
                    type: asset.mimeType || "application/octet-stream",
                    name: asset.name,
                } as any);
                formData.append("name", "car_document");

                const uploadRes = await uploadFile(formData);
                const fileId = uploadRes.data?.results?.[0]?.id;
                console.log("CAR DOCUMENT UPLOADED", uploadRes, fileId);

                if (!fileId) throw new Error("Upload succeeded but no file ID returned");
                setCarDocument((prev) => ({ ...prev, id: fileId }));


            } catch (error) {
                console.error("Car document upload failed:", error);
                // Clear optimistic value so user knows it didn't go through
                setCarDocument(null);
                Alert.alert(
                    "Upload Failed",
                    "Failed to upload the car document. Please try again."
                );
            } finally {
                setIsUploadingDocument(false);
            }
        } catch (err) {
            console.error("Document pick error:", err);
            setIsUploadingDocument(false);
        }
    }, [uploadFile]);

    // ── Pick license photo (ImagePicker gallery — kept as-is) then upload ─────
    const pickLicensePhoto = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Permission to access photos is required.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];
            const fileName = asset.fileName || asset.uri.split("/").pop() || "license.jpg";

            // Show filename immediately as optimistic feedback
            setDriversLicense((prev) => ({ ...prev, name: fileName }));
            setErrors((e) => ({ ...e, driversLicense: "" }));
            setIsUploadingLicense(true);

            try {
                const formData = new FormData();
                formData.append("files", {
                    uri: asset.uri,
                    type: "image/jpeg",
                    name: fileName,
                } as any);
                formData.append("name", "drivers_license");

                const uploadRes = await uploadFile(formData);
                const fileId = uploadRes.data?.results?.[0]?.id;
                console.log("LICENSE UPLOADED", uploadRes, fileId);

                if (!fileId) throw new Error("Upload succeeded but no file ID returned");

                setDriversLicense((prev) => ({ ...prev, id: fileId }));
            } catch (error) {
                console.error("License upload failed:", error);
                // Clear optimistic value so user knows it didn't go through
                setDriversLicense(null);
                Alert.alert(
                    "Upload Failed",
                    "Failed to upload the license photo. Please try again."
                );
            } finally {
                setIsUploadingLicense(false);
            }
        } catch (err) {
            console.error("Image pick error:", err);
            setIsUploadingLicense(false);
        }
    }, [uploadFile]);

    const handleSubmit = async () => {
        if (!validateForm()) return;
        console.log({ plateNumber, carModel, year, carDocument: carDocument?.id, driversLicense: driversLicense?.id, carColor });

        try {
            await createVehicle({
                plate_number: plateNumber,
                model: carModel,
                year: parseInt(year, 10),
                color: carColor,
            });
            // await AsyncStorage.setItem("vehicle_id", id);

            await submitKycDocument({
                doc_type: "POLICE_CLEARANCE",
                file: carDocument?.id || "",
            });

            await submitKycDocument({
                doc_type: "DRIVER_LICENSE",
                file: driversLicense?.id || "",
            });


            navigation.navigate("AddPhotos" as never);

        } catch (error) {
            Alert.alert(
                "Submission Failed",
                "An error occurred while submitting your car details. Please try again."
            );
            // navigation.navigate("AddPhotos" as never);

            console.error("Error submitting car details:", error);
        }

    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.navigate("IDVerify" as never)}
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
                                Tier 1 Upgrade
                            </Text>
                            <Text style={[styles.subtitle, { fontSize: scaleFont(13) }]}>
                                Verify your identity by providing the necessary information
                                below to upgrade to tier 2.
                            </Text>
                        </View>

                        {/* Plate Number */}
                        <View style={[styles.inputContainer, { marginTop: inputMarginTop }]}>
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
                                <View style={[styles.inputContainer, { marginTop: inputMarginTop }]}>
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
                                <View style={[styles.inputContainer, { marginTop: inputMarginTop }]}>
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

                        {/* Car Document — DocumentPicker, now with upload */}
                        <FilePicker
                            icon="file-text"
                            placeholder="Car Document (PDF / Image)"
                            value={carDocument?.name}
                            onPress={pickDocument}
                            error={errors.carDocument}
                            loading={isUploadingDocument}
                        />

                        {/* Driver's License — ImagePicker gallery, now with upload */}
                        <FilePicker
                            icon="camera"
                            placeholder="Driver's License (Photo)"
                            value={driversLicense?.name}
                            onPress={pickLicensePhoto}
                            error={errors.driversLicense}
                            loading={isUploadingLicense}
                        />

                        {/* Car Color */}
                        <View style={[styles.inputContainer, { marginTop: inputMarginTop }]}>
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
                            style={[
                                styles.proceedBtn,
                                { marginTop: submitMarginTop },
                                (isUploadingDocument || isUploadingLicense) && styles.proceedBtnDisabled,
                            ]}
                            onPress={handleSubmit}
                            activeOpacity={0.85}
                            disabled={isUploadingDocument || isUploadingLicense}
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
        padding: 3,
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
        padding: 20,
        marginHorizontal: 20,
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
        gap: 10,
        alignItems: "flex-start",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        borderRadius: 10,
        marginBottom: 5,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#fff",
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: 14,
        paddingHorizontal: 4,
        fontFamily: "Poppins-Regular",
    },
    filePickerText: {
        flex: 1,
        color: "#aaa",
        fontFamily: "Poppins-Regular",
        fontSize: 14,
    },
    filePickerTextFilled: {
        color: "#fff",
        fontWeight: "600",
    },
    errorText: {
        color: "#ff4444",
        marginBottom: 4,
        marginLeft: 12,
        marginTop: 2,
        fontFamily: "Poppins-Regular",
        fontSize: 12,
    },
    proceedBtn: {
        backgroundColor: "#fcbf24",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 50,
        paddingVertical: 14,
    },
    proceedBtnDisabled: {
        opacity: 0.5,
    },
    proceedText: {
        color: "#000",
        fontWeight: "bold",
        fontFamily: "Poppins-Bold",
    },
});