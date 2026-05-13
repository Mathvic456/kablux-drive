import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
    Alert,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import React, { useState, useCallback, useMemo } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useUploadFile } from "../../../services/fileUpload.service";
import { useSubmitKycDocument } from "../../../services/useSubmitKyc.service";
import { useCreateVehicle } from "../../../services/createVehicle.service";
import Select from "../../../components/Select";

// ─── Sanitizers ───────────────────────────────────────────────────────────────
// Allows letters, numbers, spaces only
const stripSpecial = (text: string) => text.replace(/[^a-zA-Z0-9 ]/g, "");
// Plate: letters, numbers, hyphens only (common plate format)
const stripSpecialPlate = (text: string) => text.replace(/[^a-zA-Z0-9-]/g, "");
// Year: digits only
const stripSpecialYear = (text: string) => text.replace(/[^0-9]/g, "");

// ─── File Picker Row ──────────────────────────────────────────────────────────
const FilePicker = ({ icon, placeholder, value, onPress, error, loading }: {
    icon: string;
    placeholder: string;
    value?: string;
    onPress: () => void;
    error?: string;
    loading?: boolean;
}) => (
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
                <ActivityIndicator size="small" color="#fcbf24" style={styles.inputIcon} />
            ) : (
                <Feather
                    name={icon}
                    size={20}
                    color={value ? "#fcbf24" : "#aaa"}
                    style={styles.inputIcon}
                />
            )}
            <Text
                style={[styles.filePickerText, value && styles.filePickerTextFilled]}
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

    const inputMarginTop = useMemo(() => Math.max(10, height * 0.012), [height]);
    const submitMarginTop = useMemo(() => Math.max(24, height * 0.03), [height]);

    const [plateNumber, setPlateNumber] = useState("");
    const [carModel, setCarModel] = useState("");
    const [year, setYear] = useState("");
    const [carDocument, setCarDocument] = useState<{ id: string; name: string } | null>(null);
    const [driversLicense, setDriversLicense] = useState<{ id: string; name: string } | null>(null);
    const [carColor, setCarColor] = useState("");
    const [isCarInGoodCondition, setIsCarInGoodCondition] = useState<string | null>(null);
    const [isAcWorking, setIsAcWorking] = useState<string | null>(null);
    const [isInteriorNeat, setIsInteriorNeat] = useState<string | null>(null);
    const [carBodyCondition, setCarBodyCondition] = useState<string | null>(null);

    const [isUploadingDocument, setIsUploadingDocument] = useState(false);
    const [isUploadingLicense, setIsUploadingLicense] = useState(false);
    const [showLicensePickerModal, setShowLicensePickerModal] = useState(false);
    const [showDocumentPickerModal, setShowDocumentPickerModal] = useState(false);

    const [errors, setErrors] = useState({
        plateNumber: "",
        carModel: "",
        year: "",
        carDocument: "",
        driversLicense: "",
        carColor: "",
        isCarInGoodCondition: "",
        isAcWorking: "",
        isInteriorNeat: "",
        carBodyCondition: "",
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
            isCarInGoodCondition: "",
            isAcWorking: "",
            isInteriorNeat: "",
            carBodyCondition: "",
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
        if (!isCarInGoodCondition) {
            newErrors.isCarInGoodCondition = "Please select an option";
            valid = false;
        }
        if (!isAcWorking) {
            newErrors.isAcWorking = "Please select an option";
            valid = false;
        }
        if (!isInteriorNeat) {
            newErrors.isInteriorNeat = "Please select an option";
            valid = false;
        }
        if (!carBodyCondition) {
            newErrors.carBodyCondition = "Please select an option";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    // ── Shared document upload helper ─────────────────────────────────────────
    const handleDocumentUpload = useCallback(
        async (uri: string, mimeType: string, fileName: string) => {
            setErrors((e) => ({ ...e, carDocument: "" }));
            setCarDocument({ id: "", name: fileName });
            setIsUploadingDocument(true);
            try {
                const formData = new FormData();
                formData.append("files", {
                    uri,
                    type: mimeType || "application/octet-stream",
                    name: fileName,
                } as any);
                formData.append("name", "car_document");

                const uploadRes = await uploadFile(formData);
                const fileId = uploadRes.data?.results?.[0]?.id;
                console.log("CAR DOCUMENT UPLOADED", uploadRes, fileId);

                if (!fileId) throw new Error("Upload succeeded but no file ID returned");
                setCarDocument({ id: fileId, name: fileName });
            } catch (error) {
                console.error("Car document upload failed:", error);
                setCarDocument(null);
                Alert.alert("Upload Failed", "Failed to upload the car document. Please try again.");
            } finally {
                setIsUploadingDocument(false);
            }
        },
        [uploadFile]
    );

    // ── Pick car document from file system ────────────────────────────────────
    const pickDocumentFromFiles = useCallback(async () => {
        setShowDocumentPickerModal(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "image/*"],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];
            await handleDocumentUpload(asset.uri, asset.mimeType || "application/octet-stream", asset.name);
        } catch (err) {
            console.error("Document pick error:", err);
            setIsUploadingDocument(false);
        }
    }, [handleDocumentUpload]);

    // ── Pick car document from camera  ─────────────────────────────────────────
    const pickDocumentFromCamera = useCallback(async () => {
        setShowDocumentPickerModal(false);
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Camera permission is required.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];
            const fileName = asset.fileName || asset.uri.split("/").pop() || "car_document.jpg";
            await handleDocumentUpload(asset.uri, "image/jpeg", fileName);
        } catch (err) {
            console.error("Camera error:", err);
            setIsUploadingDocument(false);
        }
    }, [handleDocumentUpload]);

    // ── Pick car document from gallery ────────────────────────────────────────
    const pickDocumentFromGallery = useCallback(async () => {
        setShowDocumentPickerModal(false);
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
            const fileName = asset.fileName || asset.uri.split("/").pop() || "car_document.jpg";
            await handleDocumentUpload(asset.uri, "image/jpeg", fileName);
        } catch (err) {
            console.error("Image pick error:", err);
            setIsUploadingDocument(false);
        }
    }, [handleDocumentUpload]);

    // ── Shared upload helper for license ─────────────────────────────────────
    const handleLicenseUpload = useCallback(
        async (uri: string, fileName: string) => {
            setErrors((e) => ({ ...e, driversLicense: "" }));
            setIsUploadingLicense(true);
            try {
                const formData = new FormData();
                formData.append("files", {
                    uri,
                    type: "image/jpeg",
                    name: fileName,
                } as any);
                formData.append("name", "drivers_license");

                const uploadRes = await uploadFile(formData);
                const fileId = uploadRes.data?.results?.[0]?.id;
                console.log("LICENSE UPLOADED", uploadRes, fileId);

                if (!fileId) throw new Error("Upload succeeded but no file ID returned");
                setDriversLicense({ id: fileId, name: fileName });
            } catch (error) {
                console.error("License upload failed:", error);
                setDriversLicense(null);
                Alert.alert("Upload Failed", "Failed to upload the license photo. Please try again.");
            } finally {
                setIsUploadingLicense(false);
            }
        },
        [uploadFile]
    );

    // ── Pick license from gallery ─────────────────────────────────────────────
    const pickLicenseFromGallery = useCallback(async () => {
        setShowLicensePickerModal(false);
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
                aspect: [9, 16],
            });

            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];
            const fileName = asset.fileName || asset.uri.split("/").pop() || "license.jpg";
            setDriversLicense((prev) => ({ id: prev?.id || "", name: fileName }));
            await handleLicenseUpload(asset.uri, fileName);
        } catch (err) {
            console.error("Image pick error:", err);
            setIsUploadingLicense(false);
        }
    }, [handleLicenseUpload]);

    // ── Pick license from camera ──────────────────────────────────────────────
    const pickLicenseFromCamera = useCallback(async () => {
        setShowLicensePickerModal(false);
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Camera permission is required.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];
            const fileName = asset.fileName || asset.uri.split("/").pop() || "license.jpg";
            setDriversLicense((prev) => ({ id: prev?.id || "", name: fileName }));
            await handleLicenseUpload(asset.uri, fileName);
        } catch (err) {
            console.error("Camera error:", err);
            setIsUploadingLicense(false);
        }
    }, [handleLicenseUpload]);

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            await createVehicle({
                plate_number: plateNumber,
                model: carModel,
                year: parseInt(year, 10),
                color: carColor,
                vehicle_info: {
                    is_car_in_good_condition: isCarInGoodCondition === "yes",
                    is_ac_working: isAcWorking === "yes",
                    is_interior_neat: isInteriorNeat === "yes",
                    car_body_condition: carBodyCondition,
                },
            });

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
            console.error("Error submitting car details:", error);
        }
    };

    // ── Reusable picker sheet ─────────────────────────────────────────────────
    const PickerSheet = ({
        visible,
        onClose,
        title,
        onCamera,
        onGallery,
        onFiles,
    }: {
        visible: boolean;
        onClose: () => void;
        title: string;
        onCamera: () => void;
        onGallery: () => void;
        onFiles?: () => void;
    }) => (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.pickerOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.pickerSheet}>
                            <View style={styles.pickerHandle} />
                            <Text style={styles.pickerTitle}>{title}</Text>

                            <TouchableOpacity style={styles.pickerOption} onPress={onCamera}>
                                <View style={styles.pickerIconWrap}>
                                    <Ionicons name="camera" size={22} color="#fcbf24" />
                                </View>
                                <View>
                                    <Text style={styles.pickerOptionText}>Take a Photo</Text>
                                    <Text style={styles.pickerOptionSub}>Use your camera</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.pickerOption} onPress={onGallery}>
                                <View style={styles.pickerIconWrap}>
                                    <Ionicons name="images" size={22} color="#fcbf24" />
                                </View>
                                <View>
                                    <Text style={styles.pickerOptionText}>Choose from Gallery</Text>
                                    <Text style={styles.pickerOptionSub}>Pick an existing photo</Text>
                                </View>
                            </TouchableOpacity>

                            {onFiles && (
                                <TouchableOpacity style={styles.pickerOption} onPress={onFiles}>
                                    <View style={styles.pickerIconWrap}>
                                        <Ionicons name="document-outline" size={22} color="#fcbf24" />
                                    </View>
                                    <View>
                                        <Text style={styles.pickerOptionText}>Browse Files</Text>
                                        <Text style={styles.pickerOptionSub}>Pick a PDF or document</Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
                                <Text style={styles.pickerCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

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
                                    setPlateNumber(stripSpecialPlate(t).toUpperCase());
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
                                            setCarModel(stripSpecial(t));
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
                                            setYear(stripSpecialYear(t));
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

                        {/* Car Document — opens bottom sheet with 3 options */}
                        <FilePicker
                            icon="file-text"
                            placeholder="Car Document (PDF / Image)"
                            value={carDocument?.name}
                            onPress={() => setShowDocumentPickerModal(true)}
                            error={errors.carDocument}
                            loading={isUploadingDocument}
                        />

                        {/* Driver's License — opens bottom sheet */}
                        <FilePicker
                            icon="camera"
                            placeholder="Driver's License (Photo)"
                            value={driversLicense?.name}
                            onPress={() => setShowLicensePickerModal(true)}
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
                                    setCarColor(stripSpecial(t));
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

                        {/* Vehicle Info — condition selects */}
                        <Select
                            icon="check-circle"
                            label="Is your car in good condition?"
                            placeholder="Select Yes or No"
                            value={isCarInGoodCondition}
                            options={[
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                            ]}
                            onSelect={(v) => {
                                setIsCarInGoodCondition(v);
                                setErrors((e) => ({ ...e, isCarInGoodCondition: "" }));
                            }}
                            error={errors.isCarInGoodCondition}
                        />

                        <Select
                            icon="wind"
                            label="Is the air conditioning working?"
                            placeholder="Select Yes or No"
                            value={isAcWorking}
                            options={[
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                            ]}
                            onSelect={(v) => {
                                setIsAcWorking(v);
                                setErrors((e) => ({ ...e, isAcWorking: "" }));
                            }}
                            error={errors.isAcWorking}
                        />

                        <Select
                            icon="droplet"
                            label="Is the car interior neat?"
                            placeholder="Select Yes or No"
                            value={isInteriorNeat}
                            options={[
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                            ]}
                            onSelect={(v) => {
                                setIsInteriorNeat(v);
                                setErrors((e) => ({ ...e, isInteriorNeat: "" }));
                            }}
                            error={errors.isInteriorNeat}
                        />

                        <Select
                            icon="shield"
                            label="How would you rate the car body condition?"
                            placeholder="Select Fair, Good or Bad"
                            value={carBodyCondition}
                            options={[
                                { value: "fair", label: "Fair" },
                                { value: "good", label: "Good" },
                                { value: "bad", label: "Bad" },
                            ]}
                            onSelect={(v) => {
                                setCarBodyCondition(v);
                                setErrors((e) => ({ ...e, carBodyCondition: "" }));
                            }}
                            error={errors.carBodyCondition}
                        />

                        {/* Disclaimer */}
                        <Text style={[styles.disclaimerText, { fontSize: scaleFont(12) }]}>
                            Kindly note that if any information given here is false, your details maybe parnanately ban from our system
                        </Text>

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

            {/* Car Document Picker Modal — camera + gallery + files */}
            <PickerSheet
                visible={showDocumentPickerModal}
                onClose={() => setShowDocumentPickerModal(false)}
                title="Upload Car Document"
                onCamera={pickDocumentFromCamera}
                onGallery={pickDocumentFromGallery}
                onFiles={pickDocumentFromFiles}
            />

            {/* License Image Source Picker Modal — camera + gallery */}
            <PickerSheet
                visible={showLicensePickerModal}
                onClose={() => setShowLicensePickerModal(false)}
                title="Upload Driver's License"
                onCamera={pickLicenseFromCamera}
                onGallery={pickLicenseFromGallery}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: "#000" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginVertical: 16,
    },
    backBtn: { padding: 3, borderRadius: 100, backgroundColor: "#fff" },
    scrollContent: { flexGrow: 1, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
    container: {
        flex: 1,
        backgroundColor: "#000",
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
    },
    titleBlock: { alignItems: "center", gap: 10, marginBottom: 6 },
    title: { color: "#fff", fontFamily: "Poppins-Bold", fontWeight: "700", letterSpacing: 0 },
    subtitle: {
        color: "#ccc",
        fontFamily: "Poppins-Regular",
        fontWeight: "400",
        textAlign: "center",
        lineHeight: 20,
    },
    row: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
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
    inputIcon: { marginRight: 8 },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: 14,
        paddingHorizontal: 4,
        fontFamily: "Poppins-Regular",
    },
    filePickerText: { flex: 1, color: "#aaa", fontFamily: "Poppins-Regular", fontSize: 14 },
    filePickerTextFilled: { color: "#fff", fontWeight: "600" },
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
    proceedBtnDisabled: { opacity: 0.5 },
    proceedText: { color: "#000", fontWeight: "bold", fontFamily: "Poppins-Bold" },
    disclaimerText: {
        color: "#fcbf24",
        marginTop: 16,
        paddingHorizontal: 4,
        textAlign: "center",
        lineHeight: 18,
        fontFamily: "Poppins-Regular",
    },
    // Picker Sheet
    pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    pickerSheet: {
        backgroundColor: "#1C1C1E",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 36,
        paddingTop: 12,
    },
    pickerHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#444",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 16,
    },
    pickerTitle: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 20,
        textAlign: "center",
        fontFamily: "Poppins-Bold",
    },
    pickerOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#2C2C2E",
    },
    pickerIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(252,191,36,0.12)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    pickerOptionText: { color: "white", fontSize: 15, fontWeight: "600", fontFamily: "Poppins-Bold" },
    pickerOptionSub: { color: "#888", fontSize: 13, marginTop: 2, fontFamily: "Poppins-Regular" },
    pickerCancel: {
        marginTop: 16,
        backgroundColor: "#2C2C2E",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    pickerCancelText: { color: "#ff4444", fontSize: 15, fontWeight: "600", fontFamily: "Poppins-Bold" },
});