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
 * Returns the active color scheme (`'light'` or `'dark'`). Automatically
 * re-renders the component when the color scheme changes.
 *
 * Notes:
 * - `null` will only be returned if the native Appearance module is unavailable
 *   (out of tree platforms).
 */
export default function useColorScheme(): ColorSchemeName | null {
  return useSyncExternalStore(subscribe, getColorScheme);
}
