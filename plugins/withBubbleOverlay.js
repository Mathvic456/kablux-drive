const { withAndroidManifest } = require('@expo/config-plugins');

const SERVICE_NAME = 'expo.modules.bubbleoverlay.BubbleService';
const FGS_TYPE = 'specialUse';

function ensureBubbleService(application) {
  application.service = application.service || [];

  const exists = application.service.some(
    (s) => s.$ && s.$['android:name'] === SERVICE_NAME,
  );
  if (exists) return;

  application.service.push({
    $: {
      'android:name': SERVICE_NAME,
      'android:exported': 'false',
      'android:foregroundServiceType': FGS_TYPE,
    },
    'property': [
      {
        $: {
          'android:name':
            'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
          'android:value':
            'Floating ride status overlay shown only while a driver is actively on a trip and the app is backgrounded.',
        },
      },
    ],
  });
}

const withBubbleOverlay = (config) =>
  withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (!application) return cfg;
    ensureBubbleService(application);
    return cfg;
  });

module.exports = withBubbleOverlay;
