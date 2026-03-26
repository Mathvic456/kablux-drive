import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
const { width, height } = Dimensions.get('window');

const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
};

export default function IDVerification() {
    const navigation = useNavigation();


    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginVertical: 20 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 1, borderRadius: "50%", backgroundColor: "#fff" }}>
                    <Ionicons name="arrow-back" size={scaleFont(24)} color="#000" />
                </TouchableOpacity>
                <View />
                <View />
            </View>
            <View style={styles.container}>
                <View style={{ flexDirection: "column", alignItems: "center", gap: 20 }}>
                    <Image source={require("../../../assets/images/face.png")} style={{ width: 93, height: 93, alignSelf: "center", marginBottom: 20 }} />
                    <Text style={styles.title}>
                        IDENTITY VERIFICATION
                    </Text>
                    <Text style={styles.subtitle}>
                        To ensure the security of your account, we require a valid ID for verification. Please upload a clear photo of your government-issued ID.
                    </Text>
                </View>

                <View style={{ flex: 1, gap: 20 }} >
                    <TouchableOpacity>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#fff", width: "100%" }}>
                            <Ionicons name="camera" size={18} color="#fff" />
                            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                                Selfie
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate("CarDetails" as never)}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#fff", width: "100%" }}>
                            <Ionicons name="person" size={18} color="#fff" />
                            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                                ID upload
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate("BankDetails" as never)}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#fff", width: "100%" }}>
                            <Ionicons name="card" size={18} color="#fff" />
                            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                                Bank Details
                            </Text>
                        </View>
                    </TouchableOpacity>

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
    container: {
        flex: 1,
        backgroundColor: "#000",
        borderRadius: 20,
        padding: Math.max(20, width * 0.05),
        margin: Math.max(20, width * 0.05),
        gap: 20,
    },
    title: {
        color: "#fff",
        fontSize: 24,
        fontFamily: "Poppins-Bold",
        fontWeight: 700,
        letterSpacing: 0,
    },
    subtitle: {
        color: "#fff",
        fontSize: 12,
        fontFamily: "Poppins-Regular",
        fontWeight: 400,
        letterSpacing: 0,
        textAlign: "center",
    }
});