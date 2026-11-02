/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const path = require('node:path');

// Package directories whose sources must be transformed rather than ignored.
const RN = '(jest-)?react-native';
const RN_SCOPE = '@react-native(-community)?';

// Yarn pnpm-mode names every store entry `<flat-name>-<protocol>-<hash>`,
// where `<protocol>` is how the package was resolved. `npm` is the only one
// that also carries the version. A package declaring peer dependencies
// resolves as `virtual` regardless of where it came from. Observed under Yarn
// 4.18: `react-native-npm-1000.0.0-30881e83e6`, `react-native-file-d30a842e27`,
// `is-odd-patch-cfbe751c88`. Listing the protocols explicitly rather than
// accepting any word keeps `react-native-reanimated-npm-1.0.0-<hash>` from
// matching with `reanimated` in the protocol position.
const STORE_PROTOCOL = 'virtual|patch|file|portal|link|exec|workspace';
const STORE_SUFFIX = `(-npm-[^\\/]+|-(?:${STORE_PROTOCOL})-[0-9a-f]+)`;

// Locations, one per install layout, where a react-native package directory
// may legitimately sit. Each is an alternative of a single negative lookahead
// applied after `node_modules/`, so anything not listed here stays ignored.
//
// The prefixes are anchored instead of allowing arbitrary leading segments.
// Without that anchoring, a scoped third-party package whose unscoped name is
// exactly `react-native` (`@sentry/react-native`, `@notifee/react-native`) or
// a directory literally named `react-native` nested inside an unrelated
// package would match and be transformed.
const TRANSFORMED_PACKAGE_LAYOUTS = [
  // Classic `node_modules/react-native/...`, and pnpm's
  // `node_modules/.pnpm/<id>/node_modules/react-native/...` — the same shape
  // behind an optional store prefix. The trailing `[\/]` is required: without
  // it the package name would also match a longer one it merely prefixes, so
  // `react-native-reanimated` would be transformed. Yarn's `-virtual-<hash>`
  // entries are deliberately not accepted here — they only ever appear under
  // `.store/`, which the next alternative handles.
  `(\\.pnpm/([^\\/]+/)?node_modules/)?(${RN}|${RN_SCOPE})[\\/]`,

  // Yarn pnpm-mode's content store:
  // `node_modules/.store/<flat>-<protocol>-<hash>/package/...`, where `<flat>`
  // is the package name with its scope slash flattened to a dash.
  //
  // The scope segment `(?:-[^-\/]+)*` must keep `-` out of its inner class.
  // Allowing it there lets the segment consume dashes itself, which gives a
  // dash-separated name exponentially many possible partitions and makes any
  // near-miss path under `.store/@react-native-...` backtrack catastrophically.
  // Jest tests this pattern against every candidate file path, so a single
  // such path would hang the run.
  //
  // Flattening erases the scope boundary here, so a third-party
  // `@react-native-<scope>/*` package (e.g.
  // `@react-native-async-storage/async-storage`) is indistinguishable from a
  // genuine `@react-native/*` one and is transformed too. Transforming is the
  // safe direction — missing one would ship untransformed sources — and the
  // cost is performance only, confined to Yarn pnpm-mode.
  `\\.store/(${RN}${STORE_SUFFIX}|${RN_SCOPE}(?:-[^-\\/]+)*${STORE_SUFFIX})/package/`,
];

module.exports = {
  haste: {
    defaultPlatform: 'ios',
    platforms: ['android', 'ios', 'native'],
  },
  moduleNameMapper: {
    // These secondary entry points are exposed via the package's `exports`,
    // but `./jest/resolver.js` strips `exports` and the generic mapper below
    // resolves subpaths as literal directory paths. Alias them explicitly so
    // they resolve to their `src/` implementations.
    '^react-native/react-private-interface$': `${path.dirname(require.resolve('react-native'))}/src/react-private-interface.js`,
    '^react-native/setup-env$': `${path.dirname(require.resolve('react-native'))}/src/setup-env.js`,
    '^react-native/unstable-internals-do-not-use$': `${path.dirname(require.resolve('react-native'))}/src/unstable-internals-do-not-use.js`,
    '^react-native($|/.*)': `${path.dirname(require.resolve('react-native'))}/$1`,
  },
  resolver: require.resolve('./jest/resolver.js'),
  transform: {
    // Resolve from the preset's own scope so strict-isolation installs
    // (pnpm / Yarn pnpm-mode) find the transformer without relying on
    // hoisting or a consumer devDependency.
    '^.+\\.(js|ts|tsx)$': require.resolve('babel-jest'),
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      require.resolve('./jest/assetFileTransformer.js'),
  },
  transformIgnorePatterns: [
    `node_modules/(?!${TRANSFORMED_PACKAGE_LAYOUTS.join('|')})`,
  ],
  setupFiles: [require.resolve('./jest/setup.js')],
  testEnvironment: require.resolve('./jest/react-native-env.js'),
};
