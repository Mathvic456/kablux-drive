import { Ionicons } from "@expo/vector-icons";
import {
    Alert,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Platform,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUploadFile } from "../../../services/fileUpload.service";
import { useCreateVehicle, useVehicleImages } from "../../../services/createVehicle.service";
import CentralModal from "../../components/CentralModal";
import { useDriverKycStatus } from "../../../services/checkKyc.service";

const PHOTO_SLOTS = [
    { id: "front", label: "Front View" },
    { id: "back", label: "Back View" },
    { id: "left", label: "Left View" },
    { id: "interior", label: "Interior" },
];

export default function AddPhotos() {
    const navigation = useNavigation();
    const { width, height } = useWindowDimensions();
    const { data: kycData, isLoading } = useDriverKycStatus();

    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
    const [activeSlot, setActiveSlot] = useState<string | null>(null);
    const [showPickerModal, setShowPickerModal] = useState(false);

    const scaleFont = useCallback(
        (size: number) => Math.round(size * Math.min(width / 375, 1.3)),
        [width]
    );
    const scaleSize = useCallback(
        (size: number) => Math.round(size * Math.min(width / 375, 1.2)),
        [width]
    );

    const [photos, setPhotos] = useState<Record<string, { uri: string; fileId: string } | null>>({
        front: null,
        back: null,
        left: null,
        interior: null,
    });

    const [uploading, setUploading] = useState<Record<string, boolean>>({
        front: false,
        back: false,
        left: false,
        interior: false,
    });

    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const { mutateAsync: uploadFile } = useUploadFile();
    const { mutateAsync: postVehicleImage } = useVehicleImages();

    // ── Shared upload helper ──────────────────────────────────────────────────
    const handlePhotoUpload = useCallback(
        async (slotId: string, uri: string, fileName: string) => {
            setPhotos((prev) => ({ ...prev, [slotId]: { uri, fileId: "" } }));
            setErrors((prev) => ({ ...prev, [slotId]: false }));
            setUploading((prev) => ({ ...prev, [slotId]: true }));

            try {
                const formData = new FormData();
                formData.append("files", {
                    uri,
                    type: "image/jpeg",
                    name: fileName,
                } as any);
                formData.append("name", `car_${slotId}`);

                const uploadRes = await uploadFile(formData);
                const fileId = uploadRes.data?.results?.[0]?.id;
                console.log(`[AddPhotos] ${slotId} uploaded, fileId:`, fileId);
                if (!fileId) throw new Error("No fileId returned from upload");
                setPhotos((prev) => ({ ...prev, [slotId]: { uri, fileId } }));
            } catch (error) {
                console.error(`[AddPhotos] ${slotId} upload failed:`, error);
                setPhotos((prev) => ({ ...prev, [slotId]: null }));
                Alert.alert("Upload Failed", `Failed to upload the ${slotId} photo. Please try again.`);
            } finally {
                setUploading((prev) => ({ ...prev, [slotId]: false }));
            }
        },
        [uploadFile]
    );

    // ── Open bottom sheet for a slot ─────────────────────────────────────────
    const openPicker = useCallback((slotId: string) => {
        setActiveSlot(slotId);
        setShowPickerModal(true);
    }, []);

    // ── Camera ────────────────────────────────────────────────────────────────
    const pickFromCamera = useCallback(async () => {
        if (!activeSlot) return;
        const slotId = activeSlot;
        setShowPickerModal(false);

        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Permission to access the camera is required.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];
            const fileName = asset.fileName || asset.uri.split("/").pop() || `${slotId}.jpg`;
            await handlePhotoUpload(slotId, asset.uri, fileName);
        } catch (err) {
            console.error("Camera error:", err);
            setUploading((prev) => ({ ...prev, [slotId]: false }));
        }
    }, [activeSlot, handlePhotoUpload]);

    // ── Gallery ───────────────────────────────────────────────────────────────
    const pickFromGallery = useCallback(async () => {
        if (!activeSlot) return;
        const slotId = activeSlot;
        setShowPickerModal(false);

        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Permission to access photos is required.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [9, 16],
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.length) return;

            const asset = result.assets[0];
            const fileName = asset.fileName || asset.uri.split("/").pop() || `${slotId}.jpg`;
            await handlePhotoUpload(slotId, asset.uri, fileName);
        } catch (err) {
            console.error("Image pick error:", err);
            setUploading((prev) => ({ ...prev, [slotId]: false }));
        }
    }, [activeSlot, handlePhotoUpload]);

    const removeImage = useCallback((slotId: string) => {
        setPhotos((prev) => ({ ...prev, [slotId]: null }));
    }, []);

    const handleProceed = useCallback(async () => {
        const newErrors: Record<string, boolean> = {};

        PHOTO_SLOTS.forEach((slot) => {
            if (!photos[slot.id]?.fileId) newErrors[slot.id] = true;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const { vehicle_id } = kycData || {};
            if (!vehicle_id) throw new Error("vehicle_id not found");

            const payload = PHOTO_SLOTS.map((slot) => ({
                file: photos[slot.id]!.fileId,
                image_type: slot.id.toUpperCase(),
            }));

            console.log("Sending payload:", payload);

            await postVehicleImage({
                vehicle_id,
                images: payload,
            });
            setSuccessModalVisible(true);
        } catch (error) {
            console.error("Submit images failed:", error);
            Alert.alert("Error", "Failed to submit vehicle images. Try again.");
        }
    }, [photos, kycData, postVehicleImage]);

    const isAnyUploading = Object.values(uploading).some(Boolean);
    const allConfirmed = PHOTO_SLOTS.every((s) => photos[s.id]?.fileId);

    const CELL_SIZE =
        (width - Math.max(20, width * 0.05) * 2 - Math.max(20, width * 0.05) * 2 - 12) / 2;

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={scaleFont(20)} color="#000" />
                </TouchableOpacity>
                <View />
                <View />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                overScrollMode="never"
            >
                <View
                    style={[
                        styles.container,
                        { padding: Math.max(20, width * 0.05), margin: Math.max(20, width * 0.05) },
                    ]}
                >
                    {/* Title block */}
                    <View style={styles.titleBlock}>
                        <Text style={[styles.title, { fontSize: scaleFont(24) }]}>
                            Add Your Car Photos
                        </Text>
                        <Text style={[styles.subtitle, { fontSize: scaleFont(12) }]}>
                            Add the specific photos of your car to complete the verification
                            process. This includes clear images of the front, back, left, and
                            interior of your vehicle. Make sure the plate number is visible
                            for the back photo.
                        </Text>
                    </View>

                    {/* 2 × 2 Grid */}
                    <View style={styles.grid}>
                        {PHOTO_SLOTS.map((slot) => {
                            const photo = photos[slot.id];
                            const isUploading = uploading[slot.id];
                            const hasError = errors[slot.id];
                            const isConfirmed = !!photo?.fileId;

                            return (
                                <View key={slot.id} style={[styles.cellWrapper, { width: CELL_SIZE }]}>
                                    <Text style={[styles.cellLabel, { fontSize: scaleFont(12) }]}>
                                        {slot.label}
                                    </Text>

                                    <TouchableOpacity
                                        style={[
                                            styles.cell,
                                            { width: CELL_SIZE, height: CELL_SIZE },
                                            hasError && styles.cellError,
                                            isConfirmed && styles.cellFilled,
                                            isUploading && styles.cellUploading,
                                        ]}
                                        onPress={() => !isUploading && openPicker(slot.id)}
                                        activeOpacity={0.75}
                                        disabled={isUploading}
                                    >
                                        {photo?.uri ? (
                                            <>
                                                <Image
                                                    source={{ uri: photo.uri }}
                                                    style={styles.cellImage}
                                                />
                                                {isUploading && (
                                                    <View style={styles.uploadingOverlay}>
                                                        <ActivityIndicator size="small" color="#fcbf24" />
                                                        <Text
                                                            style={[
                                                                styles.uploadingLabel,
                                                                { fontSize: scaleFont(10) },
                                                            ]}
                                                        >
                                                            Uploading…
                                                        </Text>
                                                    </View>
                                                )}
                                                {!isUploading && (
                                                    <TouchableOpacity
                                                        style={styles.removeBtn}
                                                        onPress={() => removeImage(slot.id)}
                                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    >
                                                        <Ionicons name="close" size={scaleFont(12)} color="#fff" />
                                                    </TouchableOpacity>
                                                )}
                                            </>
                                        ) : (
                                            <View style={styles.placeholder}>
                                                <View
                                                    style={[
                                                        styles.crossIcon,
                                                        { width: scaleSize(28), height: scaleSize(28) },
                                                    ]}
                                                >
                                                    <View style={[styles.crossH, { width: scaleSize(28) }]} />
                                                    <View style={[styles.crossV, { height: scaleSize(28) }]} />
                                                </View>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {hasError && (
                                        <Text style={[styles.errorText, { fontSize: scaleFont(10) }]}>
                                            Required
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* Proceed */}
                    <TouchableOpacity
                        style={[
                            styles.proceedBtn,
                            {
                                marginTop: Math.max(24, height * 0.03),
                                minHeight: Math.max(50, height * 0.06),
                            },
                            (!allConfirmed || isAnyUploading) && styles.proceedBtnDim,
                        ]}
                        onPress={handleProceed}
                        activeOpacity={0.85}
                        disabled={!allConfirmed || isAnyUploading}
                    >
                        <Text style={[styles.proceedText, { fontSize: scaleFont(16) }]}>
                            {isAnyUploading ? "Uploading…" : "Proceed"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Success Modal */}
            <CentralModal
                visible={isSuccessModalVisible}
                onClose={() => navigation.navigate("IDVerify" as never)}
                title="Success!"
                subText="Photos uploaded successfully. Your vehicle is now under review, and you will be notified once the verification is complete."
                icon="checkmark-circle"
                confirmText="Proceed to ID Verification"
                closeText=""
                onConfirm={() => navigation.navigate("IDVerify" as never)}
                confirmButtonColor="#fcbf24"
                themeColor="#fcbf24"
            />

            {/* Photo Source Picker Modal */}
            <Modal
                visible={showPickerModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPickerModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowPickerModal(false)}>
                    <View style={styles.pickerOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.pickerSheet}>
                                <View style={styles.pickerHandle} />
                                <Text style={styles.pickerTitle}>
                                    {activeSlot
                                        ? `Add ${PHOTO_SLOTS.find((s) => s.id === activeSlot)?.label}`
                                        : "Add Photo"}
                                </Text>

                                <TouchableOpacity style={styles.pickerOption} onPress={pickFromCamera}>
                                    <View style={styles.pickerIconWrap}>
                                        <Ionicons name="camera" size={22} color="#fcbf24" />
                                    </View>
                                    <View>
                                        <Text style={styles.pickerOptionText}>Take a Photo</Text>
                                        <Text style={styles.pickerOptionSub}>Use your camera</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.pickerOption} onPress={pickFromGallery}>
                                    <View style={styles.pickerIconWrap}>
                                        <Ionicons name="images" size={22} color="#fcbf24" />
                                    </View>
                                    <View>
                                        <Text style={styles.pickerOptionText}>Choose from Gallery</Text>
                                        <Text style={styles.pickerOptionSub}>Pick an existing photo</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.pickerCancel}
                                    onPress={() => setShowPickerModal(false)}
                                >
                                    <Text style={styles.pickerCancelText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
    backBtn: { padding: 6, borderRadius: 100, backgroundColor: "#fff" },
    scrollContent: { flexGrow: 1, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
    container: { flex: 1, backgroundColor: "#000", borderRadius: 20, gap: 24 },
    titleBlock: { alignItems: "center", gap: 10 },
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
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
    cellWrapper: { gap: 6 },
    cellLabel: { color: "#fff", fontFamily: "Poppins-Regular", fontWeight: "600" },
    cell: {
        backgroundColor: "#1E1E1E",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1E1E1E",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    cellFilled: { borderColor: "#4CAF50" },
    cellUploading: { borderColor: "#fcbf24" },
    cellError: { borderColor: "#ff4444" },
    cellImage: { width: "100%", height: "100%", resizeMode: "cover" },
    uploadingOverlay: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    uploadingLabel: { color: "#fcbf24", fontWeight: "600" },
    placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
    crossIcon: { alignItems: "center", justifyContent: "center" },
    crossH: { position: "absolute", height: 2, backgroundColor: "#fcbf24", borderRadius: 1 },
    crossV: { position: "absolute", width: 2, backgroundColor: "#fcbf24", borderRadius: 1 },
    removeBtn: {
        position: "absolute",
        top: 6, right: 6,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 100,
        padding: 4,
    },
    errorText: { color: "#ff4444", fontFamily: "Poppins-Regular", marginTop: 2 },
    proceedBtn: {
        backgroundColor: "#fcbf24",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        marginTop: 4,
    },
    proceedBtnDim: { opacity: 0.5 },
    proceedText: { color: "#000", fontWeight: "bold", fontFamily: "Poppins-Bold" },
    // Photo Picker Sheet
    pickerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
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