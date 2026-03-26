import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import Leaderboard from '../dashboard/Leaderboard';
import Ratings from '../settings/Ratings';
import Settings from '../settings/Settings';
import TabNavigator from './TabNavigator';
import DriverIncomeDashboard from '../settings/DriverIncomeDashboard';
import DocumentUploads from '../kyc/DocumentUploads';
import OrderScreen from '../dashboard/OrderScreen';
import DriverMapScreen from '../dashboard/DriverMapScreen';
import DriverChatScreen from '../dashboard/DriverChatScreen';
import Withdraw from '../wallet/Withdraw';
import BankTransfer from '../wallet/BankTransfer';
import TopUp from '../wallet/TopUp';
import Account from '../settings/Account';
import Legal from '../settings/Legal';
import City from '../settings/City';
import HelpAndSupport from '../settings/HelpAndSupport';
import LoginAndSecurity from '../settings/LoginAndSecurity';
import ReferAndEarn from '../settings/ReferAndEarn';
import SafetyActions from '../settings/SafetyActions';
import PersonalInfo from '../settings/PersonalInfo';
import IDVerification from '../kyc/new-kyc-flow/ID-verification';
import CarDetails from '../kyc/new-kyc-flow/Car-details';
import BankDetails from '../kyc/new-kyc-flow/BankDetails';
import AddPhotos from '../kyc/new-kyc-flow/AddPhotos';

const Stack = createStackNavigator();

export default function MainStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Dashboard Screens */}
      <Stack.Screen name="Leaderboard" component={Leaderboard} />
      <Stack.Screen name="Ratings" component={Ratings} />
      <Stack.Screen name="SettingsScreen" component={Settings} />
      <Stack.Screen name="DriverIncomeDashboard" component={DriverIncomeDashboard} />

      {/* App Screens */}
      <Stack.Screen name="DocumentUploads" component={DocumentUploads} />
      <Stack.Screen name="OrderScreen" component={OrderScreen} />
      <Stack.Screen name="DriverMapScreen" component={DriverMapScreen} />
      <Stack.Screen name="DriverChat" component={DriverChatScreen} />
      <Stack.Screen name="Withdraw" component={Withdraw} />
      <Stack.Screen name="BankTransfer" component={BankTransfer} />
      <Stack.Screen name="TopUp" component={TopUp} />
      <Stack.Screen name="Settings" component={Account} />
      <Stack.Screen name="Legal" component={Legal} />
      <Stack.Screen name="City" component={City} />
      <Stack.Screen name="HelpAndSupport" component={HelpAndSupport} />
      <Stack.Screen name="LoginAndSecurity" component={LoginAndSecurity} />
      <Stack.Screen name="ReferAndEarn" component={ReferAndEarn} />
      <Stack.Screen name="SafetyActions" component={SafetyActions} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfo} />
      <Stack.Screen name="IDVerify" component={IDVerification} />
      <Stack.Screen name="CarDetails" component={CarDetails} />
      <Stack.Screen name="BankDetails" component={BankDetails} />
      <Stack.Screen name="AddPhotos" component={AddPhotos} />
    </Stack.Navigator>
  );
}
