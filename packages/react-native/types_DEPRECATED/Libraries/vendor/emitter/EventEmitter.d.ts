/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * EventSubscription represents a subscription to a particular event. It can
 * remove its own subscription.
 */
interface EventSubscription {
  eventType: string;
  key: number;
  subscriber: EventSubscriptionVendor;

  /**
   * @param subscriber the subscriber that controls
   *   this subscription.
   */
  new (subscriber: EventSubscriptionVendor): EventSubscription;

  /**
   * Removes this subscription from the subscriber that controls it.
   */
  remove(): void;
}

/**
 * EventSubscriptionVendor stores a set of EventSubscriptions that are
 * subscribed to a particular event type.
 */
declare class EventSubscriptionVendor {
  constructor();

  /**
   * Adds a subscription keyed by an event type.
   *
   */
  addSubscription(
    eventType: string,
    subscription: EventSubscription,
  ): EventSubscription;

  /**
   * Removes a bulk set of the subscriptions.
   *
   * @param eventType - Optional name of the event type whose
   *   registered subscriptions to remove, if null remove all subscriptions.
   */
  removeAllSubscriptions(eventType?: string): void;

  /**
   * Removes a specific subscription. Instead of calling this function, call
   * `subscription.remove()` directly.
   *
   */
  removeSubscription(subscription: any): void;

  /**
   * Returns the array of subscriptions that are currently registered for the
   * given event type.
   *
   * Note: This array can be potentially sparse as subscriptions are deleted
   * from it when they are removed.
   *
   */
  getSubscriptionsForType(eventType: string): EventSubscription[];
}

/**
 * EmitterSubscription represents a subscription with listener and context data.
 */
interface EmitterSubscription extends EventSubscription {
  emitter: EventEmitter;
  listener: () => any;
  context: any;

  /**
   * @param emitter - The event emitter that registered this
   *   subscription
   * @param subscriber - The subscriber that controls
   *   this subscription
   * @param listener - Function to invoke when the specified event is
   *   emitted
   * @param context - Optional context object to use when invoking the
   *   listener
   */
  new (
    emitter: EventEmitter,
    subscriber: EventSubscriptionVendor,
    listener: () => any,
    context: any,
  ): EmitterSubscription;

  /**
   * Removes this subscription from the emitter that registered it.
   * Note: we're overriding the `remove()` method of EventSubscription here
   * but deliberately not calling `super.remove()` as the responsibility
   * for removing the subscription lies with the EventEmitter.
   */
  remove(): void;
}

export default class EventEmitter {
  /**
   *
   * @param subscriber - Optional subscriber instance
   *   to use. If omitted, a new subscriber will be created for the emitter.
   */
  constructor(subscriber?: EventSubscriptionVendor | null);

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function.
   *
   * @param eventType - Name of the event to listen to
   * @param listener - Function to invoke when the specified event is
   *   emitted
   * @param context - Optional context object to use when invoking the
   *   listener
   */
  addListener(
    eventType: string,
    listener: (...args: any[]) => any,
    context?: any,
  ): EmitterSubscription;

  /**
   * Removes all of the registered listeners, including those registered as
   * listener maps.
   *
   * @param eventType - Optional name of the event whose registered
   *   listeners to remove
   */
  removeAllListeners(eventType?: string): void;

  /**
   * Returns the number of listeners that are currently registered for the given
   * event.
   *
   * @param eventType - Name of the event to query
   */
  listenerCount(eventType: string): number;

  /**
   * Emits an event of the given type with the given data. All handlers of that
   * particular type will be notified.
   *
   * @param eventType - Name of the event to emit
   * @param Arbitrary arguments to be passed to each registered listener
   *
   * @example
   *   emitter.addListener('someEvent', function(message) {
   *     console.log(message);
   *   });
   *
   *   emitter.emit('someEvent', 'abc'); // logs 'abc'
   */
  emit(eventType: string, ...params: any[]): void;
}
