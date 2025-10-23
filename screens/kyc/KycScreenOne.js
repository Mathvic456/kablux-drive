import { FontAwesome, MaterialIcons, Feather, FontAwesome5, SimpleLineIcons } from "@expo/vector-icons";
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useRef } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Logo from "../../assets/Logo.png";
import { useNavigation } from '@react-navigation/native';

const KycScreenOne = ({ navigation }) => {
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraRef = useRef(null);

  const handleIDUpload = () => {
    navigation.navigate('IDVerification');
  }

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setShowPermissionModal(true);
        return;
      }
    }
    setShowCamera(true);
  }

  const closeCamera = () => {
    setShowCamera(false);
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        setShowCamera(false);
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Error taking picture:', error);
        setShowErrorModal(true);
      }
    }
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const toggleFlash = () => {
    setFlash(current => (current === 'on' ? 'off' : 'on'));
  }

  const retakePicture = () => {
    setCapturedImage(null);
    setShowCamera(true);
  }

  const handleSubmitVerification = async () => {
    if (!capturedImage) {
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call/verification process
    setTimeout(() => {
      setIsSubmitting(false);
      setShowVerificationModal(true);
      
      // Navigate after showing success message
      setTimeout(() => {
        setShowVerificationModal(false);
        navigation.navigate('NextScreen'); // Replace with your actual screen name
      }, 3000);
    }, 2000);
  }

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  }

  const closeErrorModal = () => {
    setShowErrorModal(false);
  }

  const closePermissionModal = () => {
    setShowPermissionModal(false);
  }

  // Success Modal Component
  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={closeSuccessModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <MaterialIcons name="check-circle" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.modalTitle}>Success!</Text>
          <Text style={styles.modalMessage}>ID document captured successfully!</Text>
          <TouchableOpacity style={styles.modalButton} onPress={closeSuccessModal}>
            <Text style={styles.modalButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Error Modal Component
  const ErrorModal = () => (
    <Modal
      visible={showErrorModal}
      transparent={true}
      animationType="fade"
      onRequestClose={closeErrorModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <MaterialIcons name="error-outline" size={60} color="#F44336" />
          </View>
          <Text style={styles.modalTitle}>Error</Text>
          <Text style={styles.modalMessage}>Failed to capture document. Please try again.</Text>
          <TouchableOpacity style={[styles.modalButton, styles.errorButton]} onPress={closeErrorModal}>
            <Text style={styles.modalButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Permission Modal Component
  const PermissionModal = () => (
    <Modal
      visible={showPermissionModal}
      transparent={true}
      animationType="fade"
      onRequestClose={closePermissionModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <MaterialIcons name="camera-alt" size={60} color="#FFA000" />
          </View>
          <Text style={styles.modalTitle}>Permission Required</Text>
          <Text style={styles.modalMessage}>Camera permission is needed to capture your ID document.</Text>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={[styles.modalButton, styles.secondaryButton]} onPress={closePermissionModal}>
              <Text style={[styles.modalButtonText, styles.secondaryButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => {
              closePermissionModal();
              requestPermission();
            }}>
              <Text style={styles.modalButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Verification Success Modal Component
  const VerificationModal = () => (
    <Modal
      visible={showVerificationModal}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <MaterialIcons name="verified" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.modalTitle}>Verification Submitted</Text>
          <Text style={styles.modalMessage}>Your ID will be verified and updated. Thank you!</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fcbf24" />
            <Text style={styles.loadingText}>Redirecting...</Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Document Frame Component for Camera
  const DocumentFrame = () => (
    <View style={styles.documentFrame}>
      <View style={styles.documentFrameBorder}>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>
      <View style={styles.documentInstructions}>
        <MaterialIcons name="camera-alt" size={24} color="#fff" />
        <Text style={styles.instructionsText}>
          Position your ID document within the frame
        </Text>
        <Text style={styles.instructionsSubtext}>
          Ensure all corners are visible and text is clear
        </Text>
      </View>
    </View>
  );

  // Show loading while permission is being checked
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show permission request if not granted
  if (!permission.granted && !showCamera) {
    return (
      <View style={styles.container}>
        <View style={styles.banner} />
        <View style={styles.card}>
          <View style={styles.LogoContainer}>
            <Image source={Logo} style={styles.Logoicon} />
          </View>
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.subtitle}>
            We need camera access to capture your ID document for verification
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera View
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing={facing}
          flash={flash}
        >
          {/* Document Frame Overlay */}
          <DocumentFrame />
          
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cameraButton} onPress={closeCamera}>
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cameraButton} onPress={toggleFlash}>
              <MaterialIcons 
                name={flash === 'on' ? 'flash-on' : 'flash-off'} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cameraButton} onPress={toggleCameraFacing}>
              <MaterialIcons name="flip-camera-ios" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.captureContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.banner} />

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.LogoContainer}>
          <Image source={Logo} style={styles.Logoicon} />
        </View>

        <Text style={styles.title}>KYC Verification</Text>
        <Text style={styles.subtitle}>
          Verify your identity by providing the necessary information below
        </Text>

        {/* ID Upload Button */}
        <TouchableOpacity style={styles.IDUpload} onPress={handleIDUpload}>
          <MaterialIcons name="file-upload" size={24} color="#fcbf24" />
          <Text style={styles.ButtonText}>Upload ID Document</Text>
        </TouchableOpacity>

        {/* Selfie Upload Button */}
        <TouchableOpacity style={styles.SelfieUpload} onPress={openCamera}>
          <FontAwesome name="camera" size={24} color="#fcbf24" />
          <Text style={styles.ButtonText}>
            {capturedImage ? 'Retake ID Photo' : 'Capture ID Document'}
          </Text>
        </TouchableOpacity>

        {/* Preview Captured Image */}
        {capturedImage && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>ID Document Preview</Text>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            !capturedImage && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmitVerification}
          disabled={!capturedImage || isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.submitButtonText}>Verifying...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit Verification</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Modals */}
      <SuccessModal />
      <ErrorModal />
      <PermissionModal />
      <VerificationModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  banner: {
    height: 200,
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  card: {
    flex: 1,
    marginTop: -40,
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    width: "95%",
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
  },
  Logoicon: {
    width: 130,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
  },
  IDUpload: {
    borderWidth: 1,
    borderColor: "#555",
    borderStyle: "solid",
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  ButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600"
  },
  SelfieUpload: {
    borderWidth: 1,
    borderColor: "#555",
    borderStyle: "solid",
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cameraButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 50,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 4,
    borderRadius: 50,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    backgroundColor: 'white',
    borderRadius: 35,
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fcbf24',
    resizeMode: 'contain',
  },
  retakeButton: {
    backgroundColor: '#fcbf24',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retakeButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  permissionButton: {
    backgroundColor: '#fcbf24',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#fcbf24',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Document Frame Styles
  documentFrame: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentFrameBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: 'rgba(252, 191, 36, 0.8)',
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fcbf24',
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fcbf24',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fcbf24',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fcbf24',
  },
  documentInstructions: {
    position: 'absolute',
    bottom: -80,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  instructionsSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
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
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#fcbf24',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  errorButton: {
    backgroundColor: '#F44336',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
  },
});

export default KycScreenOne;