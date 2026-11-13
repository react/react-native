/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {StatusBarVerticalBarEdgeIOS} from './StatusBar';

import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import Platform from '../../Utilities/Platform';
import NativeStatusBarManagerIOS from './NativeStatusBarManagerIOS';
import StatusBar from './StatusBar';
import {useSyncExternalStore} from 'react';

// Read once and refreshed by events, so renders don't each call into native.
let cachedEdge: ?StatusBarVerticalBarEdgeIOS;

function subscribe(onStoreChange: () => void): () => void {
  if (Platform.OS !== 'ios') {
    return () => {};
  }
  cachedEdge = StatusBar.getVerticalBarEdgeIOS();
  const subscription = new NativeEventEmitter<{
    verticalBarEdgeDidChange: [{edge: ?string}],
  }>(NativeStatusBarManagerIOS).addListener('verticalBarEdgeDidChange', () => {
    cachedEdge = StatusBar.getVerticalBarEdgeIOS();
    onStoreChange();
  });
  return () => subscription.remove();
}

function getSnapshot(): ?StatusBarVerticalBarEdgeIOS {
  if (cachedEdge === undefined) {
    cachedEdge = StatusBar.getVerticalBarEdgeIOS();
  }
  return cachedEdge;
}

/**
 * React hook that returns the edge where the system places the vertical bar
 * that holds the status bar, such as the side rail on iPhone Duo, and updates
 * when it changes. Returns `null` when the system places no vertical bar.
 *
 * @platform ios
 */
export default function useVerticalBarEdgeIOS(): ?StatusBarVerticalBarEdgeIOS {
  return useSyncExternalStore(subscribe, getSnapshot);
}
