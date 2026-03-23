import React, { useEffect, useRef, useState } from "react";
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
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Logo from "../../assets/Logo.png";
import { useVerifyOtpEndPoint, useResendOtpEndPoint } from "../../services/otpVerification.service";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CentralModal from "../components/CentralModal";

const { width, height } = Dimensions.get('window');

const OTP = ({ navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendModalMessage, setResendModalMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [resendTimer, setResendTimer] = useState(0);
  const [isAutoLogging, setIsAutoLogging] = useState(false);

  const inputRefs = useRef([]);
  const otpVerify = useVerifyOtpEndPoint();
  const otpResend = useResendOtpEndPoint();
  const { setTokens } = useAuth();

  // Responsive scaling functions
  const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  };

  const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  };

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("pendingEmail");
        if (savedEmail) {
          setEmail(savedEmail);
        }
      } catch (error) {
        console.error("❌ Error loading email:", error);
      }
    };
    loadEmail();
  }, []);

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Timer Logic: Countdown every second
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle Resend Action
  const handleResend = async () => {
    if (!email) return;
    setErrorMessage("");

    try {
      await otpResend.mutateAsync({ email });
      setResendModalMessage("A new code has been sent to your email.");
      setShowResendModal(true);
      setResendTimer(30); // Start 30s cooldown
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to resend.";
      setErrorMessage(msg);
    }
  };

  const handleOtpChange = (text, index) => {
    const sanitizedText = text.replace(/[^0-9]/g, '');
    if (sanitizedText.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = sanitizedText;
    setOtp(newOtp);

    if (sanitizedText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && sanitizedText) {
      const fullOtp = [...newOtp.slice(0, 5), sanitizedText];
      if (fullOtp.every(digit => digit !== '')) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleVerify = async (otpArray = otp) => {
    // navigation.navigate('Login');

    if (otpVerify.isPending) return;

    const code = otpArray.join('');

    if (code.length !== 6) {
      console.log("❌ OTP must be 6 digits");
      return;
    }

    try {
      await otpVerify.mutateAsync({ email, otp: code });
      setShowSuccessModal(true);
    } catch (err) {
      if (err?.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  // Auto-login after OTP verification
  const handleSuccessModalClose = async () => {
    setShowSuccessModal(false);

    try {
      setIsAutoLogging(true);
      const savedEmail = await AsyncStorage.getItem("pendingEmail");
      const savedPassword = await AsyncStorage.getItem("pendingPassword");

      if (savedEmail && savedPassword) {
        // Auto-login with stored credentials
        const res = await api.post("auth/login/", {
          email: savedEmail,
          password: savedPassword,
        });

        const accessToken = res.data?.data?.access;
        const refreshToken = res.data?.data?.refresh;
        const userId = res.data?.data?.user?.id;

        if (accessToken && refreshToken) {
          await setTokens(accessToken, refreshToken, true);
          if (userId) await AsyncStorage.setItem("userId", userId);

          // Clean up stored credentials
          await AsyncStorage.multiRemove(["pendingPassword"]);

          console.log("✅ Auto-login after signup successful");
          navigation.reset({ index: 0, routes: [{ name: "Mainapp" }] });
          return;
        }
      }

      // Fallback: go to Login if auto-login fails
      console.log("⚠️ Auto-login not possible, redirecting to Login");
      navigation.navigate("Login");
    } catch (error) {
      console.error("❌ Auto-login failed:", error);
      navigation.navigate("Login");
    } finally {
      setIsAutoLogging(false);
    }
  };

  const filledCount = otp.filter(digit => digit !== '').length;
  const progress = (filledCount / 6) * 100;
  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
        >
          {/* Top Banner */}
          <View style={styles.banner} />

          {/* Card */}
          <View style={[
            styles.card,
            {
              paddingHorizontal: Math.max(20, width * 0.05),
              paddingTop: Math.max(20, height * 0.02),
              paddingBottom: Math.max(30, height * 0.03),
            }
          ]}>
            <View style={styles.logoContainer}>
              <Image
                source={Logo}
                style={[
                  styles.logoIcon,
                  {
                    width: scaleSize(130),
                    height: scaleSize(100),
                  }
                ]}
              />
            </View>

            <View style={[
              styles.iconContainer,
              {
                width: scaleSize(50),
                height: scaleSize(50),
                borderRadius: scaleSize(25),
                padding: scaleSize(10),
              }
            ]}>
              <Feather
                name="mail"
                size={scaleSize(24)}
                color="#fcbf24"
              />
            </View>

            <Text style={[styles.title, { fontSize: scaleFont(24) }]}>
              OTP Authentication
            </Text>

            <Text style={[
              styles.subtitle,
              {
                fontSize: scaleFont(14),
                marginBottom: scaleSize(30),
              }
            ]}>
              Check your email for the verification code
            </Text>

            <View style={[
              styles.progressContainer,
              { marginBottom: scaleSize(30) }
            ]}>
              <View style={[styles.progressBar, { height: scaleSize(8) }]}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={[styles.progressText, { fontSize: scaleFont(12) }]}>
                {Math.round(progress)}% Complete
              </Text>
            </View>

            <View style={[
              styles.otpContainer,
              {
                marginBottom: scaleSize(40),
                gap: Math.max(8, width * 0.02),
              }
            ]}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    otp[index] && styles.otpInputFilled,
                    otpVerify.isPending && styles.otpInputDisabled,
                    {
                      height: scaleSize(60),
                      borderRadius: scaleSize(10),
                      borderWidth: 2,
                      fontSize: scaleFont(20),
                    }
                  ]}
                  placeholder="0"
                  placeholderTextColor="#555"
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  value={otp[index]}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  editable={!otpVerify.isPending}
                  selectTextOnFocus
                />
              ))}
            </View>

            {errorMessage ? (
              <Text style={[
                styles.errorText,
                {
                  fontSize: scaleFont(13),
                  marginBottom: scaleSize(10),
                }
              ]}>
                {errorMessage}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.verifyBtn,
                (!isOtpComplete || otpVerify.isPending) && styles.verifyBtnDisabled,
                {
                  paddingVertical: scaleSize(14),
                  minHeight: scaleSize(50),
                }
              ]}
              onPress={() => handleVerify()}
              disabled={!isOtpComplete || otpVerify.isPending}
              activeOpacity={0.8}
            >
              {otpVerify.isPending ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={[
                    styles.verifyText,
                    {
                      marginLeft: scaleSize(8),
                      fontSize: scaleFont(16),
                    }
                  ]}>
                    Verifying...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.verifyText, { fontSize: scaleFont(16) }]}>
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={[styles.resendContainer, { marginTop: scaleSize(25) }]}>
              <Text style={[styles.resendLabel, { fontSize: scaleFont(14) }]}>
                Didn't receive code?{" "}
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendTimer > 0 || otpResend.isPending}
                activeOpacity={0.7}
              >
                {otpResend.isPending ? (
                  <ActivityIndicator size="small" color="#fcbf24" />
                ) : (
                  <Text style={[
                    styles.resendLink,
                    resendTimer > 0 && styles.resendLinkDisabled,
                    { fontSize: scaleFont(14) },
                  ]}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CentralModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success!"
        subText="OTP verification successful"
        icon="checkmark-circle"
        confirmText="Login"
        closeText=""
        onConfirm={handleSuccessModalClose}
        confirmButtonColor="#fcbf24"
        themeColor="#fcbf24"
      />
      <CentralModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success!"
        subText={isAutoLogging ? "Signing you in..." : "OTP verification successful"}
        icon="checkmark-circle"
        confirmText={isAutoLogging ? "Please wait..." : "Continue"}
        closeText=""
        onConfirm={handleSuccessModalClose}
        confirmButtonColor="#fcbf24"
        themeColor="#fcbf24"
      />

      <CentralModal
        visible={showResendModal}
        onClose={() => setShowResendModal(false)}
        title="Sent!"
        subText={resendModalMessage}
        icon="mail"
        confirmText="Got it"
        closeText=""
        onConfirm={() => setShowResendModal(false)}
        confirmButtonColor="#fcbf24"
        themeColor="#4CAF50"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollView: {
    flex: 1,
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
    width: "100%",
    alignSelf: "center",
    maxWidth: 500,
  },
  logoContainer: {
    marginBottom: Math.max(10, height * 0.01),
    alignItems: 'center',
  },
  logoIcon: {
    resizeMode: "contain",
    alignSelf: "center",
  },
  iconContainer: {
    borderColor: '#fcbf24',
    alignSelf: 'center',
    marginBottom: Math.max(20, height * 0.025),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEB91454',
    borderWidth: 1,
  },
  title: {
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: Math.max(5, height * 0.01),
  },
  subtitle: {
    color: "#ccc",
    textAlign: "center",
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Math.max(8, height * 0.01),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fcbf24',
    borderRadius: 4,
  },
  progressText: {
    color: '#888',
    textAlign: 'center',
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: '100%',
  },
  otpInput: {
    flex: 1,
    backgroundColor: "#111",
    color: "#fff",
    fontWeight: "bold",
    borderColor: "#222",
  },
  otpInputFilled: {
    borderColor: "#fcbf24",
    backgroundColor: "#1a1a1a",
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    fontWeight: '500',
  },
  verifyBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnDisabled: {
    backgroundColor: "#444",
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: {
    color: "#000",
    fontWeight: "bold",
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: {
    color: '#888',
    fontWeight: '500',
  },
  resendLink: {
    color: '#fcbf24',
    fontWeight: 'bold',
  },
  resendLinkDisabled: {
    color: '#666',
  },
});

export default OTP;