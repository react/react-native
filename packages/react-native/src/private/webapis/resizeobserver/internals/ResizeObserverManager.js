/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * This module handles the communication between the React Native renderer
 * and all the resize observers that are currently observing any targets.
 *
 * In order to reduce the communication between native and JavaScript,
 * we register a single notification callback in native, and then we handle
 * how to notify each entry to the right resize observer when we receive all
 * the notifications together.
 */

import type ReactNativeElement from '../../dom/nodes/ReactNativeElement';
import type ResizeObserver, {
  ResizeObserverBoxOptions,
  ResizeObserverCallback,
} from '../ResizeObserver';
import type ResizeObserverEntry from '../ResizeObserverEntry';
import type {NativeResizeObserverToken} from '../specs/NativeResizeObserver';

import {trace} from '../../../../../Libraries/Performance/Systrace';
import {
  getInstanceHandle,
  getNativeNodeReference,
} from '../../dom/nodes/internals/NodeInternals';
import {createResizeObserverEntry} from '../ResizeObserverEntry';
import NativeResizeObserver from '../specs/NativeResizeObserver';

export type ResizeObserverId = number;

let nextResizeObserverId: ResizeObserverId = 1;
let isConnected: boolean = false;

const registeredResizeObservers: Map<
  ResizeObserverId,
  {observer: ResizeObserver, callback: ResizeObserverCallback},
> = new Map();

// Keep our own instanceHandle->target map: when a target unmounts, React
// resets its instance handle (to avoid leaks), cutting the built-in link.
const instanceHandleToTargetMap: WeakMap<interface {}, ReactNativeElement> =
  new WeakMap();

function getTargetFromInstanceHandle(
  instanceHandle: unknown,
): ?ReactNativeElement {
  // $FlowExpectedError[incompatible-type] instanceHandle is typed as mixed but we know it's an object and we need it to be to use it as a key in a WeakMap.
  const key: interface {} = instanceHandle;
  return instanceHandleToTargetMap.get(key);
}

function setTargetForInstanceHandle(
  instanceHandle: unknown,
  target: ReactNativeElement,
): void {
  // $FlowExpectedError[incompatible-type] instanceHandle is typed as mixed but we know it's an object and we need it to be to use it as a key in a WeakMap.
  const key: interface {} = instanceHandle;
  instanceHandleToTargetMap.set(key, target);
}

// Keep the native token per target: on unmount a target loses its shadow node
// reference, and without the token we couldn't clean up the observation.
const targetToTokenMap: WeakMap<ReactNativeElement, NativeResizeObserverToken> =
  new WeakMap();

/**
 * Registers the given resize observer and returns a unique ID for it, which
 * is required to start observing targets.
 */
export function registerObserver(
  observer: ResizeObserver,
  callback: ResizeObserverCallback,
): ResizeObserverId {
  const resizeObserverId = nextResizeObserverId;
  nextResizeObserverId++;
  registeredResizeObservers.set(resizeObserverId, {
    observer,
    callback,
  });
  return resizeObserverId;
}

/**
 * Unregisters the given resize observer.
 * This should only be called when an observer is no longer observing any
 * targets.
 */
export function unregisterObserver(resizeObserverId: ResizeObserverId): void {
  const deleted = registeredResizeObservers.delete(resizeObserverId);
  if (deleted && registeredResizeObservers.size === 0) {
    NativeResizeObserver?.disconnect();
    isConnected = false;
  }
}

/**
 * Starts observing a target on a specific resize observer.
 * If this is the first target being observed, this also sets up the
 * centralized notification callback in native.
 * Returns `true` if the native observation was actually set up, or `false`
 * if the target could not be observed (e.g. because it is disconnected).
 */
export function observe({
  resizeObserverId,
  target,
  box,
}: {
  resizeObserverId: ResizeObserverId,
  target: ReactNativeElement,
  box: ResizeObserverBoxOptions,
}): boolean {
  if (NativeResizeObserver == null) {
    throwIfNoNativeResizeObserver();
    return false;
  }

  const registeredObserver = registeredResizeObservers.get(resizeObserverId);
  if (registeredObserver == null) {
    console.error(
      `ResizeObserverManager: could not start observing target because ResizeObserver with ID ${resizeObserverId} was not registered.`,
    );
    return false;
  }

  const targetNativeNodeReference = getNativeNodeReference(target);
  if (targetNativeNodeReference == null) {
    // The target is disconnected. We can't observe it anymore.
    return false;
  }

  const instanceHandle = getInstanceHandle(target);
  if (instanceHandle == null) {
    console.error(
      'ResizeObserverManager: could not find reference to instance handle from target',
    );
    return false;
  }

  // Store the mapping between the instance handle and the target so we can
  // access it even after the instance handle has been unmounted.
  setTargetForInstanceHandle(instanceHandle, target);

  if (!isConnected) {
    NativeResizeObserver.connect(notifyResizeObservers);
    isConnected = true;
  }

  const token = NativeResizeObserver.observe({
    resizeObserverId,
    targetShadowNode: targetNativeNodeReference,
    box,
  });
  targetToTokenMap.set(target, token);

  return true;
}

/**
 * Instructs the given resize observer to stop observing the specified
 * target.
 */
export function unobserve(
  resizeObserverId: ResizeObserverId,
  target: ReactNativeElement,
): void {
  if (NativeResizeObserver == null) {
    throwIfNoNativeResizeObserver();
    return;
  }

  const registeredObserver = registeredResizeObservers.get(resizeObserverId);
  if (registeredObserver == null) {
    console.error(
      `ResizeObserverManager: could not stop observing target because ResizeObserver with ID ${resizeObserverId} was not registered.`,
    );
    return;
  }

  const targetToken = targetToTokenMap.get(target);
  if (targetToken == null) {
    console.error(
      'ResizeObserverManager: could not find registration data for target',
    );
    return;
  }

  NativeResizeObserver.unobserve(resizeObserverId, targetToken);
}

/**
 * This function is called from native when there are `ResizeObserver`
 * entries to dispatch.
 */
function notifyResizeObservers(hasResizeLoopError: boolean): void {
  trace('ResizeObserverManager.notifyResizeObservers', () => {
    doNotifyResizeObservers(hasResizeLoopError);
  });
}

function doNotifyResizeObservers(hasResizeLoopError: boolean): void {
  if (NativeResizeObserver == null) {
    throwIfNoNativeResizeObserver();
    return;
  }

  const nativeEntries = NativeResizeObserver.takeRecords();

  const entriesByObserver: Map<
    ResizeObserverId,
    Array<ResizeObserverEntry>,
  > = new Map();

  for (const nativeEntry of nativeEntries) {
    let list = entriesByObserver.get(nativeEntry.resizeObserverId);
    if (list == null) {
      list = [];
      entriesByObserver.set(nativeEntry.resizeObserverId, list);
    }

    const target = getTargetFromInstanceHandle(
      nativeEntry.targetInstanceHandle,
    );
    if (target == null) {
      console.warn(
        'ResizeObserverManager: could not find target to create ResizeObserverEntry',
      );
      continue;
    }

    list.push(createResizeObserverEntry(nativeEntry, target));
  }

  // Native delivers entries in observer registration order; preserve it (Map
  // insertion order isn't enough if batches merged out of order).
  const observerIds = Array.from(entriesByObserver.keys()).sort(
    (a, b) => a - b,
  );
  for (const resizeObserverId of observerIds) {
    const entriesForObserver = entriesByObserver.get(resizeObserverId);
    if (entriesForObserver == null) {
      continue;
    }

    const registeredObserver = registeredResizeObservers.get(resizeObserverId);
    if (!registeredObserver) {
      // This could happen if the observer is disconnected between commit
      // and mount. In this case, we can just ignore the entries.
      continue;
    }

    const {observer, callback} = registeredObserver;
    try {
      callback.call(observer, entriesForObserver, observer);
    } catch (error) {
      console.error(error);
    }
  }

  if (hasResizeLoopError) {
    console.error(
      'ResizeObserver loop completed with undelivered notifications.',
    );
  }
}

function throwIfNoNativeResizeObserver() {
  throw new Error('Missing native implementation of ResizeObserver');
}
