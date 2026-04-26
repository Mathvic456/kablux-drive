import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import type { BubblePayload } from './BubbleOverlay.types';

type NativeModule = {
  hasPermission(): boolean;
  requestPermission(): Promise<boolean>;
  show(payload: BubblePayload): void;
  update(payload: BubblePayload): void;
  hide(): void;
  openApp(deeplink?: string | null): void;
};

const native =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<NativeModule>('BubbleOverlay')
    : null;

if (Platform.OS === 'android' && !native) {
  console.warn('🫧 [BubbleOverlay] Native module not linked. Did you rebuild after prebuild?');
}

export const BubbleOverlay = {
  isSupported: () => Platform.OS === 'android' && native != null,

  hasPermission: () => {
    try {
      const ok = native?.hasPermission() ?? false;
      console.log('🫧 [BubbleOverlay] hasPermission ->', ok);
      return ok;
    } catch (e) {
      console.warn('🫧 [BubbleOverlay] hasPermission threw', e);
      return false;
    }
  },

  requestPermission: async () => {
    if (!native) return false;
    try {
      return await native.requestPermission();
    } catch (e) {
      console.warn('🫧 [BubbleOverlay] requestPermission threw', e);
      return false;
    }
  },

  show: (payload: BubblePayload) => {
    console.log('🫧 [BubbleOverlay] show', payload);
    try {
      native?.show(payload);
    } catch (e) {
      console.warn('🫧 [BubbleOverlay] show threw', e);
    }
  },

  update: (payload: BubblePayload) => {
    console.log('🫧 [BubbleOverlay] update', payload);
    try {
      native?.update(payload);
    } catch (e) {
      console.warn('🫧 [BubbleOverlay] update threw', e);
    }
  },

  hide: () => {
    console.log('🫧 [BubbleOverlay] hide');
    try {
      native?.hide();
    } catch (e) {
      console.warn('🫧 [BubbleOverlay] hide threw', e);
    }
  },

  // Bring the app to the foreground from a backgrounded state.
  // Pass an optional deeplink path (without the scheme), e.g. "ride/<id>".
  // Requires SYSTEM_ALERT_WINDOW (granted via the bubble permission flow).
  openApp: (deeplink?: string) => {
    console.log('🫧 [BubbleOverlay] openApp', deeplink ?? '(launcher)');
    try {
      native?.openApp(deeplink ?? null);
    } catch (e) {
      console.warn('🫧 [BubbleOverlay] openApp threw', e);
    }
  },
};

export type { BubblePayload, BubbleStatus } from './BubbleOverlay.types';
