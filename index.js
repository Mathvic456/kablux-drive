import { registerRootComponent } from 'expo';

import App from './App';
import { initFcm } from './services/fcmHandler';

// Register the FCM background message handler BEFORE the app mounts.
// This runs in a headless JS instance for killed-state delivery and must
// be in place at module load, not inside a component.
initFcm();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
