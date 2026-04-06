import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface CentralModalProps {
  visible: boolean;
  onClose: () => void;

  // Content
  title: string;
  subText?: string;
  icon?: IoniconsName;
  contentMode?: "default" | "custom";
  children?: React.ReactNode;

  // Actions
  onConfirm?: () => void;
  confirmText?: string;
  closeText?: string;

  // Customization
  iconColor?: string;
  confirmButtonColor?: string;
  closeButtonColor?: string;
  themeColor?: string;

  // Layout
  hideCloseButton?: boolean;

  // Styling Overrides (if needed)
  containerStyle?: ViewStyle;
}

const CentralModal: React.FC<CentralModalProps> = ({
  visible,
  onClose,
  title,
  subText,
  icon,
  contentMode = "default",
  children,
  onConfirm,
  confirmText = "Confirm",
  closeText = "Close",
  iconColor,
  confirmButtonColor = "#FEB914",
  closeButtonColor = "#666",
  themeColor = "#FEB914",
  hideCloseButton = false,
  containerStyle,
}) => {

  // If no onConfirm is provided, the confirm button acts as a close button
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* KeyboardAvoidingView ensures inputs in 'custom' mode don't get hidden */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            {/* Stop propagation so clicking the modal itself doesn't close it */}
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { borderColor: themeColor }, containerStyle]}>

                {/* --- 1. Header (Icon + Title) --- */}
                <View style={styles.header}>
                  {icon && (
                    <View style={[styles.iconContainer, { backgroundColor: `${themeColor}15` }]}>
                      <Ionicons
                        name={icon}
                        size={32}
                        color={iconColor || themeColor}
                      />
                    </View>
                  )}
                  <Text style={styles.title}>{title}</Text>
                </View>

                {/* --- 2. Content Area --- */}
                <View style={styles.content}>
                  {contentMode === "default" ? (
                    // Informative Mode
                    <Text style={styles.subText}>
                      {subText || "Are you sure you want to proceed?"}
                    </Text>
                  ) : (
                    // Custom Mode (Pickers, Inputs, etc.)
                    <>
                      {subText && <Text style={[styles.subText, { marginBottom: 15 }]}>{subText}</Text>}
                      {children}
                    </>
                  )}
                </View>

                {/* --- 3. Footer (Buttons) --- */}
                <View style={styles.footer}>
                  {/* Primary Button */}
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </TouchableOpacity>

                  {/* Secondary/Close Button (Below Confirm) */}
                  {!hideCloseButton && (
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={onClose}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.closeButtonText, { color: closeButtonColor }]}>
                        {closeText}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)", // Deep dark overlay
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  keyboardView: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#111",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    // Shadow for elevation
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  content: {
    width: "100%",
    marginBottom: 24,
    alignItems: "center",
  },
  subText: {
    fontSize: 15,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    width: "100%",
    alignItems: "center",
    borderColor: "blue",
    borderWidth: 0,
  },
  confirmButton: {
    width: "90%",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderColor: "white",
    // borderWidth: 1,
  },
  confirmButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default CentralModal;