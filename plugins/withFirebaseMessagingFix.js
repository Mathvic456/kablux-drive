const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFirebaseMessagingFix(config) {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const mainApplication = androidManifest.manifest.application[0];

        const metaData = mainApplication['meta-data'] || [];

        const target = metaData.find(
            (item) =>
                item.$['android:name'] ===
                'com.google.firebase.messaging.default_notification_color'
        );

        if (target) {
            target.$['tools:replace'] = 'android:resource';
        }

        // Ensure tools namespace is declared
        androidManifest.manifest.$['xmlns:tools'] =
            'http://schemas.android.com/tools';

        return config;
    });
};