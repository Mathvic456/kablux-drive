import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions
} from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRegisterEndPoint } from "../../services/auth.service";
import Logo from "../../assets/Logo.png";
import CentralModal from "../components/CentralModal";

const { width, height } = Dimensions.get('window');

const scaleFont = (size) => {
  const scaleFactor = width / 375;
  return Math.round(size * Math.min(scaleFactor, 1.3));
};

const scaleSize = (size) => {
  const scaleFactor = width / 375;
  return Math.round(size * Math.min(scaleFactor, 1.2));
};

const SignUp = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [referral, setReferral] = useState("");
  const [showErr, setShowErr] = useState(false);
  const [errMessage, setErrMessage] = useState('');

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    referral: "",
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      referral: "",
    };

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      valid = false;
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters";
      valid = false;
    }

    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!phone) {
      newErrors.phone = "Phone number is required";
      valid = false;
    } else if (!/^\+?\d{10,15}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
      valid = false;
    }

    if (!address.trim()) {
      newErrors.address = "Address is required";
      valid = false;
    } else if (address.trim().length < 10) {
      newErrors.address = "Address must be at least 10 characters";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
      valid = false;
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
      valid = false;
    } else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      newErrors.password = "Password must contain at least one special character";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const { mutate: register, isPending } = useRegisterEndPoint();

  const handleProceed = async () => {
    if (!validateForm()) return;

    const [first_name, ...rest] = fullName.trim().split(" ");
    const last_name = rest.length > 0 ? rest.join(" ") : "";

    await AsyncStorage.setItem("pendingEmail", email);
    await AsyncStorage.setItem("pendingPassword", password);

    try {
      register(
        {
          email,
          password,
          role: "driver",
          first_name,
          last_name,
          phone_number: phone,
          address,
        },
        {
          onSuccess: () => {
            navigation.navigate("OTP");
          },
          onError: (err) => {
            const errorData = err.response?.data;

            // Handle "already exists" errors
            const newErrors = { ...errors };
            let hasError = false;

            if (errorData?.email?.[0]?.includes("already exists")) {
              newErrors.email = "This email is already registered. Try signing in instead.";
              hasError = true;
            }

            if (errorData?.phone_number?.[0]?.includes("already exists")) {
              newErrors.phone = "This phone number is already registered. Try signing in instead.";
              hasError = true;
            }
            if (errorData[0]?.includes("registered")) {
              setErrMessage(errorData[0] || "This account already exists")
              setShowErr(true);
              return;
            }

            if (hasError) {
              setErrors(newErrors);
            } else {
              console.error("Registration failjjediijooiiuu:", errorData[0]);
              return alert("Something went wrong. Please try again.");
            }
          },
        }
      );
    } catch (error) {
      console.error("Registration error:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />

      {/* Top Banner */}

      <KeyboardAvoidingView
        style={styles.container}
        removeClippedSubviews={false}   // prevents clipping glitches
        scrollEventThrottle={16}
        overScrollMode="never"          // Android
        bounces={false}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Scrollable Card */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.banner} />
          <View style={styles.card}>
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
              />
            </View>

            <Text style={[styles.title, { fontSize: scaleFont(24) }]}>
              Get Started Now
            </Text>

            <Text style={[styles.subtitle, { fontSize: scaleFont(14) }]}>
              Let's create an account
            </Text>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Octicons
                name="person"
                size={scaleSize(24)}
                color="#aaa"
              />
              <TextInput
                style={[styles.input, { height: scaleSize(50) }]}
                placeholder="Full name"
                placeholderTextColor="#aaa"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            {errors.fullName ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                {errors.fullName}
              </Text>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                size={scaleSize(20)}
                color="#aaa"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { height: scaleSize(50) }]}
                placeholder="Email"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
              />
            </View>
            {errors.email ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                {errors.email}
              </Text>
            ) : null}

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Feather
                name="phone"
                size={scaleSize(20)}
                color="#aaa"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { height: scaleSize(50) }]}
                placeholder="Phone Number"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                returnKeyType="next"
              />
            </View>
            {errors.phone ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                {errors.phone}
              </Text>
            ) : null}

            {/* Address */}
            <View style={styles.inputContainer}>
              <Feather
                name="map-pin"
                size={scaleSize(20)}
                color="#aaa"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { height: scaleSize(50) }]}
                placeholder="Address"
                placeholderTextColor="#aaa"
                value={address}
                onChangeText={setAddress}
                returnKeyType="next"
              />
            </View>
            {errors.address ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                {errors.address}
              </Text>
            ) : null}

            {/* Password */}
            <View style={styles.inputContainer}>
              <Feather
                name="lock"
                size={scaleSize(20)}
                color="#aaa"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { height: scaleSize(50) }]}
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={scaleSize(20)}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                {errors.password}
              </Text>
            ) : null}

            {/* Referral Code */}
            <View style={styles.inputContainer}>
              <Octicons
                name="cross-reference"
                size={scaleSize(20)}
                color="#aaa"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { height: scaleSize(50) }]}
                placeholder="Referral Code (Optional)"
                placeholderTextColor="#aaa"
                value={referral}
                onChangeText={setReferral}
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>
            {errors.referral ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
                {errors.referral}
              </Text>
            ) : null}

            {/* Password Requirements */}
            <View style={styles.passwordRequirements}>
              <Text style={[styles.requirementText, { fontSize: scaleFont(11) }]}>
                Password must contain:
              </Text>
              <View style={styles.requirementList}>
                <Text style={[
                  styles.requirementItem,
                  { fontSize: scaleFont(10) },
                  password.length >= 8 && styles.requirementMet
                ]}>
                  • At least 8 characters
                </Text>
                <Text style={[
                  styles.requirementItem,
                  { fontSize: scaleFont(10) },
                  /[A-Z]/.test(password) && styles.requirementMet
                ]}>
                  • One uppercase letter
                </Text>
                <Text style={[
                  styles.requirementItem,
                  { fontSize: scaleFont(10) },
                  /[0-9]/.test(password) && styles.requirementMet
                ]}>
                  • One number
                </Text>
                <Text style={[
                  styles.requirementItem,
                  { fontSize: scaleFont(10) },
                  /[!@#$%^&*(),.?":{}|<>]/.test(password) && styles.requirementMet
                ]}>
                  • One special character
                </Text>
              </View>
            </View>

            {/* Proceed Button */}
            <TouchableOpacity
              style={[
                styles.proceedBtn,
                { paddingVertical: scaleSize(14) }
              ]}
              onPress={handleProceed}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={[
                  styles.proceedText,
                  { fontSize: scaleFont(16) }
                ]}>
                  Proceed
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.dividerRow, { marginVertical: scaleSize(20) }]}>
              <View style={styles.divider} />
              <Text style={[
                styles.dividerText,
                { fontSize: scaleFont(12), marginHorizontal: scaleSize(10) }
              ]}>
                or
              </Text>
              <View style={styles.divider} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                { paddingVertical: scaleSize(12) }
              ]}
            >
              <FontAwesome
                name="google"
                size={scaleSize(18)}
                color="#fff"
              />
              <Text style={[
                styles.googleText,
                {
                  fontSize: scaleFont(14),
                  marginLeft: scaleSize(8)
                }
              ]}>
                Sign in with Google
              </Text>
            </TouchableOpacity>

            {/* Sign In Link */}
            <TouchableOpacity
              onPress={handleLogin}
              style={styles.loginLinkContainer}
            >
              <Text style={[
                styles.footerText,
                { fontSize: scaleFont(12) }
              ]}>
                Already have an account?{" "}
                <Text style={styles.signup}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <CentralModal
          visible={showErr}
          onClose={() => setShowErr(false)}
          title="Sorry!"
          subText={errMessage}
          icon="alert-circle"
          confirmText="Okay"
          closeText=""
          onConfirm={() => setShowErr(false)}
          confirmButtonColor="#F44336"
          themeColor="#F44336"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    height: Math.max(200, height * 0.25),
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  scrollView: {
    flex: 1,
    marginTop: -40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  card: {
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: Math.max(20, width * 0.05),
    paddingTop: Math.max(20, height * 0.02),
    paddingBottom: Math.max(30, height * 0.03),
    width: "100%",
    alignSelf: "center",
    maxWidth: 500,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Math.max(10, height * 0.02),
  },
  logoIcon: {
    resizeMode: "contain",
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
    marginBottom: Math.max(20, height * 0.025),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    marginBottom: 5,
    paddingHorizontal: Math.max(12, width * 0.03),
    marginTop: Math.max(10, height * 0.012),
    borderWidth: 1,
    borderColor: '#222',
  },
  inputIcon: {
    marginRight: Math.max(8, width * 0.02),
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: Math.max(14, width * 0.037),
    paddingHorizontal: Math.max(8, width * 0.02),
  },
  eyeButton: {
    padding: Math.max(8, width * 0.02),
    marginLeft: Math.max(5, width * 0.01),
  },
  errorText: {
    color: "#ff4444",
    marginBottom: Math.max(5, height * 0.008),
    marginLeft: Math.max(12, width * 0.03),
    marginTop: 2,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 8,
    padding: Math.max(10, width * 0.03),
    marginTop: Math.max(5, height * 0.01),
    marginBottom: Math.max(10, height * 0.015),
  },
  requirementText: {
    color: '#aaa',
    marginBottom: Math.max(5, height * 0.008),
    fontWeight: '500',
  },
  requirementList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  requirementItem: {
    color: '#888',
    marginRight: Math.max(15, width * 0.04),
    marginBottom: Math.max(3, height * 0.004),
  },
  requirementMet: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    marginTop: Math.max(20, height * 0.025),
    alignItems: "center",
    justifyContent: 'center',
    minHeight: Math.max(50, height * 0.06),
  },
  proceedText: {
    color: "#000",
    fontWeight: "bold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#444"
  },
  dividerText: {
    color: "#aaa",
  },
  googleBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#fcbf24",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: Math.max(20, height * 0.025),
    minHeight: Math.max(45, height * 0.055),
  },
  googleText: {
    color: "#fff",
    fontWeight: '600',
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: Math.max(10, height * 0.012),
  },
  footerText: {
    color: "#888",
  },
  signup: {
    color: "#fcbf24",
    fontWeight: "bold"
  },
});

export default SignUp;