/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import registerCallableModule from '../Core/registerCallableModule';

type EventEmitterModule = {
  receiveEvent: (
    rootNodeID: number,
    topLevelType: string,
    nativeEventParam: unknown,
  ) => void,
  receiveTouches: (
    eventTopLevelType: string,
    touches: Array<unknown>,
    changedIndices: Array<number>,
  ) => void,
  ...
};

const RCTEventEmitter = {
  register(eventEmitter: EventEmitterModule) {
    registerCallableModule('RCTEventEmitter', eventEmitter);
  },
};

export default RCTEventEmitter;
