/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EdgeInsets, Metrics} from './SafeAreaViewTypes';

import NativeSafeAreaContext from '../../../src/private/specs_DEPRECATED/modules/NativeSafeAreaContext';

/**
 * Safe area metrics available synchronously at startup, read from a native
 * constant. Pass to `SafeAreaProvider`'s `initialMetrics` prop to avoid a
 * first-frame layout jump. `null` when the native module is unavailable.
 */
export const initialWindowMetrics: Metrics | null =
  NativeSafeAreaContext?.getConstants().initialWindowMetrics ?? null;

/**
 * @deprecated Use `initialWindowMetrics` instead.
 */
export const initialWindowSafeAreaInsets: EdgeInsets | void =
  initialWindowMetrics?.insets;
