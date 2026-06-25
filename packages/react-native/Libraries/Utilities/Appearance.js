/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventSubscription} from '../vendor/emitter/EventEmitter';
import type {
  AppearancePreferences as NativeAppearancePreferences,
  ColorSchemeName,
  ColorSchemeOverride,
} from './NativeAppearance';
import typeof INativeAppearance from './NativeAppearance';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import EventEmitter from '../vendor/emitter/EventEmitter';

export type {ColorSchemeName, ColorSchemeOverride};

export type AppearancePreferences = {
  colorScheme: ColorSchemeName | null,
};

type Appearance = {
  colorScheme: ColorSchemeName | null,
};

let lazyState: ?{
  readonly NativeAppearance: INativeAppearance,
  // Cache the color scheme to reduce the cost of reading it between changes.
  // NOTE: If `NativeAppearance` is null, this will always be null.
  appearance: ?Appearance,
  // NOTE: This is non-nullable to make it easier for `onChangedListener` to
  // return a non-nullable `EventSubscription` value. This is not the common
  // path, so we do not have to over-optimize it.
  readonly eventEmitter: EventEmitter<{change: [Appearance]}>,
};

/**
 * Ensures that all state and listeners are lazily initialized correctly.
 */
function getState(): NonNullable<typeof lazyState> {
  if (lazyState != null) {
    return lazyState;
  }
  const eventEmitter = new EventEmitter<{change: [Appearance]}>();
  // NOTE: Avoid initializing `NativeAppearance` until it is actually used.
  const NativeAppearance = require('./NativeAppearance').default;
  if (NativeAppearance == null) {
    // Assign `null` to avoid re-initializing on subsequent invocations.
    lazyState = {
      NativeAppearance: null,
      appearance: null,
      eventEmitter,
    };
  } else {
    const state: NonNullable<typeof lazyState> = {
      NativeAppearance,
      appearance: null,
      eventEmitter,
    };
    new NativeEventEmitter<{
      appearanceChanged: [NativeAppearancePreferences],
    }>(NativeAppearance).addListener('appearanceChanged', newAppearance => {
      state.appearance = {
        colorScheme: newAppearance.colorScheme,
      };
      eventEmitter.emit('change', state.appearance);
    });
    lazyState = state;
  }
  return lazyState;
}

/**
 * Returns the active color scheme (`'light'` or `'dark'`). This value may
 * change at runtime, either at the system level (e.g. scheduled color scheme
 * change at sunrise or sunset) or when overridden at the app level via
 * `setColorScheme()`.
 *
 * Prefer `useColorScheme()` in React components.
 *
 * Notes:
 * - `null` will only be returned if the native Appearance module is unavailable
 *   (out of tree platforms).
 */
export function getColorScheme(): ColorSchemeName | null {
  let colorScheme = null;
  const state = getState();
  const {NativeAppearance} = state;
  if (NativeAppearance != null) {
    if (state.appearance == null) {
      // Lazily initialize `state.appearance`. This should only
      // happen once because we never reassign a null value to it.
      state.appearance = {
        colorScheme: NativeAppearance.getColorScheme(),
      };
    }
    colorScheme = state.appearance.colorScheme;
  }
  return colorScheme;
}

/**
 * Force the application to always adopt a light or dark interface style. Pass
 * `'auto'` to reset and follow the system default (removes any override).
 * This does not affect the system UI, only the application.
 */
export function setColorScheme(colorScheme: ColorSchemeOverride): void {
  const state = getState();
  const {NativeAppearance} = state;
  if (NativeAppearance != null) {
    NativeAppearance.setColorScheme(colorScheme);
    state.appearance = {
      colorScheme:
        colorScheme === 'auto' || colorScheme === 'unspecified'
          ? NativeAppearance.getColorScheme()
          : colorScheme,
    };
  }
}

/**
 * Subscribe to color scheme changes. The listener receives the new appearance
 * preferences whenever the color scheme changes, whether from a system event
 * or a call to `setColorScheme()`.
 */
export function addChangeListener(
  listener: (preferences: AppearancePreferences) => void,
): EventSubscription {
  const {eventEmitter} = getState();
  return eventEmitter.addListener('change', listener);
}
