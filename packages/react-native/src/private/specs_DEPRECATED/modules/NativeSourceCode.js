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

export type SourceCodeConstants = {
  scriptURL: string,
};

export interface Spec extends TurboModule {
  readonly getConstants: () => SourceCodeConstants;
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('SourceCode');
let constants = null;

const NativeSourceCode = {
  getConstants(): SourceCodeConstants {
    if (constants == null) {
      constants = NativeModule.getConstants();
    }

    return constants;
  },
};

export default NativeSourceCode;
