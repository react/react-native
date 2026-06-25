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

import type {ProcessedColorValue} from '../../StyleSheet/processColor';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {NativeColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type {AnimatedNodeConfig} from './AnimatedNode';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import normalizeColor from '../../StyleSheet/normalizeColor';
import {processColorObject} from '../../StyleSheet/PlatformColorValueTypes';
import AnimatedValue, {flushValue} from './AnimatedValue';
import AnimatedWithChildren from './AnimatedWithChildren';

export type AnimatedColorConfig = Readonly<{
  ...AnimatedNodeConfig,
  useNativeDriver: boolean,
}>;

type ColorListenerCallback = (value: ColorValue) => unknown;

export type RgbaValue = {
  readonly r: number,
  readonly g: number,
  readonly b: number,
  readonly a: number,
  ...
};

type RgbaAnimatedValue = {
  readonly r: AnimatedValue,
  readonly g: AnimatedValue,
  readonly b: AnimatedValue,
  readonly a: AnimatedValue,
  ...
};

export type InputValue = ?(RgbaValue | RgbaAnimatedValue | ColorValue);

const NativeAnimatedAPI = NativeAnimatedHelper.API;

const defaultColor: RgbaValue = {r: 0, g: 0, b: 0, a: 1.0};

/* eslint no-bitwise: 0 */
function processColor(
  color?: ?(ColorValue | RgbaValue),
): ?(RgbaValue | NativeColorValue) {
  if (color === undefined || color === null) {
    return null;
  }

  if (isRgbaValue(color)) {
    // $FlowFixMe[incompatible-type] - Type is verified above
    return color as RgbaValue;
  }

  let normalizedColor: ?ProcessedColorValue = normalizeColor(
    // $FlowFixMe[incompatible-type] - Type is verified above
    color as ColorValue,
  );
  if (normalizedColor === undefined || normalizedColor === null) {
    return null;
  }

  if (typeof normalizedColor === 'object') {
    const processedColorObj: ?NativeColorValue =
      processColorObject(normalizedColor);
    if (processedColorObj != null) {
      return processedColorObj;
    }
  } else if (typeof normalizedColor === 'number') {
    const r: number = (normalizedColor & 0xff000000) >>> 24;
    const g: number = (normalizedColor & 0x00ff0000) >>> 16;
    const b: number = (normalizedColor & 0x0000ff00) >>> 8;
    const a: number = (normalizedColor & 0x000000ff) / 255;

    return {r, g, b, a};
  }

  return null;
}

function isRgbaValue(value: any): boolean {
  return (
    value &&
    typeof value.r === 'number' &&
    typeof value.g === 'number' &&
    typeof value.b === 'number' &&
    typeof value.a === 'number'
  );
}

function isRgbaAnimatedValue(value: any): boolean {
  return (
    value &&
    value.r instanceof AnimatedValue &&
    value.g instanceof AnimatedValue &&
    value.b instanceof AnimatedValue &&
    value.a instanceof AnimatedValue
  );
}

export function getRgbaValueAndNativeColor(
  value: RgbaValue | ColorValue,
): Readonly<{
  rgbaValue: RgbaValue,
  nativeColor?: NativeColorValue,
}> {
  const processedColor: RgbaValue | NativeColorValue =
    // $FlowFixMe[incompatible-type] - Type is verified above
    processColor(value as ColorValue | RgbaValue) ?? defaultColor;
  if (isRgbaValue(processedColor)) {
    // $FlowFixMe[incompatible-type] - Type is verified above
    return {rgbaValue: processedColor as RgbaValue};
  } else {
    return {
      // $FlowFixMe[incompatible-type] - Type is verified above
      nativeColor: processedColor as NativeColorValue,
      rgbaValue: defaultColor,
    };
  }
}

export default class AnimatedColor extends AnimatedWithChildren {
  r: AnimatedValue;
  g: AnimatedValue;
  b: AnimatedValue;
  a: AnimatedValue;
  nativeColor: ?NativeColorValue;

  _suspendCallbacks: number = 0;

  constructor(valueIn?: InputValue, config?: ?AnimatedColorConfig) {
    super(config);

    let value: RgbaValue | RgbaAnimatedValue | ColorValue =
      valueIn ?? defaultColor;
    if (isRgbaAnimatedValue(value)) {
      // $FlowFixMe[incompatible-type] - Type is verified above
      const rgbaAnimatedValue: RgbaAnimatedValue = value as RgbaAnimatedValue;
      this.r = rgbaAnimatedValue.r;
      this.g = rgbaAnimatedValue.g;
      this.b = rgbaAnimatedValue.b;
      this.a = rgbaAnimatedValue.a;
    } else {
      const {rgbaValue: initColor, nativeColor} = getRgbaValueAndNativeColor(
        // $FlowFixMe[incompatible-type] - Type is verified above
        value as ColorValue | RgbaValue,
      );
      if (nativeColor) {
        this.nativeColor = nativeColor;
      }
      this.r = new AnimatedValue(initColor.r);
      this.g = new AnimatedValue(initColor.g);
      this.b = new AnimatedValue(initColor.b);
      this.a = new AnimatedValue(initColor.a);
    }

    if (config?.useNativeDriver) {
      this.__makeNative();
    }
  }

  /**
   * Directly set the value. This will stop any animations running on the value
   * and update all the bound properties.
   */
  setValue(value: RgbaValue | ColorValue): void {
    let shouldUpdateNodeConfig = false;
    if (this.__isNative) {
      const nativeTag = this.__getNativeTag();
      NativeAnimatedAPI.setWaitingForIdentifier(nativeTag.toString());
    }

    const processedColor: RgbaValue | NativeColorValue =
      processColor(value) ?? defaultColor;
    this._withSuspendedCallbacks(() => {
      if (isRgbaValue(processedColor)) {
        // $FlowFixMe[incompatible-type] - Type is verified above
        const rgbaValue: RgbaValue = processedColor;
        this.r.setValue(rgbaValue.r);
        this.g.setValue(rgbaValue.g);
        this.b.setValue(rgbaValue.b);
        this.a.setValue(rgbaValue.a);
        if (this.nativeColor != null) {
          this.nativeColor = null;
          shouldUpdateNodeConfig = true;
        }
      } else {
        // $FlowFixMe[incompatible-type] - Type is verified above
        const nativeColor: NativeColorValue = processedColor;
        if (this.nativeColor !== nativeColor) {
          this.nativeColor = nativeColor;
          shouldUpdateNodeConfig = true;
        }
      }
    });

    if (this.__isNative) {
      const nativeTag = this.__getNativeTag();
      if (shouldUpdateNodeConfig) {
        NativeAnimatedAPI.updateAnimatedNodeConfig(
          nativeTag,
          this.__getNativeConfig(),
        );
      }
      NativeAnimatedAPI.unsetWaitingForIdentifier(nativeTag.toString());
    } else {
      flushValue(this);
    }

    // $FlowFixMe[incompatible-type]
    this.__callListeners(this.__getValue());
  }

  /**
   * Sets an offset that is applied on top of whatever value is set, whether
   * via `setValue`, an animation, or `Animated.event`. Useful for compensating
   * things like the start of a pan gesture.
   */
  setOffset(offset: RgbaValue): void {
    this.r.setOffset(offset.r);
    this.g.setOffset(offset.g);
    this.b.setOffset(offset.b);
    this.a.setOffset(offset.a);
  }

  /**
   * Merges the offset value into the base value and resets the offset to zero.
   * The final output of the value is unchanged.
   */
  flattenOffset(): void {
    this.r.flattenOffset();
    this.g.flattenOffset();
    this.b.flattenOffset();
    this.a.flattenOffset();
  }

  /**
   * Sets the offset value to the base value, and resets the base value to
   * zero. The final output of the value is unchanged.
   */
  extractOffset(): void {
    this.r.extractOffset();
    this.g.extractOffset();
    this.b.extractOffset();
    this.a.extractOffset();
  }

  /**
   * Stops any running animation or tracking. `callback` is invoked with the
   * final value after stopping the animation, which is useful for updating
   * state to match the animation position with layout.
   */
  stopAnimation(callback?: ColorListenerCallback): void {
    this.r.stopAnimation();
    this.g.stopAnimation();
    this.b.stopAnimation();
    this.a.stopAnimation();
    callback && callback(this.__getValue());
  }

  /**
   * Stops any animation and resets the value to its original.
   */
  resetAnimation(callback?: ColorListenerCallback): void {
    this.r.resetAnimation();
    this.g.resetAnimation();
    this.b.resetAnimation();
    this.a.resetAnimation();
    callback && callback(this.__getValue());
  }

  __getValue(): ColorValue {
    if (this.nativeColor != null) {
      return this.nativeColor;
    } else {
      return `rgba(${this.r.__getValue()}, ${this.g.__getValue()}, ${this.b.__getValue()}, ${this.a.__getValue()})`;
    }
  }

  __attach(): void {
    this.r.__addChild(this);
    this.g.__addChild(this);
    this.b.__addChild(this);
    this.a.__addChild(this);
    super.__attach();
  }

  __detach(): void {
    this.r.__removeChild(this);
    this.g.__removeChild(this);
    this.b.__removeChild(this);
    this.a.__removeChild(this);
    super.__detach();
  }

  _withSuspendedCallbacks(callback: () => void) {
    this._suspendCallbacks++;
    callback();
    this._suspendCallbacks--;
  }

  __callListeners(value: number): void {
    if (this._suspendCallbacks === 0) {
      super.__callListeners(value);
    }
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this.r.__makeNative(platformConfig);
    this.g.__makeNative(platformConfig);
    this.b.__makeNative(platformConfig);
    this.a.__makeNative(platformConfig);
    super.__makeNative(platformConfig);
  }

  __getNativeConfig(): {...} {
    return {
      type: 'color',
      r: this.r.__getNativeTag(),
      g: this.g.__getNativeTag(),
      b: this.b.__getNativeTag(),
      a: this.a.__getNativeTag(),
      nativeColor: this.nativeColor,
      debugID: this.__getDebugID(),
    };
  }
}
