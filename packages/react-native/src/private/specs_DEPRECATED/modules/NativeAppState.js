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

export type AppStateConstants = {
  initialAppState: string,
};

export type AppState = {app_state: string};

export interface Spec extends TurboModule {
  readonly getConstants: () => AppStateConstants;
  readonly getCurrentAppState: (
    success: (appState: AppState) => void,
    error: (error: Object) => void,
  ) => void;

  // Events
  readonly addListener: (eventName: string) => void;
  readonly removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AppState') as Spec;
