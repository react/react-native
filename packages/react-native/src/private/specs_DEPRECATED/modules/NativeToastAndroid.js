/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getConstants: () => {
    SHORT: number,
    LONG: number,
    TOP: number,
    BOTTOM: number,
    CENTER: number,
  };
  readonly show: (message: string, duration: number) => void;
  readonly showWithGravity: (
    message: string,
    duration: number,
    gravity: number,
  ) => void;
  readonly showWithGravityAndOffset: (
    message: string,
    duration: number,
    gravity: number,
    xOffset: number,
    yOffset: number,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ToastAndroid') as Spec;
