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
import React, { useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useNotificationNavigator } from './hooks/useNotificationNavigator';
import { registerDevice } from './services/deviceRegistration';
import { requestFcmPermission } from './services/fcmHandler';
// Side-effect import: registers the background location task with TaskManager.
// Must be imported at module load, before any start call.
import './services/locationBeacon';




const queryClient = new QueryClient();
export default function App() {

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

  function NotificationNavigator() {
    useNotificationNavigator();
    return null;
  }

  // Cold-start re-registration: whenever we have a valid auth token (either
  // from a fresh login or a restored "remember me" session), push the current
  // FCM token to the backend. Idempotent — deviceRegistration.ts short-circuits
  // if the token is unchanged since the last successful register.
  function DeviceRegistrar() {
    const { token } = useAuth();
    useEffect(() => {
      if (!token) return;
      // Ensure notification permission is granted at the Firebase SDK
      // level before we try to register a token. The Expo hook handles
      // the UI prompt; this is idempotent and cheap.
      (async () => {
        await requestFcmPermission();
        await registerDevice().catch((err) => {
          console.warn("⚠️ [DeviceRegistrar] cold-start register failed:", err);
        });
      })();
    }, [token]);
    return null;
  }

  try {
    return (
      <NavigationContainer ref={navigationRef}>
        <AuthProvider>
          <ApiAuthConnector />
          <NotificationNavigator />
          <DeviceRegistrar />
          <DriverRideProvider>
            <WebSocketProvider>
              <RideDeepLinkBridge />

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
