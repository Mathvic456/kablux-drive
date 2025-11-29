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


const queryClient = new QueryClient();
export default function App() {
  function ApiAuthConnector() {
  const { getValidToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(getValidToken);
    console.log("✅ API layer connected to AuthContext");
  }, [getValidToken]);

  return null;
}

  return (
  <NavigationContainer ref={navigationRef}>
        <AuthProvider>
      <ApiAuthConnector />
    <WebSocketProvider>
      <DriverRideProvider>
      <QueryClientProvider client={queryClient}>
      <AppNavigator />
      </QueryClientProvider>
    </DriverRideProvider>
    </WebSocketProvider>
    </AuthProvider>
        </NavigationContainer>
  );
}
