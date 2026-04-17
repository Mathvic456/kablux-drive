import React, { use } from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";
import { useSubmitKyc } from "../../services/checkKyc.service";

const { width, height } = Dimensions.get('window');

const scaleFont = (size) => {
  const scaleFactor = width / 375;
  return Math.round(size * Math.min(scaleFactor, 1.3));
};
const scaleSize = (size) => {
  const scaleFactor = width / 375;
  return Math.round(size * Math.min(scaleFactor, 1.2));
};

const UpgradeNotificationCard = ({ status }) => {
  const navigation = useNavigation();
  console.log('statusss', status)
  const { mutateAsync: submitKyc } = useSubmitKyc();

  const handleSendForReview = async () => {
    try {
      const data = await submitKyc();
      console.log('send for review response', data);
      Alert.alert("Success", "Your documents have been sent for review. We will notify you once the review is complete.");
    } catch (error) {
      console.error("Error sending for review:", error);
      Alert.alert("Error", "An error occurred while sending for review. Please try again.");

    }
  };

  return (
    <View style={styles.container}>

      {/* Top row: text + illustration */}
      <View style={styles.topRow}>
        {status?.kyc_status === "PENDING" ? (
          <View style={styles.textBlock}>
            <Text style={styles.title}>
              Complete Verification before receiving Rides
            </Text>
            <Text style={styles.subtitle}>
              Finish registration today to enjoy more benefits from Kablux
            </Text>
          </View>
        ) : (
          <View style={styles.textBlock}>
            <Text style={styles.title}>
              Your documents are under review
            </Text>
            <Text style={styles.subtitle}>
              We are reviewing your submitted documents. We will notify you once the review is complete.
            </Text>
          </View>
        )}

        <Image
          source={require("../../assets/reg2.png")}
          style={styles.illustration}
        />
      </View>

      {/* Button */}
      {status?.kyc_status === "PENDING" &&
        !Object.values(status?.steps || {}).every(Boolean) && (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate("IDVerify")}
          >
            <Text style={styles.viewButtonText}>Proceed</Text>
          </TouchableOpacity>
        )}

      {status?.kyc_status === "PENDING" &&
        Object.values(status?.steps || {}).every(Boolean) && (
          <TouchableOpacity
            style={[styles.viewButton, { marginTop: 8 }]}
            onPress={handleSendForReview}
          >
            <Text style={styles.viewButtonText}>Send for Review</Text>
          </TouchableOpacity>
        )}

    </View>
  );
};

export default UpgradeNotificationCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#7B0000",
    borderRadius: 12,
    padding: 15,
    margin: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  textBlock: {
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  title: {
    color: "#fff",
    fontSize: scaleFont(15),
    fontWeight: "600",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  subtitle: {
    color: "#fff",
    fontSize: scaleFont(11),
    opacity: 0.9,
    flexWrap: "wrap",
  },
  illustration: {
    width: 70,
    height: 90,
    resizeMode: "contain",
    flexShrink: 0,
  },
  viewButton: {
    backgroundColor: "#facc15",
    paddingVertical: Math.max(10, height * 0.012),
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: Math.max(14, width * 0.037),
  },
});