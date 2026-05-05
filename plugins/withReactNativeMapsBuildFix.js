/**
 * Tames `react-native-maps` and `react-native-google-maps` under
 * `use_frameworks! :static` by setting two build settings on each target:
 *
 *   1. `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES`
 *   2. `DEFINES_MODULE = NO`
 *
 * Why this is needed:
 *   - `expo-build-properties` is configured with `ios.useFrameworks: "static"`
 *     (RNFB requirement), which activates `use_frameworks! :linkage => :static`
 *     in the Podfile. Under that mode every pod is built as a clang framework
 *     module by default.
 *   - The maps headers (e.g. `AIRMap.h`, `AIRGoogleMapMarkerManager.h`)
 *     `#import <React/RCT*.h>` directly. Without setting (1), Clang rejects
 *     the include with `-Werror,-Wnon-modular-include-in-framework-module`.
 *   - With (1) alone, Clang then captures the React-Core declarations into
 *     `react_native_maps.<header>` submodules. Because both pods share the
 *     same React-Core symbols, `react-native-google-maps` then trips a hard
 *     "declaration of 'RCTViewManager' must be imported from module
 *     'react_native_maps.AIRMapCalloutManager' before it is required" error.
 *   - Setting (2) `DEFINES_MODULE = NO` stops Cocoapods from generating a
 *     module map for these pods, which removes the captured submodules and
 *     the cross-pod redeclaration conflict. The pods still build and link as
 *     frameworks; consumers reach their headers via header search paths
 *     rather than `@import`, which is how React Native auto-linking already
 *     wires them up.
 *
 * Why a config plugin instead of editing the Podfile directly:
 *   - `expo prebuild` regenerates `ios/Podfile` from a template every run; any
 *     manual edit gets clobbered. This plugin re-applies the directives each
 *     prebuild via `withDangerousMod`.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES';

const SNIPPET = `    installer.pods_project.targets.each do |target|
      if ['react-native-maps', 'react-native-google-maps'].include?(target.name)
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          config.build_settings['DEFINES_MODULE'] = 'NO'
        end
      end
    end
`;

module.exports = function withReactNativeMapsBuildFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        'Podfile',
      );
      if (!fs.existsSync(podfilePath)) return cfg;

      const contents = fs.readFileSync(podfilePath, 'utf8');
      if (contents.includes(MARKER)) return cfg;

      // Inject inside the existing `post_install do |installer|` block,
      // immediately after the `react_native_post_install(...)` call.
      const replaced = contents.replace(
        /(react_native_post_install\([\s\S]*?\)\s*\n)/,
        `$1\n${SNIPPET}`,
      );

      if (replaced === contents) {
        console.warn(
          '[withReactNativeMapsBuildFix] could not find react_native_post_install in Podfile — skipped',
        );
        return cfg;
      }

      fs.writeFileSync(podfilePath, replaced);
      return cfg;
    },
  ]);
};
