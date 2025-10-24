import { FontAwesome, Feather } from "@expo/vector-icons";
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from "react";
import { useRegisterEndPoint } from "../../services/auth.service"
import AsyncStorage from "@react-native-async-storage/async-storage";
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
} from "react-native";
import Logo from "../../assets/Logo.png";

const SignUp = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [referral, setReferral] = useState("");

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
  const handleProceed = async() => {
    if (!validateForm()) return;

    const [first_name, ...rest] = fullName.trim().split(" ");
    const last_name = rest.length > 0 ? rest.join(" ") : "";

    await AsyncStorage.setItem("pendingEmail", email);
    console.log("📩 Email saved for OTP verification:", email);
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
          navigator.navigate("OTP");
        },
        onError: (err) => {
      const errorData = err.response?.data;

      if (errorData?.email?.[0]?.includes("already exists")) {
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered. Try signing in instead.",
        }));
      } else {
        console.error("Registration failed:", errorData || err.message);
        alert("Something went wrong. Please try again.");
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Top Banner */}
      <View style={styles.banner} />

      {/* Scrollable Card */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image source={Logo} style={styles.logoIcon} />
          </View>
          <Text style={styles.title}>Get Started Now</Text>
          <Text style={styles.subtitle}>Let's create an account</Text>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Octicons name="person" size={24} color="#aaa" />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#aaa"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color="#aaa"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <Feather
              name="phone"
              size={20}
              color="#aaa"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

          {/* Address */}
          <View style={styles.inputContainer}>
            <Feather
              name="map-pin"
              size={20}
              color="#aaa"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor="#aaa"
              value={address}
              onChangeText={setAddress}
            />
          </View>
          {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

          {/* Password */}
          <View style={styles.inputContainer}>
            <Feather
              name="lock"
              size={20}
              color="#aaa"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#aaa"
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          {/* Referral Code */}
          <View style={styles.inputContainer}>
            <Octicons
              name="cross-reference"
              size={20}
              color="#aaa"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Referral Code"
              placeholderTextColor="#aaa"
              value={referral}
              onChangeText={setReferral}
              autoCapitalize="characters"
            />
          </View>

          {/* Proceed Button */}
          <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
            {isPending ?
              <ActivityIndicator size="small" color="#000" /> :
              <Text style={styles.proceedText}>Proceed</Text>
            }
            
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity style={styles.googleBtn}>
            <FontAwesome name="google" size={18} color="#fff" />
            <Text style={styles.googleText}>Sign in with Google</Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.signup}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
    marginTop: -40,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    marginBottom: 5,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  inputIcon: { 
    marginRight: 10 
  },
  input: { 
    flex: 1, 
    color: "#fff", 
    height: 50 
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 10,
  },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: "center",
  },
  proceedText: { 
    color: "#000", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: { 
    flex: 1, 
    height: 1, 
    backgroundColor: "#444" 
  },
  dividerText: { 
    color: "#aaa", 
    marginHorizontal: 10 
  },
  googleBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#fcbf24",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 30,
  },
  googleText: { 
    color: "#fff", 
    marginLeft: 8 
  },
  footerText: { 
    textAlign: "center", 
    color: "#888", 
    fontSize: 12,
    marginBottom: 20,
  },
  signup: { 
    color: "#fcbf24", 
    fontWeight: "bold" 
  },
  logoContainer: {},
  logoIcon: {
    width: 130,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
  },
});

export default SignUp;