import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useUploadFile } from "../../services/fileUpload.service";
import { useSubmitKycDocument } from "../../services/useSubmitKyc.service";
import Logo from "../../assets/Logo.png";
import CentralModal from "../components/CentralModal";
import { useDriverKycStatus } from "../../services/checkKyc.service";


const DocumentUpload = ({ navigation }) => {
  const [documents, setDocuments] = useState({
    DRIVER_LICENSE: null,
    NATIONAL_ID: null,
    // POLICE_CLEARANCE: null,
  });

  const [uploadedIds, setUploadedIds] = useState({
    DRIVER_LICENSE: null,
    NATIONAL_ID: null,
    // POLICE_CLEARANCE: null,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const uploadMutation = useUploadFile();
  const submitKycMutation = useSubmitKycDocument();
  const submitKycDocMutation = useSubmitKycDocument();
  const { data: kycData, refetch: refetchKycStatus } = useDriverKycStatus();


  useEffect(() => {
    if (kycData?.kyc_status === "IN_REVIEW") {
      setShowReviewModal(true);
    }
  }, [kycData]);

  const documentLabels = {
    DRIVER_LICENSE: "Driver's License",
    NATIONAL_ID: "National ID",
    // POLICE_CLEARANCE: "Police Clearance",
  };

  const [isUploadingMap, setIsUploadingMap] = useState({});

  const pickDocument = async (docType) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setErrorMessage("Please grant permission to access your photos");
        setShowErrorModal(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setDocuments((prev) => ({
          ...prev,
          [docType]: asset.uri,
        }));

        await uploadDocument(docType, asset.uri);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      setErrorMessage("Failed to pick document");
      setShowErrorModal(true);
    }
  };

  const uploadDocument = async (docType, uri) => {
    setIsUploadingMap(prev => ({ ...prev, [docType]: true }));
    try {
      const formData = new FormData();
      formData.append("name", docType.toLowerCase());

      const filename = uri.split("/").pop() || `${docType}.jpg`;
      formData.append("files", {
        uri: uri,
        type: "image/jpeg",
        name: filename,
      });

      await uploadMutation.mutateAsync(formData, {
        onSuccess: (res) => {
          console.log("📄 Upload result:", res.data);
          const fileId = res.data?.results?.[0]?.id;
          console.log(`✅ ${docType} uploaded, ID:`, fileId);

          if (fileId) {
            setUploadedIds((prev) => ({
              ...prev,
              [docType]: fileId,
            }));

            submitKycDocMutation.mutate({
              doc_type: docType,
              file: fileId,
            });
          }
        },
        onError: (error) => {
          console.error(`❌ ${docType} upload failed:`, error);
          setErrorMessage(`Failed to upload ${documentLabels[docType]}`);
          setShowErrorModal(true);
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage("Failed to upload document");
      setShowErrorModal(true);
    } finally {
      setIsUploadingMap(prev => ({ ...prev, [docType]: false }));
    }
  };

  const removeDocument = (docType) => {
    setUploadedIds(prev => ({
      ...prev,
      [docType]: null,
    }));
    setDocuments(prev => ({
      ...prev,
      [docType]: null,
    }));
  };

  const submitAllDocuments = async () => {
    const oneUploaded = Object.keys(uploadedIds).some(
      (key) => uploadedIds[key] !== null
    );

    if (!oneUploaded) {
      setErrorMessage("Please upload all required documents before submitting");
      setShowErrorModal(true);
      return;
    }

    try {
      console.log("🔄 Checking KYC status after uploads...");

      // Refetch the KYC status to get the latest state
      const { data: updatedKycData } = await refetchKycStatus();

      console.log("📋 Updated KYC Status:", updatedKycData?.kyc_status);

      if (updatedKycData?.kyc_status === "IN_REVIEW") {
        setShowReviewModal(true);

        setTimeout(() => {
          setShowReviewModal(false);
          navigation.goBack();
        }, 3000);
      } else {
        // Fallback success message if status hasn't changed yet
        setShowSuccessModal(true);

        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }, 3000);
      }
    } catch (error) {
      console.error("KYC status check error:", error);
      setErrorMessage("Documents uploaded but status check failed. Please refresh the app.");
      setShowErrorModal(true);
    }
  };

  const renderDocumentCard = (docType) => {
    const hasDocument = documents[docType] !== null;
    const hasUploadedId = uploadedIds[docType] !== null;
    const isThisSpecificDocUploading = isUploadingMap[docType];

    return (
      <View key={docType} style={styles.docItemContainer}>
        <View style={styles.docItemHeader}>
          <View style={styles.docNameContainer}>
            <MaterialIcons
              name={hasUploadedId ? "check-circle" : "radio-button-unchecked"}
              size={24}
              color={hasUploadedId ? "#4CAF50" : "#666"}
            />
            <Text style={styles.docName}>{documentLabels[docType]}</Text>
          </View>

          {hasUploadedId ? (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeDocument(docType)}
            >
              <MaterialIcons name="close" size={20} color="#F44336" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickDocument(docType)}
              disabled={isThisSpecificDocUploading}
            >
              {isThisSpecificDocUploading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <MaterialIcons name="cloud-upload" size={20} color="#000" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {hasDocument && (
          <View style={styles.uploadedFileInfo}>
            <Image
              source={{ uri: documents[docType] }}
              style={styles.thumbnailImage}
            />
            <MaterialIcons name="description" size={16} color="#fcbf24" style={{ marginLeft: 8 }} />
            <Text style={styles.fileName} numberOfLines={1}>
              {documents[docType].split('/').pop()}
            </Text>
            <MaterialIcons name="check" size={16} color="#4CAF50" />
          </View>
        )}
      </View>
    );
  };

  const allDocumentsReady = Object.keys(uploadedIds).every(
    (key) => uploadedIds[key] !== null
  );

  const uploadedCount = Object.values(uploadedIds).filter(id => id !== null).length;
  const totalCount = Object.keys(uploadedIds).length;

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
            Documents Uploaded: {uploadedCount} of {totalCount}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(uploadedCount / totalCount) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Document List */}
        <ScrollView style={styles.documentsList} showsVerticalScrollIndicator={false}>
          {Object.keys(documents).map((docType) => renderDocumentCard(docType))}
        </ScrollView>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.proceedBtn,
            !allDocumentsReady && styles.proceedBtnDisabled
          ]}
          onPress={submitAllDocuments}
          disabled={!allDocumentsReady || submitKycMutation.isPending}
        >
          {submitKycMutation.isPending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.proceedText}>Verifying...</Text>
            </View>
          ) : (
            <Text style={styles.proceedText}>Verify Identity</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <CentralModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        subText="All documents have been uploaded successfully! Your verification is in progress."
        icon="checkmark-circle"
        confirmText="Close"
        closeText=""
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        confirmButtonColor="#fcbf24"
        themeColor="#4CAF50"
      />

      {/* Error Modal */}
      <CentralModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Attention Required"
        subText={errorMessage}
        icon="alert-circle"
        confirmText="Okay"
        closeText=""
        onConfirm={() => setShowErrorModal(false)}
        confirmButtonColor="#F44336"
        themeColor="#F44336"
      />

      {/* Review Modal */}
      <CentralModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Documents Under Review! 🎉"
        subText="Your documents have been submitted successfully and are now being reviewed by our team. You'll be notified once your verification is complete. Thank you for your patience!"
        icon="time-outline"
        confirmText="Got it!"
        closeText=""
        onConfirm={() => {
          setShowReviewModal(false);
          navigation.goBack();
        }}
        confirmButtonColor="#fcbf24"
        themeColor="#ff9800"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
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
  LogoContainer: {
    alignItems: 'center',
  },
  Logoicon: {
    width: 130,
    height: 100,
    resizeMode: "contain",
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
    lineHeight: 20,
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
  thumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  fileName: {
    color: "#ccc",
    fontSize: 12,
    marginLeft: 6,
    marginRight: 6,
    flex: 1,
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

export default DocumentUpload;