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
  readonly sendRequest: (
    query: {
      method: string,
      url: string,
      data: Object,
      headers: Object,
      responseType: string,
      incrementalUpdates: boolean,
      timeout: number,
      withCredentials: boolean,
      readonly unstable_devToolsRequestId?: string,
    },
    callback: (requestId: number) => void,
  ) => void;
  readonly abortRequest: (requestId: number) => void;
  readonly clearCookies: (callback: (result: boolean) => void) => void;

  // RCTEventEmitter
  readonly addListener: (eventName: string) => void;
  readonly removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Networking') as Spec;
