import { Ionicons } from "@expo/vector-icons";
import {
    Alert,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useCameraPermissions } from "expo-camera";
import { useUploadFile } from "../../../services/fileUpload.service";
import { useUpdateProfile } from "../../../services/profile.service";
import { useDriverKycStatus } from "../../../services/checkKyc.service";

export default function IDVerification() {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();

    const scaleFont = useCallback(
        (size: number) => Math.round(size * Math.min(width / 375, 1.3)),
        [width]
    );

    const [selfieUri, setSelfieUri] = useState<string | null>(null);
    const [permission, requestPermission] = useCameraPermissions();

    const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
    const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();
    const { data: kycData, isLoading } = useDriverKycStatus();


    // True while either the upload or the profile update is in flight
    const isProcessing = isUploading || isUpdating;

    const handleTakeSelfie = useCallback(async () => {
        // Step 1: Ensure camera permission
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert(
                    "Camera Permission Required",
                    "Please allow camera access in your device settings to take a selfie.",
                    [{ text: "OK" }]
                );
                return;
            }
        }

        // Step 2: Open native camera — no gallery access possible
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            cameraType: ImagePicker.CameraType.front,
        });

        if (result.canceled || result.assets.length === 0) return;

        const asset = result.assets[0];

        // Show the preview immediately so the user gets instant feedback
        setSelfieUri(asset.uri);

        // Step 3: Upload + update profile — same flow as pickProfileImages in Account
        try {
            const filename = asset.fileName || asset.uri.split("/").pop() || "selfie.jpg";

            const formData = new FormData();
            formData.append("files", {
                uri: asset.uri,
                type: "image/jpeg",
                name: filename,
            } as any);
            formData.append("name", "profile_image");

            const uploadRes = await uploadFile(formData);
            const fileId = uploadRes.data?.results?.[0]?.id;
            console.log("SELFIE UPLOADED", uploadRes, fileId);

            if (!fileId) throw new Error("Upload succeeded but no file ID returned");

            // Link the uploaded file to the user's profile
            await updateProfile({ upload_id: fileId });

            Alert.alert("Selfie Saved", "Your photo has been uploaded successfully.");
        } catch (error) {
            console.error("Selfie upload failed:", error);
            // Clear the preview so the user knows it didn't go through
            setSelfieUri(null);
            Alert.alert("Upload Failed", "Failed to upload your selfie. Please try again.");
        }
    }, [permission, requestPermission, uploadFile, updateProfile]);

    const handleCarDetailNavigation = useCallback(() => {
        if (kycData?.steps?.vehicle_added && !kycData?.steps?.vehicle_images_completed) {
            navigation.navigate("AddPhotos" as never);
        }
        else {
            navigation.navigate("CarDetails" as never);
        }
    }, [navigation, kycData]);

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.navigate("MainTabs" as never)}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={scaleFont(24)} color="#000" />
                </TouchableOpacity>
                <View />
                <View />
            </View>

            <View
                style={[
                    styles.container,
                    {
                        padding: Math.max(20, width * 0.05),
                        margin: Math.max(20, width * 0.05),
                    },
                ]}
            >
                {/* Hero section */}
                <View style={styles.heroSection}>
                    <Image
                        source={require("../../../assets/images/face.png")}
                        style={styles.heroImage}
                    />
                    <Text style={[styles.title, { fontSize: scaleFont(22) }]}>
                        IDENTITY VERIFICATION
                    </Text>
                    <Text style={[styles.subtitle, { fontSize: scaleFont(12) }]}>
                        To ensure the security of your account, we require a valid ID for
                        verification. Please upload a clear photo of your government-issued ID.
                    </Text>
                </View>

                {/* Action buttons */}
                <View style={styles.actionsContainer}>

                    {/* Selfie button */}
                    <TouchableOpacity
                        onPress={handleTakeSelfie}
                        activeOpacity={0.75}
                        disabled={isProcessing || (kycData?.steps?.profile_completed ?? false)}
                    >
                        <View style={[styles.actionRow, (selfieUri || kycData?.steps?.profile_completed) ? styles.actionRowCompleted : null]}>
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#FFC107" />
                            ) : selfieUri ? (
                                <Image source={{ uri: selfieUri }} style={styles.selfieThumbnail} />
                            ) : (
                                <Ionicons name="camera" size={18} color="#fff" />
                            )}

                            <Text style={[styles.actionLabel, { fontSize: scaleFont(16) }]}>
                                {isProcessing
                                    ? "Uploading…"
                                    : selfieUri
                                        ? "Selfie Taken ✓"
                                        : "Selfie"}
                            </Text>

                            {(selfieUri || kycData?.steps?.profile_completed) && !isProcessing && (
                                <TouchableOpacity
                                    onPress={handleTakeSelfie}
                                    style={styles.retakeBtn}
                                    activeOpacity={0.7}
                                    disabled
                                >
                                    <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCarDetailNavigation}
                        activeOpacity={0.75}
                        disabled={isProcessing || (kycData?.steps?.vehicle_images_completed ?? false)}
                    >
                        <View style={[styles.actionRow, (kycData?.steps?.vehicle_added && kycData?.steps?.vehicle_images_completed) ? styles.actionRowCompleted : null]}>
                            <Ionicons name="person" size={18} color="#fff" />
                            <Text style={[styles.actionLabel, { fontSize: scaleFont(16) }]}>
                                Car Details
                            </Text>
                            {(kycData?.steps?.vehicle_added && kycData?.steps?.vehicle_images_completed) && (
                                <TouchableOpacity
                                    onPress={handleTakeSelfie}
                                    style={styles.retakeBtn}
                                    activeOpacity={0.7}
                                    disabled
                                >
                                    <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("BankDetails" as never)}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.actionRow]}>
                            <Ionicons name="card" size={18} color="#fff" />
                            <Text style={[styles.actionLabel, { fontSize: scaleFont(16) }]}>
                                Bank Details
                            </Text>
                        </View>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                        onPress={() => navigation.navigate("BankDetails" as never)}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.actionRow, (kycData?.steps?.profile_completed) ? styles.actionRowCompleted : null]}>
                            <Ionicons name="card" size={18} color="#fff" />
                            <Text style={[styles.actionLabel, { fontSize: scaleFont(16) }]}>
                                Bank Details
                            </Text>
                            {kycData?.steps?.profile_completed && (
                                <TouchableOpacity
                                    onPress={handleTakeSelfie}
                                    style={styles.retakeBtn}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity> */}

                </View>
            </View>
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
        marginVertical: 20,
    },
    backBtn: {
        padding: 4,
        borderRadius: 50,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
        backgroundColor: "#000",
        borderRadius: 20,
        gap: 20,
    },
    heroSection: {
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
    },
    heroImage: {
        width: 93,
        height: 93,
        alignSelf: "center",
        marginBottom: 20,
    },
    title: {
        color: "#fff",
        fontFamily: "Poppins-Bold",
        fontWeight: "700",
        letterSpacing: 0,
        textAlign: "center",
    },
    subtitle: {
        color: "#fff",
        fontFamily: "Poppins-Regular",
        fontWeight: "400",
        letterSpacing: 0,
        textAlign: "center",
    },
    actionsContainer: {
        flex: 1,
        gap: 20,
    },
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#fff",
        width: "100%",
        position: "relative",
    },
    actionRowCompleted: {
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.08)",
    },
    actionLabel: {
        color: "#fff",
        fontWeight: "600",
        textAlign: "center",
    },
    selfieThumbnail: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#4CAF50",
    },
    retakeBtn: {
        position: "absolute",
        right: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        // borderWidth: 1,
        // borderColor: "#555",
    },
    retakeText: {
        color: "#aaa",
        fontWeight: "500",
    },
});