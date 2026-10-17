/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);

const ANDROID_ENVIRONMENT = {
  apiLevel: 35,
  abi: 'x86_64',
  nativeBridge: 'libndk_translation.so',
  systemImage:
    'google/sdk_gphone64_x86_64/emu64xa:15/AE3A/1:userdebug/dev-keys',
  screenSize: '1080x2400',
  density: 420,
  fontScale: '1.0',
  locale: 'en-US',
  animatorDurationScale: '0.0',
  emulatorVersion: '37.2.12',
};

module.exports = {ANDROID_ENVIRONMENT, SHA_A, SHA_B};
