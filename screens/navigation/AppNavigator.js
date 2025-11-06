import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import KabluxSplashScreen from '../onboarding/KabluxSplashScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WhatDoYouDriveScreen from '../onboarding/WhatDoYouDriveScreen';
import CategorySelection from '../onboarding/CategorySelection';
import Login from '../auth/Login';
import SignUp from '../auth/SignUp';
import OTP from '../auth/OTP';
import KycScreenOne from '../kyc/KycScreenOne';
import IDVerification from '../kyc/IDVerification';
import PhotoUpload from '../kyc/PhotoUpload';
import DocumentUploads from '../kyc/DocumentUploads';
import PaymentInformation from '../kyc/PaymentInformation';
import SetPaymentInfo from '../kyc/SetPaymentInfo';
import PasskeySetup from '../auth/PasskeySetup';
import { TransitionPresets } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
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
import DrawerNavigator from './DrawerNavigator';
import DriverIncomeDashboard from '../settings/DriverIncomeDashboard';
import PriceDetails from '../ride/PriceDetails'
import RideDetails from '../ride/RideDetails'


const Stack = createStackNavigator();



const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hide header for stack if needed
           ...TransitionPresets.FadeFromBottomAndroid,

      }}
      initialRouteName='Splash'
    >
      {/* Initial screens that use Stack navigation */}
      <Stack.Screen 
        name="Splash" 
        component={KabluxSplashScreen}
      />

      <Stack.Screen 
        name="SplashTwo" 
        component={WhatDoYouDriveScreen}
      />

      <Stack.Screen
      name="PriceDetails"
      component={PriceDetails}/>

      <Stack.Screen
      name="RideDetails"
      component={RideDetails}/>



      <Stack.Screen 
        name="CategorySelection" 
        component={CategorySelection}
      />

      <Stack.Screen 
        name="Login" 
        component={Login}
      />

      <Stack.Screen 
        name="Signup" 
        component={SignUp}
      />

      <Stack.Screen 
        name="DriverIncomeDashboard" 
        component={DriverIncomeDashboard}
      />

      <Stack.Screen
        name="OTP"
        component={OTP}
      />

      <Stack.Screen 
        name="PhotoUpload" 
        component={PhotoUpload}
      />

      <Stack.Screen 
        name="Tabs" 
        component={TabNavigator}
      />





      <Stack.Screen 
        name="PaymentInformation" 
        component={PaymentInformation}
      />

      <Stack.Screen 
        name="SetPaymentInfo" 
        component={SetPaymentInfo}
      />

      <Stack.Screen 
        name="PasskeySetup" 
        component={PasskeySetup}
      />
      <Stack.Screen 
        name="Mainapp" 
        component={DrawerNavigator}
      />


      <Stack.Screen 
        name="Withdraw" 
        component={Withdraw}
      />

      <Stack.Screen 
        name="BankTransfer" 
        component={BankTransfer}
      />

      <Stack.Screen 
        name="TopUp" 
        component={TopUp}
      />

      <Stack.Screen 
        name="Settings" 
        component={Account}
      />

      <Stack.Screen 
        name="Legal" 
        component={Legal}
      />

      <Stack.Screen 
        name="City" 
        component={City}
      />

      <Stack.Screen 
        name="HelpAndSupport" 
        component={HelpAndSupport}
      />

      <Stack.Screen 
        name="LoginAndSecurity" 
        component={LoginAndSecurity}
      />

      <Stack.Screen 
        name="ReferAndEarn" 
        component={ReferAndEarn}
      />

      <Stack.Screen 
        name="SafetyActions" 
        component={SafetyActions}
      />

      <Stack.Screen 
        name="Map" 
        component={Map}
      />

      <Stack.Screen 
        name="PersonalInfo" 
        component={PersonalInfo}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;