/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {execFileSync} = require('node:child_process');
const path = require('node:path');

const SCRIPT = path.join(
  __dirname,
  '..',
  'xcode',
  'resolve-prebuilt-configuration.sh',
);

function resolve(env) {
  return execFileSync('/bin/sh', [SCRIPT], {
    env: {...process.env, ...env},
    encoding: 'utf8',
  }).trim();
}

describe('resolve-prebuilt-configuration', () => {
  test('defaults to Release when no debug signals are present', () => {
    expect(
      resolve({
        CONFIGURATION: 'Release',
        POD_CONFIGURATION_DEBUG: '',
        GCC_PREPROCESSOR_DEFINITIONS: 'COCOAPODS=1',
      }),
    ).toBe('Release');
  });

  test('selects Debug when CONFIGURATION is Debug', () => {
    expect(
      resolve({
        CONFIGURATION: 'Debug',
        POD_CONFIGURATION_DEBUG: '',
        GCC_PREPROCESSOR_DEFINITIONS: 'COCOAPODS=1',
      }),
    ).toBe('Debug');
  });

  test('selects Debug when POD_CONFIGURATION_DEBUG is YES', () => {
    expect(
      resolve({
        CONFIGURATION: 'Staging',
        POD_CONFIGURATION_DEBUG: 'YES',
        GCC_PREPROCESSOR_DEFINITIONS: 'COCOAPODS=1',
      }),
    ).toBe('Debug');
  });

  test('selects Debug when DEBUG=1 is in GCC_PREPROCESSOR_DEFINITIONS', () => {
    expect(
      resolve({
        CONFIGURATION: 'Custom',
        POD_CONFIGURATION_DEBUG: '',
        GCC_PREPROCESSOR_DEFINITIONS: 'COCOAPODS=1 DEBUG=1',
      }),
    ).toBe('Debug');
  });

  test('keeps Release when hermes-engine Debug lacks DEBUG=1 (static CocoaPods shape)', () => {
    // Shared helper must not treat missing DEBUG=1 as Debug by itself —
    // CONFIGURATION / POD_CONFIGURATION_DEBUG carry that signal.
    // hermes-engine.podspec may OR HERMES_ENABLE_DEBUGGER=1 after sourcing.
    expect(
      resolve({
        CONFIGURATION: 'Release',
        POD_CONFIGURATION_DEBUG: '',
        GCC_PREPROCESSOR_DEFINITIONS: 'COCOAPODS=1 HERMES_ENABLE_DEBUGGER=1',
      }),
    ).toBe('Release');
  });
});
