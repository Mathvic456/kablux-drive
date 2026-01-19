import React, { useState } from "react";
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
  Platform
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useForgotPassword } from "../../services/forgotPassword.service";
import Logo from '../../assets/Logo.png';
import CentralModal from '../components/CentralModal';

const { width, height } = Dimensions.get('window');

export default function ResetPasswordEmailScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [emailError, setEmailError] = useState("");
  const forgotPassword = useForgotPassword();
  
  // Responsive scaling functions
  const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  };

  const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleProceed = async () => {
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
      const errorMessage = 
        error?.response?.data?.email?.[0] ||
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to send OTP. Please try again.";
      setEmailError(errorMessage);
    }
  };

  const handleModalContinue = () => {
    setShowModal(false);
    navigation.navigate('ResetCredentials');
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (emailError) {
      setEmailError("");
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />
      
      <View style={styles.container}>
        <View style={[
          styles.banner,
          { height: Math.max(200, height * 0.25) }
        ]} />

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
            <Ionicons 
              name="arrow-back" 
              size={scaleSize(22)} 
              color="#fff" 
            />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image 
              source={Logo} 
              style={[
                styles.logoIcon,
                {
                  width: scaleSize(130),
                  height: scaleSize(100)
                }
              ]} 
              resizeMode="contain"
            />
          </View>

          <View style={[
            styles.envelopeContainer,
            {
              width: scaleSize(50),
              height: scaleSize(50),
              borderRadius: scaleSize(25),
              marginTop: scaleSize(30)
            }
          ]}>
            <FontAwesome 
              name="envelope" 
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
              Enter your email address and we'll send you a verification code
            </Text>

            <View style={[
              styles.inputContainer,
              { 
                height: scaleSize(50),
                borderRadius: scaleSize(10),
                borderWidth: 2,
                marginBottom: 5
              }
            ]}>
              <FontAwesome 
                name="envelope" 
                size={scaleSize(20)} 
                color="#aaa" 
                style={styles.inputIcon} 
              />
              
              <TextInput
                style={[
                  styles.input,
                  { fontSize: scaleFont(14) }
                ]}
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
              <Text style={[
                styles.errorText,
                { 
                  fontSize: scaleFont(12),
                  marginBottom: scaleSize(10)
                }
              ]}>
                {emailError}
              </Text>
            ) : null}

            <TouchableOpacity 
              style={[
                styles.proceedButton,
                (!email.trim() || forgotPassword.isPending) && styles.disabledButton,
                { 
                  paddingVertical: scaleSize(15),
                  marginTop: scaleSize(20),
                  minHeight: scaleSize(50)
                }
              ]} 
              onPress={handleProceed}
              disabled={!email.trim() || forgotPassword.isPending}
              activeOpacity={0.8}
            >
              {forgotPassword.isPending ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={[
                  styles.proceedButtonText,
                  { fontSize: scaleFont(16) }
                ]}>
                  Send Code
                </Text>
              )}
            </TouchableOpacity>        
          </View>
        </View>

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
    backgroundColor: "#000" 
  },
  banner: {
    backgroundColor: "#0B2633", 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40 
  },
  card: { 
    flex: 1, 
    marginTop: -40, 
    backgroundColor: "#000", 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    width: '100%', 
    alignSelf: 'center',
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
  logoIcon: {
    alignSelf: 'center',
  },
  envelopeContainer: {
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
  },
  title: {
    fontWeight: "bold",
    color: '#fff',
    marginBottom: Math.max(5, height * 0.01),
    textAlign: 'center',
  },
  subtitle: {
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: Math.max(20, width * 0.05),
    lineHeight: Math.max(20, width * 0.053),
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#111", 
    paddingHorizontal: Math.max(10, width * 0.03), 
    borderColor: '#333', 
    width: '100%' 
  },
  inputIcon: { 
    marginRight: Math.max(8, width * 0.02),
  },
  input: { 
    flex: 1, 
    color: "#fff",
    paddingHorizontal: Math.max(8, width * 0.02),
  },
  errorText: {
    color: '#ff5252',
    alignSelf: 'flex-start',
    marginLeft: Math.max(5, width * 0.01),
    fontWeight: '500',
  },
  proceedButton: {
    backgroundColor: '#fcbf24',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  proceedButtonText: {
    color: '#000',
    fontWeight: "bold",
  },
});

