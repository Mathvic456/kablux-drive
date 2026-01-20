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
  Dimensions 
} from 'react-native';
import { MaterialIcons, FontAwesome5, Feather, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLogoutEndPoint } from '../../services/auth.service';
import { useProfile } from '../../services/profile.service';
import { SocketContext } from '../../context/WebSocketProvider';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CentralModal from '../components/CentralModal';
import Platform from 'react-native/Libraries/Utilities/Platform';


export default function Account() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;

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
      <View style={[styles.loadingContainer, { height }]}>
        <ActivityIndicator 
          size={isSmallScreen ? "large" : "large"} 
          color="#facc15" 
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.errorContainer, { height }]}>
        <Text style={[
          styles.errorText,
          isSmallScreen && styles.errorTextSmall,
          isLargeScreen && styles.errorTextLarge
        ]}>
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
        <Text style={[
          styles.header,
          isSmallScreen && styles.headerSmall,
          isLargeScreen && styles.headerLarge,
          isTablet && styles.headerTablet
        ]}>
          Account
        </Text>

        {/* Profile Section */}
        <View style={[
          styles.profileSection,
          isSmallScreen && styles.profileSectionSmall,
          isLargeScreen && styles.profileSectionLarge
        ]}>
          <Image
            source={require('../../assets/Profileimg.png')}
            style={[
              styles.profileImage,
              isSmallScreen && styles.profileImageSmall,
              isLargeScreen && styles.profileImageLarge
            ]}
          />
          <View style={[
            styles.profileInfo,
            isSmallScreen && styles.profileInfoSmall,
            isLargeScreen && styles.profileInfoLarge
          ]}>
            <Text style={[
              styles.profileName,
              isSmallScreen && styles.profileNameSmall,
              isLargeScreen && styles.profileNameLarge
            ]}>
              {profile.first_name} {profile.last_name}
            </Text>
            <View style={styles.ratingRow}>
              <Text style={[
                styles.ratingText,
                isSmallScreen && styles.ratingTextSmall,
                isLargeScreen && styles.ratingTextLarge
              ]}>
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
        <View style={[
          styles.box,
          isSmallScreen && styles.boxSmall,
          isLargeScreen && styles.boxLarge,
          isTablet && styles.boxTablet
        ]}>
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
        <View style={[
          styles.box,
          isSmallScreen && styles.boxSmall,
          isLargeScreen && styles.boxLarge,
          isTablet && styles.boxTablet
        ]}>
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
const MenuItem = ({ icon, label, onPress, isLogout, isSmallScreen, isLargeScreen }) => (
  <TouchableOpacity 
    style={[
      styles.row,
      isSmallScreen && styles.rowSmall,
      isLargeScreen && styles.rowLarge
    ]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon}
    <Text style={[
      styles.rowText,
      isSmallScreen && styles.rowTextSmall,
      isLargeScreen && styles.rowTextLarge,
      isLogout && styles.logoutRowText
    ]}>
      {label}
    </Text>
    <Entypo 
      name="chevron-right" 
      size={isSmallScreen ? 16 : 18} 
      color={isLogout ? "#ff4444" : "#FFC107"} 
      style={{ marginLeft: 'auto' }} 
    />
  </TouchableOpacity>
);

const Divider = ({ isSmallScreen, isLargeScreen }) => (
  <View style={[
    styles.divider,
    isSmallScreen && styles.dividerSmall,
    isLargeScreen && styles.dividerLarge
  ]} />
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
  errorText: {
    color: 'red',
    fontSize: width * 0.04,
  },
  errorTextSmall: {
    fontSize: width * 0.038,
  },
  errorTextLarge: {
    fontSize: width * 0.042,
  },
  header: {
    color: 'white',
    fontSize: width * 0.08,
    fontWeight: '700',
    marginBottom: height * 0.02,
  },
  headerSmall: {
    fontSize: width * 0.075,
    marginBottom: height * 0.015,
  },
  headerLarge: {
    fontSize: width * 0.085,
    marginBottom: height * 0.025,
  },
  headerTablet: {
    fontSize: width * 0.09,
    textAlign: 'center',
  },
  profileSection: {
    // marginBottom: height * 0.03,
    // flexDirection: 'row',
    // alignItems: 'center',
    // alignSelf:'center',
    // borderWidth: 1,
    // borderColor: 'white',
    padding: 10,
    borderRadius: 12,
  },
  profileSectionSmall: {
    marginBottom: height * 0.025,
  },
  profileSectionLarge: {
    marginBottom: height * 0.035,
  },
  profileImage: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    marginRight: width * 0.04,
    alignSelf:'center',
    // borderWidth: 1,
    // borderColor: 'white',
    padding: 10,
    borderRadius: 12,
  },
  profileInfo: {
    flex: 1,
    alignSelf:'center',
  },
  profileInfoSmall: {
    marginLeft: width * 0.03,
  },
  profileInfoLarge: {
    marginLeft: width * 0.05,
  },
  profileName: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: '600',
    marginBottom: height * 0.005,
  },
  profileNameSmall: {
    fontSize: width * 0.042,
  },
  profileNameLarge: {
    fontSize: width * 0.048,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFC107',
    fontSize: width * 0.038,
    fontWeight: '500',
    marginRight: width * 0.01,
  },
  ratingTextSmall: {
    fontSize: width * 0.036,
  },
  ratingTextLarge: {
    fontSize: width * 0.04,
  },
  box: {
    backgroundColor: '#04223A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: width * 0.04,
    marginBottom: height * 0.025,
    width: '100%',
  },
  boxSmall: {
    borderRadius: width * 0.035,
    marginBottom: height * 0.02,
  },
  boxLarge: {
    borderRadius: width * 0.045,
    marginBottom: height * 0.03,
  },
  boxTablet: {
    maxWidth: 500,
    alignSelf: 'center',
  },
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
  rowTextSmall: {
    fontSize: width * 0.038,
    marginLeft: width * 0.025,
  },
  rowTextLarge: {
    fontSize: width * 0.042,
    marginLeft: width * 0.035,
  },
  logoutRowText: {
    color: '#ff4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFC107',
    opacity: 0.5,
    marginHorizontal: width * 0.04,
  },
  dividerSmall: {
    marginHorizontal: width * 0.035,
  },
  dividerLarge: {
    marginHorizontal: width * 0.045,
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