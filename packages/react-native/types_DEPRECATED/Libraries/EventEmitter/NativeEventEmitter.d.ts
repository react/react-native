/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import EventEmitter, {
  EmitterSubscription,
} from '../vendor/emitter/EventEmitter';

/**
 * The React Native implementation of the IOS RCTEventEmitter which is required when creating
 * a module that communicates with IOS
 */
type NativeModule = {
  /**
   * Add the provided eventType as an active listener
   * @param eventType name of the event for which we are registering listener
   */
  addListener: (eventType: string) => void;

  /**
   * Remove a specified number of events.  There are no eventTypes in this case, as
   * the native side doesn't remove the name, but only manages a counter of total
   * listeners
   * @param count number of listeners to remove (of any type)
   */
  removeListeners: (count: number) => void;
};

/**
 * Abstract base class for implementing event-emitting modules. This implements
 * a subset of the standard EventEmitter node module API.
 */
declare class NativeEventEmitter extends EventEmitter {
  /**
   * @param nativeModule the NativeModule implementation.  This is required on IOS and will throw
   *      an invariant error if undefined.
   */
  constructor(nativeModule?: NativeModule);

  /**
   * Add the specified listener, this call passes through to the NativeModule
   * addListener
   *
   * @param eventType name of the event for which we are registering listener
   * @param listener the listener function
   * @param context context of the listener
   */
  addListener(
    eventType: string,
    listener: (event: any) => void,
    context?: Object,
  ): EmitterSubscription;

  /**
   * @param eventType  name of the event whose registered listeners to remove
   */
  removeAllListeners(eventType: string): void;
}
