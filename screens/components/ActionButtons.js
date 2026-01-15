import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  useWindowDimensions,
  Dimensions 
} from 'react-native';
import { MaterialIcons, Entypo } from '@expo/vector-icons';

export default function ActionButtons({ label, icon, onPress }) {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isLargeScreen = width > 414;
  const isTablet = width > 768;

  // Calculate responsive sizes
  const buttonPaddingVertical = isSmallScreen ? height * 0.016 : height * 0.018;
  const buttonPaddingHorizontal = isSmallScreen ? width * 0.04 : width * 0.045;
  const buttonMarginBottom = isSmallScreen ? 8 : 10;
  const buttonBorderRadius = isSmallScreen ? 10 : 12;
  const iconGap = isSmallScreen ? 8 : 10;
  const fontSize = isSmallScreen ? 14 : 15;
  const iconSize = isSmallScreen ? 16 : 18;

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        {
          paddingVertical: buttonPaddingVertical,
          paddingHorizontal: buttonPaddingHorizontal,
          marginBottom: buttonMarginBottom,
          borderRadius: buttonBorderRadius,
        },
        isLargeScreen && styles.buttonLarge,
        isTablet && styles.buttonTablet
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.leftRow,
        { gap: iconGap }
      ]}>
        {React.cloneElement(icon, {
          size: iconSize,
          color: icon.props.color || '#FFC107'
        })}
        <Text style={[
          styles.label,
          isSmallScreen && styles.labelSmall,
          isLargeScreen && styles.labelLarge,
          isTablet && styles.labelTablet
        ]}>
          {label}
        </Text>
      </View>
      <Entypo 
        name="chevron-right" 
        size={iconSize} 
        color="white" 
      />
    </TouchableOpacity>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: width * 0.03,
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.045,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.012,
    width: '100%',
    minHeight: height * 0.06,
  },
  buttonLarge: {
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
    borderRadius: width * 0.035,
  },
  buttonTablet: {
    paddingVertical: height * 0.022,
    paddingHorizontal: width * 0.06,
    marginBottom: height * 0.018,
    borderRadius: width * 0.04,
    maxWidth: 600,
    alignSelf: 'center',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.025,
    flex: 1,
  },
  label: {
    color: 'white',
    fontSize: width * 0.04,
    fontWeight: '500',
    flexShrink: 1,
  },
  labelSmall: {
    fontSize: width * 0.038,
  },
  labelLarge: {
    fontSize: width * 0.042,
  },
  labelTablet: {
    fontSize: width * 0.045,
  },
});