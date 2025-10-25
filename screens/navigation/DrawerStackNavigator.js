import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import KabluxSplashScreen from '../onboarding/KabluxSplashScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Leaderboard from '../dashboard/Leaderboard';
import Ratings from '../settings/Ratings';
import Settings from '../settings/Settings';


const Stack = createStackNavigator();

const DrawerStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hide header for stack if needed
           ...TransitionPresets.FadeFromBottomAndroid,

      }}
    >

      <Stack.Screen 
        name="Leaderboard" 
        component={Leaderboard}
      />

      <Stack.Screen 
        name="Ratings" 
        component={Ratings}
      />

      <Stack.Screen 
        name="Settings" 
        component={Settings}
      />
      
      
    </Stack.Navigator>
  );
};

export default DrawerStackNavigator;