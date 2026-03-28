import React, { useState, useCallback, useMemo } from "react";
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
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { FontAwesome, MaterialIcons, Feather } from "@expo/vector-icons";
import Logo from "../../assets/Logo.png";
import { useLoginEndPoint } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useGoogleAuth } from "../../utils/useGoogleAuth";
import GoogleSignInButton from "../../components/GoogleSignInButton";

// FIX: Removed module-level Dimensions.get() — it can return stale values before
// the layout is measured, causing a re-render flicker. useWindowDimensions() is
// the correct hook-based approach that stays in sync with the React lifecycle.

const Login = ({ navigation }) => {
  const { width, height } = useWindowDimensions(); // FIX: reactive, no flicker

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const { promptGoogleSignIn, isLoading: isGoogleLoading } = useGoogleAuth({
    onSuccess: () => navigation.replace("Mainapp"),
    onError: (msg) => console.error("[Google Auth]", msg),
  });

  // FIX: Scaling functions memoized — prevents recreation on every render
  const scaleFont = useCallback((size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  }, [width]);

  const scaleSize = useCallback((size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  }, [width]);

  const { setTokens } = useAuth();
  const { token: pushToken, getPushToken } = usePushNotifications();
  const { mutate: login, isPending } = useLoginEndPoint(navigation, remember, setTokens);

  const validateForm = useCallback(() => {
    let valid = true;
    const newErrors = { email: "", password: "" };

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
  }, [email, password]);

  const handleSubmit = useCallback(async () => {
    setAuthError("");
    if (!validateForm()) return;

    let fcmToken = pushToken;
    if (!fcmToken) {
      try {
        fcmToken = await getPushToken();
      } catch (error) {
        fcmToken = "";
        console.warn("Failed to get push token, proceeding without it:", error);
      }
    }

    const payload = { email, password, role: "driver", type: "android" };
    if (fcmToken) payload.fcm_token = fcmToken;

    login(payload, {
      onSuccess: () => console.log("Login successful"),
      onError: (error) => {
        if (error?.response?.status === 401) {
          setAuthError("Invalid email or password");
        } else {
          setAuthError("Something went wrong. Please try again.");
        }
      },
    });
  }, [validateForm, email, password, pushToken, getPushToken, login]);

  const handleSignUpPress = useCallback(() => navigation.navigate("Signup"), [navigation]);
  const handleForgotPassword = useCallback(() => navigation.navigate("ResetPasswordEmail"), [navigation]);

  // FIX: Memoize dynamic styles to avoid recalculating on every render
  const dynStyles = useMemo(() => ({
    banner: { height: Math.max(200, height * 0.25) },
    card: {
      paddingHorizontal: Math.max(20, width * 0.05),
      paddingTop: Math.max(20, height * 0.02),
      paddingBottom: Math.max(30, height * 0.03),
    },
    inputRow: { height: scaleSize(50), marginTop: scaleSize(10) },
    checkboxSize: { width: scaleSize(20), height: scaleSize(20) },
    rowMargin: { marginTop: scaleSize(10), marginBottom: scaleSize(20) },
    buttonStyle: { paddingVertical: scaleSize(14), marginTop: scaleSize(10), minHeight: scaleSize(50) },
    dividerMargin: { marginVertical: scaleSize(20) },
  }), [width, height, scaleSize]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />

      <KeyboardAvoidingView
        style={styles.container}
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

          <View style={[styles.card, dynStyles.card]}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={Logo}
                style={{ width: scaleSize(130), height: scaleSize(100) }}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.title, { fontSize: scaleFont(24) }]}>Sign In</Text>
            <Text style={[styles.subtitle, { fontSize: scaleFont(14), lineHeight: scaleFont(20) }]}>
              Earn more with structured support and transparent payouts.
            </Text>

            {/* Email Input */}
            <View style={[styles.inputContainer, dynStyles.inputRow]}>
              <MaterialIcons name="email" size={scaleSize(20)} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontSize: scaleFont(14) }]}
                placeholder="Email"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isPending}
                returnKeyType="next"
              />
            </View>
            {errors.email ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.email}</Text>
            ) : null}

            {/* Password Input */}
            <View style={[styles.inputContainer, dynStyles.inputRow]}>
              <FontAwesome name="lock" size={scaleSize(20)} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontSize: scaleFont(14) }]}
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isPending}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                disabled={isPending}
              >
                <Feather name={showPassword ? "eye" : "eye-off"} size={scaleSize(20)} color="#aaa" />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>{errors.password}</Text>
            ) : null}

            {/* Remember & Forgot */}
            <View style={[styles.row, dynStyles.rowMargin]}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRemember((v) => !v)}
                disabled={isPending}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, !remember && styles.checkboxUnchecked, dynStyles.checkboxSize]}>
                  {remember && <MaterialIcons name="check" size={scaleSize(16)} color="#000" />}
                </View>
                <Text style={[styles.checkboxLabel, { fontSize: scaleFont(12) }]}>Remember Password</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword} disabled={isPending} activeOpacity={0.7}>
                <Text style={[styles.forgot, { fontSize: scaleFont(12) }]}>Forgot Password</Text>
              </TouchableOpacity>
            </View>

            {authError ? (
              <Text style={[styles.authError, { fontSize: scaleFont(13), marginBottom: scaleSize(10) }]}>
                {authError}
              </Text>
            ) : null}

            {/* Proceed Button */}
            <TouchableOpacity
              style={[styles.proceedBtn, isPending && styles.proceedBtnDisabled, dynStyles.buttonStyle]}
              onPress={handleSubmit}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={[styles.proceedText, { fontSize: scaleFont(16), marginLeft: scaleSize(8) }]}>
                    Signing In...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.proceedText, { fontSize: scaleFont(16) }]}>Proceed</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.dividerRow, dynStyles.dividerMargin]}>
              <View style={styles.divider} />
              <Text style={[styles.dividerText, { fontSize: scaleFont(12), marginHorizontal: scaleSize(10) }]}>or</Text>
              <View style={styles.divider} />
            </View>

            <GoogleSignInButton onPress={promptGoogleSignIn} disabled={isGoogleLoading} loading={isGoogleLoading} />

            {/* Sign Up Link */}
            <TouchableOpacity
              onPress={handleSignUpPress}
              disabled={isPending}
              style={styles.signupLink}
              activeOpacity={0.7}
            >
              <Text style={[styles.footerText, { fontSize: scaleFont(12) }]}>
                Don't have an account ?{" "}
                <Text style={styles.signup}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    width: "100%",
    alignSelf: "center",
    maxWidth: 500,
  },
  logoContainer: { marginBottom: 10, alignItems: "center", justifyContent: "center" },
  title: { fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 5 },
  subtitle: { color: "#ccc", textAlign: "center", marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    marginBottom: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: "#fff", paddingHorizontal: 8 },
  eyeButton: { padding: 8, marginLeft: 5 },
  errorText: { color: "#ff4444", marginBottom: 5, marginLeft: 12, marginTop: 2 },
  authError: { color: "#ff4444", textAlign: "center", fontWeight: "500" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" },
  checkboxRow: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  checkbox: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#fcbf24",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#fcbf24",
  },
  checkboxUnchecked: { backgroundColor: "transparent" },
  checkboxLabel: { color: "#fff", flexShrink: 1, fontWeight: "500" },
  forgot: { color: "#fcbf24", flexShrink: 1, textAlign: "right", fontWeight: "500" },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  proceedBtnDisabled: { backgroundColor: "#666", opacity: 0.6 },
  loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  proceedText: { color: "#000", fontWeight: "bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  divider: { flex: 1, height: 1, backgroundColor: "#444" },
  dividerText: { color: "#aaa", fontWeight: "500" },
  signupLink: { alignItems: "center", marginTop: 10, marginBottom: 20 },
  footerText: { color: "#888" },
  signup: { color: "#fcbf24", fontWeight: "bold" },
});

export default Login;