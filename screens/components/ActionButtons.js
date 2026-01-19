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
  const screenHeight = Dimensions.get('window').height;
  const isShortScreen = screenHeight < 700;

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        isSmallScreen && styles.buttonSmall,
        isLargeScreen && styles.buttonLarge,
        isTablet && styles.buttonTablet,
        isShortScreen && styles.buttonShort
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.leftRow,
        isShortScreen && styles.leftRowShort
      ]}>
        {React.cloneElement(icon, {
          size: isSmallScreen ? 16 : isShortScreen ? 14 : 20,
          color: icon.props.color || '#FFC107'
        })}
        <Text style={[
          styles.label,
          isSmallScreen && styles.labelSmall,
          isLargeScreen && styles.labelLarge,
          isTablet && styles.labelTablet,
          isShortScreen && styles.labelShort
        ]}>
          {label}
        </Text>
      </View>
      <Entypo 
        name="chevron-right" 
        size={isSmallScreen ? 16 : isShortScreen ? 14 : 20} 
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
    borderRadius: Math.min(width * 0.03, 12),
    paddingVertical: Math.min(height * 0.018, 16),
    paddingHorizontal: Math.min(width * 0.045, 20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.min(height * 0.012, 10),
    width: '100%',
    minHeight: Math.min(height * 0.06, 48),
  },
  buttonSmall: {
    borderRadius: Math.min(width * 0.025, 10),
    paddingVertical: Math.min(height * 0.016, 14),
    paddingHorizontal: Math.min(width * 0.04, 16),
    marginBottom: Math.min(height * 0.01, 8),
    minHeight: Math.min(height * 0.055, 44),
  },
  buttonLarge: {
    borderRadius: Math.min(width * 0.035, 14),
    paddingVertical: Math.min(height * 0.02, 18),
    paddingHorizontal: Math.min(width * 0.05, 24),
    marginBottom: Math.min(height * 0.015, 12),
    minHeight: Math.min(height * 0.065, 52),
  },
  buttonTablet: {
    borderRadius: Math.min(width * 0.04, 16),
    paddingVertical: Math.min(height * 0.022, 20),
    paddingHorizontal: Math.min(width * 0.06, 28),
    marginBottom: Math.min(height * 0.018, 14),
    minHeight: Math.min(height * 0.07, 56),
    maxWidth: 600,
    alignSelf: 'center',
  },
  buttonShort: {
    borderRadius: Math.min(width * 0.025, 10),
    paddingVertical: Math.min(height * 0.014, 12),
    paddingHorizontal: Math.min(width * 0.035, 14),
    marginBottom: Math.min(height * 0.008, 6),
    minHeight: Math.min(height * 0.05, 40),
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.min(width * 0.025, 12),
    flex: 1,
  },
  leftRowShort: {
    gap: Math.min(width * 0.02, 8),
  },
  label: {
    color: 'white',
    fontSize: Math.min(width * 0.04, 16),
    fontWeight: '500',
    flexShrink: 1,
  },
  labelSmall: {
    fontSize: Math.min(width * 0.038, 14),
  },
  labelLarge: {
    fontSize: Math.min(width * 0.042, 18),
  },
  labelTablet: {
    fontSize: Math.min(width * 0.045, 20),
  },
  labelShort: {
    fontSize: Math.min(width * 0.036, 13),
  },
});
