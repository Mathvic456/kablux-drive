import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CounterOfferItem from "./CounterOfferItem";
import { scaleSize } from "../../utils/scaling";

const { width, height } = Dimensions.get("window");

export default function CounterOffersModal({
  visible,
  onClose,
  negotiationArray,
  socket,
  onAccept,
  onCounterSubmit,
  hasSufficientBalance,
}) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView style={styles.fullScreenModal} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <SafeAreaView style={[styles.fullScreenContent, { paddingTop: Platform.OS === "ios" ? 0 : 50 }]}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={scaleSize(24)} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Counter Offers</Text>
            <View style={{ width: scaleSize(24) }} />
          </View>

          <FlatList
            data={negotiationArray}
            keyExtractor={(item) => item.ride_request_view_id}
            renderItem={({ item }) => (
              <CounterOfferItem
                item={item}
                onClose={onClose}
                socket={socket}
                onAccept={onAccept}
                onCounterSubmit={onCounterSubmit}
                disabled={!hasSufficientBalance}
                disabledMessage="Add funds to accept offers"
                showViewOnly={!hasSufficientBalance}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>No counter offers available</Text>
              </View>
            }
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenModal: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.9)", justifyContent: "flex-end", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  fullScreenContent: { backgroundColor: "#000", borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "90%", paddingHorizontal: Math.max(16, width * 0.04), paddingTop: Math.max(16, height * 0.02) },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Math.max(16, height * 0.02), paddingHorizontal: 5 },
  modalTitle: { fontSize: Math.max(18, width * 0.048), fontWeight: "bold", color: "white", textAlign: "center", flex: 1 },
  listContent: { paddingBottom: Math.max(20, height * 0.025) },
  emptyList: { padding: Math.max(20, height * 0.025), alignItems: "center" },
  emptyListText: { color: "#999", fontSize: Math.max(14, width * 0.037) },
});
