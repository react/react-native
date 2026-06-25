/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  EventSubscription,
  IEventEmitter,
} from '../../vendor/emitter/EventEmitter';

import RCTDeviceEventEmitter from '../RCTDeviceEventEmitter';

/**
 * Mock `NativeEventEmitter` to ignore Native Modules.
 */
export default class NativeEventEmitter<
  TEventToArgsMap extends Readonly<Record<string, ReadonlyArray<unknown>>>,
> implements IEventEmitter<TEventToArgsMap>
{
  addListener<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    listener: (...args: TEventToArgsMap[TEvent]) => unknown,
    context?: unknown,
  ): EventSubscription {
    return RCTDeviceEventEmitter.addListener(eventType, listener, context);
  }

  emit<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    ...args: TEventToArgsMap[TEvent]
  ): void {
    RCTDeviceEventEmitter.emit(eventType, ...args);
  }

  removeAllListeners<TEvent extends keyof TEventToArgsMap>(
    eventType?: ?TEvent,
  ): void {
    RCTDeviceEventEmitter.removeAllListeners(eventType);
  }

  listenerCount<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
  ): number {
    return RCTDeviceEventEmitter.listenerCount(eventType);
  }
}
