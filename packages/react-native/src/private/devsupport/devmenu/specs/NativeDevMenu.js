/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly show: () => void;
  readonly reload: () => void;
  readonly setProfilingEnabled: (enabled: boolean) => void;
  readonly setHotLoadingEnabled: (enabled: boolean) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DevMenu') as Spec;
