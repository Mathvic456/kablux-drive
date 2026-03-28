import React, { useState, useMemo } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useForgotPassword } from "../../services/forgotPassword.service";
import Logo from '../../assets/Logo.png';
import CentralModal from '../components/CentralModal';

const { width, height } = Dimensions.get('window');

const scaleFont = (size) => Math.round(size * Math.min(width / 375, 1.3));
const scaleSize = (size) => Math.round(size * Math.min(width / 375, 1.2));

export default function ResetPasswordEmailScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [emailError, setEmailError] = useState("");
  const forgotPassword = useForgotPassword();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleProceed = async () => {
    setEmailError("");
    if (!email.trim()) { setEmailError("Email is required"); return; }
    if (!validateEmail(email)) { setEmailError("Please enter a valid email address"); return; }

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
  };

  const handleModalContinue = () => {
    setShowModal(false);
    navigation.navigate('ResetCredentials');
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
        >
          <View style={styles.banner} />

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={scaleSize(22)} color="#fff" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image source={Logo} style={styles.logoIcon} resizeMode="contain" />
            </View>

            <View style={styles.envelopeContainer}>
              <FontAwesome name="envelope" size={scaleSize(24)} color="#fcbf24" />
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

              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.proceedButton,
                  (!email.trim() || forgotPassword.isPending) && styles.disabledButton,
                ]}
                onPress={handleProceed}
                disabled={!email.trim() || forgotPassword.isPending}
                activeOpacity={0.8}
              >
                {forgotPassword.isPending ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.proceedButtonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  banner: {
    height: Math.max(200, height * 0.25),
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  card: {
    marginTop: -40,
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: Math.max(20, width * 0.05),
    paddingTop: Math.max(20, height * 0.02),
    paddingBottom: Math.max(30, height * 0.03),
    width: '100%',
    alignSelf: 'center',
    maxWidth: 500,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Math.max(10, height * 0.01),
    padding: Math.max(5, width * 0.01),
    alignSelf: 'flex-start',
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Math.max(10, height * 0.01),
  },
  logoIcon: {
    width: scaleSize(130),
    height: scaleSize(100),
    alignSelf: 'center',
  },
  envelopeContainer: {
    width: scaleSize(50),
    height: scaleSize(50),
    borderRadius: scaleSize(25),
    marginTop: scaleSize(30),
    backgroundColor: '#FEB91454',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fcbf24',
  },
  bottomSection: {
    backgroundColor: '#000',
    alignItems: 'center',
    width: '100%',
    paddingTop: scaleSize(40),
  },
  title: {
    fontSize: scaleFont(24),
    fontWeight: "bold",
    color: '#fff',
    marginBottom: Math.max(5, height * 0.01),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scaleFont(14),
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: Math.max(20, width * 0.05),
    lineHeight: Math.max(20, width * 0.053),
    marginBottom: scaleSize(30),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    height: scaleSize(50),
    borderRadius: scaleSize(10),
    borderWidth: 2,
    borderColor: '#333',
    paddingHorizontal: Math.max(10, width * 0.03),
    marginBottom: 5,
    width: '100%',
  },
  inputIcon: {
    marginRight: Math.max(8, width * 0.02),
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: scaleFont(14),
    paddingHorizontal: Math.max(8, width * 0.02),
  },
  errorText: {
    fontSize: scaleFont(12),
    color: '#ff5252',
    alignSelf: 'flex-start',
    marginLeft: Math.max(5, width * 0.01),
    marginBottom: scaleSize(10),
    fontWeight: '500',
  },
  proceedButton: {
    backgroundColor: '#fcbf24',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSize(15),
    marginTop: scaleSize(20),
    minHeight: scaleSize(50),
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  proceedButtonText: {
    fontSize: scaleFont(16),
    color: '#000',
    fontWeight: "bold",
  },
});