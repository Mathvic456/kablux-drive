const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const SOURCE_DIR = 'assets/notification-icons';
const ICON_NAME = 'ic_notification.png';

// Copies pre-built white-silhouette notification icons from
// assets/notification-icons/{density}/ic_notification.png into
// android/app/src/main/res/drawable-{density}/ic_notification.png
// so they survive `expo prebuild --clean`.
const withNotificationIcon = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const resRoot = path.join(platformRoot, 'app', 'src', 'main', 'res');

      for (const density of DENSITIES) {
        const src = path.join(projectRoot, SOURCE_DIR, density, ICON_NAME);
        const destDir = path.join(resRoot, `drawable-${density}`);
        const dest = path.join(destDir, ICON_NAME);

        if (!fs.existsSync(src)) {
          console.warn(`[withNotificationIcon] missing source: ${src}`);
          continue;
        }
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
      }

      return cfg;
    },
  ]);

module.exports = withNotificationIcon;
