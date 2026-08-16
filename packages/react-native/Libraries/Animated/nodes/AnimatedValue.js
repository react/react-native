/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type {AnimatedNodeConfig} from './AnimatedNode';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import AnimatedWithChildren from './AnimatedWithChildren';

export type AnimatedValueConfig = Readonly<{
  ...AnimatedNodeConfig,
}>;

const NativeAnimatedAPI = NativeAnimatedHelper.API;

/**
 * Animated works by building a directed acyclic graph of dependencies
 * transparently when you render your Animated components.
 *
 * new Animated.Value(0)
 * .interpolate()        .interpolate()    new Animated.Value(1)
 * opacity               translateY      scale
 * style                    transform
 * View#234                   style
 * View#123
 *
 * A) Top Down phase
 * When an Animated.Value is updated, we recursively go down through this
 * graph in order to find leaf nodes: the views that we flag as needing
 * an update.
 *
 * B) Bottom Up phase
 * When a view is flagged as needing an update, we recursively go back up
 * in order to build the new value that it needs. The reason why we need
 * this two phases process is to deal with composite props such as
 * transform which can receive values from multiple parents.
 */

export function flushValue(rootNode: AnimatedWithChildren): void {
  const leaves = new Set<(update: () => void) => void, ...>();
  function findAnimatedStyles(node: AnimatedWithChildren) {
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
function _executeAsAnimatedBatch(id: string, operation: () => void): void {
  NativeAnimatedAPI.setWaitingForIdentifier(id);
  operation();
  NativeAnimatedAPI.unsetWaitingForIdentifier(id);
}

/**
 * Standard value for driving animations. One `Animated.Value` can drive
 * multiple properties in a synchronized fashion, but can only be driven by one
 * mechanism at a time. Using a new mechanism (e.g. starting a new animation,
 * or calling `setValue`) will stop any previous ones.
 *
 * See https://reactnative.dev/docs/animatedvalue
 */
export default class AnimatedValue extends AnimatedWithChildren {
  _value: number;
  _startingValue: number;
  _offset: number;
  _animation: ?any;

  constructor(valueIn?: ?number, config?: ?AnimatedValueConfig) {
    super(config);
    if (typeof valueIn !== 'number') {
      this._value = 0;
      this._startingValue = 0;
    } else {
      this._value = valueIn;
      this._startingValue = valueIn;
    }
    this._offset = 0;
    if (config?.useNativeDriver) {
      this.__makeNative();
    }
  }

  __detach(): void {
    if (this.__isNative) {
      NativeAnimatedAPI.stopTracking(this.__getNativeTag());
    }
    super.__detach();
  }

  /**
   * Directly set the value. This will stop any animations running on the value
   * and update all the bound properties.
   *
   * See https://reactnative.dev/docs/animatedvalue#setvalue
   */
  setValue(value: number): void {
    if (this._animation) {
      this._animation.stop();
      this._animation = null;
    }
    this._updateValue(value, !this.__isNative);
    if (this.__isNative) {
      _executeAsAnimatedBatch(this.__getNativeTag().toString(), () => {
        NativeAnimatedAPI.setAnimatedNodeValue(this.__getNativeTag(), value);
      });
    }
  }

  /**
   * Sets an offset that is applied on top of whatever value is set, whether
   * via `setValue`, an animation, or `Animated.event`. Useful for compensating
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
   * Sets the offset value to the base value, and resets the base value to
   * zero. The final output of the value is unchanged.
   *
   * See https://reactnative.dev/docs/animatedvalue#extractoffset
   */
  extractOffset(): void {
    this._offset += this._value;
    this._value = 0;
    if (this.__isNative) {
      NativeAnimatedAPI.extractAnimatedNodeOffset(this.__getNativeTag());
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
    callback && callback(this.__getValue());
  }

  /**
   * Stops any animation and resets the value to its original.
   *
   * See https://reactnative.dev/docs/animatedvalue#resetanimation
   */
  resetAnimation(callback?: ?(value: number) => void): void {
    this.stopTracking();
    this._animation && this._animation.stop();
    this._animation = null;
    this._value = this._startingValue;
    callback && callback(this.__getValue());
  }

  __getValue(): number {
    return this._value + this._offset;
  }

  /**
   * Private method for tracking movements of another value. However, this
   * behavior is being deprecated in favor of a graph-based architecture.
   */
  track(tracking: any): void {
    this.stopTracking();
    this._animation = tracking;
    this._animation.start();
  }

  stopTracking(): void {
    if (this._animation && typeof this._animation.stopTracking === 'function') {
      this._animation.stopTracking();
    }
    this._animation = null;
  }

  _updateValue(value: number, flush: boolean): void {
    this._value = value;
    if (flush) {
      flushValue(this);
    }
    this.__callListeners(this.__getValue());
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    super.__makeNative(platformConfig);
  }

  __getNativeConfig(): {...} {
    return {
      type: 'value',
      value: this._value,
      offset: this._offset,
      debugID: this.__getDebugID(),
    };
  }
                              }
