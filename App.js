import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppNavigator from './screens/navigation/AppNavigator';

const queryClient = new QueryClient();
export default function App() {
  return (
     <NavigationContainer>
      <QueryClientProvider client={queryClient}>
      <AppNavigator />
      </QueryClientProvider>
    </NavigationContainer>
  );
}
