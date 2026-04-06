import React, { useState, useCallback, useMemo } from "react";
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
  useWindowDimensions,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRegisterEndPoint } from "../../services/auth.service";
import Logo from "../../assets/Logo.png";
import CentralModal from "../components/CentralModal";
import PlanSelector from "../../components/PlanSelector";

// FIX: Removed module-level Dimensions.get('window') — returns stale values
// before layout is measured, causing a re-render flicker.
// useWindowDimensions() is reactive and tied to the React lifecycle.

const SignUp = ({ navigation }) => {
  const { width, height } = useWindowDimensions();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [plan, setPlan] = useState("");
  const [showErr, setShowErr] = useState(false);
  const [errMessage, setErrMessage] = useState("");

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    driver_type: "",
  });

  // FIX: Memoized so they don't recreate on every render
  const scaleFont = useCallback((size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  }, [width]);

  const scaleSize = useCallback((size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  }, [width]);

  const validateForm = useCallback(() => {
    let valid = true;
    const newErrors = {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      confirmPassword: "",
      driver_type: "",
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

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    if (!plan) {
      newErrors.driver_type = "Please select a driver type";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [fullName, email, phone, address, password, confirmPassword, plan]);

  const handleLogin = useCallback(() => navigation.navigate("Login"), [navigation]);

  const { mutate: register, isPending } = useRegisterEndPoint();

  const handleProceed = useCallback(async () => {
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
          driver_type: plan,
        },
        {
          onSuccess: () => {
            navigation.navigate("Terms");
          },
          onError: (err) => {
            const errorData = err.response?.data;
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
            if (errorData?.[0]?.includes("registered")) {
              setErrMessage(errorData[0] || "This account already exists");
              setShowErr(true);
              return;
            }

            if (hasError) {
              setErrors(newErrors);
            } else {
              console.error("Registration failed:", errorData?.[0]);
              alert("Something went wrong. Please try again.");
            }
          },
        }
      );
    } catch (error) {
      console.error("Registration error:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  }, [validateForm, fullName, email, password, phone, address, plan, register, errors, navigation]);

  // FIX: Memoize dynamic styles to avoid recalculating every render
  const dynStyles = useMemo(() => ({
    banner: { height: Math.max(200, height * 0.25) },
    inputHeight: { height: scaleSize(50) },
    logo: { width: scaleSize(130), height: scaleSize(100) },
  }), [height, scaleSize]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />

      <KeyboardAvoidingView
        style={styles.container}
        removeClippedSubviews={false}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.banner, dynStyles.banner]} />

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={scaleSize(22)} color="#fff" />
            </TouchableOpacity>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={Logo} style={dynStyles.logo} resizeMode="contain" />
            </View>

            <Text style={[styles.title, { fontSize: scaleFont(24) }]}>Get Started Now</Text>
            <Text style={[styles.subtitle, { fontSize: scaleFont(14) }]}>Let's create an account</Text>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Octicons name="person" size={scaleSize(24)} color="#aaa" />
              <TextInput
                style={[styles.input, dynStyles.inputHeight]}
                placeholder="Full name"
                placeholderTextColor="#aaa"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            {errors.fullName ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.fullName}</Text>
            ) : null}

            {/* Email */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={scaleSize(20)} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, dynStyles.inputHeight]}
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
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.email}</Text>
            ) : null}

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Feather name="phone" size={scaleSize(20)} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, dynStyles.inputHeight]}
                placeholder="Phone Number"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                returnKeyType="next"
              />
            </View>
            {errors.phone ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.phone}</Text>
            ) : null}

            {/* Address */}
            <View style={styles.inputContainer}>
              <Feather name="map-pin" size={scaleSize(20)} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, dynStyles.inputHeight]}
                placeholder="Address"
                placeholderTextColor="#aaa"
                value={address}
                onChangeText={setAddress}
                returnKeyType="next"
              />
            </View>
            {errors.address ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.address}</Text>
            ) : null}

            {/* Password */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={scaleSize(20)} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, dynStyles.inputHeight]}
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={scaleSize(20)} color="#aaa" />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.password}</Text>
            ) : null}

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={scaleSize(20)} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, dynStyles.inputHeight]}
                placeholder="Confirm Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeButton}>
                <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={scaleSize(20)} color="#aaa" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.confirmPassword}</Text>
            ) : null}

            {/* Password Requirements */}
            <View style={styles.passwordRequirements}>
              <Text style={[styles.requirementText, { fontSize: scaleFont(11) }]}>Password must contain:</Text>
              <View style={styles.requirementList}>
                {[
                  { label: "At least 8 characters", met: password.length >= 8 },
                  { label: "One uppercase letter", met: /[A-Z]/.test(password) },
                  { label: "One number", met: /[0-9]/.test(password) },
                  { label: "One special character", met: /[!@#$%^&*(),.?\":{}|<>]/.test(password) },
                ].map(({ label, met }) => (
                  <Text
                    key={label}
                    style={[
                      styles.requirementItem,
                      { fontSize: scaleFont(10) },
                      met && styles.requirementMet,
                    ]}
                  >
                    • {label}
                  </Text>
                ))}
              </View>
            </View>

            {/* Plan Selector — original component, Premium & Business disabled inside it */}
            <PlanSelector
              selectedPlan={plan}
              onSelect={setPlan}
              error={errors.driver_type}
            />

            {/* Proceed Button */}
            <TouchableOpacity
              style={[styles.proceedBtn, { paddingVertical: scaleSize(14) }]}
              onPress={handleProceed}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={[styles.proceedText, { fontSize: scaleFont(16) }]}>Proceed</Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <TouchableOpacity onPress={handleLogin} style={styles.loginLinkContainer}>
              <Text style={[styles.footerText, { fontSize: scaleFont(12) }]}>
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
  mainContainer: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000" },
  banner: {
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  scrollView: { flex: 1, marginTop: -40 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  card: {
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    width: "100%",
    alignSelf: "center",
    maxWidth: 500,
  },
  logoContainer: { alignItems: "center", marginBottom: 10 },
  title: { fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 5 },
  subtitle: { color: "#ccc", textAlign: "center", marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    marginBottom: 5,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 8,
  },
  eyeButton: { padding: 8, marginLeft: 5 },
  errorText: { color: "#ff4444", marginBottom: 5, marginLeft: 12, marginTop: 2 },
  passwordRequirements: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  requirementText: { color: "#aaa", marginBottom: 5, fontWeight: "500" },
  requirementList: { flexDirection: "row", flexWrap: "wrap" },
  requirementItem: { color: "#888", marginRight: 15, marginBottom: 3 },
  requirementMet: { color: "#4CAF50", fontWeight: "600" },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  proceedText: { color: "#000", fontWeight: "bold" },
  loginLinkContainer: { alignItems: "center", marginTop: 12 },
  footerText: { color: "#888" },
  signup: { color: "#fcbf24", fontWeight: "bold" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 5,
  },
});

export default SignUp;