import React, { useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useForgotPassword } from "../../services/forgotPassword.service";
import Logo from "../../assets/Logo.png";
import CentralModal from "../components/CentralModal";

const { width, height } = Dimensions.get("window");

// Keep these (they're fine)
const scaleFont = (size) => Math.round(size * Math.min(width / 375, 1.3));
const scaleSize = (size) => Math.round(size * Math.min(width / 375, 1.2));

export default function ResetPasswordEmailScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [emailError, setEmailError] = useState("");
  const forgotPassword = useForgotPassword();

  // ✅ Memoized layout values (prevents recalculation flicker)
  const layout = useMemo(() => {
    return {
      bannerHeight: Math.max(200, height * 0.25),
      paddingHorizontal: Math.max(20, width * 0.05),
      paddingTop: Math.max(20, height * 0.02),
      paddingBottom: Math.max(30, height * 0.03),
      logoWidth: scaleSize(130),
      logoHeight: scaleSize(100),
    };
  }, []);

  const validateEmail = useCallback(
    (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    []
  );

  const handleEmailChange = useCallback(
    (text) => {
      setEmail(text);
      if (emailError) setEmailError("");
    },
    [emailError]
  );

  const handleProceed = useCallback(async () => {
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      await forgotPassword.mutateAsync({ email });
      await AsyncStorage.setItem("forgotPasswordEmail", email);
      setShowModal(true);
    } catch (error) {
      setEmailError(
        error?.response?.data?.email?.[0] ||
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to send OTP. Please try again."
      );
    }
  }, [email, validateEmail, forgotPassword]);

  const handleModalContinue = useCallback(() => {
    setShowModal(false);
    navigation.navigate("ResetCredentials");
  }, [navigation]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />

      {/* ✅ Removed KeyboardAvoidingView (major flicker fix) */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        overScrollMode="never"
      >
        <View style={[styles.banner, { height: layout.bannerHeight }]} />

        <View
          style={[
            styles.card,
            {
              paddingHorizontal: layout.paddingHorizontal,
              paddingTop: layout.paddingTop,
              paddingBottom: layout.paddingBottom,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={scaleSize(22)}
              color="#fff"
            />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image
              source={Logo}
              style={{
                width: layout.logoWidth,
                height: layout.logoHeight,
              }}
              resizeMode="contain"
            />
          </View>

          <View style={styles.envelopeContainer}>
            <FontAwesome
              name="envelope"
              size={scaleSize(24)}
              color="#fcbf24"
            />
          </View>

          <View style={styles.bottomSection}>
            <Text style={styles.title}>Reset Password</Text>

            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a verification code
            </Text>

            <View style={styles.inputContainer}>
              <FontAwesome
                name="envelope"
                size={scaleSize(20)}
                color="#aaa"
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={handleEmailChange}
                editable={!forgotPassword.isPending}
                returnKeyType="done"
                onSubmitEditing={handleProceed}
              />
            </View>

            {!!emailError && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.proceedButton,
                (!email.trim() || forgotPassword.isPending) &&
                styles.disabledButton,
              ]}
              onPress={handleProceed}
              disabled={!email.trim() || forgotPassword.isPending}
              activeOpacity={0.8}
            >
              {/* ✅ Fixed height to prevent flicker */}
              <View style={styles.buttonContent}>
                {forgotPassword.isPending ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.proceedButtonText}>Send Code</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CentralModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Code Sent!"
        subText={`A verification code has been sent to\n${email}\n\nCheck your email and enter the code to continue.`}
        icon="mail"
        confirmText="Continue"
        closeText=""
        onConfirm={handleModalContinue}
        confirmButtonColor="#fcbf24"
        themeColor="#4CAF50"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  banner: {
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  card: {
    marginTop: -40,
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    width: "100%",
    alignSelf: "center",
    maxWidth: 500,
  },
  backButton: {
    marginBottom: 10,
    padding: 5,
    alignSelf: "flex-start",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  envelopeContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: 30,
    backgroundColor: "#FEB91454",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fcbf24",
  },
  bottomSection: {
    alignItems: "center",
    width: "100%",
    paddingTop: 40,
  },
  title: {
    fontSize: scaleFont(24),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: scaleFont(14),
    color: "#aaa",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    height: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#333",
    paddingHorizontal: 10,
    marginBottom: 5,
    width: "100%",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: scaleFont(14),
  },
  errorText: {
    fontSize: scaleFont(12),
    color: "#ff5252",
    alignSelf: "flex-start",
    marginLeft: 5,
    marginBottom: 10,
    fontWeight: "500",
  },
  proceedButton: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    minHeight: 50,
  },
  buttonContent: {
    height: 20, // ✅ prevents layout shift
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  proceedButtonText: {
    fontSize: scaleFont(16),
    color: "#000",
    fontWeight: "bold",
  },
});