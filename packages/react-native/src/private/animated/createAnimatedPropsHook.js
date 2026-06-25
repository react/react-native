/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AnimatedPropsAllowlist} from '../../../Libraries/Animated/nodes/AnimatedProps';
import type {EventSubscription} from '../../../Libraries/EventEmitter/NativeEventEmitter';

import AnimatedNode from '../../../Libraries/Animated/nodes/AnimatedNode';
import AnimatedProps from '../../../Libraries/Animated/nodes/AnimatedProps';
import AnimatedValue from '../../../Libraries/Animated/nodes/AnimatedValue';
import {isPublicInstance as isFabricPublicInstance} from '../../../Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstanceUtils';
import {RootTagContext} from '../../../Libraries/ReactNative/RootTag';
import useRefEffect from '../../../Libraries/Utilities/useRefEffect';
import * as ReactNativeFeatureFlags from '../featureflags/ReactNativeFeatureFlags';
import {createAnimatedPropsMemoHook} from './createAnimatedPropsMemoHook';
import NativeAnimatedHelper from './NativeAnimatedHelper';
import {
  useCallback,
  useContext,
  useEffect,
  useInsertionEffect,
  useReducer,
  useRef,
} from 'react';

type ReducedProps<TProps> = {
  ...TProps,
  collapsable: boolean,
  ...
};
type CallbackRef<T> = T => unknown;

export type AnimatedPropsHook = <TProps extends {...}, TInstance>(
  props: TProps,
) => [ReducedProps<TProps>, CallbackRef<TInstance | null>];

type UpdateCallback = () => void;

type AnimatedValueListeners = Array<{
  propValue: AnimatedValue,
  listenerId: string,
}>;

export default function createAnimatedPropsHook(
  allowlist: ?AnimatedPropsAllowlist,
): AnimatedPropsHook {
  const useAnimatedPropsMemo = createAnimatedPropsMemoHook(allowlist);

  const useNativePropsInFabric =
    ReactNativeFeatureFlags.shouldUseSetNativePropsInFabric();

  return function useAnimatedProps<TProps extends {...}, TInstance>(
    props: TProps,
  ): [ReducedProps<TProps>, CallbackRef<TInstance | null>] {
    const [, scheduleUpdate] = useReducer<number, void>(count => count + 1, 0);
    const onUpdateRef = useRef<UpdateCallback | null>(null);
    const timerRef = useRef<TimeoutID | null>(null);

    const rootTag = useContext(RootTagContext);

    const node = useAnimatedPropsMemo(
      () =>
        new AnimatedProps(
          props,
          () => onUpdateRef.current?.(),
          allowlist,
          rootTag,
        ),
      props,
    );

    useEffect(() => {
      // Animated queue flush is handled deterministically in setImmediate for the following feature flags:
      // cxxNativeAnimatedEnabled
      if (!NativeAnimatedHelper.shouldSignalBatch) {
        // If multiple components call `flushQueue`, the first one will flush the
        // queue and subsequent ones will do nothing.
        NativeAnimatedHelper.API.flushQueue();
      }
      let drivenAnimationEndedListener: ?EventSubscription = null;
      if (node.__isNative) {
        drivenAnimationEndedListener =
          NativeAnimatedHelper.nativeEventEmitter.addListener(
            'onUserDrivenAnimationEnded',
            data => {
              node.update();
            },
          );
      }

      return () => {
        drivenAnimationEndedListener?.remove();
      };
    });

    useAnimatedPropsLifecycle(node);

    // TODO: This "effect" does three things:
    //
    //   1) Call `setNativeView`.
    //   2) Update `onUpdateRef`.
    //   3) Update listeners for `AnimatedEvent` props.
    //
    // Ideally, each of these would be separate "effects" so that they are not
    // unnecessarily re-run when irrelevant dependencies change. For example, we
    // should be able to hoist all `AnimatedEvent` props and only do #3 if either
    // the `AnimatedEvent` props change or `instance` changes.
    //
    // But there is no way to transparently compose three separate callback refs,
    // so we just combine them all into one for now.
    const refEffect = useCallback(
      (instance: TInstance) => {
        // NOTE: This may be called more often than necessary (e.g. when `props`
        // changes), but `setNativeView` already optimizes for that.
        // $FlowFixMe[incompatible-type]
        node.setNativeView(instance);

        // NOTE: When using the JS animation driver, this callback is called on
        // every animation frame. When using the native driver, this callback is
        // called when the animation completes.
        onUpdateRef.current = () => {
          if (process.env.NODE_ENV === 'test') {
            // Check 1: this is a test.
            // call `scheduleUpdate` to bypass use of setNativeProps.
            return scheduleUpdate();
          }

          const isFabricNode = isFabricInstance(instance);
          if (node.__isNative) {
            // Check 2: this is an animation driven by native.
            // In native driven animations, this callback is only called once the animation completes.
            const shouldRemoveJsSync =
              ReactNativeFeatureFlags.cxxNativeAnimatedEnabled();
            if (isFabricNode && !shouldRemoveJsSync) {
              // Call `scheduleUpdate` to synchronise Fiber and Shadow tree.
              // Must not be called in Paper.
              scheduleUpdate();
            }
            return;
          }

          if (
            typeof instance !== 'object' ||
            typeof instance?.setNativeProps !== 'function'
          ) {
            // Check 3: the instance does not support setNativeProps. Call `scheduleUpdate`.
            return scheduleUpdate();
          }

          if (!isFabricNode) {
            // Check 4: this is a paper instance, call setNativeProps.
            // $FlowFixMe[not-a-function] - Assume it's still a function.
            // $FlowFixMe[incompatible-use]
            return instance.setNativeProps(node.__getAnimatedValue());
          }

          if (!useNativePropsInFabric) {
            // Check 5: setNativeProps are disabled.
            return scheduleUpdate();
          }

          // This is a Fabric instance and setNativeProps is supported.

          // $FlowFixMe[not-a-function] - Assume it's still a function.
          // $FlowFixMe[incompatible-use]
          instance.setNativeProps(node.__getAnimatedValue());

          // Keeping state of Fiber tree and Shadow tree in sync.
          //
          // This is done by calling `scheduleUpdate` which will trigger a commit.
          // However, React commit is not fast enough to drive animations.
          // This is where setNativeProps comes in handy but the state between
          // Fiber tree and Shadow tree needs to be kept in sync.
          // The goal is to call `scheduleUpdate` as little as possible to maintain
          // performance but frequently enough to keep state in sync.
          // Debounce is set to 48ms, which is 3 * the duration of a frame.
          // 3 frames was the highest value where flickering state was not observed.
          if (timerRef.current != null) {
            clearTimeout(timerRef.current);
          }
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            scheduleUpdate();
          }, 48);
        };

        const target = getEventTarget(instance);
        const animatedValueListeners: AnimatedValueListeners = [];
        const eventTuples = node.__getNativeAnimatedEventTuples();

        for (const [propName, propValue] of eventTuples) {
          propValue.__attach(target, propName);
          // $FlowFixMe[incompatible-type] - the `addListenersToPropsValue` drills down the propValue.
          addListenersToPropsValue(propValue, animatedValueListeners);
        }

        return () => {
          onUpdateRef.current = null;

          for (const [propName, propValue] of eventTuples) {
            propValue.__detach(target, propName);
          }

          for (const {propValue, listenerId} of animatedValueListeners) {
            propValue.removeListener(listenerId);
          }
        };
      },
      [node],
    );
    const callbackRef = useRefEffect<TInstance>(refEffect);

    return [reduceAnimatedProps<TProps>(node, props), callbackRef];
  };
}

function reduceAnimatedProps<TProps>(
  node: AnimatedProps,
  props: TProps,
): ReducedProps<TProps> {
  // Force `collapsable` to be false so that the native view is not flattened.
  // Flattened views cannot be accurately referenced by the native driver.
  return {
    ...node.__getValueWithStaticProps(props),
    collapsable: false,
  };
}

function addListenersToPropsValue(
  propValue: AnimatedValue,
  accumulator: AnimatedValueListeners,
) {
  // propValue can be a scalar value, an array or an object.
  if (propValue instanceof AnimatedValue) {
    const listenerId = propValue.addListener(() => {});
    accumulator.push({propValue, listenerId});
  } else if (Array.isArray(propValue)) {
    // An array can be an array of scalar values, arrays of arrays, or arrays of objects
    for (const prop of propValue) {
      addListenersToPropsValue(prop, accumulator);
    }
  } else if (propValue instanceof Object) {
    addAnimatedValuesListenersToProps(propValue, accumulator);
  }
}

function addAnimatedValuesListenersToProps(
  props: AnimatedNode,
  accumulator: AnimatedValueListeners,
) {
  for (const propName in props) {
    // $FlowFixMe[prop-missing] - This is an object contained in a prop, but we don't know the exact type.
    const propValue = props[propName];
    addListenersToPropsValue(propValue, accumulator);
  }
}

/**
 * Manages the lifecycle of the supplied `AnimatedProps` by invoking `__attach`
 * and `__detach`. However, `__detach` occurs in a microtask for these reasons:
 *
 *   1. Optimizes detaching and attaching `AnimatedNode` instances that rely on
 *      reference counting to cleanup state, by causing detach to be scheduled
 *      after any subsequent attach.
 *   2. Avoids calling `detach` during the insertion effect phase (which
 *      occurs during the commit phase), which may invoke completion callbacks.
 *
 * We should avoid invoking completion callbacks during the commit phase because
 * callbacks may update state, which is unsupported and will force synchronous
 * updates.
 */
function useAnimatedPropsLifecycle(node: AnimatedProps): void {
  const isMounted = useRef<boolean>(false);

  useInsertionEffect(() => {
    isMounted.current = true;
    node.__attach();

    return () => {
      isMounted.current = false;
      queueMicrotask(() => {
        // NOTE: Do not restore default values on unmount, see D18197735.
        if (isMounted.current) {
          // TODO: Stop restoring default values (unless `reset` is called).
          node.__restoreDefaultValues();
        }
        node.__detach();
      });
    };
  }, [node]);
}

function getEventTarget<TInstance>(instance: TInstance): TInstance {
  return typeof instance === 'object' &&
    typeof instance?.getScrollableNode === 'function'
    ? // $FlowFixMe[incompatible-use] - Legacy instance assumptions.
      instance.getScrollableNode()
    : instance;
}

// $FlowFixMe[unclear-type] - Legacy instance assumptions.
function isFabricInstance(instance: any): boolean {
  return (
    isFabricPublicInstance(instance) ||
    // Some components have a setNativeProps function but aren't a host component
    // such as lists like FlatList and SectionList. These should also use
    // forceUpdate in Fabric since setNativeProps doesn't exist on the underlying
    // host component. This crazy hack is essentially special casing those lists and
    // ScrollView itself to use forceUpdate in Fabric.
    // If these components end up using forwardRef then these hacks can go away
    // as instance would actually be the underlying host component and the above check
    // would be sufficient.
    isFabricPublicInstance(instance?.getNativeScrollRef?.()) ||
    isFabricPublicInstance(
      instance?.getScrollResponder?.()?.getNativeScrollRef?.(),
    )
  );
}
