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

import type {
  EventSubscription,
  IEventEmitter,
} from '../vendor/emitter/EventEmitter';

import Platform from '../Utilities/Platform';
import RCTDeviceEventEmitter from './RCTDeviceEventEmitter';
import invariant from 'invariant';

/**
 * The React Native implementation of the IOS RCTEventEmitter which is required when creating
 * a module that communicates with IOS
 */
interface NativeModule {
  /**
   * Add the provided eventType as an active listener
   * @param eventType name of the event for which we are registering listener
   */
  addListener(eventType: string): void;
  /**
   * Remove a specified number of events.  There are no eventTypes in this case, as
   * the native side doesn't remove the name, but only manages a counter of total
   * listeners
   * @param count number of listeners to remove (of any type)
   */
  removeListeners(count: number): void;
}

/** @deprecated Use `EventSubscription` instead. */
type EmitterSubscription = EventSubscription;

export type {EventSubscription, EmitterSubscription};
/** @deprecated Use `EventSubscription` instead. */
export type NativeEventSubscription = EventSubscription;

// $FlowFixMe[unclear-type] unclear type of events
type UnsafeNativeEventObject = Object;

/**
 * `NativeEventEmitter` is intended for use by Native Modules to emit events to
 * JavaScript listeners. If a `NativeModule` is supplied to the constructor, it
 * will be notified (via `addListener` and `removeListeners`) when the listener
 * count changes to manage "native memory".
 *
 * Currently, all native events are fired via a global `RCTDeviceEventEmitter`.
 * This means event names must be globally unique, and it means that call sites
 * can theoretically listen to `RCTDeviceEventEmitter` (although discouraged).
 */
export default class NativeEventEmitter<
  TEventToArgsMap extends Readonly<
    Record<string, ReadonlyArray<UnsafeNativeEventObject>>,
  > = Readonly<Record<string, ReadonlyArray<UnsafeNativeEventObject>>>,
> implements IEventEmitter<TEventToArgsMap>
{
  _nativeModule: ?NativeModule;

  /**
   * @param nativeModule the NativeModule implementation.  This is required on IOS and will throw
   *      an invariant error if undefined.
   */
  constructor(nativeModule?: ?NativeModule) {
    if (Platform.OS === 'ios') {
      invariant(
        nativeModule != null,
        '`new NativeEventEmitter()` requires a non-null argument.',
      );
    }

    const hasAddListener =
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      !!nativeModule && typeof nativeModule.addListener === 'function';
    const hasRemoveListeners =
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      !!nativeModule && typeof nativeModule.removeListeners === 'function';

    if (nativeModule && hasAddListener && hasRemoveListeners) {
      this._nativeModule = nativeModule;
    } else if (nativeModule != null) {
      if (!hasAddListener) {
        console.warn(
          '`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.',
        );
      }
      if (!hasRemoveListeners) {
        console.warn(
          '`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.',
        );
      }
    }
  }

  /**
   * Add the specified listener, this call passes through to the NativeModule
   * addListener
   *
   * @param eventType name of the event for which we are registering listener
   * @param listener the listener function
   * @param context context of the listener
   */
  addListener<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    listener: (...args: TEventToArgsMap[TEvent]) => unknown,
    context?: unknown,
  ): EventSubscription {
    this._nativeModule?.addListener(eventType);
    let subscription: ?EventSubscription = RCTDeviceEventEmitter.addListener(
      eventType,
      listener,
      context,
    );

    return {
      remove: () => {
        if (subscription != null) {
          this._nativeModule?.removeListeners(1);
          // $FlowFixMe[incompatible-use]
          subscription.remove();
          subscription = null;
        }
      },
    };
  }

  emit<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    ...args: TEventToArgsMap[TEvent]
  ): void {
    // Generally, `RCTDeviceEventEmitter` is directly invoked. But this is
    // included for completeness.
    RCTDeviceEventEmitter.emit(eventType, ...args);
  }

  /**
   * @param eventType  name of the event whose registered listeners to remove
   */
  removeAllListeners<TEvent extends keyof TEventToArgsMap>(
    eventType?: ?TEvent,
  ): void {
    invariant(
      eventType != null,
      '`NativeEventEmitter.removeAllListener()` requires a non-null argument.',
    );
    this._nativeModule?.removeListeners(this.listenerCount(eventType));
    RCTDeviceEventEmitter.removeAllListeners(eventType);
  }

  listenerCount<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
  ): number {
    return RCTDeviceEventEmitter.listenerCount(eventType);
  }
}
