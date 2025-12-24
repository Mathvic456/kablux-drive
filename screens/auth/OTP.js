import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../../assets/Logo.png";
import { useVerifyOtpEndPoint, useResendOtpEndPoint } from "../../services/otpVerification.service";
import CentralModal from "../components/CentralModal";

const OTP = ({ navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendModalMessage, setResendModalMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // 👇 Timer state for resend cooldown
  const [resendTimer, setResendTimer] = useState(0);

  const inputRefs = useRef([]);
  const otpVerify = useVerifyOtpEndPoint();
  
  // 👇 Initialize Resend Hook
  const otpResend = useResendOtpEndPoint();

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("pendingEmail");
        if (savedEmail) {
          setEmail(savedEmail);
          console.log("📬 Loaded email from storage:", savedEmail);
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

  // 👇 Timer Logic: Countdown every second
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // 👇 Handle Resend Action
  const handleResend = async () => {
    if (!email) return;
    setErrorMessage("");
    
    try {
      await otpResend.mutateAsync({ email });
      setResendModalMessage("A new code has been sent to your email.");
      setShowResendModal(true);
      setResendTimer(30); // Start 30s cooldown
    } catch (err) {
        // Handle error silently or show simple message
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
    if (otpVerify.isPending) return;

    const code = otpArray.join('');
    
    if (code.length !== 6) {
      console.log("❌ OTP must be 6 digits");
      return;
    }

    console.log("🔢 Verifying OTP:", code);
    
    try {
      await otpVerify.mutateAsync({ email, otp: code });
      console.log("✅ OTP verification successful!");
      setShowSuccessModal(true);
    } catch (err) {
      console.error("OTP verification failed:", err);

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

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    console.log("I shifted the navigation.navigate to after login temporarily so I can work on document upload separately");
    navigation.navigate('Login');
  };

  const filledCount = otp.filter(digit => digit !== '').length;
  const progress = (filledCount / 6) * 100;
  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <View style={styles.container}>
      <View style={styles.banner} />

      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoIcon} />
        </View>

        <View style={styles.iconContainer}>
          <Feather name="mail" size={24} color="#fcbf24" />
        </View>

        <Text style={styles.title}>OTP Authentication</Text>
        <Text style={styles.subtitle}>
          Check your email for the verification code
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${progress}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress)}% Complete
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                otp[index] && styles.otpInputFilled,
                otpVerify.isPending && styles.otpInputDisabled
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
            <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>
              {errorMessage}
            </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.verifyBtn,
            (!isOtpComplete || otpVerify.isPending) && styles.verifyBtnDisabled
          ]}
          onPress={() => handleVerify()}
          disabled={!isOtpComplete || otpVerify.isPending}
        >
          {otpVerify.isPending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={[styles.verifyText, { marginLeft: 8 }]}>Verifying...</Text>
            </View>
          ) : (
            <Text style={styles.verifyText}>Verify</Text>
          )}
        </TouchableOpacity>

        {/* 👇 RESEND UI SECTION */}
        <View style={styles.resendContainer}>
            <Text style={styles.resendLabel}>Didn't receive code? </Text>
            <TouchableOpacity 
                onPress={handleResend}
                disabled={resendTimer > 0 || otpResend.isPending}
            >
                {otpResend.isPending ? (
                    <ActivityIndicator size="small" color="#fcbf24" />
                ) : (
                    <Text style={[
                        styles.resendLink,
                        resendTimer > 0 && styles.resendLinkDisabled
                    ]}>
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                    </Text>
                )}
            </TouchableOpacity>
        </View>

      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000" 
  },
  banner: {
    height: 200,
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  card: {
    flex: 1,
    marginTop: -40,
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    width: "95%",
    alignSelf: "center",
  },
  logoContainer: {
    marginBottom: 10,
  },
  logoIcon: {
    width: 130,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
  },
  iconContainer: {
    borderColor: '#fcbf24',
    padding: 10,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#FEB91454',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 30,
  },
  progressContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fcbf24',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 60,
    backgroundColor: "#111",
    borderRadius: 10,
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    borderWidth: 2,
    borderColor: "#222",
  },
  otpInputFilled: {
    borderColor: "#fcbf24",
    backgroundColor: "#1a1a1a",
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  verifyBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
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
    fontSize: 16 
  },

  resendContainer: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: {
    color: '#888',
    fontSize: 14,
  },
  resendLink: {
    color: '#fcbf24',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resendLinkDisabled: {
    color: '#666',
  },
  // Modal Styles...
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#fcbf24',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 60,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OTP;