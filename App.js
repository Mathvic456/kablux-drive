import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppNavigator from './screens/navigation/AppNavigator';
import { WebSocketProvider } from './context/WebSocketProvider';

const queryClient = new QueryClient();
export default function App() {
  return (
    <WebSocketProvider>
     <NavigationContainer>
      <QueryClientProvider client={queryClient}>
      <AppNavigator />
      </QueryClientProvider>
    </NavigationContainer>
    </WebSocketProvider>
  );
}
