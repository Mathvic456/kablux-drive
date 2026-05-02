import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Linking, Dimensions
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import CentralModal from '../components/CentralModal'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { Camera } from 'expo-camera'
import { Audio } from 'expo-av'
import * as MediaLibrary from 'expo-media-library'

const { width } = Dimensions.get('window')
const isSmallScreen = width < 375
const STORAGE_KEY = '@app_permissions'

export default function Settings() {
  const [permissions, setPermissions] = useState({
    notifications: false,
    location: false,
    camera: false,
    microphone: false,
    storage: false,
  })

  const [loading, setLoading] = useState({})
  const [alertModalVisible, setAlertModalVisible] = useState(false)
  const [alertData, setAlertData] = useState({ title: '', message: '', action: null })
  const navigation = useNavigation()

  const goBack = () => navigation.goBack()

  useEffect(() => {
    checkAllPermissions()
  }, [])

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(permissions)).catch(console.error)
  }, [permissions])

  const checkAllPermissions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored) setPermissions(JSON.parse(stored))
    } catch (_) { }

    const updates = {}

    try {
      const loc = await Location.getForegroundPermissionsAsync()
      updates.location = loc.granted
    } catch (_) { }

    try {
      const notif = await Notifications.getPermissionsAsync()
      updates.notifications = notif.granted
    } catch (_) { }

    try {
      const cam = await Camera.getCameraPermissionsAsync()
      updates.camera = cam.granted
    } catch (_) { }

    try {
      const mic = await Audio.getPermissionsAsync()
      updates.microphone = mic.granted
    } catch (_) { }

    try {
      const media = await MediaLibrary.getPermissionsAsync()
      updates.storage = media.granted
    } catch (_) { }

    setPermissions(prev => ({ ...prev, ...updates }))
  }

  const showSettingsAlert = (title, message) => {
    setAlertData({ title, message, action: () => Linking.openSettings() })
    setAlertModalVisible(true)
  }

  const handlePermissionToggle = async (permissionType, requested) => {
    if (loading[permissionType]) return
    setLoading(prev => ({ ...prev, [permissionType]: true }))

    try {
      switch (permissionType) {

        case 'notifications': {
          if (requested) {
            const { granted, canAskAgain } = await Notifications.requestPermissionsAsync()
            setPermissions(prev => ({ ...prev, notifications: granted }))
            if (!granted) {
              showSettingsAlert(
                'Notifications Denied',
                canAskAgain ? 'Notification permission was denied.' : 'Please enable notifications in your device settings.'
              )
            }
          } else {
            setPermissions(prev => ({ ...prev, notifications: false }))
            showSettingsAlert('Disable Notifications', 'To turn off notifications, please go to your device settings.')
          }
          break
        }

        case 'location': {
          if (requested) {
            const { granted, canAskAgain } = await Location.requestForegroundPermissionsAsync()
            setPermissions(prev => ({ ...prev, location: granted }))
            if (!granted) {
              showSettingsAlert(
                'Location Denied',
                canAskAgain ? 'Location permission was denied.' : 'Please enable location access in your device settings.'
              )
            }
          } else {
            setPermissions(prev => ({ ...prev, location: false }))
            showSettingsAlert('Disable Location', 'To revoke location access, please go to your device settings.')
          }
          break
        }

        case 'camera': {
          if (requested) {
            const { granted, canAskAgain } = await Camera.requestCameraPermissionsAsync()
            setPermissions(prev => ({ ...prev, camera: granted }))
            if (!granted) {
              showSettingsAlert(
                'Camera Denied',
                canAskAgain ? 'Camera permission was denied.' : 'Please enable camera access in your device settings.'
              )
            }
          } else {
            setPermissions(prev => ({ ...prev, camera: false }))
            showSettingsAlert('Disable Camera', 'To revoke camera access, please go to your device settings.')
          }
          break
        }

        case 'microphone': {
          if (requested) {
            const { granted, canAskAgain } = await Audio.requestPermissionsAsync()
            setPermissions(prev => ({ ...prev, microphone: granted }))
            if (!granted) {
              showSettingsAlert(
                'Microphone Denied',
                canAskAgain ? 'Microphone permission was denied.' : 'Please enable microphone access in your device settings.'
              )
            }
          } else {
            setPermissions(prev => ({ ...prev, microphone: false }))
            showSettingsAlert('Disable Microphone', 'To revoke microphone access, please go to your device settings.')
          }
          break
        }

        case 'storage': {
          if (requested) {
            const { granted, canAskAgain } = await MediaLibrary.requestPermissionsAsync()
            setPermissions(prev => ({ ...prev, storage: granted }))
            if (!granted) {
              showSettingsAlert(
                'Storage Denied',
                canAskAgain ? 'Storage permission was denied.' : 'Please enable storage access in your device settings.'
              )
            }
          } else {
            setPermissions(prev => ({ ...prev, storage: false }))
            showSettingsAlert('Disable Storage', 'To revoke storage access, please go to your device settings.')
          }
          break
        }

        default:
          setPermissions(prev => ({ ...prev, [permissionType]: requested }))
      }
    } catch (error) {
      console.error(`Error with ${permissionType} permission:`, error)
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
          loading[permissionType] && styles.toggleDisabled,
        ]}
        onPress={() => handlePermissionToggle(permissionType, !permissions[permissionType])}
        disabled={loading[permissionType]}
      >
        <View
          style={[
            styles.toggleCircle,
            permissions[permissionType] ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
            loading[permissionType] && styles.toggleCircleDisabled,
          ]}
        >
          <Text style={styles.toggleText}>
            {loading[permissionType] ? '...' : permissions[permissionType] ? 'ON' : 'OFF'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
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
        </View>
      </View>

      <CentralModal
        visible={alertModalVisible}
        onClose={() => setAlertModalVisible(false)}
        title={alertData.title}
        subText={alertData.message}
        icon="information-circle"
        confirmText="Open Settings"
        closeText=""
        onConfirm={() => {
          if (alertData.action) alertData.action()
          setAlertModalVisible(false)
        }}
        confirmButtonColor="#FCB71F"
        themeColor="#FFA500"
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#000000', gap: 30 },
  header: { marginBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { color: 'white', fontSize: 28, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, lineHeight: 22, marginBottom: 15 },
  section: { gap: 20, marginBottom: 30 },
  sectionTitle: { color: '#FFD700', fontSize: 18, fontWeight: '600', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 215, 0, 0.3)' },
  permissionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#1C1C1E', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  permissionInfo: { flex: 1, marginRight: 15 },
  iconTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  permissionTitle: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 12 },
  permissionDescription: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, lineHeight: 18, paddingLeft: 34 },
  toggleContainer: { width: 70, height: 35, backgroundColor: '#1c1c1c', borderRadius: 20, justifyContent: 'center', paddingHorizontal: 4, marginTop: 4 },
  toggleActive: { backgroundColor: 'rgba(255, 215, 0, 0.2)' },
  toggleDisabled: { opacity: 0.5 },
  toggleCircle: { width: '50%', height: '80%', backgroundColor: '#333', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  toggleCircleDisabled: { backgroundColor: '#555' },
  toggleText: { color: 'white', fontSize: 10, fontWeight: '600' },
})