/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getConstants: () => {
    settings: Object,
  };
  readonly setValues: (values: Object) => void;
  readonly deleteValues: (values: Array<string>) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SettingsManager',
) as Spec;
