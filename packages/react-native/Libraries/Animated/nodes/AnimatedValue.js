/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EventSubscription} from '../../vendor/emitter/EventEmitter';
import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type Animation from '../animations/Animation';
import type {EndCallback} from '../animations/Animation';
import type {
  InterpolationConfigSupportedOutputType,
  InterpolationConfigType,
} from './AnimatedInterpolation';
import type AnimatedNode from './AnimatedNode';
import type {AnimatedNodeConfig} from './AnimatedNode';
import type AnimatedTracking from './AnimatedTracking';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import AnimatedInterpolation from './AnimatedInterpolation';
import AnimatedWithChildren from './AnimatedWithChildren';

export type AnimatedValueConfig = Readonly<{
  ...AnimatedNodeConfig,
  useNativeDriver: boolean,
}>;

const NativeAnimatedAPI = NativeAnimatedHelper.API;

/**
 * Animated works by building a directed acyclic graph of dependencies
 * transparently when you render your Animated components.
 *
 *               new Animated.Value(0)
 *     .interpolate()        .interpolate()    new Animated.Value(1)
 *         opacity               translateY      scale
 *          style                         transform
 *         View#234                         style
 *                                         View#123
 *
 * A) Top Down phase
 * When an Animated.Value is updated, we recursively go down through this
 * graph in order to find leaf nodes: the views that we flag as needing
 * an update.
 *
 * B) Bottom Up phase
 * When a view is flagged as needing an update, we recursively go back up
 * in order to build the new value that it needs. The reason why we need
 * this two-phases process is to deal with composite props such as
 * transform which can receive values from multiple parents.
 */
export function flushValue(rootNode: AnimatedNode): void {
  const leaves = new Set<{update: () => void, ...}>();
  function findAnimatedStyles(node: AnimatedNode) {
    // $FlowFixMe[prop-missing]
    if (typeof node.update === 'function') {
      leaves.add(node as any);
    } else {
      node.__getChildren().forEach(findAnimatedStyles);
    }
  }
  findAnimatedStyles(rootNode);
  leaves.forEach(leaf => leaf.update());
}

/**
 * Some operations are executed only on batch end, which is _mostly_ scheduled when
 * Animated component props change. For some of the changes which require immediate execution
 * (e.g. setValue), we create a separate batch in case none is scheduled.
 */
function _executeAsAnimatedBatch(id: string, operation: () => void) {
  NativeAnimatedAPI.setWaitingForIdentifier(id);
  operation();
  NativeAnimatedAPI.unsetWaitingForIdentifier(id);
}

/**
 * Standard value for driving animations.  One `Animated.Value` can drive
 * multiple properties in a synchronized fashion, but can only be driven by one
 * mechanism at a time.  Using a new mechanism (e.g. starting a new animation,
 * or calling `setValue`) will stop any previous ones.
 *
 * See https://reactnative.dev/docs/animatedvalue
 */
export default class AnimatedValue extends AnimatedWithChildren {
  _listenerCount: number;
  _updateSubscription: ?EventSubscription;

  _value: number;
  _startingValue: number;
  _offset: number;
  _animation: ?Animation;
  _tracking: ?AnimatedTracking;
  __deferAnimationStart: boolean;

  constructor(value: number, config?: ?AnimatedValueConfig) {
    super(config);
    if (typeof value !== 'number') {
      throw new Error('AnimatedValue: Attempting to set value to undefined');
    }

    this._listenerCount = 0;
    this._updateSubscription = null;

    this._startingValue = this._value = value;
    this._offset = 0;
    this.__deferAnimationStart =
      ReactNativeFeatureFlags.animatedDeferStartOfTimingAnimations();
    this._animation = null;
    if (config && config.useNativeDriver) {
      this.__makeNative();
    }
  }

  __detach() {
    if (this.__isNative) {
      NativeAnimatedAPI.getValue(this.__getNativeTag(), value => {
        this._value = value - this._offset;
      });
    }
    this.stopAnimation();
    super.__detach();
  }

  __getValue(): number {
    return this._value + this._offset;
  }

  __makeNative(platformConfig: ?PlatformConfig): void {
    super.__makeNative(platformConfig);
    if (this._listenerCount > 0) {
      this.__ensureUpdateSubscriptionExists();
    }
  }

  addListener(callback: (value: any) => unknown): string {
    const id = super.addListener(callback);
    this._listenerCount++;
    if (this.__isNative) {
      this.__ensureUpdateSubscriptionExists();
    }
    return id;
  }

  removeListener(id: string): void {
    super.removeListener(id);
    this._listenerCount--;
    if (this.__isNative && this._listenerCount === 0) {
      this._updateSubscription?.remove();
    }
  }

  removeAllListeners(): void {
    super.removeAllListeners();
    this._listenerCount = 0;
    if (this.__isNative) {
      this._updateSubscription?.remove();
    }
  }

  __ensureUpdateSubscriptionExists(): void {
    if (this._updateSubscription != null) {
      return;
    }
    const nativeTag = this.__getNativeTag();
    NativeAnimatedAPI.startListeningToAnimatedNodeValue(nativeTag);
    const subscription: EventSubscription =
      NativeAnimatedHelper.nativeEventEmitter.addListener(
        'onAnimatedValueUpdate',
        data => {
          if (data.tag === nativeTag) {
            this.__onAnimatedValueUpdateReceived(data.value, data.offset);
          }
        },
      );

    this._updateSubscription = {
      remove: () => {
        // Only this function assigns to `this.#updateSubscription`.
        if (this._updateSubscription == null) {
          return;
        }
        this._updateSubscription = null;
        subscription.remove();
        NativeAnimatedAPI.stopListeningToAnimatedNodeValue(nativeTag);
      },
    };
  }

  /**
   * Directly set the value.  This will stop any animations running on the value
   * and update all the bound properties.
   *
   * See https://reactnative.dev/docs/animatedvalue#setvalue
   */
  setValue(value: number): void {
    if (this._animation) {
      this._animation.stop();
      this._animation = null;
    }
    this._updateValue(
      value,
      !this.__isNative /* don't perform a flush for natively driven values */,
    );
    if (this.__isNative) {
      _executeAsAnimatedBatch(this.__getNativeTag().toString(), () =>
        NativeAnimatedAPI.setAnimatedNodeValue(this.__getNativeTag(), value),
      );
    }
  }

  /**
   * Sets an offset that is applied on top of whatever value is set, whether via
   * `setValue`, an animation, or `Animated.event`.  Useful for compensating
   * things like the start of a pan gesture.
   *
   * See https://reactnative.dev/docs/animatedvalue#setoffset
   */
  setOffset(offset: number): void {
    this._offset = offset;
    if (this.__isNative) {
      NativeAnimatedAPI.setAnimatedNodeOffset(this.__getNativeTag(), offset);
    }
  }

  /**
   * Merges the offset value into the base value and resets the offset to zero.
   * The final output of the value is unchanged.
   *
   * See https://reactnative.dev/docs/animatedvalue#flattenoffset
   */
  flattenOffset(): void {
    this._value += this._offset;
    this._offset = 0;
    if (this.__isNative) {
      NativeAnimatedAPI.flattenAnimatedNodeOffset(this.__getNativeTag());
    }
  }

  /**
   * Sets the offset value to the base value, and resets the base value to zero.
   * The final output of the value is unchanged.
   *
   * See https://reactnative.dev/docs/animatedvalue#extractoffset
   */
  extractOffset(): void {
    this._offset += this._value;
    this._value = 0;
    if (this.__isNative) {
      _executeAsAnimatedBatch(this.__getNativeTag().toString(), () =>
        NativeAnimatedAPI.extractAnimatedNodeOffset(this.__getNativeTag()),
      );
    }
  }

  /**
   * Stops any running animation or tracking. `callback` is invoked with the
   * final value after stopping the animation, which is useful for updating
   * state to match the animation position with layout.
   *
   * See https://reactnative.dev/docs/animatedvalue#stopanimation
   */
  stopAnimation(callback?: ?(value: number) => void): void {
    this.stopTracking();
    this._animation && this._animation.stop();
    this._animation = null;
    if (callback) {
      if (this.__isNative) {
        NativeAnimatedAPI.getValue(this.__getNativeTag(), callback);
      } else {
        callback(this.__getValue());
      }
    }
  }

  /**
   * Stops any animation and resets the value to its original.
   *
   * See https://reactnative.dev/docs/animatedvalue#resetanimation
   */
  resetAnimation(callback?: ?(value: number) => void): void {
    this.stopAnimation(callback);
    this._value = this._startingValue;
    if (this.__isNative) {
      NativeAnimatedAPI.setAnimatedNodeValue(
        this.__getNativeTag(),
        this._startingValue,
      );
    }
  }

  __onAnimatedValueUpdateReceived(value: number, offset?: number): void {
    this._updateValue(value, false /*flush*/);
    if (offset != null) {
      this._offset = offset;
    }
  }

  /**
   * Interpolates the value before updating the property, e.g. mapping 0-1 to
   * 0-10.
   */
  interpolate<OutputT extends InterpolationConfigSupportedOutputType>(
    config: InterpolationConfigType<OutputT>,
  ): AnimatedInterpolation<OutputT> {
    return new AnimatedInterpolation(this, config);
  }

  /**
   * Typically only used internally, but could be used by a custom Animation
   * class.
   *
   * See https://reactnative.dev/docs/animatedvalue#animate
   */
  animate(animation: Animation, callback: ?EndCallback): void {
    const previousAnimation = this._animation;
    this._animation && this._animation.stop();
    this._animation = animation;
    animation.start(
      this._value,
      value => {
        // Natively driven animations will never call into that callback, therefore we can always
        // pass flush = true to allow the updated value to propagate to native with setNativeProps
        this._updateValue(value, true /* flush */);
      },
      result => {
        this._animation = null;
        callback && callback(result);
        if (this._animation == null) {
          this.__deferAnimationStart =
            ReactNativeFeatureFlags.animatedDeferStartOfTimingAnimations();
        }
      },
      previousAnimation,
      this,
    );
  }

  /**
   * Typically only used internally.
   */
  stopTracking(): void {
    this._tracking && this._tracking.__detach();
    this._tracking = null;
  }

  /**
   * Typically only used internally.
   */
  track(tracking: AnimatedTracking): void {
    this.stopTracking();
    this._tracking = tracking;
    // Make sure that the tracking animation starts executing
    this._tracking && this._tracking.update();
  }

  _updateValue(value: number, flush: boolean): void {
    if (value === undefined) {
      throw new Error('AnimatedValue: Attempting to set value to undefined');
    }

    this._value = value;
    if (flush) {
      flushValue(this);
    }
    this.__callListeners(this.__getValue());
  }

  __getNativeConfig(): Object {
    return {
      type: 'value',
      value: this._value,
      offset: this._offset,
      debugID: this.__getDebugID(),
    };
  }
}
