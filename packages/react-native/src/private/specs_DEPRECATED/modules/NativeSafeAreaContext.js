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
import type {Double} from '../../../../Libraries/Types/CodegenTypes';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export type SafeAreaContextConstants = {
  initialWindowMetrics?: {
    insets: {
      top: Double,
      right: Double,
      bottom: Double,
      left: Double,
    },
    frame: {
      x: Double,
      y: Double,
      width: Double,
      height: Double,
    },
  },
};

export interface Spec extends TurboModule {
  readonly getConstants: () => SafeAreaContextConstants;
}

export default (TurboModuleRegistry.get<Spec>('SafeAreaContext'): ?Spec);
