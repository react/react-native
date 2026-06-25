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

import AnimatedValue from './AnimatedValue';
import AnimatedWithChildren from './AnimatedWithChildren';
import invariant from 'invariant';

export type AnimatedValueXYConfig = Readonly<{
  ...AnimatedNodeConfig,
  useNativeDriver: boolean,
}>;
type ValueXYListenerCallback = (value: {x: number, y: number, ...}) => unknown;

let _uniqueId = 1;

/**
 * 2D Value for driving 2D animations, such as pan gestures. Almost identical
 * API to normal `Animated.Value`, but multiplexed.
 *
 * See https://reactnative.dev/docs/animatedvaluexy
 */
export default class AnimatedValueXY extends AnimatedWithChildren {
  x: AnimatedValue;
  y: AnimatedValue;
  _listeners: {
    [key: string]: {
      x: string,
      y: string,
      ...
    },
    ...
  };

  constructor(
    valueIn?: ?{
      readonly x: number | AnimatedValue,
      readonly y: number | AnimatedValue,
      ...
    },
    config?: ?AnimatedValueXYConfig,
  ) {
    super(config);
    const value: any = valueIn || {x: 0, y: 0}; // @flowfixme: shouldn't need `: any`
    if (typeof value.x === 'number' && typeof value.y === 'number') {
      this.x = new AnimatedValue(value.x);
      this.y = new AnimatedValue(value.y);
    } else {
      invariant(
        value.x instanceof AnimatedValue && value.y instanceof AnimatedValue,
        'AnimatedValueXY must be initialized with an object of numbers or ' +
          'AnimatedValues.',
      );
      this.x = value.x;
      this.y = value.y;
    }
    this._listeners = {};
    if (config && config.useNativeDriver) {
      this.__makeNative();
    }
  }

  /**
   * Directly set the value. This will stop any animations running on the value
   * and update all the bound properties.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#setvalue
   */
  setValue(value: {x: number, y: number, ...}) {
    this.x.setValue(value.x);
    this.y.setValue(value.y);
  }

  /**
   * Sets an offset that is applied on top of whatever value is set, whether
   * via `setValue`, an animation, or `Animated.event`. Useful for compensating
   * things like the start of a pan gesture.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#setoffset
   */
  setOffset(offset: {x: number, y: number, ...}) {
    this.x.setOffset(offset.x);
    this.y.setOffset(offset.y);
  }

  /**
   * Merges the offset value into the base value and resets the offset to zero.
   * The final output of the value is unchanged.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#flattenoffset
   */
  flattenOffset(): void {
    this.x.flattenOffset();
    this.y.flattenOffset();
  }

  /**
   * Sets the offset value to the base value, and resets the base value to
   * zero. The final output of the value is unchanged.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#extractoffset
   */
  extractOffset(): void {
    this.x.extractOffset();
    this.y.extractOffset();
  }

  __getValue(): {
    x: number,
    y: number,
    ...
  } {
    return {
      x: this.x.__getValue(),
      y: this.y.__getValue(),
    };
  }

  /**
   * Stops any animation and resets the value to its original.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#resetanimation
   */
  resetAnimation(
    callback?: (value: {x: number, y: number, ...}) => void,
  ): void {
    this.x.resetAnimation();
    this.y.resetAnimation();
    callback && callback(this.__getValue());
  }

  /**
   * Stops any running animation or tracking. `callback` is invoked with the
   * final value after stopping the animation, which is useful for updating
   * state to match the animation position with layout.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#stopanimation
   */
  stopAnimation(callback?: (value: {x: number, y: number, ...}) => void): void {
    this.x.stopAnimation();
    this.y.stopAnimation();
    callback && callback(this.__getValue());
  }

  /**
   * Adds an asynchronous listener to the value so you can observe updates from
   * animations.  This is useful because there is no way to synchronously read
   * the value because it might be driven natively.
   *
   * Returns a string that serves as an identifier for the listener.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#addlistener
   */
  addListener(callback: ValueXYListenerCallback): string {
    const id = String(_uniqueId++);
    const jointCallback = ({value: number}: any) => {
      callback(this.__getValue());
    };
    this._listeners[id] = {
      x: this.x.addListener(jointCallback),
      y: this.y.addListener(jointCallback),
    };
    return id;
  }

  /**
   * Unregister a listener. The `id` param shall match the identifier
   * previously returned by `addListener()`.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#removelistener
   */
  removeListener(id: string): void {
    this.x.removeListener(this._listeners[id].x);
    this.y.removeListener(this._listeners[id].y);
    delete this._listeners[id];
  }

  /**
   * Remove all registered listeners.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#removealllisteners
   */
  removeAllListeners(): void {
    this.x.removeAllListeners();
    this.y.removeAllListeners();
    this._listeners = {};
  }

  /**
   * Converts `{x, y}` into `{left, top}` for use in style.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#getlayout
   */
  getLayout(): {[key: string]: AnimatedValue, ...} {
    return {
      left: this.x,
      top: this.y,
    };
  }

  /**
   * Converts `{x, y}` into a useable translation transform.
   *
   * See https://reactnative.dev/docs/animatedvaluexy#gettranslatetransform
   */
  getTranslateTransform(): Array<
    {translateX: AnimatedValue} | {translateY: AnimatedValue},
  > {
    return [{translateX: this.x}, {translateY: this.y}];
  }

  __attach(): void {
    this.x.__addChild(this);
    this.y.__addChild(this);
    super.__attach();
  }

  __detach(): void {
    this.x.__removeChild(this);
    this.y.__removeChild(this);
    super.__detach();
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this.x.__makeNative(platformConfig);
    this.y.__makeNative(platformConfig);
    super.__makeNative(platformConfig);
  }
}
