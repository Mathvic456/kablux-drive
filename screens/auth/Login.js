import React, { useEffect, useState } from "react";
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
  SafeAreaView,
  StatusBar
} from "react-native";
import { FontAwesome, MaterialIcons, Feather } from "@expo/vector-icons";
import Logo from "../../assets/Logo.png";
import { useLoginEndPoint } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";
import { usePushNotifications } from "../../hooks/usePushNotifications";


const { width, height } = Dimensions.get('window');

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


  // Responsive scaling functions
  const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  };

  const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  };

  // Get setTokens from AuthContext
  const { setTokens } = useAuth();
  const { token: pushToken, getPushToken } = usePushNotifications();

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
      let fcmToken = pushToken;
      if (!fcmToken) {
        try {
          fcmToken = await getPushToken();
        } catch (error) {
          fcmToken = ""
          console.warn("Failed to get push token, proceeding without it:", error);
        }
      }

      const payload = { email, password, role: 'driver', type: 'android' };
      if (fcmToken) {
        payload.fcm_token = fcmToken;
      }

      login(
        payload,
        {
          onSuccess: () => {
            // setActiveStatus({ is_online: true });
            console.log(" Login successful");
          },
          onError: (error) => {
            if (error?.response?.status === 401) {
              setAuthError("Invalid email or password");
            } else {
              setAuthError("Something went wrong. Please try again.");
            }
          },
        }
      );
    }
  };

  const handleSignUpPress = () => {
    navigation.navigate('Signup');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ResetPasswordEmail');
  };


  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2633" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Top Banner */}
        <View style={[styles.banner, {
          height: Math.max(200, height * 0.25)
        }]} />

        {/* Scrollable Card */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[
            styles.card,
            {
              paddingHorizontal: Math.max(20, width * 0.05),
              paddingTop: Math.max(20, height * 0.02),
              paddingBottom: Math.max(30, height * 0.03)
            }
          ]}>
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

            <Text style={[
              styles.title,
              { fontSize: scaleFont(24) }
            ]}>
              Sign In
            </Text>

            <Text style={[
              styles.subtitle,
              {
                fontSize: scaleFont(14),
                lineHeight: scaleFont(20)
              }
            ]}>
              Need a ride? Skip the stress and rent a car in minutes. Whether
              it's a quick trip, a business ride or a family vacation, we got
              you covered.
            </Text>

            {/* Email Input */}
            <View style={[
              styles.inputContainer,
              {
                height: scaleSize(50),
                marginTop: scaleSize(10)
              }
            ]}>
              <MaterialIcons
                name="email"
                size={scaleSize(20)}
                color="#aaa"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { fontSize: scaleFont(14) }
                ]}
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
              <Text style={[
                styles.errorText,
                { fontSize: scaleFont(12) }
              ]}>
                {errors.email}
              </Text>
            ) : null}

            {/* Password Input */}
            <View style={[
              styles.inputContainer,
              {
                height: scaleSize(50),
                marginTop: scaleSize(10)
              }
            ]}>
              <FontAwesome
                name="lock"
                size={scaleSize(20)}
                color="#aaa"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { fontSize: scaleFont(14) }
                ]}
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isPending}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={isPending}
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={scaleSize(20)}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={[
                styles.errorText,
                { fontSize: scaleFont(12) }
              ]}>
                {errors.password}
              </Text>
            ) : null}

            {/* Remember & Forgot */}
            <View style={[
              styles.row,
              {
                marginTop: scaleSize(10),
                marginBottom: scaleSize(20)
              }
            ]}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRemember(!remember)}
                disabled={isPending}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  !remember && styles.checkboxUnchecked,
                  {
                    width: scaleSize(20),
                    height: scaleSize(20)
                  }
                ]}>
                  {remember && (
                    <MaterialIcons
                      name="check"
                      size={scaleSize(16)}
                      color="#000"
                    />
                  )}
                </View>
                <Text style={[
                  styles.checkboxLabel,
                  { fontSize: scaleFont(12) }
                ]}>
                  Remember Password
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={isPending}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.forgot,
                  { fontSize: scaleFont(12) }
                ]}>
                  Forgot Password
                </Text>
              </TouchableOpacity>
            </View>

            {authError ? (
              <Text style={[
                styles.authError,
                {
                  fontSize: scaleFont(13),
                  marginBottom: scaleSize(10)
                }
              ]}>
                {authError}
              </Text>
            ) : null}

            {/* Proceed Button */}
            <TouchableOpacity
              style={[
                styles.proceedBtn,
                isPending && styles.proceedBtnDisabled,
                {
                  paddingVertical: scaleSize(14),
                  marginTop: scaleSize(10),
                  minHeight: scaleSize(50)
                }
              ]}
              onPress={handleSubmit}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={[
                    styles.proceedText,
                    {
                      fontSize: scaleFont(16),
                      marginLeft: scaleSize(8)
                    }
                  ]}>
                    Signing In...
                  </Text>
                </View>
              ) : (
                <Text style={[
                  styles.proceedText,
                  { fontSize: scaleFont(16) }
                ]}>
                  Proceed
                </Text>
              )}
            </TouchableOpacity>



            {/* Sign Up Link */}
            <TouchableOpacity
              onPress={handleSignUpPress}
              disabled={isPending}
              style={styles.signupLink}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.footerText,
                { fontSize: scaleFont(12) }
              ]}>
                Don't have an account?{" "}
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
    width: "100%",
    alignSelf: "center",
    maxWidth: 500,
  },
  logoContainer: {
    marginBottom: Math.max(10, height * 0.01),
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
    borderWidth: 1,
    borderColor: '#222',
  },
  inputIcon: {
    marginRight: Math.max(8, width * 0.02),
  },
  input: {
    flex: 1,
    color: "#fff",
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
  authError: {
    color: "#ff4444",
    textAlign: "center",
    fontWeight: '500',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: 'wrap',
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  checkbox: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#fcbf24",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Math.max(8, width * 0.02),
    backgroundColor: "#fcbf24",
  },
  checkboxUnchecked: {
    backgroundColor: "transparent"
  },
  checkboxLabel: {
    color: "#fff",
    flexShrink: 1,
    fontWeight: '500',
  },
  forgot: {
    color: "#fcbf24",
    flexShrink: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#444"
  },
  dividerText: {
    color: "#aaa",
    fontWeight: '500',
  },
  signupLink: {
    alignItems: 'center',
    marginTop: Math.max(10, height * 0.01),
    marginBottom: Math.max(20, height * 0.02),
  },
  footerText: {
    color: "#888",
  },
  signup: {
    color: "#fcbf24",
    fontWeight: "bold"
  },
});

export default Login;