/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostPlatform} from './Constants';
import type {
  FantomRenderedOutput,
  RenderOutputConfig,
} from './getFantomRenderedOutput';
import type {MixedElement} from 'react';
import type {RootTag} from 'react-native';
import type ReactNativeDocument from 'react-native/src/private/webapis/dom/nodes/ReactNativeDocument';

import * as Benchmark from './Benchmark';
import {getConstants} from './Constants';
import getFantomRenderedOutput from './getFantomRenderedOutput';
import {LogBox} from 'react-native';
import ErrorUtils from 'react-native/Libraries/vendor/core/ErrorUtils';
import NativeFantom, {
  NativeEventCategory,
} from 'react-native/src/private/testing/fantom/specs/NativeFantom';
import {
  getInstanceHandle,
  getNativeNodeReference,
} from 'react-native/src/private/webapis/dom/nodes/internals/NodeInternals';
import ReadOnlyNode from 'react-native/src/private/webapis/dom/nodes/ReadOnlyNode';

const nativeRuntimeScheduler = global.nativeRuntimeScheduler;
const {unstable_scheduleCallback, unstable_ImmediatePriority} =
  nativeRuntimeScheduler;

type NodeOrRef = ReadOnlyNode | Readonly<{current: ?ReadOnlyNode}>;

export type RootConfig = {
  viewportWidth?: number,
  viewportHeight?: number,
  devicePixelRatio?: number,
  viewportOffsetX?: number,
  viewportOffsetY?: number,
};

export {getConstants} from './Constants';

/**
 * Returns the host OS where the Fantom test runner is running (e.g.
 * 'linux', 'macos', 'windows'). This is different from React Native's
 * `Platform.OS`, which always reflects the React Native target platform
 * being tested.
 */
export function getHostPlatform(): HostPlatform {
  return getConstants().hostPlatform;
}

// Defaults use iPhone 14 values (very common device).
const DEFAULT_VIEWPORT_WIDTH = 390;
const DEFAULT_VIEWPORT_HEIGHT = 844;
const DEFAULT_DEVICE_PIXEL_RATIO = 3;

class Root {
  #surfaceId: RootTag;
  #viewportWidth: number;
  #viewportHeight: number;
  #viewportOffsetX: number;
  #viewportOffsetY: number;
  #devicePixelRatio: number;
  #document: ?ReactNativeDocument;

  constructor(config?: RootConfig) {
    this.#viewportWidth = config?.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH;
    this.#viewportHeight = config?.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT;
    this.#devicePixelRatio =
      config?.devicePixelRatio ?? DEFAULT_DEVICE_PIXEL_RATIO;
    this.#viewportOffsetX = config?.viewportOffsetX ?? 0;
    this.#viewportOffsetY = config?.viewportOffsetY ?? 0;

    this.#surfaceId = NativeFantom.startSurface(
      this.#viewportWidth,
      this.#viewportHeight,
      this.#devicePixelRatio,
      this.#viewportOffsetX,
      this.#viewportOffsetY,
    );
  }

  // $FlowExpectedError[unsafe-getters-setters]
  get document(): ReactNativeDocument {
    if (this.#document == null) {
      throw new Error(
        'Cannot get `document` from root because it has not been rendered.',
      );
    }

    return this.#document;
  }

  render(element: MixedElement): void {
    if (!flushingQueue) {
      throw new Error(
        'Unexpected call to `render` outside of the event loop. Please call `render` within a `runTask` callback.',
      );
    }

    // Require Fabric lazily to prevent it from running InitializeCore before the test
    // has a change to do its environment setup.
    const ReactFabric =
      require('react-native/Libraries/Renderer/shims/ReactFabric').default;

    // $FlowExpectedError[incompatible-type]
    const surfaceIdIsNumber = this.#surfaceId as number;
    ReactFabric.render(element, surfaceIdIsNumber, null, true);

    if (this.#document == null) {
      this.#document =
        // $FlowExpectedError[incompatible-type] We know that `getPublicInstanceFromRootTag` returns `ReactNativeDocument | null` in Fantom.
        ReactFabric.getPublicInstanceFromRootTag(surfaceIdIsNumber);
    }
  }

  takeMountingManagerLogs(): Array<string> {
    return NativeFantom.takeMountingManagerLogs(this.#surfaceId);
  }

  destroy() {
    // TODO: check for leaks.
    NativeFantom.stopSurface(this.#surfaceId);
    NativeFantom.flushMessageQueue();
    this.#document = null;
  }

  getRenderedOutput(config: RenderOutputConfig = {}): FantomRenderedOutput {
    return getFantomRenderedOutput(this.#surfaceId, config);
  }

  getRootTag(): RootTag {
    return this.#surfaceId;
  }

  // TODO: add an API to check if all surfaces were deallocated when tests are finished.
}

export type {Root};

export {NativeEventCategory} from 'react-native/src/private/testing/fantom/specs/NativeFantom';

const DEFAULT_TASK_PRIORITY = unstable_ImmediatePriority;

/**
 * Schedules a task to run on the event loop.
 * If the work loop is running, it will be executed according to its priority.
 * Otherwise, it will wait in the queue until the work loop runs.
 *
 * @param task - The task to be scheduled.
 *
 * @example
 * ```
 * Fantom.scheduleTask(() => {
 *   // Task to be run within React Native's scheduling.
 * });
 *
 * // The task has not run yet.
 *
 * Fantom.runWorkLoop(); // Trigger work loop.
 *
 * // The task has been executed.
 * ```
 */
export function scheduleTask(task: () => void | Promise<void>) {
  unstable_scheduleCallback(DEFAULT_TASK_PRIORITY, task);
}

let flushingQueue = false;
let isLogBoxCheckEnabled = true;
let pendingError: unknown = null;

// Install a Fantom-specific global error handler that captures the first error
// reported during the current work loop into `pendingError`. `runWorkLoop()`
// re-throws the captured error after `flushMessageQueue()` returns, so errors
// thrown inside `runTask` callbacks (or microtasks queued by them) propagate
// out and become observable as Jest test failures.
//
// This overrides the handler installed by `setUpErrorHandling.js`, which in
// Fantom (where LogBox is not installed) only `console.error`s the error.
// Subsequent errors during the same work loop are ignored: only the first one
// is re-thrown, since it is typically the most informative; subsequent errors
// are usually follow-on noise.
ErrorUtils.setGlobalHandler((error: unknown, _isFatal: boolean) => {
  if (pendingError == null) {
    pendingError = error;
  }
});

/**
 * Runs a task on the event loop.
 * React must run inside of event loop to ensure scheduling environment is closer to production.
 *
 * @param task - The task to run.
 *
 * @example
 * ```
 * const root = Fantom.createRoot();
 * Fantom.runTask(() => {
 *   root.render(<View />);
 * });
 * ```
 */
export function runTask(task: () => void | Promise<void>) {
  if (flushingQueue) {
    throw new Error(
      'Nested `runTask` calls are not allowed. If you want to schedule a task from inside another task, use `scheduleTask` instead.',
    );
  }

  scheduleTask(task);
  runWorkLoop();
}

/**
 * Simulates the production of animation frames for a specified duration.
 * This function is useful for testing animations or time-dependent behaviors
 * by advancing the animation frame timeline without waiting for real time to pass.
 *
 * @param milliseconds - The duration in milliseconds for which to produce animation frames
 *
 * @example
 * ```
 * // Simulate 500ms of animation frames
 * Fantom.unstable_produceFramesForDuration(500);
 *
 * // Now you can test the state of your UI after those frames have been produced
 * ```
 *
 * Note: This API is marked as unstable and may change in future versions.
 */
export function unstable_produceFramesForDuration(milliseconds: number) {
  NativeFantom.produceFramesForDuration(milliseconds);
}

/**
 * Returns props appplied via direct manipulation to a view represented by shadow node.
 * Direct manipulation is used by C++ Animated to change view properties on UI tick
 * while the animation is in progress. Once animation finishes, the final state is committed
 * to the shadow tree and result is observable through other JavaScript APIs, like `measure`.
 *
 * @param node - The node for which to retrieve direct manipulation props.
 * @returns Mixed type data containing the direct manipulation properties
 *
 * Note: This API is marked as unstable and may change in future versions.
 */
export function unstable_getDirectManipulationProps(
  nodeOrRef: NodeOrRef,
): Readonly<{
  [string]: unknown,
}> {
  const node = getNode(nodeOrRef);
  const shadowNode = getNativeNodeReference(node);
  return NativeFantom.getDirectManipulationProps(shadowNode);
}

export function unstable_getFabricUpdateProps(nodeOrRef: NodeOrRef): Readonly<{
  [string]: unknown,
}> {
  const node = getNode(nodeOrRef);
  const shadowNode = getNativeNodeReference(node);
  return NativeFantom.getFabricUpdateProps(shadowNode);
}

/**
 * Returns the names of event handlers registered on a component's shadow node.
 *
 * @param nodeOrRef - The node or ref for which to retrieve event handlers.
 * @returns Array of event handler prop names (e.g. `['onLayout', 'onTouchStart']`)
 */
export function getDefinedEventHandlers(
  nodeOrRef: NodeOrRef,
): ReadonlyArray<string> {
  const node = getNode(nodeOrRef);
  const instanceHandle = getInstanceHandle(node);
  if (typeof instanceHandle !== 'object' || instanceHandle == null) {
    return [];
  }
  // WARNING: This uses React private API (fiber internals).
  // $FlowExpectedError[incompatible-type]
  const memoizedProps = (
    instanceHandle as {memoizedProps?: {[string]: unknown}}
  ).memoizedProps;
  if (memoizedProps == null) {
    return [];
  }
  return Object.keys(memoizedProps).filter(
    key => key.startsWith('on') && typeof memoizedProps[key] === 'function',
  );
}

/**
 * Simulates running a task on the UI thread and forces side effect to drain
 * the event queue, scheduling events to be dispatched to JavaScript.
 * To be used when enqueuing native events.
 *
 * @param task - The task to run on the UI thread.
 *
 * @example
 * ```
 * Fantom.runOnUIThread(() => {
 *   Fantom.enqueueNativeEvent(element, 'focus');
 * });
 *
 * // The effects of `focus` event are *not* yet observable.
 *
 * Fantom.runWorkLoop();
 *
 * // The effects of `focus` event are now observable.
 * ```
 */
export function runOnUIThread(task: () => void) {
  task();
  NativeFantom.flushEventQueue();
}

/**
 * Runs a side effect to drain the event queue and dispatches events to JavaScript.
 * Useful to flash out all tasks.
 */
export function flushAllNativeEvents() {
  NativeFantom.flushEventQueue();
  runWorkLoop();
}

/**
 * Runs the event loop until all tasks are executed.
 * To be used with `Fantom.enqueueNativeEvent` and `Fantom.scheduleTask`.
 *
 * @example
 * ```
 * Fantom.scheduleTask(() => {
 *   // Task to be run within React Native's scheduling.
 * });
 *
 * // The task has not run yet.
 *
 * Fantom.runWorkLoop();
 *
 * // The task has been executed.
 * ```
 */
export function runWorkLoop(): void {
  if (flushingQueue) {
    throw new Error(
      'Cannot start the work loop because it is already running. If you want to schedule a task from inside another task, use `scheduleTask` instead.',
    );
  }

  if (__DEV__) {
    // We don't want to run these checks in optimized mode
    // to avoid the small performance overhead in benchmarks.
    runLogBoxCheck();
  }

  // Clear any error captured outside of a work loop (e.g., during module setup)
  // so it does not spuriously fail the next work loop.
  pendingError = null;

  try {
    flushingQueue = true;
    NativeFantom.flushMessageQueue();
  } finally {
    flushingQueue = false;
  }

  if (__DEV__) {
    // We also do it after because a task might trigger the initialization of the environment that enables LogBox,
    // which could be equally dangerous. If LogBox is now installed, this throws
    // and intentionally takes precedence over any captured task error: the
    // LogBox diagnostic is more actionable.
    runLogBoxCheck();
  }

  // Re-throw the first error captured by the global handler during this work
  // loop, so the failure propagates out of `runTask` / `runWorkLoop` and Jest
  // marks the test as failed with the original error.
  const errorToThrow = pendingError;
  pendingError = null;
  if (errorToThrow != null) {
    throw errorToThrow;
  }
}

/**
 * Set this flag to `false` to let Fantom run tasks with LogBox installed
 * (necessary only if you are testing LogBox specifically).
 *
 * Otherwise, it will throw an error when running its work loop,
 * as LogBox would intercept all errors in tasks instead of making them throw.
 *
 * @example
 * ```
 * // In LogBox tests:
 * Fantom.setLogBoxCheckEnabled(false);
 * ```
 */
export function setLogBoxCheckEnabled(enabled: boolean) {
  isLogBoxCheckEnabled = enabled;
}

/**
 * Indicates if the current function is being executed within the Event Loop
 * (as a task or microtask).
 *
 * @example
 * ```
 * Fantom.isInWorkLoop(); // false
 *
 * Fantom.runTask(() => {
 *   Fantom.isInWorkLoop(); // true
 * });
 *
 * Fantom.isInWorkLoop(); // false
 * ```
 */
export function isInWorkLoop(): boolean {
  return flushingQueue;
}

/**
 * Create a Root that can render a React component tree.
 *
 * Accepts an optional RootConfig with the following optional options:
 * @param devicePixelRatio - Numeric value, defaults to 3 (iPhone 14).
 * @param viewportHeight - Numeric value, defaults to 844 (iPhone 14).
 * @param viewportWidth - Numeric value, defaults to 390 (iPhone 14).
 *
 * @example
 * ```
 * const root = Fantom.createRoot({
 *  viewportWidth: 200, // default is 390
 *  viewportHeight: 600, // default is 844
 *  devicePixelRatio: 2, // default is 3
 * });
 * ```
 */
export function createRoot(rootConfig?: RootConfig): Root {
  return new Root(rootConfig);
}

/**
 * This is a low level method to enqueue a native event to a node.
 * It does not wait for it to be flushed in the UI thread or for it to be
 * processed by JS.
 *
 * When you simply need to dispatch a native event and observe its effects, use `dispatchNativeEvent`.
 *
 * @param node - The node to which the event will be dispatched. You must make sure the event is appropriate for the provided node. For example, if sending a scroll event, you must make sure the node is of type <ScrollView />.
 * @param type - The type of the event. e.g 'focus', 'blur', 'change', 'scroll', etc.
 * @param payload - The data associated with the event. What is delivered as `event.nativeEvent` on a component.
 * @param options - Object describing what priority the event is and whether it gets coalesced. For event priority, see `NativeEventCategory`.
 *
 * @example
 * ```
 * Fantom.runOnUIThread(() => {
 *   Fantom.enqueueNativeEvent(element, 'focus');
 * });
 *
 * // The effects of `focus` event are *not* yet observable.
 *
 * Fantom.runWorkLoop();
 *
 * // The effects of `focus` event are observable.
 * ```
 */
export function enqueueNativeEvent(
  nodeOrRef: NodeOrRef,
  type: string,
  payload?: Readonly<{[key: string]: unknown}>,
  options?: Readonly<{category?: NativeEventCategory, isUnique?: boolean}>,
) {
  const node = getNode(nodeOrRef);
  const shadowNode = getNativeNodeReference(node);
  NativeFantom.enqueueNativeEvent(
    shadowNode,
    type,
    payload,
    options?.category,
    options?.isUnique,
  );
}

/**
 * Dispatches a native event and makes sure its effects are observable after calling this method.
 *
 * @param node - The node to which the event will be dispatched. You must make sure the event is appropriate for the provided node. For example, if sending a scroll event, you must make sure the node is of type <ScrollView />.
 * @param type - The type of the event. e.g 'focus', 'blur', 'change', 'scroll', etc.
 * @param payload - The data associated with the event. What is delivered as `event.nativeEvent` on a component.
 * @param options - Object describing what priority the event is and whether it gets coalesced. For event priority, see `NativeEventCategory`.
 *
 * @example
 * ```
 * Fantom.dispatchNativeEvent(element, 'focus');
 *
 * // The effects of `focus` are immediately observable.
 * ```
 */
export function dispatchNativeEvent(
  nodeOrRef: NodeOrRef,
  type: string,
  payload?: Readonly<{[key: string]: unknown}>,
  options?: Readonly<{category?: NativeEventCategory, isUnique?: boolean}>,
) {
  const node = getNode(nodeOrRef);

  runOnUIThread(() => {
    enqueueNativeEvent(node, type, payload, options);
  });

  if (!flushingQueue) {
    runWorkLoop();
  }
}

export type ScrollEventOptions = {
  x: number,
  y: number,
  zoomScale?: number,
};

/**
 * Enqueues an event to scroll a <ScrollView /> node to the given coordinates.
 * It does not wait for it to be flushed in the UI thread or for it to be
 * processed by JS.
 *
 * When you need to simply scroll a <ScrollView /> and observe effects immediately, use `Fantom.scrollTo`.
 *
 * @params node - A node to be scrolled. Must be of type <ScrollView />.
 * @params options - Object describing the scroll position and zoom level. See `ScrollEventOptions` for more details.
 *
 * @example
 * ```
 * const root = Fantom.createRoot();
 * let maybeScrollViewNode;
 *
 * Fantom.runTask(() => {
 *   root.render(
 *     <ScrollView
 *       ref={node => {
 *         maybeScrollViewNode = node;
 *       }} />
 *       <ScrollViewContent />
 *     </ScrollView>,
 *   );
 * });
 *
 * const element = ensureInstance(maybeScrollViewNode, ReactNativeElement);
 *
 * Fantom.runOnUIThread(() => {
 *   Fantom.enqueueScrollEvent(element, {
 *     x: 20,
 *     y: 10,
 *  });
 *
 * // The changes from scroll event are *not* yet observable.
 *
 * Fantom.runWorkLoop();
 *
 * // The changes from scroll event are observable.
 * ```
 */
export function enqueueScrollEvent(
  nodeOrRef: NodeOrRef,
  options: ScrollEventOptions,
) {
  const node = getNode(nodeOrRef);
  const shadowNode = getNativeNodeReference(node);
  NativeFantom.enqueueScrollEvent(shadowNode, options);
}

/**
 * Scrolls the specified ScrollView node to the given coordinates on the UI thread.
 * The call is immediately observable unlike `Fantom.enqueueScrollEvent` where the
 * event is queued and not processed.
 *
 * @params node - A node to be scrolled. Must be of type <ScrollView />.
 * @params options - Object describing the scroll position and zoom level. See `ScrollEventOptions` for more details.
 *
 * @example
 * ```
 * const root = Fantom.createRoot();
 * let maybeScrollViewNode;
 *
 * Fantom.runTask(() => {
 *   root.render(
 *     <ScrollView
 *       ref={node => {
 *         maybeScrollViewNode = node;
 *       }} />
 *       <ScrollViewContent />
 *     </ScrollView>,
 *   );
 * });
 *
 * const element = ensureInstance(maybeScrollViewNode, ReactNativeElement);
 *
 * Fantom.scrollTo(element, {x: 0, y: 20});
 *
 * // Assert that changes from Fantom.scrollTo are in effect.
 * ```
 */
export function scrollTo(nodeOrRef: NodeOrRef, options: ScrollEventOptions) {
  const node = getNode(nodeOrRef);

  runOnUIThread(() => {
    enqueueScrollEvent(node, options);
  });

  runWorkLoop();
}

/**
 * Enqueues modal size update for a given node.
 * It does not wait for it to be processed and effects are not observable after calling this method.
 * Can only be called on <Modal />.
 *
 * @params node - A node to have its size updated. Must be of type <Modal />.
 * @params size - New size for the node. This would typically be screen size.
 *
 * @example
 * ```
 * Fantom.runOnUIThread(() => {
 *   Fantom.enqueueModalSizeUpdate(modalElement, {
 *     width: 100,
 *     height: 100,
 *   });
 * });
 *
 * // The effects of `enqueueModalSizeUpdate` are *not* yet observable.
 *
 * Fantom.runWorkLoop();
 *
 * // The effects of `enqueueModalSizeUpdate` are yet observable.
 * ```
 */
export function enqueueModalSizeUpdate(
  nodeOrRef: NodeOrRef,
  size: Readonly<{width: number, height: number}>,
) {
  const node = getNode(nodeOrRef);
  const shadowNode = getNativeNodeReference(node);
  NativeFantom.enqueueModalSizeUpdate(shadowNode, size.width, size.height);
}

export const unstable_benchmark = Benchmark;

export type {
  SuiteOptions as BenchmarkSuiteOptions,
  TestOptions as BenchmarkTestOptions,
} from './Benchmark';

/**
 * Returns a function that returns the current reference count for the supplied
 * element's shadow node. If the reference count is zero, that means the shadow
 * node has been deallocated.
 *
 * @param node The node for which to create a reference counting function.
 */
export function createShadowNodeReferenceCounter(
  nodeOrRef: NodeOrRef,
): () => number {
  const node = getNode(nodeOrRef);
  const shadowNode = getNativeNodeReference(node);
  return NativeFantom.createShadowNodeReferenceCounter(shadowNode);
}

/**
 * Returns a function that returns the current revision number for the supplied
 * element's shadow node.
 *
 * @param node The node for which to create a revision getter.
 */
export function createShadowNodeRevisionGetter(
  nodeOrRef: NodeOrRef,
): () => ?number {
  const node = getNode(nodeOrRef);
  const shadowNode = getNativeNodeReference(node);
  return NativeFantom.createShadowNodeRevisionGetter(shadowNode);
}

/**
 * Saves a heap snapshot after forcing garbage collection.
 *
 * It prints the location of the saved snapshot file, which can be opened using
 * the "Memory" pane in Chrome DevTools.
 */
export function takeJSMemoryHeapSnapshot(): void {
  const constants = getConstants();

  if (constants.isRunningFromCI) {
    throw new Error('Unexpected call to `saveJSMemoryHeapSnapshot` from CI');
  }

  const filePath = constants.jsHeapSnapshotOutputPathTemplate.replace(
    constants.jsHeapSnapshotOutputPathTemplateToken,
    new Date().toISOString(),
  );

  try {
    NativeFantom.saveJSMemoryHeapSnapshot(filePath);
  } catch (nativeError: unknown) {
    let errorMessage = 'Error saving JS heap snapshot.';
    if (
      nativeError instanceof Error &&
      nativeError.message.includes(
        "Cannot create heap snapshots if Hermes isn't built with memory instrumentation.",
      )
    ) {
      // We would generally use an error with nativeError as cause, but our infra
      // doesn't support that yet (it expects a `cause` property on the error with
      // a very specific shape).
      errorMessage +=
        ' If you want to take JS heap snapshots in optimized builds, ' +
        'please call Fantom with FANTOM_ENABLE_MEMORY_INSTRUMENTATION=1 ' +
        '(only works locally with Buck).';
    }

    throw new Error(errorMessage, {cause: nativeError});
  }

  console.info(`💾 JS heap snapshot saved to ${filePath}\n`);
}

export * from './HighResTimeStampMock';
export * from './TimerMock';

function runLogBoxCheck() {
  if (isLogBoxCheckEnabled && LogBox.isInstalled()) {
    const message =
      'Cannot run work loop while LogBox is installed, as LogBox intercepts errors thrown in tests.' +
      ' If you are installing LogBox unintentionally using `InitializeCore`, replace it with `@react-native/fantom/src/setUpDefaultReactNativeEnvironment` to avoid this problem.';

    // This is will go through even if throwing doesn't.
    console.error(message);

    // Throwing here won't re-throw in the test if LogBox is enabled,
    // but will hopefully fail it for some other reason.
    throw new Error(message);
  }
}

function getNode(nodeOrRef: NodeOrRef): ReadOnlyNode {
  if (nodeOrRef instanceof ReadOnlyNode) {
    return nodeOrRef;
  } else if (nodeOrRef.current != null) {
    return nodeOrRef.current;
  } else {
    throw new TypeError('Could not get node from ref');
  }
}

global.__FANTOM_PACKAGE_LOADED__ = true;
