import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  AsyncStorage,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Logo from "../../assets/Logo.png";
import { useLoginEndPoint } from "../../services/auth.service";

const Login = ({ navigation, setTokenFromOutside }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const { mutate: login, isPending } = useLoginEndPoint(navigation, remember);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: "",
      password: "",
    };

    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  //TODO: add remember me validation to login endpoint
  const handleSubmit = async () => {
    if (validateForm()) {
      login({ email, password });
    }
  };

  const handleSignUpPress = () => {
    navigation.navigate('Signup');
  };

  const handleForgotPassword = () => {
    // Add your forgot password navigation here
    console.log("Forgot password pressed");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.banner} />

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
          
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Need a ride? Skip the stress and rent a car in minutes. Whether
            it's a quick trip, a business ride or a family vacation, we got
            you covered.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="email"
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
              editable={!isPending}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <FontAwesome
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
              value={password}
              onChangeText={setPassword}
              editable={!isPending}
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

          {/* Remember & Forgot */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRemember(!remember)}
              disabled={isPending}
            >
              <View style={[styles.checkbox, !remember && styles.checkboxUnchecked]}>
                {remember && <MaterialIcons name="check" size={16} color="#000" />}
              </View>
              <Text style={styles.checkboxLabel}>Remember Password</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} disabled={isPending}>
              <Text style={styles.forgot}>Forgot Password</Text>
            </TouchableOpacity>
          </View>

          {/* Proceed Button */}
          <TouchableOpacity
            style={[styles.proceedBtn, isPending && styles.proceedBtnDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.proceedText}>  Signing In...</Text>
              </View>
            ) : (
              <Text style={styles.proceedText}>Proceed</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity style={styles.googleBtn} disabled={isPending}>
            <FontAwesome name="google" size={18} color="#fff" />
            <Text style={styles.googleText}>Sign in with Google</Text>
          </TouchableOpacity>

          {/* Sign Up */}
          <TouchableOpacity onPress={handleSignUpPress} disabled={isPending}>
            <Text style={styles.footerText}>
              Don't have an account?{" "}
              <Text style={styles.signup}>Sign up</Text>
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
  logoContainer: {
    marginBottom: 10,
  },
  logoIcon: {
    width: 130,
    height: 100,
    resizeMode: "contain",
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  checkboxRow: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#fcbf24",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#fcbf24",
  },
  checkboxUnchecked: { 
    backgroundColor: "transparent" 
  },
  checkboxLabel: { 
    color: "#fff", 
    fontSize: 12 
  },
  forgot: { 
    color: "#fcbf24", 
    fontSize: 12 
  },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 10,
    alignItems: "center",
  },
  proceedBtnDisabled: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default Login;