/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {NativeEventSubscription} from '../EventEmitter/RCTNativeAppEventEmitter';

type ColorSchemeName = 'light' | 'dark';

type ColorSchemeOverride =
  | ColorSchemeName
  | 'auto'
  /** @deprecated Use 'auto' instead */
  | 'unspecified';

export namespace Appearance {
  type AppearancePreferences = {
    colorScheme: ColorSchemeName | null;
  };

  type AppearanceListener = (preferences: AppearancePreferences) => void;

  /**
   * Returns the active color scheme (`'light'` or `'dark'`). This value may
   * change at runtime, either at the system level (e.g. scheduled color scheme
   * change at sunrise or sunset) or when overridden at the app level via
   * `setColorScheme()`.
   *
   * Prefer `useColorScheme()` in React components.
   *
   * Notes:
   * - `null` will only be returned if the native Appearance module is
   *   unavailable (out of tree platforms).
   */
  export function getColorScheme(): ColorSchemeName | null;

  /**
   * Force the application to always adopt a light or dark interface style. Pass
   * `'auto'` to reset and follow the system default (removes any override).
   * This does not affect the system UI, only the application.
   */
  export function setColorScheme(scheme: ColorSchemeOverride): void;

  /**
   * Subscribe to color scheme changes. The listener receives the new appearance
   * preferences whenever the color scheme changes, whether from a system event
   * or a call to `setColorScheme()`.
   */
  export function addChangeListener(
    listener: AppearanceListener,
  ): NativeEventSubscription;
}

/**
 * Returns the active color scheme (`'light'` or `'dark'`). Automatically
 * re-renders the component when the color scheme changes.
 *
 * Notes:
 * - `null` will only be returned if the native Appearance module is unavailable
 *   (out of tree platforms).
 */
export function useColorScheme(): ColorSchemeName | null;
