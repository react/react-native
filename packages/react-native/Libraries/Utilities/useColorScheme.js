/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {ColorSchemeName} from './NativeAppearance';

import {addChangeListener, getColorScheme} from './Appearance';
import {useSyncExternalStore} from 'react';

const subscribe = (onStoreChange: () => void) => {
  const appearanceSubscription = addChangeListener(onStoreChange);
  return () => appearanceSubscription.remove();
};

/**
 * React hook that provides and subscribes to color scheme updates from the
 * `Appearance` module. Returns `'light'`, `'dark'`, or `null`.
 *
 * Notes:
 * - `null` will only be returned if the native Appearance module is unavailable
 *   (out of tree platforms).
 *
 * @see https://reactnative.dev/docs/usecolorscheme
 */
export default function useColorScheme(): ColorSchemeName | null {
  return useSyncExternalStore(subscribe, getColorScheme);
}
