import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'

// Only import permissions that work in Expo Go
import * as Location from 'expo-location'
import * as LocalAuthentication from 'expo-local-authentication'

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
  const [expoGoMode, setExpoGoMode] = useState(true)

  // Check available permissions on component mount
  useEffect(() => {
    checkAvailablePermissions()
  }, [])

  const checkAvailablePermissions = async () => {
    setLoading(prev => ({ ...prev, checking: true }))

    try {
      // Check Location Permission (works in Expo Go)
      try {
        const locationStatus = await Location.getForegroundPermissionsAsync()
        setPermissions(prev => ({
          ...prev,
          location: locationStatus.granted
        }))
      } catch (error) {
        console.log('Location permission check failed:', error)
      }

      // Check Biometric Availability (works in Expo Go)
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

      // For other permissions in Expo Go, we'll simulate the state
      // since we can't actually check them in Expo Go
      setPermissions(prev => ({
        ...prev,
        notifications: false,
        camera: false,
        microphone: false,
        storage: false,
        contacts: false,
      }))

    } catch (error) {
      console.error('Error checking permissions:', error)
    } finally {
      setLoading(prev => ({ ...prev, checking: false }))
    }
  }

  const handlePermissionToggle = async (permissionType, requested) => {
    if (loading[permissionType]) return

    setLoading(prev => ({ ...prev, [permissionType]: true }))

    try {
      switch (permissionType) {
        case 'notifications':
          if (requested) {
            Alert.alert(
              "Enable Notifications",
              "To enable notifications, you need to create a development build. Expo Go has limited notification support.",
              [
                { text: "Learn More", onPress: () => Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/') },
                { text: "OK" }
              ]
            )
          }
          // Simulate state change for demo
          setPermissions(prev => ({ ...prev, notifications: requested }))
          break

        case 'location':
          if (requested) {
            const result = await Location.requestForegroundPermissionsAsync()
            setPermissions(prev => ({ ...prev, location: result.granted }))
            
            if (!result.granted) {
              Alert.alert(
                "Location Permission Denied",
                "To use location features, please enable location permissions in your device settings.",
                [
                  { text: "Open Settings", onPress: () => Linking.openSettings() },
                  { text: "Cancel" }
                ]
              )
            }
          } else {
            setPermissions(prev => ({ ...prev, location: false }))
          }
          break

        case 'camera':
          Alert.alert(
            "Camera Access",
            "Camera permissions require a development build for full functionality in Expo.",
            [
              { text: "Learn More", onPress: () => Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/') },
              { text: "OK", onPress: () => setPermissions(prev => ({ ...prev, camera: requested })) }
            ]
          )
          break

        case 'microphone':
          Alert.alert(
            "Microphone Access",
            "Microphone permissions require a development build. Expo AV is deprecated, use expo-audio instead.",
            [
              { text: "Learn More", onPress: () => Linking.openURL('https://docs.expo.dev/versions/latest/sdk/audio/') },
              { text: "OK", onPress: () => setPermissions(prev => ({ ...prev, microphone: requested })) }
            ]
          )
          break

        case 'storage':
          Alert.alert(
            "Storage Access",
            "Media library access requires a development build in newer Expo versions.",
            [
              { text: "Learn More", onPress: () => Linking.openURL('https://docs.expo.dev/develop/development-builds/create-a-build/') },
              { text: "OK", onPress: () => setPermissions(prev => ({ ...prev, storage: requested })) }
            ]
          )
          break

        case 'contacts':
          Alert.alert(
            "Contacts Access",
            "Contacts permissions require a development build for full functionality.",
            [
              { text: "Learn More", onPress: () => Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/') },
              { text: "OK", onPress: () => setPermissions(prev => ({ ...prev, contacts: requested })) }
            ]
          )
          break

        case 'biometric':
          if (requested) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Enable Biometric Login',
              fallbackLabel: 'Use Passcode',
            })
            if (result.success) {
              setPermissions(prev => ({ ...prev, biometric: true }))
              Alert.alert("Success", "Biometric login has been enabled!")
            } else {
              setPermissions(prev => ({ ...prev, biometric: false }))
            }
          } else {
            setPermissions(prev => ({ ...prev, biometric: false }))
          }
          break

        default:
          break
      }

    } catch (error) {
      console.error(`Error with ${permissionType} permission:`, error)
      Alert.alert("Limitation", `This permission requires a development build for full functionality.`)
      
      // Still update UI for demo purposes
      if (permissionType !== 'location' && permissionType !== 'biometric') {
        setPermissions(prev => ({ ...prev, [permissionType]: requested }))
      }
    } finally {
      setLoading(prev => ({ ...prev, [permissionType]: false }))
    }
  }

  const PermissionToggle = ({ icon, title, description, permissionType, expoGoWarning = false }) => (
    <View style={styles.permissionItem}>
      <View style={styles.permissionInfo}>
        <View style={styles.iconTitle}>
          <Ionicons name={icon} size={22} color="#FFD700" />
          <Text style={styles.permissionTitle}>{title}</Text>
          {expoGoWarning && (
            <View style={styles.expoGoBadge}>
              <Text style={styles.expoGoBadgeText}>Dev Build</Text>
            </View>
          )}
        </View>
        <Text style={styles.permissionDescription}>{description}</Text>
        {expoGoWarning && (
          <Text style={styles.expoGoWarning}>
            Requires development build in Expo
          </Text>
        )}
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
            <Text style={styles.headerTitle}>App Permissions</Text>
            <View style={styles.expoGoBanner}>
              <Ionicons name="information-circle" size={16} color="#FFD700" />
              <Text style={styles.expoGoBannerText}>Expo Go Mode</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Manage what this app can access on your device
          </Text>
          
          {/* <TouchableOpacity 
            style={styles.refreshButton}
            onPress={checkAvailablePermissions}
            disabled={loading.checking}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={loading.checking ? "#888" : "#FFD700"} 
            />
            <Text style={styles.refreshText}>
              {loading.checking ? "Checking..." : "Refresh Permissions"}
            </Text>
          </TouchableOpacity> */}
        </View>

        {/* Permissions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Permissions</Text>
          
          <PermissionToggle
            icon="notifications-outline"
            title="Push Notifications"
            description="Receive ride updates, promotions and important alerts"
            permissionType="notifications"
            expoGoWarning={true}
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
            expoGoWarning={true}
          />

          <PermissionToggle
            icon="mic-outline"
            title="Microphone Access"
            description="For voice commands and in-app calls"
            permissionType="microphone"
            expoGoWarning={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          
          <PermissionToggle
            icon="folder-outline"
            title="Storage Access"
            description="Save ride receipts and app data locally"
            permissionType="storage"
            expoGoWarning={true}
          />

          <PermissionToggle
            icon="people-outline"
            title="Contacts Access"
            description="Find friends and share ride details"
            permissionType="contacts"
            expoGoWarning={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <PermissionToggle
            icon="finger-print-outline"
            title="Biometric Login"
            description="Use fingerprint or face ID for faster login"
            permissionType="biometric"
          />
        </View>

        {/* Development Build Info */}
        <View style={styles.devBuildInfo}>
          <Ionicons name="rocket-outline" size={24} color="#FFD700" />
          <View style={styles.devBuildText}>
            <Text style={styles.devBuildTitle}>Ready for Production?</Text>
            <Text style={styles.devBuildDescription}>
              Create a development build to test all permissions and access native device features.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.devBuildButton}
            onPress={() => Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/')}
          >
            <Text style={styles.devBuildButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  expoGoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  expoGoBannerText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  refreshText: {
    color: '#FFD700',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
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
    flexWrap: 'wrap',
  },
  permissionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 8,
  },
  expoGoBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expoGoBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
  permissionDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 18,
    paddingLeft: 34,
  },
  expoGoWarning: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    paddingLeft: 34,
    fontStyle: 'italic',
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
  devBuildInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    marginTop: 10,
  },
  devBuildText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  devBuildTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  devBuildDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 18,
  },
  devBuildButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  devBuildButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
})