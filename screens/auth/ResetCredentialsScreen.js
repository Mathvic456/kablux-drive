import React, { useRef, useState, useEffect } from "react";
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
  Dimensions
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { usePasswordReset } from "../../services/passwordReset.service";
import Logo from "../../assets/Logo.png";
import CentralModal from '../components/CentralModal';

const { width, height } = Dimensions.get('window');

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

  // Responsive scaling functions
  const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  };

  const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  };

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
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 1);

    const newOtp = [...otp];
    newOtp[index] = numericText;
    setOtp(newOtp);

    if (numericText && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: "" }));
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      } else if (otp[index] && index < 5) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleProceed = async () => {
    const otpError = validateOtp();
    const passwordError = validatePassword();
    const confirmPasswordError = validateConfirmPassword();

    setErrors({
      otp: otpError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      general: "",
    });

    if (otpError || passwordError || confirmPasswordError) {
      return;
    }

    try {
      const email = await AsyncStorage.getItem("forgotPasswordEmail");
      
      if (!email) {
        setErrors((prev) => ({
          ...prev,
          general: "Email not found. Please start from the beginning.",
        }));
        return;
      }

      await resetPassword({
        new_password: password,
        email,
        otp: otp.join(""),
      });

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
    
    return otpValid && passwordValid && confirmPasswordValid;
  };

  useEffect(() => {
    const valid = isFormValid();
  }, [otp, password, confirmPassword]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />
      
      <View style={styles.container}>
        <View style={[
          styles.banner,
          { height: Math.max(200, height * 0.25) }
        ]} />

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
            <View style={[
              styles.card,
              {
                paddingHorizontal: Math.max(20, width * 0.05),
                paddingTop: Math.max(20, height * 0.02),
                paddingBottom: Math.max(30, height * 0.03)
              }
            ]}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={scaleSize(22)} color="#fff" />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <Image 
                  source={Logo} 
                  style={[
                    styles.logo,
                    {
                      width: scaleSize(130),
                      height: scaleSize(100)
                    }
                  ]} 
                  resizeMode="contain"
                />
              </View>

              <View style={[
                styles.iconContainer,
                {
                  width: scaleSize(50),
                  height: scaleSize(50),
                  borderRadius: scaleSize(25),
                  marginTop: scaleSize(30)
                }
              ]}>
                <FontAwesome 
                  name="lock" 
                  size={scaleSize(24)} 
                  color="#fcbf24" 
                />
              </View>

              <View style={[
                styles.bottomSection,
                { paddingTop: scaleSize(40) }
              ]}>
                <Text style={[
                  styles.title,
                  { fontSize: scaleFont(24) }
                ]}>
                  Reset Password
                </Text>
                
                <Text style={[
                  styles.subtitle,
                  { 
                    fontSize: scaleFont(14),
                    marginBottom: scaleSize(30)
                  }
                ]}>
                  Enter the code and set your new password
                </Text>

                {/* OTP Input */}
                <View style={[
                  styles.fieldContainer,
                  { marginBottom: scaleSize(20) }
                ]}>
                  <Text style={[
                    styles.fieldLabel,
                    { fontSize: scaleFont(14) }
                  ]}>
                    Verification Code
                  </Text>
                  
                  <View style={[
                    styles.otpInputsContainer,
                    { gap: Math.max(8, width * 0.02) }
                  ]}>
                    {otp.map((value, index) => (
                      <TextInput
                        key={index}
                        ref={(el) => {
                          otpRefs.current[index] = el;
                        }}
                        style={[
                          styles.otpInput,
                          errors.otp && styles.inputError,
                          {
                            width: scaleSize(45),
                            height: scaleSize(60),
                            borderRadius: scaleSize(10),
                            borderWidth: 2,
                            fontSize: scaleFont(24)
                          }
                        ]}
                        value={value}
                        keyboardType="number-pad"
                        maxLength={1}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleOtpKeyPress(e, index)}
                        editable={!isLoading}
                      />
                    ))}
                  </View>
                  
                  {errors.otp ? (
                    <Text style={[
                      styles.errorText,
                      { fontSize: scaleFont(12) }
                    ]}>
                      {errors.otp}
                    </Text>
                  ) : null}
                </View>

                {/* New Password Input */}
                <View style={[
                  styles.fieldContainer,
                  { marginBottom: scaleSize(20) }
                ]}>
                  <Text style={[
                    styles.fieldLabel,
                    { fontSize: scaleFont(14) }
                  ]}>
                    New Password
                  </Text>
                  
                  <View
                    style={[
                      styles.inputContainer,
                      errors.password && styles.inputContainerError,
                      {
                        height: scaleSize(50),
                        borderRadius: scaleSize(10),
                        borderWidth: 2
                      }
                    ]}
                  >
                    <FontAwesome
                      name="lock"
                      size={scaleSize(20)}
                      color="#aaa"
                      style={styles.inputIcon}
                    />
                    
                    <TextInput
                      ref={passwordRef}
                      style={[
                        styles.input,
                        { fontSize: scaleFont(14) }
                      ]}
                      placeholder="Enter new password"
                      placeholderTextColor="#666"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) {
                          setErrors((prev) => ({ ...prev, password: "" }));
                        }
                      }}
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      editable={!isLoading}
                      returnKeyType="next"
                    />
                    
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={scaleSize(22)}
                        color="#aaa"
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {errors.password ? (
                    <Text style={[
                      styles.errorText,
                      { fontSize: scaleFont(12) }
                    ]}>
                      {errors.password}
                    </Text>
                  ) : null}
                  
                  <View style={[
                    styles.passwordRequirements,
                    { marginTop: scaleSize(10) }
                  ]}>
                    <Text style={[
                      styles.requirementText,
                      { fontSize: scaleFont(12) }
                    ]}>
                      Password must contain:
                    </Text>
                    
                    <Text style={[
                      styles.requirementItem,
                      { fontSize: scaleFont(11) }
                    ]}>
                      • At least 8 characters
                    </Text>
                    
                    <Text style={[
                      styles.requirementItem,
                      { fontSize: scaleFont(11) }
                    ]}>
                      • One uppercase letter (A-Z)
                    </Text>
                    
                    <Text style={[
                      styles.requirementItem,
                      { fontSize: scaleFont(11) }
                    ]}>
                      • One lowercase letter (a-z)
                    </Text>
                    
                    <Text style={[
                      styles.requirementItem,
                      { fontSize: scaleFont(11) }
                    ]}>
                      • One number (0-9)
                    </Text>
                    
                    <Text style={[
                      styles.requirementItem,
                      { fontSize: scaleFont(11) }
                    ]}>
                      • One special character (!@#$%^&*)
                    </Text>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={[
                  styles.fieldContainer,
                  { marginBottom: scaleSize(20) }
                ]}>
                  <Text style={[
                    styles.fieldLabel,
                    { fontSize: scaleFont(14) }
                  ]}>
                    Confirm Password
                  </Text>
                  
                  <View
                    style={[
                      styles.inputContainer,
                      errors.confirmPassword && styles.inputContainerError,
                      {
                        height: scaleSize(50),
                        borderRadius: scaleSize(10),
                        borderWidth: 2
                      }
                    ]}
                  >
                    <FontAwesome
                      name="lock"
                      size={scaleSize(20)}
                      color="#aaa"
                      style={styles.inputIcon}
                    />
                    
                    <TextInput
                      ref={confirmPasswordRef}
                      style={[
                        styles.input,
                        { fontSize: scaleFont(14) }
                      ]}
                      placeholder="Re-enter password"
                      placeholderTextColor="#666"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errors.confirmPassword) {
                          setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                        }
                      }}
                      onSubmitEditing={handleProceed}
                      editable={!isLoading}
                      returnKeyType="done"
                    />
                    
                    <TouchableOpacity 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={scaleSize(22)}
                        color="#aaa"
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {errors.confirmPassword ? (
                    <Text style={[
                      styles.errorText,
                      { fontSize: scaleFont(12) }
                    ]}>
                      {errors.confirmPassword}
                    </Text>
                  ) : null}
                </View>

                {/* General Error */}
                {errors.general ? (
                  <Text style={[
                    styles.errorTextGeneral,
                    { 
                      fontSize: scaleFont(13),
                      marginBottom: scaleSize(15)
                    }
                  ]}>
                    {errors.general}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.proceedButton,
                    (!isFormValid() || isLoading) && styles.disabledButton,
                    {
                      paddingVertical: scaleSize(15),
                      marginTop: scaleSize(10),
                      minHeight: scaleSize(50)
                    }
                  ]}
                  onPress={handleProceed}
                  disabled={!isFormValid() || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={[
                      styles.proceedButtonText,
                      { fontSize: scaleFont(16) }
                    ]}>
                      Reset Password
                    </Text>
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
  },
  banner: {
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
    marginBottom: Math.max(10, height * 0.01),
    padding: Math.max(5, width * 0.01),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Math.max(10, height * 0.01),
  },
  logo: {
    resizeMode: "contain",
  },
  iconContainer: {
    backgroundColor: "#FEB91454",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#fcbf24',
  },
  bottomSection: {
    backgroundColor: "#000",
    alignItems: "center",
    width: '100%',
  },
  title: {
    fontWeight: "bold",
    color: "#fff",
    marginBottom: Math.max(5, height * 0.01),
    textAlign: 'center',
  },
  subtitle: {
    color: "#aaa",
    textAlign: "center",
    paddingHorizontal: Math.max(20, width * 0.05),
    lineHeight: Math.max(20, width * 0.053),
  },
  fieldContainer: {
    width: "100%",
  },
  fieldLabel: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: Math.max(8, height * 0.01),
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  otpInput: {
    borderColor: "#333",
    textAlign: "center",
    color: "#fff",
    backgroundColor: "#111",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: Math.max(10, width * 0.03),
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
    marginRight: Math.max(8, width * 0.02),
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingHorizontal: Math.max(8, width * 0.02),
  },
  eyeButton: {
    padding: Math.max(5, width * 0.01),
    marginLeft: Math.max(5, width * 0.01),
  },
  errorText: {
    color: "#ff5252",
    marginTop: Math.max(5, height * 0.008),
    marginLeft: Math.max(5, width * 0.01),
  },
  errorTextGeneral: {
    color: "#ff5252",
    textAlign: "center",
    paddingHorizontal: Math.max(10, width * 0.03),
    fontWeight: '500',
  },
  passwordRequirements: {
    paddingLeft: Math.max(5, width * 0.01),
  },
  requirementText: {
    color: "#aaa",
    marginBottom: Math.max(5, height * 0.008),
    fontWeight: "600",
  },
  requirementItem: {
    color: "#777",
    marginBottom: Math.max(2, height * 0.003),
  },
  proceedButton: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  proceedButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
});

export default ResetCredentialsScreen;