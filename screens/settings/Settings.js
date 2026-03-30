import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import CentralModal from '../components/CentralModal'
import { useNavigation } from '@react-navigation/native';

import * as Location from 'expo-location'
import * as LocalAuthentication from 'expo-local-authentication'

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

export default function Settings() {
  const [permissions, setPermissions] = useState({
    notifications: false,
    location: false,
    camera: false,
    microphone: false,
    storage: false,
    contacts: false,
    biometric: false,
  })

  const [loading, setLoading] = useState({})
  const [alertModalVisible, setAlertModalVisible] = useState(false)
  const [alertData, setAlertData] = useState({ title: '', message: '', action: null })
  const navigation = useNavigation()

  const goBack = () => { navigation.goBack(); }

  useEffect(() => {
    checkAvailablePermissions()
  }, [])

  const checkAvailablePermissions = async () => {
    try {
      try {
        const locationStatus = await Location.getForegroundPermissionsAsync()
        setPermissions(prev => ({ ...prev, location: locationStatus.granted }))
      } catch (error) {
        console.log('Location permission check failed:', error)
      }

      try {
        const biometricAvailable = await LocalAuthentication.hasHardwareAsync()
        const biometricEnrolled = await LocalAuthentication.isEnrolledAsync()
        setPermissions(prev => ({
          ...prev,
          biometric: biometricAvailable && biometricEnrolled
        }))
      } catch (error) {
        console.log('Biometric check failed:', error)
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  const handlePermissionToggle = async (permissionType, requested) => {
    if (loading[permissionType]) return

    setLoading(prev => ({ ...prev, [permissionType]: true }))

    try {
      switch (permissionType) {
        case 'location':
          if (requested) {
            const result = await Location.requestForegroundPermissionsAsync()
            setPermissions(prev => ({ ...prev, location: result.granted }))
            if (!result.granted) {
              setAlertData({
                title: "Location Permission Denied",
                message: "To use location features, please enable location permissions in your device settings.",
                action: () => Linking.openSettings()
              });
              setAlertModalVisible(true);
            }
          } else {
            setPermissions(prev => ({ ...prev, location: false }))
          }
          break

        case 'biometric':
          if (requested) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Enable Biometric Login',
              fallbackLabel: 'Use Passcode',
            })
            if (result.success) {
              setPermissions(prev => ({ ...prev, biometric: true }))
              setAlertData({
                title: "Success",
                message: "Biometric login has been enabled!"
              });
              setAlertModalVisible(true);
            } else {
              setPermissions(prev => ({ ...prev, biometric: false }))
            }
          } else {
            setPermissions(prev => ({ ...prev, biometric: false }))
          }
          break

        default:
          setPermissions(prev => ({ ...prev, [permissionType]: requested }))
          break
      }
    } catch (error) {
      console.error(`Error with ${permissionType} permission:`, error)
      setPermissions(prev => ({ ...prev, [permissionType]: requested }))
    } finally {
      setLoading(prev => ({ ...prev, [permissionType]: false }))
    }
  }

  const PermissionToggle = ({ icon, title, description, permissionType }) => (
    <View style={styles.permissionItem}>
      <View style={styles.permissionInfo}>
        <View style={styles.iconTitle}>
          <Ionicons name={icon} size={22} color="#FFD700" />
          <Text style={styles.permissionTitle}>{title}</Text>
        </View>
        <Text style={styles.permissionDescription}>{description}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.toggleContainer,
          permissions[permissionType] && styles.toggleActive,
          loading[permissionType] && styles.toggleDisabled
        ]}
        onPress={() => handlePermissionToggle(permissionType, !permissions[permissionType])}
        disabled={loading[permissionType]}
      >
        <View
          style={[
            styles.toggleCircle,
            permissions[permissionType] ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
            loading[permissionType] && styles.toggleCircleDisabled
          ]}
        >
          <Text style={styles.toggleText}>
            {loading[permissionType] ? "..." : permissions[permissionType] ? "ON" : "OFF"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back-circle" size={isSmallScreen ? 28 : 32} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>App Permissions</Text>
            <View />
          </View>
          <Text style={styles.headerSubtitle}>
            Manage what this app can access on your device
          </Text>
        </View>

        {/* Permissions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Permissions</Text>

          <PermissionToggle
            icon="notifications-outline"
            title="Push Notifications"
            description="Receive ride updates, promotions and important alerts"
            permissionType="notifications"
          />

          <PermissionToggle
            icon="location-outline"
            title="Location Access"
            description="Required for finding nearby rides and navigation"
            permissionType="location"
          />

          <PermissionToggle
            icon="camera-outline"
            title="Camera Access"
            description="For profile pictures and document verification"
            permissionType="camera"
          />

          <PermissionToggle
            icon="mic-outline"
            title="Microphone Access"
            description="For voice commands and in-app calls"
            permissionType="microphone"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <PermissionToggle
            icon="folder-outline"
            title="Storage Access"
            description="Save ride receipts and app data locally"
            permissionType="storage"
          />

          {/* <PermissionToggle
            icon="people-outline"
            title="Contacts Access"
            description="Find friends and share ride details"
            permissionType="contacts"
          /> */}
        </View>

        <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>Security</Text> */}

          {/* <PermissionToggle
            icon="finger-print-outline"
            title="Biometric Login"
            description="Use fingerprint or face ID for faster login"
            permissionType="biometric"
          /> */}
        </View>
      </View>

      <CentralModal
        visible={alertModalVisible}
        onClose={() => setAlertModalVisible(false)}
        title={alertData.title}
        subText={alertData.message}
        icon={alertData.action ? "information-circle" : "checkmark-circle"}
        confirmText={alertData.action ? "Open Settings" : "OK"}
        closeText=""
        onConfirm={() => {
          if (alertData.action) {
            alertData.action();
          }
          setAlertModalVisible(false);
        }}
        confirmButtonColor="#FCB71F"
        themeColor={alertData.action ? "#FFA500" : "#4CAF50"}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#000000',
    gap: 30,
  },
  header: {
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },
  section: {
    gap: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  permissionInfo: {
    flex: 1,
    marginRight: 15,
  },
  iconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  permissionDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 18,
    paddingLeft: 34,
  },
  toggleContainer: {
    width: 70,
    height: 35,
    backgroundColor: "#1c1c1c",
    borderRadius: 20,
    justifyContent: "center",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  toggleActive: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleCircle: {
    width: "50%",
    height: "80%",
    backgroundColor: "#333",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleCircleDisabled: {
    backgroundColor: "#555",
  },
  toggleText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
})