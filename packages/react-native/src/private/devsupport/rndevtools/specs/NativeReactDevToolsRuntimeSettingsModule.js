/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

export type ReloadAndProfileConfig = {
  shouldReloadAndProfile: boolean,
  recordChangeDescriptions: boolean,
};

// Linter doesn't speak Flow's `Partial` type
export type PartialReloadAndProfileConfig = {
  shouldReloadAndProfile?: boolean,
  recordChangeDescriptions?: boolean,
};

export interface Spec extends TurboModule {
  readonly setReloadAndProfileConfig: (
    config: PartialReloadAndProfileConfig,
  ) => void;
  readonly getReloadAndProfileConfig: () => ReloadAndProfileConfig;
}

export default TurboModuleRegistry.get<Spec>(
  'ReactDevToolsRuntimeSettingsModule',
) as ?Spec;
