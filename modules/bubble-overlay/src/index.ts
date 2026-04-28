import { requireOptionalNativeModule } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';

type NativeModule = {
  hasPermission(): boolean;
  requestPermission(): Promise<boolean>;
  show(): void;
  update(): void;
  hide(): void;
  openApp(deeplink?: string | null): void;
  addListener(eventName: 'onDismissed', listener: () => void): EventSubscription;
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

  show: () => {
    console.log('🫧 [BubbleOverlay] show');
    try {
      native?.show();
    } catch (e) {
      console.warn('🫧 [BubbleOverlay] show threw', e);
    }
  },

  update: () => {
    console.log('🫧 [BubbleOverlay] update');
    try {
      native?.update();
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

  // Fires when the user drags the bubble onto the trash zone to dismiss it.
  // Returns a subscription with .remove(); no-op on platforms without the module.
  addDismissListener: (listener: () => void): { remove: () => void } => {
    if (!native?.addListener) return { remove: () => {} };
    try {
      const sub = native.addListener('onDismissed', listener);
      return { remove: () => sub.remove() };
    } catch (e) {
      console.warn('🫧 [BubbleOverlay] addDismissListener threw', e);
      return { remove: () => {} };
    }
  },
};

export type { BubbleEvents } from './BubbleOverlay.types';
