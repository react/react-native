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
  readonly reload: () => void;
  readonly reloadWithReason?: (reason: string) => void;
  readonly onFastRefresh?: () => void;
  readonly setHotLoadingEnabled: (isHotLoadingEnabled: boolean) => void;
  readonly setProfilingEnabled: (isProfilingEnabled: boolean) => void;
  readonly toggleElementInspector: () => void;
  readonly addMenuItem: (title: string) => void;
  readonly openDebugger?: () => void;

  // Events
  readonly addListener: (eventName: string) => void;
  readonly removeListeners: (count: number) => void;

  // iOS only.
  readonly setIsShakeToShowDevMenuEnabled: (enabled: boolean) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DevSettings') as Spec;
