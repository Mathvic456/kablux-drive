/**
 * Injects `use_modular_headers!` into the iOS Podfile target block.
 *
 * Why this is needed:
 *   - `expo-build-properties` is configured with `ios.useFrameworks: "static"`,
 *     which activates `use_frameworks! :linkage => :static` in the Podfile.
 *   - Under static frameworks, all pod headers must be wrapped as clang
 *     modules. React Native Firebase v24's umbrella headers transitively
 *     include non-modular headers from FirebaseCore / GoogleUtilities, which
 *     fails Xcode's strict modular include check (-Wnon-modular-include-in-
 *     framework-module, raised as -Werror), producing build errors like:
 *
 *         include of non-modular header inside framework module 'RNFBApp.*'
 *
 *   - The canonical RNFB-with-static-frameworks fix is `use_modular_headers!`
 *     applied to the entire target so CocoaPods wraps every pod as a clang
 *     module.
 *
 * Why a config plugin instead of editing the Podfile directly:
 *   - `expo prebuild` regenerates `ios/Podfile` from a template every run; any
 *     manual edit gets clobbered. This plugin re-applies the directive each
 *     prebuild via `withDangerousMod`.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'use_modular_headers!';

module.exports = function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        'Podfile',
      );
      if (!fs.existsSync(podfilePath)) return cfg;

      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (contents.includes(MARKER)) return cfg;

      // Insert immediately after `use_expo_modules!` for stable placement at
      // the top of the target block, before pod declarations.
      const replaced = contents.replace(
        /(use_expo_modules!\s*\n)/,
        `$1  ${MARKER}\n`,
      );

      if (replaced === contents) {
        // Fallback: prepend after the `target 'kabluxdrive' do` line.
        contents = contents.replace(
          /(target\s+['"][^'"]+['"]\s+do\s*\n)/,
          `$1  ${MARKER}\n`,
        );
      } else {
        contents = replaced;
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
