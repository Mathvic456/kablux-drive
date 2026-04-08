import React, { useRef, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { usePasswordReset } from "../../services/passwordReset.service";
import Logo from "../../assets/Logo.png";
import CentralModal from "../components/CentralModal";
import { useResendOTP } from "../../services/forgotPassword.service";

export default function ResetCredentialsScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const resendOTP = useResendOTP();
  const [errors, setErrors] = useState({
    otp: "",
    password: "",
    confirmPassword: "",
    general: "",
  });

  const otpRefs = useRef([]);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const cooldownRef = useRef(null);

  const { mutateAsync: resetPassword, isPending: isLoading } = usePasswordReset();

  const scaleFont = useCallback((size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  }, [width]);

  const scaleSize = useCallback((size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  }, [width]);

  const validateOtp = useCallback(() => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return "OTP must be 6 digits";
    if (!/^\d+$/.test(otpString)) return "OTP must contain only numbers";
    return "";
  }, [otp]);

  const validatePassword = useCallback(() => {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Must contain at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Must contain at least one special character";
    return "";
  }, [password]);

  const validateConfirmPassword = useCallback(() => {
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  }, [password, confirmPassword]);

  const isFormValid = useMemo(() => {
    const otpString = otp.join("");
    const otpValid = otpString.length === 6 && /^\d+$/.test(otpString);
    const passwordValid = password.length > 0 && validatePassword() === "";
    const confirmPasswordValid = confirmPassword.length > 0 && password === confirmPassword;
    return otpValid && passwordValid && confirmPasswordValid;
  }, [otp, password, confirmPassword, validatePassword]);

  // Supports both single-digit entry and full paste of 6 digits
  const handleOtpChange = useCallback((text, index) => {
    const cleaned = text.replace(/[^0-9]/g, "");

    // Handle paste: distribute 6 digits across all inputs
    if (cleaned.length === 6) {
      const newOtp = cleaned.split("");
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
      setErrors((prev) => prev.otp ? { ...prev, otp: "" } : prev);
      return;
    }

    const numericText = cleaned.slice(0, 1);
    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = numericText;
      return newOtp;
    });
    if (numericText && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    setErrors((prev) => prev.otp ? { ...prev, otp: "" } : prev);
  }, []);

  const handleOtpKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      } else if (otp[index] && index < 5) {
        setOtp((prev) => {
          const newOtp = [...prev];
          newOtp[index] = "";
          return newOtp;
        });
      }
    }
  }, [otp]);

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const email = await AsyncStorage.getItem("forgotPasswordEmail");
      if (!email) {
        setErrors((prev) => ({ ...prev, general: "Email not found. Please start over." }));
        return;
      }

      const res = await resendOTP.mutateAsync({ email });
      console.log("resend res", res);

      setResendCooldown(60);
      let remaining = 60;
      cooldownRef.current = setInterval(() => {
        remaining -= 1;
        setResendCooldown(remaining);
        if (remaining <= 0) {
          clearInterval(cooldownRef.current);
        }
      }, 1000);
    } catch {
      setErrors((prev) => ({ ...prev, general: "Failed to resend OTP. Try again." }));
    } finally {
      setIsResending(false);
    }
  }, [resendCooldown, isResending]);

  const handleProceed = useCallback(async () => {
    const otpError = validateOtp();
    const passwordError = validatePassword();
    const confirmPasswordError = validateConfirmPassword();

    setErrors({ otp: otpError, password: passwordError, confirmPassword: confirmPasswordError, general: "" });

    if (otpError || passwordError || confirmPasswordError) return;

    try {
      const email = await AsyncStorage.getItem("forgotPasswordEmail");
      if (!email) {
        setErrors((prev) => ({ ...prev, general: "Email not found. Please start from the beginning." }));
        return;
      }
      await resetPassword({ new_password: password, email, otp: otp.join("") });
      await AsyncStorage.removeItem("forgotPasswordEmail");
      setShowSuccessModal(true);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.new_password?.[0] ||
        error?.response?.data?.otp?.[0] ||
        error?.response?.data?.email?.[0] ||
        error?.response?.data?.detail ||
        error?.message ||
        "Password reset failed. Please try again.";
      setErrors((prev) => ({ ...prev, general: errorMessage }));
    }
  }, [validateOtp, validatePassword, validateConfirmPassword, password, otp, resetPassword]);

  const handleModalContinue = useCallback(() => {
    setShowSuccessModal(false);
    navigation.navigate("Login");
  }, [navigation]);

  const dynStyles = useMemo(() => ({
    banner: { height: Math.max(200, height * 0.25) },
    card: {
      paddingHorizontal: Math.max(20, width * 0.05),
      paddingTop: Math.max(20, height * 0.02),
      paddingBottom: Math.max(30, height * 0.03),
    },
    iconContainer: {
      width: scaleSize(50),
      height: scaleSize(50),
      borderRadius: scaleSize(25),
      marginTop: scaleSize(30),
    },
    otpGap: { gap: Math.max(8, width * 0.02) },
    otpInput: {
      width: scaleSize(45),
      height: scaleSize(60),
      borderRadius: scaleSize(10),
      borderWidth: 2,
      fontSize: scaleFont(24),
    },
    inputRow: {
      height: scaleSize(50),
      borderRadius: scaleSize(10),
      borderWidth: 2,
    },
  }), [width, height, scaleSize, scaleFont]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />

      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.banner, dynStyles.banner]} />
            <View style={[styles.card, dynStyles.card]}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={scaleSize(22)} color="#fff" />
              </TouchableOpacity>

              {/* Logo */}
              <View style={styles.logoContainer}>
                <Image
                  source={Logo}
                  style={{ width: scaleSize(130), height: scaleSize(100) }}
                  resizeMode="contain"
                />
              </View>

              {/* Lock Icon */}
              <View style={[styles.iconContainer, dynStyles.iconContainer]}>
                <FontAwesome name="lock" size={scaleSize(24)} color="#fcbf24" />
              </View>

              <View style={[styles.bottomSection, { paddingTop: scaleSize(40) }]}>
                <Text style={[styles.title, { fontSize: scaleFont(24) }]}>Reset Password</Text>
                <Text style={[styles.subtitle, { fontSize: scaleFont(14), marginBottom: scaleSize(30) }]}>
                  Enter the code and set your new password
                </Text>

                {/* OTP Input */}
                <View style={[styles.fieldContainer, { marginBottom: scaleSize(8) }]}>
                  <Text style={[styles.fieldLabel, { fontSize: scaleFont(14) }]}>Verification Code</Text>

                  <View style={[styles.otpInputsContainer, dynStyles.otpGap]}>
                    {otp.map((value, index) => (
                      <TextInput
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        style={[
                          styles.otpInput,
                          errors.otp && styles.inputError,
                          dynStyles.otpInput,
                        ]}
                        value={value}
                        keyboardType="number-pad"
                        maxLength={index === 0 ? 6 : 1}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleOtpKeyPress(e, index)}
                        editable={!isLoading}
                      />
                    ))}
                  </View>

                  {errors.otp ? (
                    <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.otp}</Text>
                  ) : null}
                </View>

                {/* Resend OTP Button */}
                <View style={styles.resendRow}>
                  <Text style={[styles.resendLabel, { fontSize: scaleFont(13) }]}>
                    Didn't receive the code?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending || isLoading}
                    activeOpacity={0.7}
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color="#fcbf24" />
                    ) : (
                      <Text
                        style={[
                          styles.resendText,
                          { fontSize: scaleFont(13) },
                          (resendCooldown > 0 || isLoading) && styles.resendDisabled,
                        ]}
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* New Password */}
                <View style={[styles.fieldContainer, { marginBottom: scaleSize(20), marginTop: scaleSize(12) }]}>
                  <Text style={[styles.fieldLabel, { fontSize: scaleFont(14) }]}>New Password</Text>
                  <View style={[styles.inputContainer, errors.password && styles.inputContainerError, dynStyles.inputRow]}>
                    <FontAwesome name="lock" size={scaleSize(20)} color="#aaa" style={styles.inputIcon} />
                    <TextInput
                      ref={passwordRef}
                      style={[styles.input, { fontSize: scaleFont(14) }]}
                      placeholder="Enter new password"
                      placeholderTextColor="#666"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setErrors((prev) => prev.password ? { ...prev, password: "" } : prev);
                      }}
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      editable={!isLoading}
                      returnKeyType="next"
                    />
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton} disabled={isLoading}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={scaleSize(22)} color="#aaa" />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? (
                    <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.password}</Text>
                  ) : null}

                  <View style={[styles.passwordRequirements, { marginTop: scaleSize(10) }]}>
                    <Text style={[styles.requirementText, { fontSize: scaleFont(12) }]}>Password must contain:</Text>
                    {[
                      "At least 8 characters",
                      "One uppercase letter (A-Z)",
                      "One lowercase letter (a-z)",
                      "One number (0-9)",
                      "One special character (!@#$%^&*)",
                    ].map((req) => (
                      <Text key={req} style={[styles.requirementItem, { fontSize: scaleFont(11) }]}>• {req}</Text>
                    ))}
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={[styles.fieldContainer, { marginBottom: scaleSize(20) }]}>
                  <Text style={[styles.fieldLabel, { fontSize: scaleFont(14) }]}>Confirm Password</Text>
                  <View style={[styles.inputContainer, errors.confirmPassword && styles.inputContainerError, dynStyles.inputRow]}>
                    <FontAwesome name="lock" size={scaleSize(20)} color="#aaa" style={styles.inputIcon} />
                    <TextInput
                      ref={confirmPasswordRef}
                      style={[styles.input, { fontSize: scaleFont(14) }]}
                      placeholder="Re-enter password"
                      placeholderTextColor="#666"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setErrors((prev) => prev.confirmPassword ? { ...prev, confirmPassword: "" } : prev);
                      }}
                      onSubmitEditing={handleProceed}
                      editable={!isLoading}
                      returnKeyType="done"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeButton} disabled={isLoading}>
                      <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={scaleSize(22)} color="#aaa" />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword ? (
                    <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.confirmPassword}</Text>
                  ) : null}
                </View>

                {/* General Error */}
                {errors.general ? (
                  <Text style={[styles.errorTextGeneral, { fontSize: scaleFont(13), marginBottom: scaleSize(15) }]}>
                    {errors.general}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.proceedButton,
                    (!isFormValid || isLoading) && styles.disabledButton,
                    { paddingVertical: scaleSize(15), marginTop: scaleSize(10), minHeight: scaleSize(50) },
                  ]}
                  onPress={handleProceed}
                  disabled={!isFormValid || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={[styles.proceedButtonText, { fontSize: scaleFont(16) }]}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <CentralModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Success!"
          subText={"Your password has been reset successfully.\n\nYou can now login with your new password."}
          icon="checkmark-circle"
          confirmText="Login Now"
          closeText=""
          onConfirm={handleModalContinue}
          confirmButtonColor="#fcbf24"
          themeColor="#4CAF50"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000" },
  banner: {
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1, marginTop: -40, backgroundColor: "#000" },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  card: {
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    width: "100%",
    alignSelf: "center",
    maxWidth: 500,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 5,
  },
  logoContainer: { alignItems: "center", marginBottom: 10 },
  iconContainer: {
    backgroundColor: "#FEB91454",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fcbf24",
  },
  bottomSection: { backgroundColor: "#000", alignItems: "center", width: "100%" },
  title: { fontWeight: "bold", color: "#fff", marginBottom: 5, textAlign: "center" },
  subtitle: { color: "#aaa", textAlign: "center", paddingHorizontal: 20, lineHeight: 20 },
  fieldContainer: { width: "100%" },
  fieldLabel: { color: "#fff", fontWeight: "bold", marginBottom: 8 },
  otpInputsContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  otpInput: {
    borderColor: "#333",
    textAlign: "center",
    color: "#fff",
    backgroundColor: "#111",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  resendLabel: { color: "#888" },
  resendText: { color: "#fcbf24", fontWeight: "600" },
  resendDisabled: { color: "#555" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 10,
    borderColor: "#333",
    width: "100%",
  },
  inputContainerError: { borderColor: "#ff5252" },
  inputError: { borderColor: "#ff5252" },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: "#fff", paddingHorizontal: 8 },
  eyeButton: { padding: 5, marginLeft: 5 },
  errorText: { color: "#ff5252", marginTop: 5, marginLeft: 5 },
  errorTextGeneral: { color: "#ff5252", textAlign: "center", paddingHorizontal: 10, fontWeight: "500" },
  passwordRequirements: { paddingLeft: 5 },
  requirementText: { color: "#aaa", marginBottom: 5, fontWeight: "600" },
  requirementItem: { color: "#777", marginBottom: 2 },
  proceedButton: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: { backgroundColor: "#666", opacity: 0.6 },
  proceedButtonText: { color: "#000", fontWeight: "bold" },
});