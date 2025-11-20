import { FontAwesome, MaterialIcons, Feather, FontAwesome5, SimpleLineIcons } from "@expo/vector-icons";
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useUploadFile } from "../../services/fileUpload.service";
import * as DocumentPicker from 'expo-document-picker';
import Logo from "../../assets/Logo.png";
import { useNavigation } from '@react-navigation/native';

const DocumentUploads = () => {
  const [documents, setDocuments] = useState([
    { id: 1, name: "National Identity Card", uploaded: false, file: null, type: 'nationalId' },
    { id: 2, name: "Driver's License", uploaded: false, file: null, type: 'driversLicense' },
    { id: 3, name: "International Passport", uploaded: false, file: null, type: 'passport' },
    { id: 4, name: "Utility Bill", uploaded: false, file: null, type: 'utilityBill' },
    { id: 5, name: "Bank Statement", uploaded: false, file: null, type: 'bankStatement' }
  ]);
  
  const [uploadedFiles, setUploadedFiles] = useState(new Map());
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  
  const fileUploadMutation = useUploadFile();
  const navigation = useNavigation();


const pickDocument = async (docType) => {
  try {
    setUploadingDoc(docType);
    
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      setUploadingDoc(null);
      return;
    }

    const file = result.assets[0];

    console.log("=== FILE PICKER RESULT ===");
    console.log("URI:", file.uri);
    console.log("Name:", file.name);
    console.log("Size:", file.size);
    console.log("MIME:", file.mimeType);
    console.log("========================");

    const formData = new FormData();
    formData.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/octet-stream",
    });


    
    console.log("=== SENDING TO BACKEND ===");

    try {
      const response = await fileUploadMutation.mutateAsync(formData);
      
      console.log("=== BACKEND RESPONSE ===");
      console.log("Full response:", JSON.stringify(response, null, 2));
      
      const uploadId = response.data.id || response.data._id || response.data.fileId || 'temp-id-' + Date.now();
      
      console.log(`File uploaded successfully for ${docType}:`, uploadId);
      
      setUploadedFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(docType, {
          id: uploadId,
          fileName: file.name,
        });
        return newMap;
      });
      
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.type === docType 
            ? { ...doc, uploaded: true, file: { name: file.name } }
            : doc
        )
      );

    } catch (error) {
      console.error('=== BACKEND ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setShowErrorModal(true);
    }

  } catch (error) {
    console.error('=== DOCUMENT PICKER ERROR ===');
    console.error('Error picking document:', error);
    setShowErrorModal(true);
  } finally {
    setUploadingDoc(null);
  }
};
  const removeDocument = (docType) => {

    setUploadedFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(docType);
      return newMap;
    });
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.type === docType 
          ? { ...doc, uploaded: false, file: null }
          : doc
      )
    );
  };

  const handleSubmitVerification = async () => {
    const allUploaded = documents.filter(doc => doc.type !== 'driversLicense' && doc.type !== 'bankStatement').every(doc => doc.uploaded);
    
    if (!allUploaded) { 
      setShowErrorModal(true);
      return;
    }
    setIsSubmitting(true);

    const uploadedFilesObject = Object.fromEntries(uploadedFiles);
    
    console.log("All uploaded files with IDs:", uploadedFilesObject);
    
    try {

      await AsyncStorage.setItem("preDocuments", JSON.stringify(uploadedFilesObject)); 
      console.log("Stored in async storage")
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessModal(true);
        
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.navigate('KycScreenOne');
        }, 3000);
      }, 2000);
      
    } catch (error) {
      console.error('Verification submission error:', error);
      setIsSubmitting(false);
      setShowErrorModal(true);
    }
  };

  const getUploadedFileName = (docType) => {
    const doc = documents.find(d => d.type === docType);
    return doc?.file?.name || '';
  };

  const allDocumentsUploaded = documents.every(doc => doc.uploaded);

  // Success Modal Component
  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <MaterialIcons name="check-circle" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.modalTitle}>Success!</Text>
          <Text style={styles.modalMessage}>
            All documents have been uploaded successfully! Your verification is in progress.
          </Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fcbf24" />
            <Text style={styles.loadingText}>Redirecting...</Text>
          </View>
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
      onRequestClose={() => setShowErrorModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <MaterialIcons name="error-outline" size={60} color="#F44336" />
          </View>
          <Text style={styles.modalTitle}>Attention Required</Text>
          <Text style={styles.modalMessage}>
            {documents.every(doc => doc.uploaded) 
              ? "There was an error processing your documents. Please try again."
              : "Please upload all required documents before proceeding with verification."
            }
          </Text>
          <TouchableOpacity 
            style={[styles.modalButton, styles.errorButton]} 
            onPress={() => setShowErrorModal(false)}
          >
            <Text style={styles.modalButtonText}>Okay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );



  const DocumentItem = ({ doc }) => (
    <View style={styles.docItemContainer}>
      <View style={styles.docItemHeader}>
        <View style={styles.docNameContainer}>
          <MaterialIcons 
            name={doc.uploaded ? "check-circle" : "radio-button-unchecked"} 
            size={24} 
            color={doc.uploaded ? "#4CAF50" : "#666"} 
          />
          <Text style={styles.docName}>{doc.name}</Text>
        </View>
        
        {doc.uploaded ? (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => removeDocument(doc.type)}
          >
            <MaterialIcons name="close" size={20} color="#F44336" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => pickDocument(doc.type)}
            disabled={uploadingDoc === doc.type}
          >
            {uploadingDoc === doc.type ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <MaterialIcons name="cloud-upload" size={20} color="#000" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {doc.uploaded && (
        <View style={styles.uploadedFileInfo}>
          <MaterialIcons name="description" size={16} color="#fcbf24" />
          <Text style={styles.fileName} numberOfLines={1}>
            {getUploadedFileName(doc.type)}
          </Text>
          <MaterialIcons name="check" size={16} color="#4CAF50" />
        </View>
      )}
    </View>
  );



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
          Please upload each document and ensure they are clear and legible.
          We are required to verify your identity before you can use the application. 
          Your information will be encrypted and stored securely.
        </Text>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Documents Uploaded: {documents.filter(doc => doc.uploaded).length} of {documents.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(documents.filter(doc => doc.uploaded).length / documents.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Document types */}
        <ScrollView style={styles.documentsList} showsVerticalScrollIndicator={false}>
          {documents.map((doc) => (
            <DocumentItem key={doc.id} doc={doc} />
          ))}
        </ScrollView>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.proceedBtn,
            !allDocumentsUploaded && styles.proceedBtnDisabled
          ]}
          onPress={handleSubmitVerification}
          disabled={!allDocumentsUploaded || isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.proceedText}>Verifying...</Text>
            </View>
          ) : (
            <Text style={styles.proceedText}>Verify Identity</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Modals */}
      <SuccessModal />
      <ErrorModal />
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
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fcbf24",
    textAlign: "center",
    marginBottom: 20,
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
    lineHeight: 20,
  },
  Logoicon: {
    width: 130,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
  },
  documentsList: {
    flex: 1,
    marginBottom: 10,
  },
  docItemContainer: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
  },
  docItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  uploadButton: {
    backgroundColor: "#fcbf24",
    padding: 8,
    borderRadius: 6,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: "transparent",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F44336",
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  fileName: {
    color: "#ccc",
    fontSize: 12,
    marginLeft: 6,
    marginRight: 6,
    flex: 1,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fcbf24',
    borderRadius: 3,
  },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 10,
    alignItems: "center",
  },
  proceedBtnDisabled: {
    backgroundColor: "#555",
    opacity: 0.6,
  },
  proceedText: { 
    color: "#000", 
    fontWeight: "bold", 
    fontSize: 16 
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
  errorButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DocumentUploads;