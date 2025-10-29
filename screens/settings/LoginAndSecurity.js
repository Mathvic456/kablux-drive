import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Feather, Entypo, FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

export default function LoginAndSecurity() {
  const navigation = useNavigation();
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [passkeysModalVisible, setPasskeysModalVisible] = useState(false);
  const [linkGoogleModalVisible, setLinkGoogleModalVisible] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const goBack = () => {
    navigation.goBack();
  }

  const InviteFriends = () => {
    navigation.navigate('ReferAndEarn');
  }

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, number and special character';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = () => {
    if (validatePasswordForm()) {
      // Here you would typically make an API call to change the password
      Alert.alert('Success', 'Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordModalVisible(false);
      setErrors({});
    }
  };

  const handleSetUpPasskeys = () => {
    // Implementation for setting up passkeys
    Alert.alert('Passkeys', 'Passkeys setup functionality would go here');
    setPasskeysModalVisible(false);
  };

  const handleLinkGoogle = () => {
    // Implementation for linking Google account
    Alert.alert('Google Account', 'Google account linking functionality would go here');
    setLinkGoogleModalVisible(false);
  };

  const updatePasswordField = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back-circle" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.text}>Login & Security</Text>
        <View style={{ width: 24 }}></View>
      </View>

      {/* Main Content */}
      <View style={styles.box}>
        {/* Change Password */}
        <TouchableOpacity 
          style={styles.row} 
          onPress={() => setChangePasswordModalVisible(true)}
        >
          <Feather name="lock" size={20} color="#FFC107" />
          <Text style={styles.rowText}>Change Password</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Set up Passkeys */}
        <TouchableOpacity 
          style={styles.row} 
          onPress={() => setPasskeysModalVisible(true)}
        >
          <Feather name="key" size={20} color="#FFC107" />
          <Text style={styles.rowText}>Set up Passkeys</Text>
          <Entypo
            name="chevron-right"
            size={18}
            color="#FFC107"
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Link Google */}
        <TouchableOpacity 
          style={styles.row} 
          onPress={() => setLinkGoogleModalVisible(true)}
        >
          <FontAwesome name="google" size={20} color="#FFC107" />
          <Text style={styles.rowText}>Link Google</Text>
          <Entypo
            name="chevron-right"
            size={18}
            color="#FFC107"
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>
      </View>

      {/* Info Text */}
      <Text style={styles.infoText}>
        Linking a social account allows you to sign in to KabLUX with ease. We will not use your
        social account for anything else without your permission.
      </Text>

      {/* Invite Friends Button */}
      <TouchableOpacity style={styles.inviteButton} onPress={InviteFriends}>
        <Text style={styles.inviteText}>Invite Friends</Text>
      </TouchableOpacity>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={changePasswordModalVisible}
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity 
                onPress={() => {
                  setChangePasswordModalVisible(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setErrors({});
                }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={[styles.input, errors.currentPassword && styles.inputError]}
                  placeholder="Enter current password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={passwordData.currentPassword}
                  onChangeText={(text) => updatePasswordField('currentPassword', text)}
                />
                {errors.currentPassword && (
                  <Text style={styles.errorText}>{errors.currentPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={[styles.input, errors.newPassword && styles.inputError]}
                  placeholder="Enter new password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={passwordData.newPassword}
                  onChangeText={(text) => updatePasswordField('newPassword', text)}
                />
                {errors.newPassword && (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm new password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => updatePasswordField('confirmPassword', text)}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              <Text style={styles.passwordRequirements}>
                Password must contain at least 8 characters with uppercase, lowercase, number, and special character.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setChangePasswordModalVisible(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setErrors({});
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set up Passkeys Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passkeysModalVisible}
        onRequestClose={() => setPasskeysModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set up Passkeys</Text>
              <TouchableOpacity onPress={() => setPasskeysModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Feather name="key" size={48} color="#FFC107" style={styles.modalIcon} />
              <Text style={styles.modalDescription}>
                Passkeys allow you to sign in securely using biometric authentication like Face ID or Touch ID, without needing to remember passwords.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setPasskeysModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Not Now</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSetUpPasskeys}
                >
                  <Text style={styles.saveButtonText}>Set up Passkey</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Link Google Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={linkGoogleModalVisible}
        onRequestClose={() => setLinkGoogleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link Google Account</Text>
              <TouchableOpacity onPress={() => setLinkGoogleModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <FontAwesome name="google" size={48} color="#FFC107" style={styles.modalIcon} />
              <Text style={styles.modalDescription}>
                Link your Google account to sign in to KabLUX quickly and securely. We will only use this for authentication purposes.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setLinkGoogleModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]}
                  onPress={handleLinkGoogle}
                >
                  <Text style={styles.saveButtonText}>Link Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'black',
    gap: 20,
  },
  text: {
    fontSize: 30,
    color: 'white',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    backgroundColor: '#04223A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowText: {
    color: 'white',
    fontSize: 15,
    marginLeft: 10,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFC107',
    opacity: 0.5,
    marginHorizontal: 16,
  },
  infoText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 40,
  },
  inviteButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 'auto'
  },
  inviteText: {
    color: '#04223A',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#04223A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  passwordRequirements: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  saveButton: {
    backgroundColor: '#FFC107',
  },
  cancelButtonText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#04223A',
    fontSize: 16,
    fontWeight: '600',
  },
});