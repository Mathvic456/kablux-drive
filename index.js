import { registerRootComponent } from 'expo';

import App from './App';
import { initFcm } from './services/fcmHandler';
import { setupCallKeep } from './services/callkeep';

// Register the FCM background message handler BEFORE the app mounts.
// This runs in a headless JS instance for killed-state delivery and must
// be in place at module load, not inside a component.
initFcm();

// CallKeep setup + listener registration at module load so cold-start
// answerCall events (user taps Answer on a killed app) find listeners
// ready once the JS runtime finishes booting.
setupCallKeep().catch((err) =>
  console.warn('⚠️ [index] setupCallKeep failed:', err)
);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
