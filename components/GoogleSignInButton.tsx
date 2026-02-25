import { FontAwesome } from '@expo/vector-icons';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

interface GoogleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function GoogleSignInButton({
  onPress,
  disabled,
  loading,
}: GoogleSignInButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.googleBtn, (disabled || loading) && styles.googleBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" style={styles.googleIcon} />
      ) : (
        <FontAwesome name="google" size={20} color="#fff" style={styles.googleIcon} />
      )}
      <Text style={styles.googleText}>Sign in with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: '#fcbf24',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  googleBtnDisabled: { opacity: 0.7 },
  googleIcon: { marginRight: 10 },
  googleText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});