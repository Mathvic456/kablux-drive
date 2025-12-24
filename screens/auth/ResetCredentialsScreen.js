import { usePasswordReset } from "../../services/passwordReset.service";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState, useEffect } from "react";
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
} from "react-native";
import Logo from "../../assets/Logo.png";
import CentralModal from '../components/CentralModal';

export default function ResetCredentialsScreen() {
  const navigation = useNavigation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    otp: "",
    password: "",
    confirmPassword: "",
    general: "",
  });

  const otpRefs = useRef([]);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const { mutateAsync: resetPassword, isPending: isLoading } = usePasswordReset();

  const validateOtp = () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      return "OTP must be 6 digits";
    }
    if (!/^\d+$/.test(otpString)) {
      return "OTP must contain only numbers";
    }
    return "";
  };

  const validatePassword = () => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    if (!hasUppercase) {
      return "Must contain at least one uppercase letter";
    }
    if (!hasLowercase) {
      return "Must contain at least one lowercase letter";
    }
    if (!hasNumber) {
      return "Must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Must contain at least one special character";
    }
    return "";
  };

  const validateConfirmPassword = () => {
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleOtpChange = (text, index) => {
    // Only allow single numeric digit
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 1);

    const newOtp = [...otp];
    newOtp[index] = numericText;
    setOtp(newOtp);

    console.log("📝 OTP Updated:", newOtp.join(""));

    // Auto-focus to next field when digit is entered
    if (numericText && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Clear OTP error when user starts typing
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: "" }));
    }
  };

  const handleOtpKeyPress = (e, index) => {
    // Move to previous field on backspace when current field is empty
    if (e.nativeEvent.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      } else if (otp[index] && index < 5) {
        // If field has value and backspace is pressed, clear it and stay
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleProceed = async () => {
    // Validate all fields
    const otpError = validateOtp();
    const passwordError = validatePassword();
    const confirmPasswordError = validateConfirmPassword();

    console.log("🔍 Validation Results:", {
      otpError,
      passwordError,
      confirmPasswordError,
    });

    setErrors({
      otp: otpError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      general: "",
    });

    // Stop if any validation errors
    if (otpError || passwordError || confirmPasswordError) {
      console.log("❌ Validation failed, not proceeding");
      return;
    }

    try {
      // Get email from AsyncStorage
      const email = await AsyncStorage.getItem("forgotPasswordEmail");
      console.log("📧 Retrieved email:", email);
      
      if (!email) {
        setErrors((prev) => ({
          ...prev,
          general: "Email not found. Please start from the beginning.",
        }));
        return;
      }

      console.log("🚀 Sending password reset request...");
      
      // Call password reset API
      const response = await resetPassword({
        new_password: password,
        email,
        otp: otp.join(""),
      });

      console.log("✅ Password reset successful:", response);
      
      // Clear sensitive data
      await AsyncStorage.removeItem("forgotPasswordEmail");
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error("❌ Password reset error:", error);
      
      const errorMessage =
        error?.response?.data?.new_password?.[0] ||
        error?.response?.data?.otp?.[0] ||
        error?.response?.data?.email?.[0] ||
        error?.response?.data?.detail ||
        error?.message ||
        "Password reset failed. Please try again.";
      
      console.log("🔴 Error message:", errorMessage);
      
      setErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
    }
  };

  const handleModalContinue = () => {
    setShowSuccessModal(false);
    navigation.navigate('Login');
  };

  const isFormValid = () => {
    const otpString = otp.join("");
    const otpValid = otpString.length === 6 && /^\d+$/.test(otpString);
    
    const passwordError = validatePassword();
    const passwordValid = password.length > 0 && passwordError === "";
    
    const confirmPasswordValid = confirmPassword.length > 0 && password === confirmPassword;
    
    console.log("🎯 Form Validation:", {
      otp: otpString,
      otpValid,
      password: password.slice(0, 3) + "***",
      passwordValid,
      passwordError,
      confirmPassword: confirmPassword.slice(0, 3) + "***",
      confirmPasswordValid,
      isValid: otpValid && passwordValid && confirmPasswordValid,
    });
    
    return otpValid && passwordValid && confirmPasswordValid;
  };

  // Add useEffect to log form validity changes
  useEffect(() => {
    const valid = isFormValid();
    console.log("🔄 Form validity changed:", valid);
  }, [otp, password, confirmPassword]);

  return (
    <View style={styles.container}>
      <View style={styles.banner} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image source={Logo} style={styles.logo} />
            </View>

            <View style={styles.iconContainer}>
              <FontAwesome name="lock" size={24} color="#fcbf24" />
            </View>

            <View style={styles.bottomSection}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter the code and set your new password
              </Text>

              {/* OTP Input */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Verification Code</Text>
                <View style={styles.otpInputsContainer}>
                  {otp.map((value, index) => (
                    <TextInput
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      style={[
                        styles.otpInput,
                        errors.otp && styles.inputError,
                      ]}
                      value={value}
                      keyboardType="number-pad"
                      maxLength={1}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    />
                  ))}
                </View>
                {errors.otp ? (
                  <Text style={styles.errorText}>{errors.otp}</Text>
                ) : null}
              </View>

              {/* New Password Input */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password && styles.inputContainerError,
                  ]}
                >
                  <FontAwesome
                    name="lock"
                    size={20}
                    color="#aaa"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      console.log("🔐 Password changed, length:", text.length);
                      setPassword(text);
                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#aaa"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementText}>Password must contain:</Text>
                  <Text style={styles.requirementItem}>• At least 8 characters</Text>
                  <Text style={styles.requirementItem}>• One uppercase letter (A-Z)</Text>
                  <Text style={styles.requirementItem}>• One lowercase letter (a-z)</Text>
                  <Text style={styles.requirementItem}>• One number (0-9)</Text>
                  <Text style={styles.requirementItem}>• One special character (!@#$%^&*)</Text>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.confirmPassword && styles.inputContainerError,
                  ]}
                >
                  <FontAwesome
                    name="lock"
                    size={20}
                    color="#aaa"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      console.log("🔐 Confirm password changed, matches:", text === password);
                      setConfirmPassword(text);
                      if (errors.confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                    onSubmitEditing={handleProceed}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#aaa"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              {/* General Error */}
              {errors.general ? (
                <Text style={styles.errorTextGeneral}>{errors.general}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.proceedButton,
                  (!isFormValid() || isLoading) && styles.disabledButton,
                ]}
                onPress={handleProceed}
                disabled={!isFormValid() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.proceedButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <CentralModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        subText="Your password has been reset successfully.\n\nYou can now login with your new password."
        icon="checkmark-circle"
        confirmText="Login Now"
        closeText=""
        onConfirm={handleModalContinue}
        confirmButtonColor="#fcbf24"
        themeColor="#4CAF50"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  banner: {
    height: 200,
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: -40,
    backgroundColor: "#000",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    width: "95%",
    alignSelf: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 130,
    height: 100,
    resizeMode: "contain",
  },
  iconContainer: {
    backgroundColor: "#FEB91454",
    borderRadius: 50,
    marginTop: 30,
    width: 50,
    height: 50,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSection: {
    backgroundColor: "#000",
    alignItems: "center",
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  fieldContainer: {
    width: "100%",
    marginBottom: 20,
  },
  fieldLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "bold",
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  otpInput: {
    width: 45,
    height: 60,
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 24,
    color: "#fff",
    backgroundColor: "#111",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: "#333",
    width: "100%",
  },
  inputContainerError: {
    borderColor: "#ff5252",
  },
  inputError: {
    borderColor: "#ff5252",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    height: 50,
  },
  errorText: {
    color: "#ff5252",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  errorTextGeneral: {
    color: "#ff5252",
    fontSize: 13,
    marginBottom: 15,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  passwordRequirements: {
    marginTop: 10,
    paddingLeft: 5,
  },
  requirementText: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 5,
    fontWeight: "600",
  },
  requirementItem: {
    color: "#777",
    fontSize: 11,
    marginBottom: 2,
  },
  proceedButton: {
    backgroundColor: "#fcbf24",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  proceedButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 350,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 22,
  },
  modalSubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "#fcbf24",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});