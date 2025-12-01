import React from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";

export default function PaystackWebView({ route, navigation }) {
  const { url } = route.params;

  const onNavChange = (nav) => {
    const currentUrl = nav.url;

    if (currentUrl.includes("https://your-callback-url.com")) {
      const reference = currentUrl.split("reference=")[1];

      navigation.replace("VerifyPayment", { reference });
    }
  };

  return (
    <WebView
      source={{ uri: url }}
      onNavigationStateChange={onNavChange}
      startInLoadingState
      renderLoading={() => (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    />
  );
}
