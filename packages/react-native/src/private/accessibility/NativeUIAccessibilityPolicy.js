/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {getNativeUIAccessibilityAdapter} from './NativeUIAccessibilityPlatform';

export type NativeUIAccessibilityMode = 'legacy' | 'system-v2';
export type NativeUIAccessibilityConfigurationResult = Readonly<{
  requestedMode: NativeUIAccessibilityMode,
  effectiveMode: NativeUIAccessibilityMode,
  status: 'applied' | 'unsupported-platform',
}>;

let mode: NativeUIAccessibilityMode = 'legacy';

/**
 * Select the shared UI accessibility behavior before mounting any surfaces.
 * The version is a compatibility boundary, not a per-feature opt-in.
 * Unsupported adoption retains legacy behavior and is reported to the caller.
 */
export function configureNativeUIAccessibility(
  config: Readonly<{mode: NativeUIAccessibilityMode}>,
): NativeUIAccessibilityConfigurationResult {
  const unsupported =
    config.mode === 'system-v2' &&
    !getNativeUIAccessibilityAdapter().supportsSystemAccessibility;
  mode = unsupported ? 'legacy' : config.mode;
  return {
    requestedMode: config.mode,
    effectiveMode: mode,
    status: unsupported ? 'unsupported-platform' : 'applied',
  };
}

export function getNativeUIAccessibilityMode(): NativeUIAccessibilityMode {
  return mode;
}

export function isNativeUIAccessibilityEnabled(): boolean {
  return mode === 'system-v2';
}
