import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Dimensions,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Feather, Entypo, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLogoutEndPoint } from '../../services/auth.service';
import { useProfile } from '../../services/profile.service';
import { SocketContext } from '../../context/WebSocketProvider';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CentralModal from '../components/CentralModal';
import Platform from 'react-native/Libraries/Utilities/Platform';
import { api } from '../../services/api';


export default function Account() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;

  const [modalVisible, setModalVisible] = useState(false);

  // --- Delete Account State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dLoading, setDLoading] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ reason: '', password: '' });
  const [deleteErrors, setDeleteErrors] = useState({});

  const navigation = useNavigation();
  const { data: profile, isPending, isError } = useProfile();
  const { clearTokens } = useAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutEndPoint(clearTokens);
  const { socket } = useContext(SocketContext);

  const LoginAndSecurity = () => navigation.navigate('LoginAndSecurity');
  const PersonalInfo = () => navigation.navigate('PersonalInfo');
  const Settings = () => navigation.navigate('SettingsScreen');
  const Safety = () => navigation.navigate('SafetyActions');
  const City = () => navigation.navigate('City');
  const ReferAndEarn = () => navigation.navigate('ReferAndEarn');
  const HelpAndSupport = () => navigation.navigate('HelpAndSupport');
  const Legal = () => navigation.navigate('Legal');

  const handleLogout = async () => {
    console.log('🚪 Starting logout process...');

    if (socket) {
      console.log('🔌 Closing WebSocket connection...');
      socket.close(1000, 'User logged out');
    }

    logout(undefined, {
      onSuccess: () => {
        console.log('✅ Logout successful');
        setModalVisible(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      },
      onError: async (error) => {
        console.error('❌ Logout error:', error);
        try {
          await AsyncStorage.removeItem('userId');
          await AsyncStorage.removeItem('pendingEmail');
          setModalVisible(false);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (cleanupError) {
          console.error('❌ Cleanup failed:', cleanupError);
        }
      },
    });
  };

  // --- Delete Account Handlers ---
  const validateDeleteForm = () => {
    const errors = {};

    if (!deleteForm.reason || deleteForm.reason.trim().length === 0) {
      errors.reason = 'Reason is required to delete your account.';
    }
    if (!deleteForm.password || deleteForm.password.trim().length === 0) {
      errors.password = 'Password is required to delete your account.';
    } else if (deleteForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setDeleteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeleteAcct = async () => {
    if (!validateDeleteForm()) return;

    setDLoading(true);
    try {
      await api.post('auth/request_delete_account/', {
        password: deleteForm.password,
        reason: deleteForm.reason,
      });

      console.log('[Account] Delete account request successful');
      setShowDeleteModal(false);
      setDeleteForm({ reason: '', password: '' });
      setDeleteErrors({});
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      console.log('actual err', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.';
      console.error('[Account] Delete account error:', message);
      setDeleteErrors({ password: message, reason: message });
    } finally {
      setDLoading(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (dLoading) return;
    setShowDeleteModal(false);
    setDeleteForm({ reason: '', password: '' });
    setDeleteErrors({});
  };

  if (isPending) {
    return (
      <View style={[styles.loadingContainer, { height }]}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.errorContainer, { height }]}>
        <Text
          style={[
            styles.errorText,
            isSmallScreen && styles.errorTextSmall,
            isLargeScreen && styles.errorTextLarge,
          ]}
        >
          Error loading profile
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text
          style={[
            styles.header,
            isSmallScreen && styles.headerSmall,
            isLargeScreen && styles.headerLarge,
            isTablet && styles.headerTablet,
          ]}
        >
          Account
        </Text>

        {/* Profile Section */}
        <View
          style={[
            styles.profileSection,
            isSmallScreen && styles.profileSectionSmall,
            isLargeScreen && styles.profileSectionLarge,
          ]}
        >
          <Image
            source={require('../../assets/Profileimg.png')}
            style={[
              styles.profileImage,
              isSmallScreen && styles.profileImageSmall,
              isLargeScreen && styles.profileImageLarge,
            ]}
          />
          <View
            style={[
              styles.profileInfo,
              isSmallScreen && styles.profileInfoSmall,
              isLargeScreen && styles.profileInfoLarge,
            ]}
          >
            <Text
              style={[
                styles.profileName,
                isSmallScreen && styles.profileNameSmall,
                isLargeScreen && styles.profileNameLarge,
              ]}
            >
              {profile.first_name} {profile.last_name}
            </Text>
            <View style={styles.ratingRow}>
              <Text
                style={[
                  styles.ratingText,
                  isSmallScreen && styles.ratingTextSmall,
                  isLargeScreen && styles.ratingTextLarge,
                ]}
              >
                {profile.rating}
              </Text>
              <FontAwesome5
                name="star"
                size={isSmallScreen ? 12 : 14}
                color="#FFC107"
              />
            </View>
          </View>
        </View>

        {/* First Box: Personal Info / Security */}
        <View
          style={[
            styles.box,
            isSmallScreen && styles.boxSmall,
            isLargeScreen && styles.boxLarge,
            isTablet && styles.boxTablet,
          ]}
        >
          <MenuItem
            onPress={PersonalInfo}
            icon={<MaterialIcons name="person-outline" size={isSmallScreen ? 18 : 20} color="#FFC107" />}
            label="Personal info"
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
          <Divider isSmallScreen={isSmallScreen} isLargeScreen={isLargeScreen} />
          <MenuItem
            onPress={LoginAndSecurity}
            icon={<Feather name="lock" size={isSmallScreen ? 18 : 20} color="#FFC107" />}
            label="Login & security"
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
        </View>

        {/* Second Box: Settings, Safety, etc. */}
        <View
          style={[
            styles.box,
            isSmallScreen && styles.boxSmall,
            isLargeScreen && styles.boxLarge,
            isTablet && styles.boxTablet,
          ]}
        >
          <MenuItem
            onPress={Settings}
            icon={<Feather name="settings" size={isSmallScreen ? 18 : 20} color="#FFC107" />}
            label="Settings"
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
          <Divider isSmallScreen={isSmallScreen} isLargeScreen={isLargeScreen} />
          <MenuItem
            onPress={Safety}
            icon={<Feather name="shield" size={isSmallScreen ? 18 : 20} color="#FFC107" />}
            label="Safety"
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
          <Divider isSmallScreen={isSmallScreen} isLargeScreen={isLargeScreen} />
          <MenuItem
            onPress={City}
            icon={<Entypo name="location-pin" size={isSmallScreen ? 18 : 20} color="#FFC107" />}
            label="City"
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
          <Divider isSmallScreen={isSmallScreen} isLargeScreen={isLargeScreen} />
          <MenuItem
            onPress={ReferAndEarn}
            icon={<Feather name="gift" size={isSmallScreen ? 18 : 20} color="#FFC107" />}
            label="Refer & Earn"
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
          <Divider isSmallScreen={isSmallScreen} isLargeScreen={isLargeScreen} />
          <MenuItem
            onPress={HelpAndSupport}
            icon={<Feather name="help-circle" size={isSmallScreen ? 18 : 20} color="#FFC107" />}
            label="Help & Support"
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
          <Divider isSmallScreen={isSmallScreen} isLargeScreen={isLargeScreen} />
          <MenuItem
            onPress={Legal}
            icon={<Feather name="file-text" size={isSmallScreen ? 18 : 20} color="#FFC107" />}
            label="Legal"
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
          <Divider isSmallScreen={isSmallScreen} isLargeScreen={isLargeScreen} />
          <MenuItem
            onPress={() => setModalVisible(true)}
            icon={<Feather name="log-out" size={isSmallScreen ? 18 : 20} color="#ff4444" />}
            label="Log Out"
            isLogout
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
          <Divider isSmallScreen={isSmallScreen} isLargeScreen={isLargeScreen} />
          <MenuItem
            onPress={() => setShowDeleteModal(true)}
            icon={<Feather name="trash-2" size={isSmallScreen ? 18 : 20} color="#ff4444" />}
            label="Delete Account"
            isLogout
            isSmallScreen={isSmallScreen}
            isLargeScreen={isLargeScreen}
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <CentralModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Log Out"
        subText="Are you sure you want to log out?"
        icon="log-out"
        confirmText="Log Out"
        closeText="Cancel"
        onConfirm={handleLogout}
        confirmButtonColor="#ff4444"
        themeColor="#ff4444"
      />

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseDeleteModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseDeleteModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.deleteModal}>
                {/* Header */}
                <View style={styles.deleteModalHeader}>
                  <Ionicons name="warning-outline" size={28} color="#FF4444" />
                  <Text style={styles.deleteModalTitle}>Delete Account</Text>
                </View>

                <Text style={styles.deleteModalText}>
                  This action is permanent and cannot be undone. All your data will be erased.
                </Text>

                {/* Reason Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Reason for leaving<Text style={styles.requiredTag}> *</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      deleteErrors.reason ? styles.inputError : null,
                    ]}
                    placeholder="Tell us why you're leaving..."
                    placeholderTextColor="#666"
                    value={deleteForm.reason}
                    onChangeText={(text) => {
                      setDeleteForm((prev) => ({ ...prev, reason: text }));
                      if (deleteErrors.reason) {
                        setDeleteErrors((prev) => ({ ...prev, reason: undefined }));
                      }
                    }}
                    multiline
                    numberOfLines={3}
                    editable={!dLoading}
                  />
                  {deleteErrors.reason ? (
                    <Text style={styles.errorText}>{deleteErrors.reason}</Text>
                  ) : null}
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Confirm your password<Text style={styles.requiredTag}> *</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      deleteErrors.password ? styles.inputError : null,
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    value={deleteForm.password}
                    onChangeText={(text) => {
                      setDeleteForm((prev) => ({ ...prev, password: text }));
                      if (deleteErrors.password) {
                        setDeleteErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    secureTextEntry
                    editable={!dLoading}
                  />
                  {deleteErrors.password ? (
                    <Text style={styles.errorText}>{deleteErrors.password}</Text>
                  ) : null}
                </View>

                {/* Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCloseDeleteModal}
                    disabled={dLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={handleDeleteAcct}
                    disabled={dLoading}
                  >
                    {dLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

/* --- Small Components --- */
const MenuItem = ({ icon, label, onPress, isLogout, isSmallScreen, isLargeScreen }) => (
  <TouchableOpacity
    style={[
      styles.row,
      isSmallScreen && styles.rowSmall,
      isLargeScreen && styles.rowLarge,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon}
    <Text
      style={[
        styles.rowText,
        isSmallScreen && styles.rowTextSmall,
        isLargeScreen && styles.rowTextLarge,
        isLogout && styles.logoutRowText,
      ]}
    >
      {label}
    </Text>
    <Entypo
      name="chevron-right"
      size={isSmallScreen ? 16 : 18}
      color={isLogout ? '#ff4444' : '#FFC107'}
      style={{ marginLeft: 'auto' }}
    />
  </TouchableOpacity>
);

const Divider = ({ isSmallScreen, isLargeScreen }) => (
  <View
    style={[
      styles.divider,
      isSmallScreen && styles.dividerSmall,
      isLargeScreen && styles.dividerLarge,
    ]}
  />
);

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: height * 0.05,
    minHeight: height * 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorText: { color: 'red', fontSize: width * 0.04 },
  errorTextSmall: { fontSize: width * 0.038 },
  errorTextLarge: { fontSize: width * 0.042 },
  header: {
    color: 'white',
    fontSize: width * 0.08,
    fontWeight: '700',
    marginBottom: height * 0.02,
  },
  headerSmall: { fontSize: width * 0.075, marginBottom: height * 0.015 },
  headerLarge: { fontSize: width * 0.085, marginBottom: height * 0.025 },
  headerTablet: { fontSize: width * 0.09, textAlign: 'center' },
  profileSection: { padding: 10, borderRadius: 12 },
  profileSectionSmall: { marginBottom: height * 0.025 },
  profileSectionLarge: { marginBottom: height * 0.035 },
  profileImage: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    marginRight: width * 0.04,
    alignSelf: 'center',
    padding: 10,
  },
  profileImageSmall: {},
  profileImageLarge: {},
  profileInfo: { flex: 1, alignSelf: 'center' },
  profileInfoSmall: { marginLeft: width * 0.03 },
  profileInfoLarge: { marginLeft: width * 0.05 },
  profileName: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: '600',
    marginBottom: height * 0.005,
  },
  profileNameSmall: { fontSize: width * 0.042 },
  profileNameLarge: { fontSize: width * 0.048 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: {
    color: '#FFC107',
    fontSize: width * 0.038,
    fontWeight: '500',
    marginRight: width * 0.01,
  },
  ratingTextSmall: { fontSize: width * 0.036 },
  ratingTextLarge: { fontSize: width * 0.04 },
  box: {
    backgroundColor: '#04223A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: width * 0.04,
    marginBottom: height * 0.025,
    width: '100%',
  },
  boxSmall: { borderRadius: width * 0.035, marginBottom: height * 0.02 },
  boxLarge: { borderRadius: width * 0.045, marginBottom: height * 0.03 },
  boxTablet: { maxWidth: 500, alignSelf: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.016,
    paddingHorizontal: width * 0.04,
    minHeight: height * 0.06,
  },
  rowSmall: {
    paddingVertical: height * 0.014,
    paddingHorizontal: width * 0.035,
    minHeight: height * 0.055,
  },
  rowLarge: {
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.045,
    minHeight: height * 0.065,
  },
  rowText: {
    color: 'white',
    fontSize: width * 0.04,
    marginLeft: width * 0.03,
    fontWeight: '500',
    flex: 1,
  },
  rowTextSmall: { fontSize: width * 0.038, marginLeft: width * 0.025 },
  rowTextLarge: { fontSize: width * 0.042, marginLeft: width * 0.035 },
  logoutRowText: { color: '#ff4444' },
  divider: {
    height: 1,
    backgroundColor: '#FFC107',
    opacity: 0.5,
    marginHorizontal: width * 0.04,
  },
  dividerSmall: { marginHorizontal: width * 0.035 },
  dividerLarge: { marginHorizontal: width * 0.045 },
  // Delete Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteModalTitle: {
    color: '#FF4444',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deleteModalText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: { width: '100%', marginBottom: 14 },
  inputLabel: { color: '#ccc', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  requiredTag: { color: '#FF4444' },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  inputError: { borderColor: '#FF4444' },
  errorText: { color: '#FF4444', fontSize: 12, marginTop: 4 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: '#444' },
  deleteButton: { backgroundColor: '#FF4444' },
  cancelButtonText: { color: '#fff', fontWeight: '600' },
  deleteButtonText: { color: '#fff', fontWeight: '600' },
});