import React, { useState } from "react";
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
import { Feather, MaterialIcons, Entypo } from "@expo/vector-icons";
import { useUploadFile } from "@/services/upload.service";
import { useSubmitKycDocument } from "@/services/useSubmitKyc.service";

const DocumentUpload = ({ navigation }) => {
  const [documents, setDocuments] = useState({
    DRIVER_LICENSE: null,
    NATIONAL_ID: null,
    POLICE_CLEARANCE: null,
  });

  const [uploadedIds, setUploadedIds] = useState({
    DRIVER_LICENSE: null,
    NATIONAL_ID: null,
    POLICE_CLEARANCE: null,
  });

  const uploadMutation = useUploadFile();
  const submitKycMutation = useSubmitKycDocument();

  const documentLabels = {
    DRIVER_LICENSE: "Driver's License",
    NATIONAL_ID: "National ID",
    POLICE_CLEARANCE: "Police Clearance",
  };

  const pickDocument = async (docType) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos"
        );
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
        
        // Automatically upload the document
        await uploadDocument(docType, asset.uri);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadDocument = async (docType, uri) => {
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
          }
        },
        onError: (error) => {
          console.error(`❌ ${docType} upload failed:`, error);
          Alert.alert("Error", `Failed to upload ${documentLabels[docType]}`);
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload document");
    }
  };

  const submitAllDocuments = async () => {
    // Check if all documents are uploaded
    const allUploaded = Object.keys(uploadedIds).every(
      (key) => uploadedIds[key] !== null
    );

    if (!allUploaded) {
      Alert.alert(
        "Missing Documents",
        "Please upload all required documents before submitting"
      );
      return;
    }

    try {
      // Submit each document to KYC endpoint
      const submissions = Object.keys(uploadedIds).map((docType) =>
        submitKycMutation.mutateAsync({
          doc_type: docType,
          file: uploadedIds[docType],
        })
      );

      await Promise.all(submissions);

      Alert.alert(
        "Success",
        "All documents submitted successfully for verification!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert(
        "Error",
        "Failed to submit documents. Please try again."
      );
    }
  };

  const renderDocumentCard = (docType) => {
    const hasDocument = documents[docType] !== null;
    const hasUploadedId = uploadedIds[docType] !== null;
    const isUploading = uploadMutation.isPending;

    return (
      <View key={docType} style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentTitle}>
            {documentLabels[docType]}
          </Text>
          {hasUploadedId && (
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          )}
        </View>

        {hasDocument ? (
          <View style={styles.documentPreview}>
            <Image
              source={{ uri: documents[docType] }}
              style={styles.previewImage}
            />
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => pickDocument(docType)}
              disabled={isUploading}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument(docType)}
            disabled={isUploading}
          >
            <Feather name="upload" size={32} color="#FEB914" />
            <Text style={styles.uploadButtonText}>
              {isUploading ? "Uploading..." : "Upload Document"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const allDocumentsReady = Object.keys(uploadedIds).every(
    (key) => uploadedIds[key] !== null
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Entypo name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Documents</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Upload the required documents for verification
        </Text>

        {Object.keys(documents).map((docType) => renderDocumentCard(docType))}

        <TouchableOpacity
          style={[
            styles.submitButton,
            !allDocumentsReady && styles.submitButtonDisabled,
          ]}
          onPress={submitAllDocuments}
          disabled={!allDocumentsReady || submitKycMutation.isPending}
        >
          {submitKycMutation.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit for Verification
            </Text>
          )}
        </TouchableOpacity>

        {!allDocumentsReady && (
          <Text style={styles.helperText}>
            All documents must be uploaded before submission
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 24,
  },
  documentCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  documentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  uploadButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#FEB914",
    borderRadius: 8,
  },
  uploadButtonText: {
    marginTop: 8,
    color: "#FEB914",
    fontSize: 14,
    fontWeight: "600",
  },
  documentPreview: {
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeButton: {
    backgroundColor: "#FEB914",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  changeButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#FEB914",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#555",
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  helperText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 14,
    marginBottom: 40,
  },
});

export default DocumentUpload;