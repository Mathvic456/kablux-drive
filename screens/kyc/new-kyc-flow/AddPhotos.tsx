import { Ionicons, Feather } from "@expo/vector-icons";
import {
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
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

const PHOTO_SLOTS = [
    { id: "front", label: "Front View" },
    { id: "back", label: "Back View" },
    { id: "side", label: "Side View" },
    { id: "interior", label: "Interior" },
];

const CELL_SIZE = (width - Math.max(20, width * 0.05) * 2 - Math.max(20, width * 0.05) * 2 - 12) / 2;

export default function AddPhotos() {
    const navigation = useNavigation();
    const [photos, setPhotos] = useState({ front: null, back: null, side: null, interior: null });
    const [errors, setErrors] = useState({});

    const pickImage = async (slotId) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                alert("Permission to access photos is required.");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (!result.canceled && result.assets?.length > 0) {
                setPhotos((prev) => ({ ...prev, [slotId]: result.assets[0].uri }));
                setErrors((prev) => ({ ...prev, [slotId]: false }));
            }
        } catch (err) {
            console.error("Image pick error:", err);
        }
    };

    const removeImage = (slotId) => {
        setPhotos((prev) => ({ ...prev, [slotId]: null }));
    };

    const handleProceed = () => {
        const newErrors = {};
        PHOTO_SLOTS.forEach((slot) => {
            if (!photos[slot.id]) newErrors[slot.id] = true;
        });
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        // Navigate or submit
        navigation.navigate("IDVerify" as never);
        console.log("Photos:", photos);
    };

    const allFilled = PHOTO_SLOTS.every((s) => photos[s.id]);

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate("CarDetails" as never)} style={styles.backBtn}>
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
                <View style={styles.container}>
                    {/* Title block */}
                    <View style={styles.titleBlock}>
                        <Text style={[styles.title, { fontSize: scaleFont(24) }]}>
                            Add Your Car Photos
                        </Text>
                        <Text style={[styles.subtitle, { fontSize: scaleFont(12) }]}>
                            Add the specific photos of your car to complete the verification
                            process. This includes clear images of the front, back, side, and
                            interior of your vehicle. Make sure the plate number is visible
                            for the back photo.
                        </Text>
                    </View>

                    {/* 2 x 2 Grid */}
                    <View style={styles.grid}>
                        {PHOTO_SLOTS.map((slot) => {
                            const uri = photos[slot.id];
                            const hasError = errors[slot.id];

                            return (
                                <View key={slot.id} style={styles.cellWrapper}>
                                    {/* Label */}
                                    <Text style={[styles.cellLabel, { fontSize: scaleFont(12) }]}>
                                        {slot.label}
                                    </Text>

                                    {/* Box */}
                                    <TouchableOpacity
                                        style={[
                                            styles.cell,
                                            { width: CELL_SIZE, height: CELL_SIZE },
                                            hasError && styles.cellError,
                                            uri && styles.cellFilled,
                                        ]}
                                        onPress={() => pickImage(slot.id)}
                                        activeOpacity={0.75}
                                    >
                                        {uri ? (
                                            <>
                                                <Image
                                                    source={{ uri }}
                                                    style={styles.cellImage}
                                                />
                                                {/* Remove button */}
                                                <TouchableOpacity
                                                    style={styles.removeBtn}
                                                    onPress={() => removeImage(slot.id)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <Ionicons name="close" size={scaleFont(12)} color="#fff" />
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <View style={styles.placeholder}>
                                                <View style={styles.crossIcon}>
                                                    <View style={styles.crossH} />
                                                    <View style={styles.crossV} />
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

                    {/* Proceed Button */}
                    <TouchableOpacity
                        style={[styles.proceedBtn, !allFilled && styles.proceedBtnDim]}
                        onPress={handleProceed}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.proceedText, { fontSize: scaleFont(16) }]}>
                            Proceed
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        gap: 24,
    },
    titleBlock: {
        alignItems: "center",
        gap: 10,
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

    // Grid
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        justifyContent: "space-between",
    },
    cellWrapper: {
        width: CELL_SIZE,
        gap: 6,
    },
    cellLabel: {
        color: "#fff",
        fontFamily: "Poppins-Regular",
        fontWeight: "600",
    },
    cell: {
        backgroundColor: "#1E1E1E",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1E1E1E",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    cellFilled: {
        borderColor: "#fcbf24",
    },
    cellError: {
        borderColor: "#ff4444",
    },
    cellImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    placeholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    crossIcon: {
        width: scaleSize(28),
        height: scaleSize(28),
        alignItems: "center",
        justifyContent: "center",
    },
    crossH: {
        position: "absolute",
        width: scaleSize(28),
        height: 2,
        backgroundColor: "#fcbf24",
        borderRadius: 1,
    },
    crossV: {
        position: "absolute",
        width: 2,
        height: scaleSize(28),
        backgroundColor: "#fcbf24",
        borderRadius: 1,
    },
    removeBtn: {
        position: "absolute",
        top: 6,
        right: 6,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 100,
        padding: 4,
    },
    errorText: {
        color: "#ff4444",
        fontFamily: "Poppins-Regular",
        marginTop: 2,
    },

    // Proceed
    proceedBtn: {
        backgroundColor: "#fcbf24",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        minHeight: Math.max(50, height * 0.06),
        paddingVertical: Math.max(14, height * 0.017),
        marginTop: 4,
    },
    proceedBtnDim: {
        opacity: 0.5,
    },
    proceedText: {
        color: "#000",
        fontWeight: "bold",
        fontFamily: "Poppins-Bold",
    },
});