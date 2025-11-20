import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../../assets/Logo.png";
import { useVerifyOtpEndPoint } from "../../services/otpVerification.service";

const OTP = ({ navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef([]);
  const otpVerify = useVerifyOtpEndPoint();

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

  const handleOtpChange = (text, index) => {
    // Only allow digits
    const sanitizedText = text.replace(/[^0-9]/g, '');
    if (sanitizedText.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = sanitizedText;
    setOtp(newOtp);

    // Auto-advance to next input
    if (sanitizedText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
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
        // If current input is empty, move to previous and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        // If current input has value, just clear it
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

  // Calculate progress based on filled inputs
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
          
                {errorMessage && (
        <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>
          {errorMessage}
        </Text>
      )}
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
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Feather name="check-circle" size={60} color="#fcbf24" />
            </View>
            
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalSubtitle}>
              OTP verification successful
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.modalButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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