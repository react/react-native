/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {IEventEmitter} from '../vendor/emitter/EventEmitter';

import {trace} from '../Performance/Systrace';
import EventEmitter from '../vendor/emitter/EventEmitter';

// FIXME: use typed events
/* $FlowFixMe[unclear-type] unclear type of events */
type RCTDeviceEventDefinitions = {[name: string]: Array<any>};

/**
 * Global EventEmitter used by the native platform to emit events to JavaScript.
 * Events are identified by globally unique event names.
 *
 * NativeModules that emit events should instead subclass `NativeEventEmitter`.
 */
class RCTDeviceEventEmitterImpl extends EventEmitter<RCTDeviceEventDefinitions> {
  // Add systrace to RCTDeviceEventEmitter.emit method for debugging
  emit<TEvent extends keyof RCTDeviceEventDefinitions>(
    eventType: TEvent,
    ...args: RCTDeviceEventDefinitions[TEvent]
  ): void {
    trace(
      () => `RCTDeviceEventEmitter.emit#${eventType}`,
      () => {
        super.emit(eventType, ...args);
      },
    );
  }
}
const RCTDeviceEventEmitter: IEventEmitter<RCTDeviceEventDefinitions> =
  new RCTDeviceEventEmitterImpl();

Object.defineProperty(global, '__rctDeviceEventEmitter', {
  configurable: true,
  value: RCTDeviceEventEmitter,
});

export default RCTDeviceEventEmitter as IEventEmitter<RCTDeviceEventDefinitions>;
