/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// $FlowFixMe[unclear-type] unclear type of events
type UnsafeEventObject = Object;

export interface EventSubscription {
  remove(): void;
}

export interface IEventEmitter<
  TEventToArgsMap extends Readonly<
    Record<string, ReadonlyArray<UnsafeEventObject>>,
  >,
> {
  addListener<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    listener: (...args: TEventToArgsMap[TEvent]) => unknown,
    context?: unknown,
  ): EventSubscription;

  emit<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    ...args: TEventToArgsMap[TEvent]
  ): void;

  removeAllListeners<TEvent extends keyof TEventToArgsMap>(
    eventType?: ?TEvent,
  ): void;

  listenerCount<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
  ): number;
}

interface Registration<TArgs> {
  readonly context: unknown;
  readonly listener: (...args: TArgs) => unknown;
  readonly remove: () => void;
}

type Registry<
  TEventToArgsMap extends Readonly<
    Record<string, ReadonlyArray<UnsafeEventObject>>,
  >,
> = {
  [K in keyof TEventToArgsMap]: Set<Registration<TEventToArgsMap[K]>>,
};

/**
 * EventEmitter manages listeners and publishes events to them.
 *
 * EventEmitter accepts a single type parameter that defines the valid events
 * and associated listener argument(s).
 *
 * @example
 *
 *   const emitter = new EventEmitter<{
 *     success: [number, string],
 *     error: [Error],
 *   }>();
 *
 *   emitter.on('success', (statusCode, responseText) => {...});
 *   emitter.emit('success', 200, '...');
 *
 *   emitter.on('error', error => {...});
 *   emitter.emit('error', new Error('Resource not found'));
 *
 */
export default class EventEmitter<
  TEventToArgsMap extends Readonly<
    Record<string, ReadonlyArray<UnsafeEventObject>>,
  > = Readonly<Record<string, ReadonlyArray<UnsafeEventObject>>>,
> implements IEventEmitter<TEventToArgsMap>
{
  #registry: Registry<TEventToArgsMap>;

  constructor() {
    // $FlowFixMe[incompatible-type]
    this.#registry = {};
  }

  /**
   * Registers a listener that is called when the supplied event is emitted.
   * Returns a subscription that has a `remove` method to undo registration.
   */
  addListener<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    listener: (...args: TEventToArgsMap[TEvent]) => unknown,
    context: unknown,
  ): EventSubscription {
    if (typeof listener !== 'function') {
      throw new TypeError(
        'EventEmitter.addListener(...): 2nd argument must be a function.',
      );
    }
    const registrations = allocate<
      TEventToArgsMap,
      keyof TEventToArgsMap,
      TEventToArgsMap[TEvent],
    >(this.#registry, eventType);
    const registration: Registration<TEventToArgsMap[TEvent]> = {
      context,
      listener,
      remove(): void {
        registrations.delete(registration);
      },
    };
    registrations.add(registration);
    return registration;
  }

  /**
   * Emits the supplied event. Additional arguments supplied to `emit` will be
   * passed through to each of the registered listeners.
   *
   * If a listener modifies the listeners registered for the same event, those
   * changes will not be reflected in the current invocation of `emit`.
   */
  emit<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    ...args: TEventToArgsMap[TEvent]
  ): void {
    const registrations: ?Set<Registration<TEventToArgsMap[TEvent]>> =
      this.#registry[eventType];
    if (registrations != null) {
      // Copy `registrations` to take a snapshot when we invoke `emit`, in case
      // registrations are added or removed when listeners are invoked.
      for (const registration of Array.from(registrations)) {
        registration.listener.apply(registration.context, args);
      }
    }
  }

  /**
   * Removes all registered listeners.
   */
  removeAllListeners<TEvent extends keyof TEventToArgsMap>(
    eventType?: ?TEvent,
  ): void {
    if (eventType == null) {
      // $FlowFixMe[incompatible-type]
      this.#registry = {};
    } else {
      delete this.#registry[eventType];
    }
  }

  /**
   * Returns the number of registered listeners for the supplied event.
   */
  listenerCount<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
  ): number {
    const registrations: ?Set<Registration<TEventToArgsMap[TEvent]>> =
      this.#registry[eventType];
    return registrations == null ? 0 : registrations.size;
  }
}

function allocate<
  TEventToArgsMap extends Readonly<
    Record<string, ReadonlyArray<UnsafeEventObject>>,
  >,
  TEvent extends keyof TEventToArgsMap,
>(
  registry: Registry<TEventToArgsMap>,
  eventType: TEvent,
): Set<Registration<TEventToArgsMap[TEvent]>> {
  let registrations: ?Set<Registration<TEventToArgsMap[TEvent]>> =
    registry[eventType];
  if (registrations == null) {
    registrations = new Set();
    registry[eventType] = registrations;
  }
  return registrations;
}
