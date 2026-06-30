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
    readonly HEIGHT: number,
  };

  /**
   *  - statusBarStyles can be:
   *    - 'default'
   *    - 'dark-content'
   */
  readonly setStyle: (statusBarStyle?: ?string) => void;
  readonly setHidden: (hidden: boolean) => void;
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('StatusBarManager');
let constants = null;

const NativeStatusBarManager = {
  getConstants(): {
    readonly HEIGHT: number,
  } {
    if (constants == null) {
      constants = NativeModule.getConstants();
    }
    return constants;
  },

  /**
   *  - statusBarStyles can be:
   *    - 'default'
   *    - 'dark-content'
   */
  setStyle(statusBarStyle?: ?string): void {
    NativeModule.setStyle(statusBarStyle);
  },

  setHidden(hidden: boolean): void {
    NativeModule.setHidden(hidden);
  },
};

export default NativeStatusBarManager;
