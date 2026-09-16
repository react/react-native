/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {TurboModule, TurboModuleRegistry} from 'react-native';

export interface SomeConstants {
  x: string;
  y: number;
  z: boolean;
}

export interface SampleSpec extends TurboModule {
  getConstants(): SomeConstants;
  doSomething(): void;
}

export default TurboModuleRegistry.getEnforcing<SampleSpec>('Sample');
