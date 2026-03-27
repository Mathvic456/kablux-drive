import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Animated,
} from "react-native";


const { width, height } = Dimensions.get('window');

const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
};

const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
};



const Terms = ({ navigation }) => {



    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#0B2633" />
            <View style={styles.container} >
                <View style={{ marginBottom: Math.max(20, height * 0.03), gap: Math.max(4, height * 0.005), borderBottomWidth: 1, borderBottomColor: "#fff" }}>
                    <Text style={styles.title}>
                        AGREEMENT
                    </Text>
                    <Text style={styles.title2}>
                        Terms and Conditions
                    </Text>
                    <Text style={styles.date}>
                        Last updated: June 2024
                    </Text>
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: Math.max(20, width * 0.05) }}>
                    <Text style={{ color: "#fff", fontSize: scaleFont(14), lineHeight: scaleFont(22), textAlign: "justify" }}>
                        Welcome to Kablux Drive! By using our services, you agree to the following terms and conditions. Please read them carefully before using our app.

                        1. Acceptance of Terms: By accessing or using Kablux Drive, you agree to be bound by these terms and conditions, as well as our Privacy Policy. If you do not agree to these terms, please do not use our services.

                        2. User Responsibilities: You are responsible for maintaining the confidentiality of your account and password, and for restricting access to your device. You agree to accept responsibility for all activities that occur under your account. You must not use our services for any illegal or unauthorized purpose.

                        3. Service Availability: Kablux Drive strives to provide reliable and uninterrupted service, but we do not guarantee that our services will always be available or error-free. We reserve the right to modify, suspend, or discontinue our services at any time without prior notice.
                    </Text>
                </ScrollView>

                <TouchableOpacity
                    style={{
                        backgroundColor: "#fcbf24",
                        paddingVertical: Math.max(12, height * 0.015),
                        borderRadius: 8,
                        alignItems: "center",
                    }}
                    onPress={() => navigation.navigate("OTP")}
                >
                    <Text style={{ color: "#000", fontSize: scaleFont(16), fontWeight: "bold" }}>
                        Accept Terms
                    </Text>
                </TouchableOpacity>

            </View>


        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "#0B2633",
    },
    container: {
        flex: 1,
        backgroundColor: "#000",
        borderRadius: 20,
        padding: Math.max(20, width * 0.05),
        margin: Math.max(20, width * 0.05),
    },
    title: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "Montserrat-Regular",
        fontWeight: 400,
        letterSpacing: 0,
        // lineHeight: scaleFont(30),

    },
    title2: { color: "#fff", fontSize: scaleFont(24), fontWeight: "bold" },
    date: { color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: Math.max(20, height * 0.03) }
});

export default Terms;