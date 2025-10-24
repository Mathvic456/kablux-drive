import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  View,
  Image,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const KabluxLogo = require('./../../assets/Logo.png');

const KabluxSplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // for fade in/out
  const translateY = useRef(new Animated.Value(-100)).current; // start above screen
  const navigation = useNavigation();


  useEffect(() => {
    // Start the animation sequence
    Animated.sequence([
      // Delay before logo appears
      Animated.delay(2000),

      // Fade in + slide down
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),

      // Stay visible briefly
      Animated.delay(1500),

      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
     
      checkToken();
    });
  }, [fadeAnim, translateY, navigation]);

    async function checkToken() {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        navigation.replace('Tabs');
      } else {
        navigation.replace('Login');
      }
    };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Animated.Image
        source={KabluxLogo}
        style={[
          styles.logoImage,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 50,
  },
});

export default KabluxSplashScreen;
