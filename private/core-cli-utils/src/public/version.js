/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Usage:
//
// > const semver = require('semver');
// > semver.satisfies(process.env.ANDROID_SDK, android.ANDROID_SDK);
// true
//
// The version of @react-native/core-cli-utils matches a particular version
// of react-native.  For example:
//
// > npm info @react-native/core-cli-util@latest --json | jq '.version'
// > "0.75.0"
//
// Means that:
// > require('@react-native/core-cli-utils/versions.js').apple.XCODE
// > ">= 12.x"
//
// For react-native@0.75.0 you have to have a version of XCode >= 12

const android = {
  ANDROID_NDK: '>= 23.x',
  ANDROID_SDK: '>= 33.x',
};

const apple = {
  COCOAPODS: '>= 1.10.0',
  XCODE: '>= 12.x',
};

const common = {
  BUN: '>= 1.0.0',
  JAVA: '>= 17 <= 20',
  NODE_JS: '>= 18',
  NPM: '>= 4.x',
  RUBY: '>= 2.6.10',
  YARN: '>= 1.10.x',
};

const all = {
  ...apple,
  ...android,
  ...common,
};

module.exports = {all, android, apple, common};
