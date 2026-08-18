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
  readonly connect: (
    url: string,
    protocols: ?Array<string>,
    options: {
      headers?: Object,
      unstable_devToolsRequestId?: string,
    },
    socketID: number,
  ) => void;
  readonly send: (message: string, forSocketID: number) => void;
  readonly sendBinary: (base64String: string, forSocketID: number) => void;
  readonly ping: (socketID: number) => void;
  readonly close: (code: number, reason: string, socketID: number) => void;

  // RCTEventEmitter
  readonly addListener: (eventName: string) => void;
  readonly removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'WebSocketModule',
) as Spec;
