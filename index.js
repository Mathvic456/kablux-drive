import { registerRootComponent } from 'expo';

import App from './App';
import { initFcm } from './services/fcmHandler';
import { setupRingingNotification } from './services/ringingNotification';

// Register the FCM background message handler BEFORE the app mounts.
// This runs in a headless JS instance for killed-state delivery and must
// be in place at module load, not inside a component.
initFcm();

// Register notifee foreground + background event handlers so action-
// button taps (Accept / Decline) are processed, including from a killed
// app state. Must run at module load to install the background handler.
setupRingingNotification();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
