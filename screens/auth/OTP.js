import { FontAwesome, MaterialIcons, Feather } from "@expo/vector-icons";
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Logo from "../../assets/Logo.png";
import { useNavigation } from '@react-navigation/native';

const OTP = ({ navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  // Update progress whenever OTP changes
  useEffect(() => {
    const filledCount = otp.filter(digit => digit !== '').length;
    const newProgress = (filledCount / 4) * 100;
    setProgress(newProgress);
  }, [otp]);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto move to next input
    if (text && index < 3) {
      inputRefs.current[index + 1].focus();
    }

    // Auto submit when all fields are filled
    if (text && index === 3) {
      const isAllFilled = newOtp.every(digit => digit !== '');
      if (isAllFilled) {
        handleVerify();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    const otpCode = otp.join('');
    console.log("OTP Entered:", otpCode);
    
    // Simulate API call or verification process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      // Here you would typically verify the OTP with your backend
      // For demo purposes, we'll assume it's always successful
      console.log("OTP verification successful!");
      
      // Navigate to next screen after successful verification
      navigation.navigate('KycScreenOne'); // Change 'Home' to your target screen
      
    } catch (error) {
      console.log("OTP verification failed:", error);
      // You can add error handling here (show error message, etc.)
    } finally {
      setIsLoading(false);
    }
  }

  const handleResendOTP = () => {
    if (isLoading) return; // Prevent resend during loading
    
    console.log("Resend OTP");
    setOtp(['', '', '', '']);
    setProgress(0);
    inputRefs.current[0].focus();
    
    // You can add your resend OTP logic here
  }

  const focusNext = (index) => {
    if (index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.banner} />

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.LogoContainer}>
          <Image source={Logo} style={styles.Logoicon} />
        </View>

        <View style={styles.IconContainer}>
          <Feather name="mail" size={24} color="#fcbf24" />
        </View>
        <Text style={styles.title}>OTP Authentication</Text>
        <Text style={styles.subtitle}>
          Check your email for the verification code
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress)}% Complete
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {[0, 1, 2, 3].map((index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                otp[index] && styles.otpInputFilled,
                isLoading && styles.otpInputDisabled
              ]}
              placeholder="0"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              value={otp[index]}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => {
                if (otp[index] && index < 3 && !otp[index + 1]) {
                  focusNext(index);
                }
              }}
              editable={!isLoading}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyBtn,
            (!otp.every(digit => digit !== '') || isLoading) && styles.verifyBtnDisabled
          ]}
          onPress={handleVerify}
          disabled={!otp.every(digit => digit !== '') || isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.verifyText}>Verifying...</Text>
            </View>
          ) : (
            <Text style={styles.verifyText}>Verify</Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP */}
        <TouchableOpacity 
          onPress={handleResendOTP}
          disabled={isLoading}
        >
          <Text style={[
            styles.resendText,
            isLoading && styles.resendTextDisabled
          ]}>
            Didn't receive code?{" "}
            <Text style={[
              styles.resendLink,
              isLoading && styles.resendLinkDisabled
            ]}>Resend OTP</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
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
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fcbf24",
    textAlign: "center",
    marginBottom: 20,
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
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fcbf24',
    borderRadius: 4,
    transition: 'width 0.3s ease-in-out',
  },
  progressText: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: "#111",
    borderRadius: 10,
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: "#333",
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
    marginTop: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  verifyBtnDisabled: {
    backgroundColor: "#666",
    opacity: 0.6,
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
  resendText: { 
    textAlign: "center", 
    color: "#888", 
    fontSize: 14 
  },
  resendTextDisabled: {
    opacity: 0.5,
  },
  resendLink: { 
    color: "#fcbf24", 
    fontWeight: "bold" 
  },
  resendLinkDisabled: {
    color: "#666",
  },
  Logoicon: {
    width: 130,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
  },
  IconContainer: {
    borderColor: '#fcbf24',
    padding: 10,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#FEB91454',
  },
});

export default OTP;