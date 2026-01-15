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
  Dimensions,
  PixelRatio,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Logo from "../../assets/Logo.png";
import { useLoginEndPoint } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing functions
const widthPercentageToDP = (widthPercent) => {
  const elemWidth = parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_WIDTH * elemWidth / 100);
};

const heightPercentageToDP = (heightPercent) => {
  const elemHeight = parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_HEIGHT * elemHeight / 100);
};

// Font scaling
const scaleFont = (size) => {
  const scale = SCREEN_WIDTH / 375; // 375 is standard iPhone width
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");

  // Get window dimensions for responsive layout
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 768;

  // Get setTokens from AuthContext
  const { setTokens } = useAuth();

  // Pass setTokens to the login hook
  const { mutate: login, isPending } = useLoginEndPoint(
    navigation,
    remember,
    setTokens
  );

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

  const handleSubmit = async () => {
    setAuthError("");

    if (validateForm()) {
      login(
        { email, password },
        {
          onSuccess: () => {
            // Handle success if needed
          },
          onError: (error) => {
            if (error?.response?.status === 401) {
              setAuthError("Invalid email or password");
            } else {
              setAuthError("Something went wrong. Please try again.");
            }
          },
        }
      )
    }
  };

  const handleSignUpPress = () => {
    navigation.navigate('Signup');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ResetPasswordEmail');
  };

  // Dynamic styles based on screen size
  const dynamicStyles = {
    bannerHeight: isSmallScreen ? heightPercentageToDP('15%') : heightPercentageToDP('20%'),
    logoSize: isSmallScreen ? widthPercentageToDP('30%') : widthPercentageToDP('35%'),
    cardPadding: isSmallScreen ? widthPercentageToDP('5%') : widthPercentageToDP('8%'),
    titleFontSize: isSmallScreen ? scaleFont(20) : scaleFont(24),
    subtitleFontSize: isSmallScreen ? scaleFont(12) : scaleFont(14),
    inputHeight: isSmallScreen ? heightPercentageToDP('6%') : heightPercentageToDP('7%'),
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <View style={[styles.banner, { height: dynamicStyles.bannerHeight }]} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isSmallScreen ? 20 : 30 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[
          styles.card,
          {
            padding: dynamicStyles.cardPadding,
            width: isSmallScreen ? '100%' : isLargeScreen ? '85%' : '95%',
            maxWidth: 500, // Prevents stretching on tablets
            alignSelf: 'center',
          }
        ]}>
          <View style={styles.logoContainer}>
            <Image 
              source={Logo} 
              style={[
                styles.logoIcon, 
                { 
                  width: dynamicStyles.logoSize,
                  height: dynamicStyles.logoSize,
                }
              ]} 
              resizeMode="contain"
            />
          </View>
          
          <Text style={[styles.title, { fontSize: dynamicStyles.titleFontSize }]}>
            Sign In
          </Text>
          <Text style={[styles.subtitle, { fontSize: dynamicStyles.subtitleFontSize }]}>
            Need a ride? Skip the stress and rent a car in minutes. Whether
            it's a quick trip, a business ride or a family vacation, we got
            you covered.
          </Text>

          {/* Email Input */}
          <View style={[styles.inputContainer, { height: dynamicStyles.inputHeight }]}>
            <MaterialIcons
              name="email"
              size={isSmallScreen ? 18 : 20}
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
          <View style={[styles.inputContainer, { height: dynamicStyles.inputHeight }]}>
            <FontAwesome
              name="lock"
              size={isSmallScreen ? 18 : 20}
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
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={isSmallScreen ? 18 : 20}
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
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <View style={[styles.checkbox, !remember && styles.checkboxUnchecked]}>
                {remember && <MaterialIcons name="check" size={isSmallScreen ? 14 : 16} color="#000" />}
              </View>
              <Text style={[
                styles.checkboxLabel,
                { fontSize: isSmallScreen ? scaleFont(11) : scaleFont(12) }
              ]}>
                Remember Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleForgotPassword} 
              disabled={isPending}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Text style={[
                styles.forgot,
                { fontSize: isSmallScreen ? scaleFont(11) : scaleFont(12) }
              ]}>
                Forgot Password
              </Text>
            </TouchableOpacity>
          </View>
          
          {authError ? (
            <Text style={[
              styles.authError,
              { fontSize: isSmallScreen ? scaleFont(11) : scaleFont(13) }
            ]}>
              {authError}
            </Text>
          ) : null}

          {/* Proceed Button */}
          <TouchableOpacity
            style={[styles.proceedBtn, isPending && styles.proceedBtnDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={[
                  styles.proceedText,
                  { fontSize: isSmallScreen ? scaleFont(14) : scaleFont(16) }
                ]}>
                  Signing In...
                </Text>
              </View>
            ) : (
              <Text style={[
                styles.proceedText,
                { fontSize: isSmallScreen ? scaleFont(14) : scaleFont(16) }
              ]}>
                Proceed
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={[
              styles.dividerText,
              { fontSize: isSmallScreen ? scaleFont(12) : scaleFont(14) }
            ]}>
              or
            </Text>
            <View style={styles.divider} />
          </View>

          {/* Sign Up */}
          <TouchableOpacity 
            onPress={handleSignUpPress} 
            disabled={isPending}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[
              styles.footerText,
              { fontSize: isSmallScreen ? scaleFont(11) : scaleFont(12) }
            ]}>
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
  },
  card: {
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  logoContainer: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    resizeMode: "contain",
  },
  title: {
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
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
    fontSize: 14,
    paddingVertical: 0, // Better for Android
  },
  errorText: {
    color: "#ff4444",
    fontSize: 11,
    marginBottom: 10,
    marginLeft: 10,
  },
  authError: {
    color: "#ff4444",
    textAlign: "center",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    flexWrap: 'wrap', // For very small screens
  },
  checkboxRow: { 
    flexDirection: "row", 
    alignItems: "center",
    flexShrink: 1, // Prevents overflow
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
    flexShrink: 1,
  },
  forgot: { 
    color: "#fcbf24",
    flexShrink: 1,
    textAlign: 'right',
  },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50, // Ensures touchable area on all screens
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
    marginHorizontal: 10,
  },
  footerText: { 
    textAlign: "center", 
    color: "#888",
    marginBottom: 20,
  },
  signup: { 
    color: "#fcbf24", 
    fontWeight: "bold" 
  },
});

export default Login;