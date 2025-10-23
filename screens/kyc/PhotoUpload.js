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
  Alert,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Logo from "../../assets/Logo.png";
import { useNavigation } from '@react-navigation/native';

const PhotoUpload = ({ navigation }) => {
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [permission, requestPermission] = useCameraPermissions(); // Correct array destructuring
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);

  const handleIDUpload = () => {
    navigation.navigate('IDVerification');
  }

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission required', 'Camera permission is needed to take photos');
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
        Alert.alert('Success', 'Selfie captured successfully!');
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
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
            We need camera access to take your selfie for verification
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
          verify your identity by providing the necessary information below
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
            {capturedImage ? 'Retake Selfie' : 'Take Selfie'}
          </Text>
        </TouchableOpacity>

        {/* Preview Captured Image */}
        {capturedImage && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Selfie Preview</Text>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
              <Text style={styles.retakeButtonText}>Retake Selfie</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit Verification</Text>
        </TouchableOpacity>
      </View>
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
    height: 200,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fcbf24',
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
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
  submitButton: {
    backgroundColor: '#fcbf24',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PhotoUpload;