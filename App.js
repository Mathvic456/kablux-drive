import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppNavigator from './screens/navigation/AppNavigator';
import { WebSocketProvider } from './context/WebSocketProvider';
import { navigationRef } from './screens/context/NavigationContext';
import { DriverRideProvider } from './context/DriverRideContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setAuthTokenGetter } from './services/api';
import React, { use, useEffect } from 'react';
import * as Notifications from "expo-notifications";
import { GoogleSignin } from '@react-native-google-signin/google-signin';




const queryClient = new QueryClient();
export default function App() {

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log("Notification clicked:", data);

      const tryNavigate = (attempts = 0) => {
        if (!navigationRef.isReady()) {
          if (attempts < 10) setTimeout(() => tryNavigate(attempts + 1), 500);
          return;
        }

        const type = data?.type || data?.click_action;

        if (type === "RIDE_REQUESTED") {
          navigationRef.navigate("Mainapp", {
            screen: "MainTabs",
            params: { screen: "Home", params: { notificationData: data } },
          });
        } else if (data?.screen) {
          navigationRef.navigate(data.screen, data.params || {});
        }
      };

      tryNavigate();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // const { token } = useAuth()
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true, // required for idToken to be non-null
    });
  }, []);

  function ApiAuthConnector() {
    const { getValidToken, token } = useAuth();

    useEffect(() => {
      setAuthTokenGetter(getValidToken);
      console.log("✅ API layer connected to AuthContext", token);
    }, [getValidToken]);


    return null;
  }

  try {
    return (
      <NavigationContainer ref={navigationRef}>
        <AuthProvider>
          <ApiAuthConnector />
          <DriverRideProvider>
            <WebSocketProvider>

              <QueryClientProvider client={queryClient}>
                <AppNavigator />
              </QueryClientProvider>

            </WebSocketProvider>
          </DriverRideProvider>
        </AuthProvider>
      </NavigationContainer>
    );
  } catch (error) {
    console.error("🔴 APP INITIALIZATION ERROR:", JSON.stringify(error, null, 2));
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          App Failed to Load
        </Text>
        <Text style={{ color: '#ccc', fontSize: 14, textAlign: 'center' }}>
          {error?.message || 'An unknown error occurred during initialization'}
        </Text>
        <Text style={{ color: '#999', fontSize: 12, marginTop: 15, textAlign: 'center', fontFamily: 'monospace' }}>
          Check console for details
        </Text>
      </View>
    );
  }
}
