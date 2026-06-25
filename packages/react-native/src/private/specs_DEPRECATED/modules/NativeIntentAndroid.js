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
  readonly getInitialURL: () => Promise<string>;
  readonly canOpenURL: (url: string) => Promise<boolean>;
  readonly openURL: (url: string) => Promise<void>;
  readonly openSettings: () => Promise<void>;
  readonly sendIntent: (
    action: string,
    extras: ?Array<{
      key: string,
      value: string | number | boolean, // TODO(T67672788): Union types are not type safe
      ...
    }>,
  ) => Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('IntentAndroid') as ?Spec;
