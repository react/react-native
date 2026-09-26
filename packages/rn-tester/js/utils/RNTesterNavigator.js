/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from 'react-native';

import {TurboModuleRegistry} from 'react-native';

export type RNTesterRoute = {
  moduleKey: string,
  title: string,
  exampleKey?: ?string,
  documentationURL?: ?string,
  hidesChrome?: boolean,
};

interface Spec extends TurboModule {
  push(route: RNTesterRoute): void;
  pushFromDeepLink(route: RNTesterRoute): void;
}

const NativeModule =
  TurboModuleRegistry.getEnforcing<Spec>('RNTesterNavigator');

/**
 * Pushes a module or example screen onto the selected tab's native stack.
 */
export function push(route: RNTesterRoute): void {
  NativeModule.push(route);
}

/**
 * Switches to the Components tab, resets its stack, and pushes the route.
 */
export function pushFromDeepLink(route: RNTesterRoute): void {
  NativeModule.pushFromDeepLink(route);
}
