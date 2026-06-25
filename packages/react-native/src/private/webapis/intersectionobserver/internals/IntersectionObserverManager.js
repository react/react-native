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
 * and all the intersection observers that are currently observing any targets.
 *
 * In order to reduce the communication between native and JavaScript,
 * we register a single notication callback in native, and then we handle how
 * to notify each entry to the right intersection observer when we receive all
 * the notifications together.
 */

import type ReactNativeElement from '../../dom/nodes/ReactNativeElement';
import type IntersectionObserver, {
  IntersectionObserverCallback,
} from '../IntersectionObserver';
import type IntersectionObserverEntry from '../IntersectionObserverEntry';
import type {NativeIntersectionObserverToken} from '../specs/NativeIntersectionObserver';

import {trace} from '../../../../../Libraries/Performance/Systrace';
import {
  getInstanceHandle,
  getNativeNodeReference,
} from '../../dom/nodes/internals/NodeInternals';
import {createIntersectionObserverEntry} from '../IntersectionObserverEntry';
import NativeIntersectionObserver from '../specs/NativeIntersectionObserver';
import nullthrows from 'nullthrows';

export type IntersectionObserverId = number;

let nextIntersectionObserverId: IntersectionObserverId = 1;
let isConnected: boolean = false;

const registeredIntersectionObservers: Map<
  IntersectionObserverId,
  {observer: IntersectionObserver, callback: IntersectionObserverCallback},
> = new Map();

// We need to keep the mapping from instance handles to targets because when
// targets are detached (their components are unmounted), React resets the
// instance handle to prevent memory leaks and it cuts the connection between
// the instance handle and the target.
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

const targetToTokenMap: WeakMap<
  ReactNativeElement,
  NativeIntersectionObserverToken,
> = new WeakMap();

/**
 * Registers the given intersection observer and returns a unique ID for it,
 * which is required to start observing targets.
 */
export function registerObserver(
  observer: IntersectionObserver,
  callback: IntersectionObserverCallback,
): IntersectionObserverId {
  const intersectionObserverId = nextIntersectionObserverId;
  nextIntersectionObserverId++;
  registeredIntersectionObservers.set(intersectionObserverId, {
    observer,
    callback,
  });
  return intersectionObserverId;
}

/**
 * Unregisters the given intersection observer.
 * This should only be called when an observer is no longer observing any
 * targets.
 */
export function unregisterObserver(
  intersectionObserverId: IntersectionObserverId,
): void {
  const deleted = registeredIntersectionObservers.delete(
    intersectionObserverId,
  );
  if (deleted && registeredIntersectionObservers.size === 0) {
    NativeIntersectionObserver?.disconnect();
    isConnected = false;
  }
}

/**
 * Starts observing a target on a specific intersection observer.
 * If this is the first target being observed, this also sets up the centralized
 * notification callback in native.
 */
export function observe({
  intersectionObserverId,
  root,
  target,
}: {
  intersectionObserverId: IntersectionObserverId,
  root: ?ReactNativeElement,
  target: ReactNativeElement,
}): boolean {
  if (NativeIntersectionObserver == null) {
    throwIfNoNativeIntersectionObserver();
    return false;
  }

  const registeredObserver = registeredIntersectionObservers.get(
    intersectionObserverId,
  );
  if (registeredObserver == null) {
    console.error(
      `IntersectionObserverManager: could not start observing target because IntersectionObserver with ID ${intersectionObserverId} was not registered.`,
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
      'IntersectionObserverManager: could not find reference to instance handle from target',
    );
    return false;
  }

  const rootNativeNodeReference =
    root != null ? getNativeNodeReference(root) : null;
  if (root != null && rootNativeNodeReference == null) {
    console.error(
      'IntersectionObserverManager: could not find shadow node for observation root',
    );
    return false;
  }

  // Store the mapping between the instance handle and the target so we can
  // access it even after the instance handle has been unmounted.
  setTargetForInstanceHandle(instanceHandle, target);

  if (!isConnected) {
    NativeIntersectionObserver.connect(notifyIntersectionObservers);
    isConnected = true;
  }

  const token = nullthrows(NativeIntersectionObserver.observeV2)({
    intersectionObserverId,
    rootShadowNode: rootNativeNodeReference,
    targetShadowNode: targetNativeNodeReference,
    thresholds: registeredObserver.observer.thresholds,
    rootThresholds: registeredObserver.observer.rnRootThresholds,
    rootMargin: registeredObserver.observer.rootMargin,
  });
  targetToTokenMap.set(target, token);

  return true;
}

export function unobserve(
  intersectionObserverId: number,
  target: ReactNativeElement,
): void {
  if (NativeIntersectionObserver == null) {
    throwIfNoNativeIntersectionObserver();
    return;
  }

  const registeredObserver = registeredIntersectionObservers.get(
    intersectionObserverId,
  );
  if (registeredObserver == null) {
    console.error(
      `IntersectionObserverManager: could not stop observing target because IntersectionObserver with ID ${intersectionObserverId} was not registered.`,
    );
    return;
  }

  const targetToken = targetToTokenMap.get(target);
  if (targetToken == null) {
    console.error(
      'IntersectionObserverManager: could not find registration data for target',
    );
    return;
  }

  nullthrows(NativeIntersectionObserver.unobserveV2)(
    intersectionObserverId,
    targetToken,
  );
}

/**
 * This function is called from native when there are `IntersectionObserver`
 * entries to dispatch.
 */
function notifyIntersectionObservers(): void {
  trace(
    'IntersectionObserverManager.notifyIntersectionObservers',
    doNotifyIntersectionObservers,
  );
}

function doNotifyIntersectionObservers(): void {
  if (NativeIntersectionObserver == null) {
    throwIfNoNativeIntersectionObserver();
    return;
  }

  const nativeEntries = NativeIntersectionObserver.takeRecords();

  const entriesByObserver: Map<
    IntersectionObserverId,
    Array<IntersectionObserverEntry>,
  > = new Map();

  for (const nativeEntry of nativeEntries) {
    let list = entriesByObserver.get(nativeEntry.intersectionObserverId);
    if (list == null) {
      list = [];
      entriesByObserver.set(nativeEntry.intersectionObserverId, list);
    }

    const target = getTargetFromInstanceHandle(
      nativeEntry.targetInstanceHandle,
    );
    if (target == null) {
      console.warn('Could not find target to create IntersectionObserverEntry');
      continue;
    }

    list.push(createIntersectionObserverEntry(nativeEntry, target));
  }

  for (const [
    intersectionObserverId,
    entriesForObserver,
  ] of entriesByObserver) {
    const registeredObserver = registeredIntersectionObservers.get(
      intersectionObserverId,
    );
    if (!registeredObserver) {
      // This could happen if the observer is disconnected between commit
      // and mount. In this case, we can just ignore the entries.
      return;
    }

    const {observer, callback} = registeredObserver;
    try {
      callback.call(observer, entriesForObserver, observer);
    } catch (error) {
      console.error(error);
    }
  }
}

function throwIfNoNativeIntersectionObserver() {
  throw new Error('Missing native implementation of IntersectionObserver');
}
