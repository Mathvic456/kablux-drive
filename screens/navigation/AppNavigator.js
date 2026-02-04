import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import KabluxSplashScreen from '../onboarding/KabluxSplashScreen';
import WhatDoYouDriveScreen from '../onboarding/WhatDoYouDriveScreen';
import CategorySelection from '../onboarding/CategorySelection';
import Login from '../auth/Login';
import SignUp from '../auth/SignUp';
import OTP from '../auth/OTP';
import KycScreenOne from '../kyc/KycScreenOne';
import PhotoUpload from '../kyc/PhotoUpload';
import PaymentInformation from '../kyc/PaymentInformation';
import SetPaymentInfo from '../kyc/SetPaymentInfo';
import PasskeySetup from '../auth/PasskeySetup';
import { TransitionPresets } from '@react-navigation/stack';
import ResetPasswordEmailScreen from '../auth/ResetPasswordEmailScreen';
import ResetCredentialsScreen from '../auth/ResetCredentialsScreen';
import DynamicPayStackWebViewScreen from '../dashboard/PaystackWebView';
import DrawerNavigator from './DrawerNavigator';
import PriceDetails from '../ride/PriceDetails';
import RideDetails from '../ride/RideDetails';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.FadeFromBottomAndroid,
      }}
      initialRouteName='Splash'
    >
      {/* Auth & Onboarding Screens */}
      <Stack.Screen name="Splash" component={KabluxSplashScreen} />
      <Stack.Screen name="SplashTwo" component={WhatDoYouDriveScreen} />
      <Stack.Screen name="CategorySelection" component={CategorySelection} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="ResetPasswordEmail" component={ResetPasswordEmailScreen} />
      <Stack.Screen name="ResetCredentials" component={ResetCredentialsScreen} />
      <Stack.Screen name="Signup" component={SignUp} />
      <Stack.Screen name="OTP" component={OTP} />
      <Stack.Screen name='KycScreenOne' component={KycScreenOne} />
      <Stack.Screen name="PhotoUpload" component={PhotoUpload} />
      <Stack.Screen name="PaymentInformation" component={PaymentInformation} />
      <Stack.Screen name="SetPaymentInfo" component={SetPaymentInfo} />
      <Stack.Screen name="PasskeySetup" component={PasskeySetup} />

      {/* Main App - Drawer contains everything else */}
      <Stack.Screen
        name="Mainapp"
        component={DrawerNavigator}
        options={{ gestureEnabled: false }}
      />

      {/* Standalone modals that need to be outside drawer */}
      <Stack.Screen name="PaystackWebView" component={DynamicPayStackWebViewScreen} />
      <Stack.Screen name="PriceDetails" component={PriceDetails} />
      <Stack.Screen name="RideDetails" component={RideDetails} />
    </Stack.Navigator>
  );
};

export default AppNavigator;