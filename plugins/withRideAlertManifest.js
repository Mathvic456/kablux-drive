const { withAndroidManifest } = require('@expo/config-plugins');

const RIDE_DEEPLINK_SCHEME = 'kablux-drive';
const RIDE_DEEPLINK_HOST = 'ride';

function ensureMainActivityFlags(mainActivity) {
  mainActivity.$['android:showWhenLocked'] = 'true';
  mainActivity.$['android:turnScreenOn'] = 'true';
  mainActivity.$['android:launchMode'] = 'singleTask';
}

function ensureRideDeeplinkIntent(mainActivity) {
  mainActivity['intent-filter'] = mainActivity['intent-filter'] || [];

  const alreadyPresent = mainActivity['intent-filter'].some((filter) => {
    const data = filter.data || [];
    return data.some(
      (d) =>
        d.$ &&
        d.$['android:scheme'] === RIDE_DEEPLINK_SCHEME &&
        d.$['android:host'] === RIDE_DEEPLINK_HOST,
    );
  });

  if (alreadyPresent) return;

  mainActivity['intent-filter'].push({
    $: { 'android:autoVerify': 'false' },
    action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
    category: [
      { $: { 'android:name': 'android.intent.category.DEFAULT' } },
      { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
    ],
    data: [
      {
        $: {
          'android:scheme': RIDE_DEEPLINK_SCHEME,
          'android:host': RIDE_DEEPLINK_HOST,
        },
      },
    ],
  });
}

const withRideAlertManifest = (config) =>
  withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (!application) return cfg;

    const mainActivity = (application.activity || []).find(
      (a) => a.$ && a.$['android:name'] === '.MainActivity',
    );
    if (!mainActivity) return cfg;

    ensureMainActivityFlags(mainActivity);
    ensureRideDeeplinkIntent(mainActivity);

    return cfg;
  });

module.exports = withRideAlertManifest;
