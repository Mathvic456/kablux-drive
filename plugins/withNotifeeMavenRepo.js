const { withProjectBuildGradle } = require('@expo/config-plugins');

const MARKER = '// >>> notifee local maven repo';
const SNIPPET = `
${MARKER}
allprojects {
  repositories {
    maven {
      url("\${rootProject.projectDir}/../node_modules/@notifee/react-native/android/libs")
    }
  }
}
`;

const withNotifeeMavenRepo = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes(MARKER)) return cfg;
    cfg.modResults.contents = cfg.modResults.contents + '\n' + SNIPPET;
    return cfg;
  });

module.exports = withNotifeeMavenRepo;
