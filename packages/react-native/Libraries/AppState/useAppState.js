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

import type {AppStateStatus} from './AppState';

import AppState from './AppState';
import {useSyncExternalStore} from 'react';

const subscribe = (onStoreChange: () => void) => {
  const subscription = AppState.addEventListener('change', onStoreChange);
  return () => subscription.remove();
};

const getSnapshot = (): AppStateStatus => {
  return AppState.currentState ?? 'unknown';
};

/**
 * `useAppState` is a React hook that returns the current app state.
 *
 * The value will be one of:
 * - `active` - The app is running in the foreground
 * - `background` - The app is running in the background
 * - `inactive` - (iOS only) Transitioning between foreground and background
 * - `unknown` - The initial state before the app state is determined
 *
 * The hook automatically subscribes to app state changes and re-renders the
 * component when the state changes.
 *
 * Usage:
 * ```
 * function MyComponent() {
 *   const appState = useAppState();
 *
 *   useEffect(() => {
 *     if (appState === 'active') {
 *       // App came to foreground - refresh data
 *     }
 *   }, [appState]);
 *
 *   return <Text>App is {appState}</Text>;
 * }
 * ```
 *
 * See https://reactnative.dev/docs/appstate
 */
export default function useAppState(): AppStateStatus {
  return useSyncExternalStore(subscribe, getSnapshot);
}
