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

export type I18nManagerConstants = {
  isRTL: boolean,
  localeIdentifier: string,
};

export interface Spec extends TurboModule {
  readonly getConstants: () => I18nManagerConstants;
  forceRTL: (forceRTL: boolean) => boolean;
}

export default TurboModuleRegistry.get<Spec>('I18nManager') as ?Spec;
