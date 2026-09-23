/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {AppStateStatus} from './AppState';

/**
 * `useAppState` is a React hook that returns the current app state.
 * The component will re-render whenever the app state changes.
 *
 * Returns one of: 'active', 'background', 'inactive', 'unknown', or 'extension'.
 *
 * @see https://reactnative.dev/docs/appstate
 */
export default function useAppState(): AppStateStatus;
