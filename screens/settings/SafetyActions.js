import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Linking, Platform, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Feather, Entypo, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as MailComposer from 'expo-mail-composer';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isLargeScreen = width > 768;

export default function SafetyActions() {
  const navigation = useNavigation();
  const [recordingModalVisible, setRecordingModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingDurationRef = useRef(0);
  const recordingIntervalRef = useRef(null);

  const goBack = () => { navigation.goBack(); }

  // Email Functions
  const sendEmail = async (subject, body = '') => {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert(
          'Email Not Available',
          'No email client is available on this device.',
          [{ text: 'OK' }]
        );
        return;
      }

      await MailComposer.composeAsync({
        recipients: ['hello@kabluxe.com'],
        subject: subject,
        body: body,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert(
        'Error',
        'Failed to open email client. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMessageSupport = () => {
    sendEmail('Support', 'Hello KabLux Support,\n\nI need assistance with:\n\n');
  };

  const handleReportIssue = () => {
    sendEmail('Driver Issue Report', 'Hello KabLux Support,\n\nI am reporting an issue with a customer:\n\n');
  };

  // Phone Call Function
  const handleCallPolice = () => {
    Alert.alert(
      'Call Police',
      'Do you want to call the emergency police line?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            const phoneNumber = '+2347062391997';
            const phoneUrl = Platform.select({
              ios: `telprompt:${phoneNumber}`,
              android: `tel:${phoneNumber}`,
              default: `tel:${phoneNumber}`
            });
            
            Linking.openURL(phoneUrl).catch(err => {
              console.error('Error making call:', err);
              Alert.alert('Error', 'Failed to make phone call. Please try again.');
            });
          }
        }
      ]
    );
  };

  // Location Sharing Function
  const handleShareLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to share your location.',
          [{ text: 'OK' }]
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      const mapsUrl = Platform.select({
        ios: `https://maps.apple.com/?ll=${latitude},${longitude}&q=My+Location`,
        android: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      });

      const message = `Please this is my current location: ${mapsUrl}`;
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          'Share Location',
          `WhatsApp is not installed. Copy this link to share:\n\n${mapsUrl}`,
          [
            { 
              text: 'Copy', 
              onPress: async () => {
                try {
                  // Using expo-clipboard if available
                  if (Platform.OS !== 'web') {
                    const { default: Clipboard } = await import('expo-clipboard');
                    await Clipboard.setStringAsync(mapsUrl);
                    Alert.alert('Success', 'Link copied to clipboard!');
                  } else {
                    Alert.alert('Link Ready', 'Please copy the URL from above.');
                  }
                } catch (err) {
                  Alert.alert('Link Ready', 'Please copy the URL from above.');
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Error',
        'Unable to get your location. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Audio Recording Functions
  const startRecording = async () => {
    try {
      // Request permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Audio recording permission is required.');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      
      // Start duration timer
      recordingDurationRef.current = 0;
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(recordingDurationRef.current);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      await recording.stopAndUnloadAsync();
      
      // Get the recording URI
      const uri = recording.getURI();
      setRecordingUri(uri);
      
      // Save to device storage using the new Filesystem API
      await saveRecordingToStorage(uri);
      
      // Reset states
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;
      
      Alert.alert(
        'Recording Saved',
        'Audio recording has been saved to your device storage.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const saveRecordingToStorage = async (uri) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `kablux_recording_${timestamp}.m4a`;
      
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        try {
          // Get the document directory - FIXED: using proper FileSystem API
          const baseDirectory =
  FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
          if (!documentDirectory) {
            console.error('Document directory not available');
            return;
          }
          
          const directoryUri = `${documentDirectory}kablux_recordings/`;
          const newFileUri = `${directoryUri}${fileName}`;
          
          // Check if directory exists
          const dirInfo = await FileSystem.getInfoAsync(directoryUri);
          
          if (!dirInfo.exists) {
            // Create directory
            await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
          }
          
          // Move the recording to the new location
          await FileSystem.moveAsync({
            from: uri,
            to: newFileUri,
          });
          
          console.log('Recording saved to:', newFileUri);
        } catch (fsError) {
          console.error('Filesystem error:', fsError);
          // Fallback: Try using copyAsync instead
          try {
            const baseDirectory =
  FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
            const directoryUri = `${documentDirectory}kablux_recordings/`;
            const newFileUri = `${directoryUri}${fileName}`;
            
            // Create directory if it doesn't exist
            const dirInfo = await FileSystem.getInfoAsync(directoryUri);
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
            }
            
            // Copy the file
            await FileSystem.copyAsync({
              from: uri,
              to: newFileUri,
            });
            
            console.log('Recording copied to:', newFileUri);
          } catch (copyError) {
            console.error('Copy error:', copyError);
            console.log('Using original recording URI:', uri);
          }
        }
      }
    } catch (error) {
      console.error('Error saving recording:', error);
      // Don't show error to user, just log it
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openRecordingModal = () => {
    setRecordingModalVisible(true);
  };

  const closeRecordingModal = async () => {
    if (isRecording) {
      Alert.alert(
        'Stop Recording?',
        'You are currently recording. Do you want to stop and save?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Stop & Save', 
            onPress: async () => {
              await stopRecording();
              setRecordingModalVisible(false);
            }
          },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: async () => {
              if (recording) {
                await recording.stopAndUnloadAsync();
              }
              setRecording(null);
              setIsRecording(false);
              setRecordingDuration(0);
              if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
              }
              setRecordingModalVisible(false);
            }
          }
        ]
      );
    } else {
      setRecordingModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back-circle" size={isSmallScreen ? 28 : 32} color="white" />
        </TouchableOpacity>
        <Text style={styles.text}>Safety Actions</Text>
        <View style={{ width: isSmallScreen ? 20 : 24 }}></View>
      </View>

      <TouchableOpacity style={styles.row} onPress={handleMessageSupport}>
        <FontAwesome5 name="user-friends" size={isSmallScreen ? 18 : 20} color="#FFC107" />
        <Text style={styles.rowText}>Message KabLux support</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={handleReportIssue}>
        <Entypo name="warning" size={isSmallScreen ? 20 : 22} color="#FFC107" />
        <Text style={styles.rowText}>Report issue with customer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={handleCallPolice}>
        <MaterialIcons name="local-police" size={isSmallScreen ? 20 : 22} color="#FF4B4B" />
        <Text style={[styles.rowText, { color: "#FF4B4B" }]}>Call the Police</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={handleShareLocation}>
        <Feather name="share-2" size={isSmallScreen ? 18 : 20} color="#FFC107" />
        <Text style={styles.rowText}>Share Location</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={openRecordingModal}>
        <Feather name="mic-off" size={isSmallScreen ? 18 : 20} color="#FFC107" />
        <Text style={styles.rowText}>Record audio</Text>
      </TouchableOpacity>

      {/* Recording Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={recordingModalVisible}
        onRequestClose={closeRecordingModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audio Recorder</Text>
              <TouchableOpacity onPress={closeRecordingModal}>
                <Ionicons name="close-circle" size={28} color="#FFC107" />
              </TouchableOpacity>
            </View>

            <View style={styles.recordingInfo}>
              <Feather 
                name={isRecording ? "mic" : "mic-off"} 
                size={60} 
                color={isRecording ? "#FF4B4B" : "#FFC107"} 
              />
              
              <Text style={styles.recordingStatus}>
                {isRecording ? 'Recording...' : 'Ready to Record'}
              </Text>
              
              <Text style={styles.recordingTimer}>
                {formatTime(recordingDuration)}
              </Text>
              
              <Text style={styles.recordingHint}>
                {isRecording 
                  ? 'Recording in progress. Click stop when finished.' 
                  : 'Click the record button to start recording.'}
              </Text>
            </View>

            <View style={styles.recordingControls}>
              {isRecording ? (
                <TouchableOpacity 
                  style={[styles.controlButton, styles.stopButton]}
                  onPress={stopRecording}
                >
                  <Ionicons name="stop-circle" size={40} color="white" />
                  <Text style={styles.controlButtonText}>Stop Recording</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.controlButton, styles.recordButton]}
                  onPress={startRecording}
                >
                  <Ionicons name="mic-circle" size={40} color="white" />
                  <Text style={styles.controlButtonText}>Start Recording</Text>
                </TouchableOpacity>
              )}
            </View>

            {recordingUri && !isRecording && (
              <View style={styles.savedRecording}>
                <Text style={styles.savedText}>Last recording saved successfully</Text>
                <Feather name="check-circle" size={24} color="#4CAF50" />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: isSmallScreen ? 16 : isLargeScreen ? 30 : 20,
    paddingTop: isSmallScreen ? 40 : 50,
    backgroundColor: 'black',
    gap: isSmallScreen ? 20 : 30
  },
  text: {
    fontSize: isSmallScreen ? 24 : isLargeScreen ? 36 : 30,
    color: 'white',
    alignSelf: 'center',
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.7,
    borderBottomColor: "rgba(255, 193, 7, 0.4)",
    paddingVertical: isSmallScreen ? 14 : 18
  },
  rowText: {
    color: "white",
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: "500",
    marginLeft: isSmallScreen ? 10 : 12
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  recordingInfo: {
    alignItems: 'center',
    marginVertical: 30,
  },
  recordingStatus: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
    fontWeight: '600',
  },
  recordingTimer: {
    fontSize: 48,
    color: '#FFC107',
    fontWeight: 'bold',
    marginVertical: 20,
  },
  recordingHint: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  recordingControls: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    width: '100%',
    justifyContent: 'center',
  },
  recordButton: {
    backgroundColor: '#FF4B4B',
  },
  stopButton: {
    backgroundColor: '#2196F3',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  savedRecording: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    width: '100%',
    justifyContent: 'center',
  },
  savedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
});