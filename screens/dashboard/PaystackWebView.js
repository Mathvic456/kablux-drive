import { useFundWalletEndPoint } from "../../services/funding.service";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
// if 'new URL()' crashes on older android versions
// import 'react-native-url-polyfill/auto'; 

const DynamicPayStackWebViewScreen = () => {
  const [amount, setAmount] = useState("");
  const [paystackUrl, setPaystackUrl] = useState(null);
  const navigation = useNavigation();

  const { mutate: initiateFunding, isPending } = useFundWalletEndPoint();

  const handleAddFunds = () => {
    const num = Number(amount);
    if (!amount || isNaN(num) || num < 100) {
      Alert.alert("Invalid Amount", "Minimum amount is ₦100");
      return;
    }

    const defaultEmail = "customer@example.com"; 
    
    initiateFunding(
      {
        amount: num,
        email: defaultEmail, 
        channel: "card"
      },
      {
        onSuccess: (res) => {
          const url = res.data?.data?.authorization_url;
          if (url) {
            console.log("Opening Paystack:", url);
            setPaystackUrl(url);
          } else {
            Alert.alert("Error", "No payment link received");
          }
        },
        onError: (err) => {
          const msg =
            err.response?.data?.message ||
            err.response?.data?.channel?.[0] ||
            "Failed to start payment";
          Alert.alert("Payment Error", msg);
        },
      }
    );
  };

  const handleNavigation = (navState) => {
    const { url } = navState;
    if (url.includes("reference=") && url.includes("trxref=")) {
      setPaystackUrl(null); 

      Alert.alert(
        "Payment Successful!",
        "Your wallet has been credited.",
        [
          {
            text: "Done",
            onPress: () => {
              setAmount("");
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("Tabs", { screen: "Wallet" });
              }
            },
          },
        ]
      );
    }
    
    // 3. Handle the specific "Close" button inside Paystack (if user cancels)
    else if (url.includes("close") || url.includes("cancel")) {
        setPaystackUrl(null);
    }
  };

  const setQuickAmount = (val) => setAmount(val.toString());

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 26, fontWeight: "bold" }}>←</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Add Funds to Wallet</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Amount (₦)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.note}>
            Enter the amount you want to add to your wallet
          </Text>

          <View style={styles.quickRow}>
            {[500, 1000, 5000, 10000].map((v) => (
              <TouchableOpacity
                key={v}
                style={styles.quickBtn}
                onPress={() => setQuickAmount(v)}
              >
                <Text style={styles.quickText}>₦{v.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.payBtn, isPending && styles.payBtnDisabled]}
            onPress={handleAddFunds}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.payText}>
                Pay ₦{amount ? Number(amount).toLocaleString() : "0"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Paystack Modal */}
      <Modal visible={!!paystackUrl} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPaystackUrl(null)}>
              <Text style={{ fontSize: 28, fontWeight: "bold" }}>×</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              Complete Payment
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {paystackUrl && (
            <WebView
              source={{ uri: paystackUrl }}
              onNavigationStateChange={handleNavigation}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f8f9fa" },
  headerRow: { marginBottom: 10 }, 
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 30,
  },
  form: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 16,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    fontSize: 16,
  },
  note: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginVertical: 20,
  },
  quickBtn: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  quickText: { fontWeight: "600" },
  payBtn: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  payBtnDisabled: { opacity: 0.7 },
  payText: { color: "white", fontWeight: "bold", fontSize: 18 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: 50, 
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f9fafb",
  },
});

export default DynamicPayStackWebViewScreen;