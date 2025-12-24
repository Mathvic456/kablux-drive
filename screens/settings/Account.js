import React, { useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, FontAwesome5, Feather, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLogoutEndPoint } from '../../services/auth.service';
import { useProfile } from '../../services/profile.service';
import { SocketContext } from '../../context/WebSocketProvider';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CentralModal from '../components/CentralModal';

export default function Account() {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const { data: profile, isPending, isError } = useProfile();
  const { clearTokens } = useAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutEndPoint(clearTokens);
  const { socket } = useContext(SocketContext);

  const LoginAndSecurity = () => {
    navigation.navigate('LoginAndSecurity');
  }

  const PersonalInfo = () => {
    navigation.navigate('PersonalInfo');
  }

  const Settings = () => {
    navigation.navigate('Settings');
  }

  const Safety = () => {
    navigation.navigate('SafetyActions');
  }

  const City = () => {
    navigation.navigate('City');
  }

  const ReferAndEarn = () => {
    navigation.navigate('ReferAndEarn');
  }

  const HelpAndSupport = () => {
    navigation.navigate('HelpAndSupport');
  }

  const Legal = () => {
    navigation.navigate('Legal');
  }

  const handleLogout = async () => {
    console.log("🚪 Starting logout process...");

    // Close WebSocket connection first
    if (socket) {
      console.log("🔌 Closing WebSocket connection...");
      socket.close(1000, "User logged out");
    }

    // Call logout mutation which will:
    // 1. Clear tokens through AuthContext (both Context and AsyncStorage)
    // 2. Clear other non-auth data (like userId, pendingEmail)
    logout(undefined, {
      onSuccess: () => {
        console.log("✅ Logout successful");
        setModalVisible(false);
        
        // Navigate to login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      },
      onError: async (error) => {
        console.error("❌ Logout error:", error);
        
        // Even if API fails, still clear local data and navigate
        try {
          await AsyncStorage.removeItem('userId');
          await AsyncStorage.removeItem('pendingEmail');
          setModalVisible(false);
          
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } catch (cleanupError) {
          console.error("❌ Cleanup failed:", cleanupError);
        }
      }
    });
  };

  if (isPending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading profile</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header */}
        <Text style={styles.header}>Account</Text>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={require('../../assets/Profileimg.png')}
            style={styles.profileImage}
          />
          <View style={{ alignItems: 'left' }}>
            <Text style={styles.profileName}>{profile.first_name} {profile.last_name}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>4.99 </Text>
              <FontAwesome5 name="star" size={14} color="#FFC107" />
            </View>
          </View>
        </View>

        {/* First Box: Personal Info / Security */}
        <View style={styles.box}>
          <TouchableOpacity style={styles.row} onPress={PersonalInfo}>
            <MaterialIcons name="person-outline" size={20} color="#FFC107" />
            <Text style={styles.rowText}>Personal info</Text>
            <Entypo name="chevron-right" size={18} color="#FFC107" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={LoginAndSecurity}>
            <Feather name="lock" size={20} color="#FFC107" />
            <Text style={styles.rowText}>Login & security</Text>
            <Entypo name="chevron-right" size={18} color="#FFC107" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Second Box: Settings, Safety, etc. */}
        <View style={styles.box}>
          <MenuItem onPress={Settings} icon={<Feather name="settings" size={20} color="#FFC107" />} label="Settings" />
          <Divider />
          <MenuItem onPress={Safety} icon={<Feather name="shield" size={20} color="#FFC107" />} label="Safety" />
          <Divider />
          <MenuItem onPress={City} icon={<Entypo name="location-pin" size={20} color="#FFC107" />} label="City" />
          <Divider />
          <MenuItem onPress={ReferAndEarn} icon={<Feather name="gift" size={20} color="#FFC107" />} label="Refer & Earn" />
          <Divider />
          <MenuItem onPress={HelpAndSupport} icon={<Feather name="help-circle" size={20} color="#FFC107" />} label="Help & Support" />
          <Divider />
          <MenuItem onPress={Legal} icon={<Feather name="file-text" size={20} color="#FFC107" />} label="Legal" />
          <Divider />
          <MenuItem onPress={() => setModalVisible(true)} icon={<Feather name="log-out" size={20} color="#ff4444" />} label="Log Out" isLogout />
        </View>
      </ScrollView>

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
    </>
  );
}

/* --- Small Components --- */
const MenuItem = ({ icon, label, onPress, isLogout }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    {icon}
    <Text style={[styles.rowText, isLogout && styles.logoutRowText]}>{label}</Text>
    <Entypo name="chevron-right" size={18} color={isLogout ? "#ff4444" : "#FFC107"} style={{ marginLeft: 'auto' }} />
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingLeft: 30,
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
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  header: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  profileSection: {
    marginBottom: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '500',
  },
  box: {
    backgroundColor: '#04223A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 16,
    marginBottom: 25,
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
  logoutRowText: {
    color: '#ff4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFC107',
    opacity: 0.5,
    marginHorizontal: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333',
    width: '85%',
  },
  modalIconContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonCancel: {
    backgroundColor: '#333',
  },
  buttonLogout: {
    backgroundColor: '#ff4444',
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});