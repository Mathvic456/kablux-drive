import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const KabluxLogo = require('./../../assets/Logo.png');

const CategorySelection = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const categories = ['Kablux Standard', 'Kablux Business', 'Kablux Premium'];

  const handlePress = (category) => {
    setSelectedCategory(category);

    // Animate shrink + fade
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Navigate after animation
      navigation.replace('Login'); // change to your next screen name
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={KabluxLogo} style={styles.logoImage} resizeMode="contain" />
      </View>

      {/* Title + Subtitle */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Select Category</Text>
        <Text style={styles.subtitle}>
          premium and prestige are our daily goal at a cheap rate
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryButton,
                isSelected && styles.categoryButtonSelected,
              ]}
              onPress={() => handlePress(category)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  isSelected && styles.categoryButtonTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  logoContainer: {
    position: 'absolute',
    top: 70,
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 35,
  },

  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#B3B3B3',
    textAlign: 'center',
    lineHeight: 20,
    width: '90%',
  },

  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },

  // Default Button
  categoryButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  categoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Highlighted (when selected)
  categoryButtonSelected: {
    backgroundColor: '#FFD54F',
    borderColor: '#FFD54F',
  },
  categoryButtonTextSelected: {
    color: '#000',
    fontWeight: '700',
  },
});

export default CategorySelection;
