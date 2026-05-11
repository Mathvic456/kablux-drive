import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HOLD_DURATION_MS = 1500;

const formatTime = (totalSeconds) => {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return '--:--';
  const secs = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
};

const SOSButton = ({ sosStatus, remainingSeconds, onActivate, onStop }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const completedRef = useRef(false);

  // Reset the fill animation whenever the status flips away from idle/error
  // so a fresh press starts clean.
  useEffect(() => {
    if (sosStatus !== 'idle' && sosStatus !== 'error') {
      fillAnim.setValue(0);
      completedRef.current = false;
    }
  }, [sosStatus, fillAnim]);

  const handlePressIn = () => {
    if (sosStatus !== 'idle' && sosStatus !== 'error') return;
    completedRef.current = false;
    fillAnim.setValue(0);
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !completedRef.current) {
        completedRef.current = true;
        onActivate?.();
      }
    });
  };

  const handlePressOut = () => {
    if (completedRef.current) return;
    Animated.timing(fillAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).stop();
    fillAnim.setValue(0);
  };

  const handleTap = () => {
    if (sosStatus === 'recording') onStop?.();
  };

  const isConnecting = sosStatus === 'connecting';
  const isRecording = sosStatus === 'recording';
  const isError = sosStatus === 'error';
  const isIdle = sosStatus === 'idle';

  const backgroundColor = isRecording
    ? '#b71c1c'
    : isError
      ? '#f44336'
      : '#f44336';

  const label = isRecording
    ? 'Stop SOS'
    : isError
      ? 'Retry SOS'
      : isIdle
        ? 'Hold for SOS'
        : 'SOS';

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable
      style={[styles.button, { backgroundColor }, isConnecting && styles.disabled]}
      onPressIn={isRecording ? undefined : handlePressIn}
      onPressOut={isRecording ? undefined : handlePressOut}
      onPress={isRecording ? handleTap : undefined}
      disabled={isConnecting}
    >
      {/* Progress fill during long-press */}
      {!isRecording && !isConnecting && (
        <Animated.View
          pointerEvents="none"
          style={[styles.fill, { width: fillWidth }]}
        />
      )}

      <View style={styles.content}>
        {isConnecting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="help-buoy" size={18} color="white" />
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
            {isRecording && (
              <Text style={styles.countdown} numberOfLines={1}>
                {formatTime(remainingSeconds)}
              </Text>
            )}
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    paddingHorizontal: 5,
  },
  disabled: {
    opacity: 0.6,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
  },
  countdown: {
    color: '#fff',
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    marginLeft: 4,
  },
});

export default SOSButton;
