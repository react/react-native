/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventConfig} from '../../../Libraries/Animated/AnimatedEvent';
import type {
  AnimationConfig,
  EndCallback,
} from '../../../Libraries/Animated/animations/Animation';
import type {
  AnimatedNodeConfig,
  EventMapping,
} from '../../../Libraries/Animated/NativeAnimatedModule';
import type {Spec as NativeAnimatedTurboModuleSpec} from '../../../Libraries/Animated/NativeAnimatedTurboModule';
import type {Node} from '../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {EventSubscription} from '../../../Libraries/vendor/emitter/EventEmitter';

import NativeAnimatedNonTurboModule from '../../../Libraries/Animated/NativeAnimatedModule';
import NativeAnimatedTurboModule from '../../../Libraries/Animated/NativeAnimatedTurboModule';
import NativeEventEmitter from '../../../Libraries/EventEmitter/NativeEventEmitter';
import RCTDeviceEventEmitter from '../../../Libraries/EventEmitter/RCTDeviceEventEmitter';
import Platform from '../../../Libraries/Utilities/Platform';
import * as ReactNativeFeatureFlags from '../featureflags/ReactNativeFeatureFlags';
import invariant from 'invariant';
import nullthrows from 'nullthrows';

interface NativeAnimatedModuleSpec extends NativeAnimatedTurboModuleSpec {
  // connectAnimatedNodeToShadowNodeFamily is available only in NativeAnimatedNonTurboModule
  readonly connectAnimatedNodeToShadowNodeFamily?: (
    nodeTag: number,
    // $FlowExpectedError[unclear-type].
    shadowNode: Object,
  ) => void;
}

// TODO T69437152 @petetheheat - Delete this fork when Fabric ships to 100%.
const NativeAnimatedModule: ?NativeAnimatedModuleSpec =
  NativeAnimatedNonTurboModule ?? NativeAnimatedTurboModule;

let __nativeAnimatedNodeTagCount = 1; /* used for animated nodes */
let __nativeAnimationIdCount = 1; /* used for started animations */

let nativeEventEmitter;

const waitingForQueuedOperations = new Set<string>();
let queueOperations = false;
const queue: Array<() => void> = [];
const singleOpQueue: Array<unknown> = [];

const isSingleOpBatching =
  Platform.OS === 'android' &&
  NativeAnimatedModule?.queueAndExecuteBatchedOperations != null &&
  ReactNativeFeatureFlags.animatedShouldUseSingleOp();
let flushQueueImmediate = null;

const eventListenerGetValueCallbacks: {
  [number]: (value: number) => void,
} = {};
const eventListenerAnimationFinishedCallbacks: {
  [number]: EndCallback,
} = {};
let globalEventEmitterGetValueListener: ?EventSubscription = null;
let globalEventEmitterAnimationFinishedListener: ?EventSubscription = null;

const shouldSignalBatch: boolean =
  ReactNativeFeatureFlags.cxxNativeAnimatedEnabled();

// Schedules `API.flushQueue` after the current batch, replacing any pending
// flush. On device `setImmediate` is a microtask; under jest's fake timers it's
// a fake-timer entry that only `runAllTimers` drains — not `await` or
// `advanceTimersByTime` — so the deferred flush wouldn't run before a test's
// assertions. Flush synchronously in tests instead.
function scheduleQueueFlush(): void {
  clearImmediate(flushQueueImmediate);
  if (process.env.NODE_ENV === 'test') {
    // TODO: T275950736 - remove this path
    API.flushQueue();
  } else {
    flushQueueImmediate = setImmediate(API.flushQueue);
  }
}

function createNativeOperations(): NonNullable<typeof NativeAnimatedModule> {
  const methodNames = [
    'createAnimatedNode', // 1
    'updateAnimatedNodeConfig', // 2
    'getValue', // 3
    'startListeningToAnimatedNodeValue', // 4
    'stopListeningToAnimatedNodeValue', // 5
    'connectAnimatedNodes', // 6
    'disconnectAnimatedNodes', // 7
    'startAnimatingNode', // 8
    'stopAnimation', // 9
    'setAnimatedNodeValue', // 10
    'setAnimatedNodeOffset', // 11
    'flattenAnimatedNodeOffset', // 12
    'extractAnimatedNodeOffset', // 13
    'connectAnimatedNodeToView', // 14
    'disconnectAnimatedNodeFromView', // 15
    'restoreDefaultValues', // 16
    'dropAnimatedNode', // 17
    'addAnimatedEventToView', // 18
    'removeAnimatedEventFromView', // 19
    'addListener', // 20
    'removeListener', // 21
  ];
  if (
    ReactNativeFeatureFlags.cxxNativeAnimatedEnabled() &&
    //eslint-disable-next-line
    ReactNativeFeatureFlags.useSharedAnimatedBackend() &&
    NativeAnimatedModule?.connectAnimatedNodeToShadowNodeFamily != null
  ) {
    methodNames.push('connectAnimatedNodeToShadowNodeFamily');
  }
  const nativeOperations: {
    [Values<typeof methodNames>]: (...ReadonlyArray<unknown>) => void,
  } = {};
  if (isSingleOpBatching) {
    for (let ii = 0, length = methodNames.length; ii < length; ii++) {
      const methodName = methodNames[ii];
      const operationID = ii + 1;
      nativeOperations[methodName] = (...args) => {
        // `singleOpQueue` is a flat array of operation IDs and arguments, which
        // is possible because # arguments is fixed for each operation. For more
        // details, see `NativeAnimatedModule.queueAndExecuteBatchedOperations`.
        singleOpQueue.push(operationID, ...args);
        if (shouldSignalBatch) {
          scheduleQueueFlush();
        }
      };
    }
  } else {
    for (let ii = 0, length = methodNames.length; ii < length; ii++) {
      const methodName = methodNames[ii];
      nativeOperations[methodName] = (...args) => {
        /* $FlowFixMe[prop-missing] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        const method = nullthrows(NativeAnimatedModule)[methodName];
        // If queueing is explicitly on, *or* the queue has not yet
        // been flushed, use the queue. This is to prevent operations
        // from being executed out of order.
        if (queueOperations || queue.length !== 0) {
          // $FlowExpectedError[incompatible-call] - Dynamism.
          queue.push(() => method(...args));
        } else if (shouldSignalBatch) {
          // $FlowExpectedError[incompatible-call] - Dynamism.
          queue.push(() => method(...args));
          scheduleQueueFlush();
        } else {
          // $FlowExpectedError[incompatible-call] - Dynamism.
          method(...args);
        }
      };
    }
  }
  // $FlowExpectedError[incompatible-type] - Dynamism.
  return nativeOperations;
}

const NativeOperations = createNativeOperations();

/**
 * Wrappers around NativeAnimatedModule to provide flow and autocomplete support for
 * the native module methods, and automatic queue management on Android
 */
const API = {
  addAnimatedEventToView(
    viewTag: number,
    eventName: string,
    eventMapping: EventMapping,
  ) {
    NativeOperations.addAnimatedEventToView(viewTag, eventName, eventMapping);
  },
  connectAnimatedNodes(parentTag: number, childTag: number): void {
    NativeOperations.connectAnimatedNodes(parentTag, childTag);
  },
  connectAnimatedNodeToShadowNodeFamily(
    nodeTag: number,
    shadowNode: Node,
  ): void {
    NativeOperations.connectAnimatedNodeToShadowNodeFamily?.(
      nodeTag,
      shadowNode,
    );
  },
  connectAnimatedNodeToView(nodeTag: number, viewTag: number): void {
    NativeOperations.connectAnimatedNodeToView(nodeTag, viewTag);
  },
  createAnimatedNode(tag: number, config: AnimatedNodeConfig): void {
    if (config.disableBatchingForNativeCreate) {
      NativeAnimatedModule?.createAnimatedNode(tag, config);
    } else {
      NativeOperations.createAnimatedNode(tag, config);
    }
  },
  disableQueue(): void {
    invariant(NativeAnimatedModule, 'Native animated module is not available');

    if (ReactNativeFeatureFlags.animatedShouldDebounceQueueFlush()) {
      scheduleQueueFlush();
    } else {
      API.flushQueue();
    }
  },
  disconnectAnimatedNodeFromView(nodeTag: number, viewTag: number): void {
    NativeOperations.disconnectAnimatedNodeFromView(nodeTag, viewTag);
  },
  disconnectAnimatedNodes(parentTag: number, childTag: number): void {
    NativeOperations.disconnectAnimatedNodes(parentTag, childTag);
  },
  dropAnimatedNode(tag: number): void {
    NativeOperations.dropAnimatedNode(tag);
  },
  extractAnimatedNodeOffset(nodeTag: number): void {
    NativeOperations.extractAnimatedNodeOffset(nodeTag);
  },
  flattenAnimatedNodeOffset(nodeTag: number): void {
    NativeOperations.flattenAnimatedNodeOffset(nodeTag);
  },
  flushQueue: (isSingleOpBatching
    ? (): void => {
        invariant(
          NativeAnimatedModule,
          'Native animated module is not available',
        );
        flushQueueImmediate = null;

        if (singleOpQueue.length === 0) {
          return;
        }

        // Set up event listener for callbacks if it's not set up
        ensureGlobalEventEmitterListeners();

        // Single op batching doesn't use callback functions, instead we
        // use RCTDeviceEventEmitter. This reduces overhead of sending lots of
        // JSI functions across to native code; but also, TM infrastructure currently
        // does not support packing a function into native arrays.
        NativeAnimatedModule?.queueAndExecuteBatchedOperations?.(singleOpQueue);
        singleOpQueue.length = 0;
      }
    : (): void => {
        invariant(
          NativeAnimatedModule,
          'Native animated module is not available',
        );
        flushQueueImmediate = null;

        if (queue.length === 0) {
          return;
        }

        if (Platform.OS === 'android' || shouldSignalBatch) {
          NativeAnimatedModule?.startOperationBatch?.();
        }

        for (let q = 0, l = queue.length; q < l; q++) {
          queue[q]();
        }
        queue.length = 0;

        if (Platform.OS === 'android' || shouldSignalBatch) {
          NativeAnimatedModule?.finishOperationBatch?.();
        }
      }) as () => void,
  getValue: (isSingleOpBatching
    ? (tag, saveValueCallback) => {
        /* $FlowFixMe[constant-condition] Error discovered during Constant
         * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
        if (saveValueCallback) {
          eventListenerGetValueCallbacks[tag] = saveValueCallback;
        }
        /* $FlowExpectedError[incompatible-type] - `saveValueCallback` is handled
            differently when `isSingleOpBatching` is enabled. */
        NativeOperations.getValue(tag);
      }
    : (tag, saveValueCallback) => {
        NativeOperations.getValue(tag, saveValueCallback);
      }) as NonNullable<typeof NativeAnimatedModule>['getValue'],
  removeAnimatedEventFromView(
    viewTag: number,
    eventName: string,
    animatedNodeTag: number,
  ) {
    NativeOperations.removeAnimatedEventFromView(
      viewTag,
      eventName,
      animatedNodeTag,
    );
  },
  restoreDefaultValues(nodeTag: number): void {
    NativeOperations.restoreDefaultValues?.(nodeTag);
  },
  setAnimatedNodeOffset(nodeTag: number, offset: number): void {
    NativeOperations.setAnimatedNodeOffset(nodeTag, offset);
  },
  setAnimatedNodeValue(nodeTag: number, value: number): void {
    NativeOperations.setAnimatedNodeValue(nodeTag, value);
  },
  setWaitingForIdentifier(id: string): void {
    if (shouldSignalBatch) {
      return;
    }

    waitingForQueuedOperations.add(id);
    queueOperations = true;
    if (
      ReactNativeFeatureFlags.animatedShouldDebounceQueueFlush() &&
      flushQueueImmediate
    ) {
      clearImmediate(flushQueueImmediate);
    }
  },
  startAnimatingNode: (isSingleOpBatching
    ? (animationId, nodeTag, config, endCallback) => {
        /* $FlowFixMe[constant-condition] Error discovered during Constant
         * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
        if (endCallback) {
          eventListenerAnimationFinishedCallbacks[animationId] = endCallback;
        }
        /* $FlowExpectedError[incompatible-type] - `endCallback` is handled
            differently when `isSingleOpBatching` is enabled. */
        NativeOperations.startAnimatingNode(animationId, nodeTag, config);
      }
    : (animationId, nodeTag, config, endCallback) => {
        NativeOperations.startAnimatingNode(
          animationId,
          nodeTag,
          config,
          endCallback,
        );
      }) as NonNullable<typeof NativeAnimatedModule>['startAnimatingNode'],
  startListeningToAnimatedNodeValue(tag: number): void {
    NativeOperations.startListeningToAnimatedNodeValue(tag);
  },
  stopAnimation(animationId: number) {
    NativeOperations.stopAnimation(animationId);
  },
  stopListeningToAnimatedNodeValue(tag: number): void {
    NativeOperations.stopListeningToAnimatedNodeValue(tag);
  },
  unsetWaitingForIdentifier(id: string): void {
    if (shouldSignalBatch) {
      return;
    }

    waitingForQueuedOperations.delete(id);

    if (waitingForQueuedOperations.size === 0) {
      queueOperations = false;
      API.disableQueue();
    }
  },
  updateAnimatedNodeConfig(tag: number, config: AnimatedNodeConfig): void {
    NativeOperations.updateAnimatedNodeConfig?.(tag, config);
  },
};

function ensureGlobalEventEmitterListeners() {
  if (
    globalEventEmitterGetValueListener &&
    globalEventEmitterAnimationFinishedListener
  ) {
    return;
  }
  globalEventEmitterGetValueListener = RCTDeviceEventEmitter.addListener(
    'onNativeAnimatedModuleGetValue',
    params => {
      const {tag} = params;
      const callback = eventListenerGetValueCallbacks[tag];
      /* $FlowFixMe[constant-condition] Error discovered during Constant
       * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
      if (!callback) {
        return;
      }
      callback(params.value);
      delete eventListenerGetValueCallbacks[tag];
    },
  );
  globalEventEmitterAnimationFinishedListener =
    RCTDeviceEventEmitter.addListener(
      'onNativeAnimatedModuleAnimationFinished',
      params => {
        // TODO: remove Array.isArray once native changes have propagated
        const animations = Array.isArray(params) ? params : [params];
        for (const animation of animations) {
          const {animationId} = animation;
          const callback = eventListenerAnimationFinishedCallbacks[animationId];
          /* $FlowFixMe[constant-condition] Error discovered during Constant
           * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
          if (callback) {
            callback(animation);
            delete eventListenerAnimationFinishedCallbacks[animationId];
          }
        }
      },
    );
}

function generateNewNodeTag(): number {
  return __nativeAnimatedNodeTagCount++;
}

function generateNewAnimationId(): number {
  return __nativeAnimationIdCount++;
}

function assertNativeAnimatedModule(): void {
  invariant(NativeAnimatedModule, 'Native animated module is not available');
}

let _warnedMissingNativeAnimated = false;

function shouldUseNativeDriver(
  config: Readonly<{...AnimationConfig, ...}> | EventConfig<unknown>,
): boolean {
  if (config.useNativeDriver == null) {
    console.warn(
      'Animated: `useNativeDriver` was not specified. This is a required ' +
        'option and must be explicitly set to `true` or `false`',
    );
  }

  if (config.useNativeDriver === true && !NativeAnimatedModule) {
    if (process.env.NODE_ENV !== 'test') {
      if (!_warnedMissingNativeAnimated) {
        console.warn(
          'Animated: `useNativeDriver` is not supported because the native ' +
            'animated module is missing. Falling back to JS-based animation. To ' +
            'resolve this, add `RCTAnimation` module to this app, or remove ' +
            '`useNativeDriver`. ' +
            'Make sure to run `bundle exec pod install` first. Read more about autolinking: https://github.com/react-native-community/cli/blob/master/docs/autolinking.md',
        );
        _warnedMissingNativeAnimated = true;
      }
    }
    return false;
  }

  return config.useNativeDriver || false;
}

function transformDataType(value: number | string): number | string {
  // Change the string type to number type so we can reuse the same logic in
  // iOS and Android platform
  if (typeof value !== 'string') {
    return value;
  }

  // Normalize degrees and radians to a number expressed in radians
  if (value.endsWith('deg')) {
    const degrees = parseFloat(value) || 0;
    return (degrees * Math.PI) / 180.0;
  } else if (value.endsWith('rad')) {
    return parseFloat(value) || 0;
  } else {
    return value;
  }
}

export default {
  API,
  assertNativeAnimatedModule,
  generateNewAnimationId,
  generateNewNodeTag,
  // $FlowExpectedError[unsafe-getters-setters] - unsafe getter lint suppression
  // $FlowExpectedError[missing-type-arg] - unsafe getter lint suppression
  get nativeEventEmitter(): NativeEventEmitter {
    if (!nativeEventEmitter) {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      nativeEventEmitter = new NativeEventEmitter(
        // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
        // If you want to use the native module on other platforms, please remove this condition and test its behavior
        Platform.OS !== 'ios' ? null : NativeAnimatedModule,
      );
    }
    return nativeEventEmitter;
  },
  shouldSignalBatch,
  shouldUseNativeDriver,
  transformDataType,
};
