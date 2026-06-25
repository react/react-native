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

export type ColorSchemeName = 'light' | 'dark';

export type ColorSchemeOverride = 'light' | 'dark' | 'auto' | 'unspecified';

export type AppearancePreferences = {
  colorScheme: ColorSchemeName,
};

export interface Spec extends TurboModule {
  readonly getColorScheme: () => ColorSchemeName;
  readonly setColorScheme: (colorScheme: ColorSchemeOverride) => void;

  // RCTEventEmitter
  readonly addListener: (eventName: string) => void;
  readonly removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.get<Spec>('Appearance') as ?Spec;
