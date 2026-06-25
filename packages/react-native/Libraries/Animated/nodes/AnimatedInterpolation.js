/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/* eslint no-bitwise: 0 */

'use strict';

import type {NativeColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type AnimatedNode from './AnimatedNode';
import type {AnimatedNodeConfig} from './AnimatedNode';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import {validateInterpolation} from '../../../src/private/animated/NativeAnimatedValidation';
import normalizeColor from '../../StyleSheet/normalizeColor';
import processColor from '../../StyleSheet/processColor';
import Easing from '../Easing';
import AnimatedWithChildren from './AnimatedWithChildren';
import invariant from 'invariant';

type ExtrapolateType = 'extend' | 'identity' | 'clamp';

export type InterpolationConfigSupportedOutputType =
  | number
  | string
  | NativeColorValue;

export type InterpolationConfigType<
  OutputT extends InterpolationConfigSupportedOutputType,
> = Readonly<{
  ...AnimatedNodeConfig,
  inputRange: ReadonlyArray<number>,
  outputRange: ReadonlyArray<OutputT>,
  easing?: (input: number) => number,
  extrapolate?: ExtrapolateType,
  extrapolateLeft?: ExtrapolateType,
  extrapolateRight?: ExtrapolateType,
}>;

/**
 * Very handy helper to map input ranges to output ranges with an easing
 * function and custom behavior outside of the ranges.
 */
function createNumericInterpolation(
  config: InterpolationConfigType<number>,
): (input: number) => number {
  const outputRange: ReadonlyArray<number> = config.outputRange as any;
  const inputRange = config.inputRange;

  const easing = config.easing || Easing.linear;

  let extrapolateLeft: ExtrapolateType = 'extend';
  if (config.extrapolateLeft !== undefined) {
    extrapolateLeft = config.extrapolateLeft;
  } else if (config.extrapolate !== undefined) {
    extrapolateLeft = config.extrapolate;
  }

  let extrapolateRight: ExtrapolateType = 'extend';
  if (config.extrapolateRight !== undefined) {
    extrapolateRight = config.extrapolateRight;
  } else if (config.extrapolate !== undefined) {
    extrapolateRight = config.extrapolate;
  }

  return input => {
    invariant(
      typeof input === 'number',
      'Cannot interpolate an input which is not a number',
    );

    const range = findRange(input, inputRange);
    return interpolate(
      input,
      inputRange[range],
      inputRange[range + 1],
      outputRange[range],
      outputRange[range + 1],
      easing,
      extrapolateLeft,
      extrapolateRight,
    ) as any;
  };
}

function createPlatformColorInterpolation(
  config: InterpolationConfigType<NativeColorValue>,
): (input: number) => NativeColorValue {
  const outputRange = config.outputRange;
  const outputRangeIndices = Array.from(Array(outputRange.length).keys());
  const interpolateIndex = createNumericInterpolation({
    ...config,
    inputRange: config.inputRange,
    outputRange: outputRangeIndices,
  });

  return input => {
    const interpolateResult = interpolateIndex(input);
    if (!Number.isInteger(interpolateResult)) {
      console.warn(
        'PlatformColor interpolation should happen natively, here we fallback to the closest color',
      );
    }
    return outputRange[Math.floor(interpolateResult)];
  };
}

function interpolate(
  input: number,
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number,
  easing: (input: number) => number,
  extrapolateLeft: ExtrapolateType,
  extrapolateRight: ExtrapolateType,
) {
  let result = input;

  // Extrapolate
  if (result < inputMin) {
    if (extrapolateLeft === 'identity') {
      return result;
    } else if (extrapolateLeft === 'clamp') {
      result = inputMin;
    } else if (extrapolateLeft === 'extend') {
      // noop
    }
  }

  if (result > inputMax) {
    if (extrapolateRight === 'identity') {
      return result;
    } else if (extrapolateRight === 'clamp') {
      result = inputMax;
    } else if (extrapolateRight === 'extend') {
      // noop
    }
  }

  if (outputMin === outputMax) {
    return outputMin;
  }

  if (inputMin === inputMax) {
    if (input <= inputMin) {
      return outputMin;
    }
    return outputMax;
  }

  // Input Range
  if (inputMin === -Infinity) {
    result = -result;
  } else if (inputMax === Infinity) {
    result = result - inputMin;
  } else {
    result = (result - inputMin) / (inputMax - inputMin);
  }

  // Easing
  result = easing(result);

  // Output Range
  if (outputMin === -Infinity) {
    result = -result;
  } else if (outputMax === Infinity) {
    result = result + outputMin;
  } else {
    result = result * (outputMax - outputMin) + outputMin;
  }

  return result;
}

const numericComponentRegex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

// Maps string inputs an RGBA color or an array of numeric components
function mapStringToNumericComponents(
  input: string,
):
  | {isColor: true, components: [number, number, number, number]}
  | {isColor: false, components: ReadonlyArray<number | string>} {
  let normalizedColor = normalizeColor(input);
  invariant(
    normalizedColor == null || typeof normalizedColor !== 'object',
    'PlatformColors are not supported',
  );

  if (typeof normalizedColor === 'number') {
    normalizedColor = normalizedColor || 0;
    const r = (normalizedColor & 0xff000000) >>> 24;
    const g = (normalizedColor & 0x00ff0000) >>> 16;
    const b = (normalizedColor & 0x0000ff00) >>> 8;
    const a = (normalizedColor & 0x000000ff) / 255;
    return {isColor: true, components: [r, g, b, a]};
  } else {
    const components: Array<string | number> = [];
    let lastMatchEnd = 0;
    let match: RegExp$matchResult;
    while ((match = numericComponentRegex.exec(input) as any) != null) {
      if (match.index > lastMatchEnd) {
        components.push(input.substring(lastMatchEnd, match.index));
      }
      components.push(parseFloat(match[0]));
      lastMatchEnd = match.index + match[0].length;
    }
    invariant(
      components.length > 0,
      'outputRange must contain color or value with numeric component',
    );
    if (lastMatchEnd < input.length) {
      components.push(input.substring(lastMatchEnd, input.length));
    }
    return {isColor: false, components};
  }
}

/**
 * Supports string shapes by extracting numbers so new values can be computed,
 * and recombines those values into new strings of the same shape.  Supports
 * things like:
 *
 *   rgba(123, 42, 99, 0.36) // colors
 *   -45deg                  // values with units
 */
function createStringInterpolation(
  config: InterpolationConfigType<string>,
): (input: number) => string {
  invariant(config.outputRange.length >= 2, 'Bad output range');
  const outputRange = config.outputRange.map(mapStringToNumericComponents);

  const isColor = outputRange[0].isColor;
  if (__DEV__) {
    invariant(
      outputRange.every(output => output.isColor === isColor),
      'All elements of output range should either be a color or a string with numeric components',
    );
    const firstOutput = outputRange[0].components;
    invariant(
      outputRange.every(
        output => output.components.length === firstOutput.length,
      ),
      'All elements of output range should have the same number of components',
    );
    invariant(
      outputRange.every(output =>
        output.components.every(
          (component, i) =>
            // $FlowFixMe[invalid-compare]
            typeof component === 'number' || component === firstOutput[i],
        ),
      ),
      'All elements of output range should have the same non-numeric components',
    );
  }

  const numericComponents: ReadonlyArray<ReadonlyArray<number>> =
    outputRange.map(output =>
      isColor
        ? // $FlowFixMe[incompatible-type]
          output.components
        : // $FlowFixMe[incompatible-call]
          output.components.filter(c => typeof c === 'number'),
    );
  const interpolations = numericComponents[0].map((_, i) =>
    createNumericInterpolation({
      ...config,
      outputRange: numericComponents.map(components => components[i]),
    }),
  );
  if (!isColor) {
    return input => {
      const values = interpolations.map(interpolation => interpolation(input));
      let i = 0;
      return outputRange[0].components
        .map(c => (typeof c === 'number' ? values[i++] : c))
        .join('');
    };
  } else {
    return input => {
      const result = interpolations.map((interpolation, i) => {
        const value = interpolation(input);
        // rgba requires that the r,g,b are integers.... so we want to round them, but we *dont* want to
        // round the opacity (4th column).
        return i < 3 ? Math.round(value) : Math.round(value * 1000) / 1000;
      });
      return `rgba(${result[0]}, ${result[1]}, ${result[2]}, ${result[3]})`;
    };
  }
}

function findRange(input: number, inputRange: ReadonlyArray<number>) {
  let i;
  for (i = 1; i < inputRange.length - 1; ++i) {
    if (inputRange[i] >= input) {
      break;
    }
  }
  return i - 1;
}

function checkValidRanges<
  OutputT extends InterpolationConfigSupportedOutputType,
>(inputRange: ReadonlyArray<number>, outputRange: ReadonlyArray<OutputT>) {
  checkInfiniteRange('outputRange', outputRange);
  checkInfiniteRange('inputRange', inputRange);
  checkValidInputRange(inputRange);

  invariant(
    inputRange.length === outputRange.length,
    'inputRange (' +
      inputRange.length +
      ') and outputRange (' +
      outputRange.length +
      ') must have the same length',
  );
}

function checkValidInputRange(arr: ReadonlyArray<number>) {
  invariant(arr.length >= 2, 'inputRange must have at least 2 elements');
  const message =
    'inputRange must be monotonically non-decreasing ' + String(arr);
  for (let i = 1; i < arr.length; ++i) {
    invariant(arr[i] >= arr[i - 1], message);
  }
}

function checkInfiniteRange<
  OutputT extends InterpolationConfigSupportedOutputType,
>(name: string, arr: ReadonlyArray<OutputT>) {
  invariant(arr.length >= 2, name + ' must have at least 2 elements');
  invariant(
    arr.length !== 2 || arr[0] !== -Infinity || arr[1] !== Infinity,
    /* $FlowFixMe[incompatible-type] (>=0.13.0) - In the addition expression
     * below this comment, one or both of the operands may be something that
     * doesn't cleanly convert to a string, like undefined, null, and object,
     * etc. If you really mean this implicit string conversion, you can do
     * something like String(myThing) */
    // $FlowFixMe[unsafe-addition]
    name + ' cannot be ]-infinity;+infinity[ ' + arr,
  );
}

// Ramer–Douglas–Peucker simplification using vertical distance (the curve's
// independent axis is the input position `t`). Keeps the endpoints and any point
// whose removal would push the piecewise-linear approximation more than
// `epsilon` away from the sampled curve. Produces non-uniform stops — dense
// where the curve bends, sparse where it is near-linear.
function simplifyByVerticalDistance(
  points: Array<[number, number]>,
  epsilon: number,
): Array<[number, number]> {
  if (points.length < 3) {
    return points;
  }
  const [x0, y0] = points[0];
  const [x1, y1] = points[points.length - 1];
  const dx = x1 - x0;
  let maxDistance = 0;
  let maxIndex = -1;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const chordY = dx === 0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / dx;
    const distance = Math.abs(y - chordY);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  if (maxDistance > epsilon) {
    const left = simplifyByVerticalDistance(
      points.slice(0, maxIndex + 1),
      epsilon,
    );
    const right = simplifyByVerticalDistance(points.slice(maxIndex), epsilon);
    // Drop the duplicated shared point at the split.
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

// Samples an `easing` function and simplifies it (RDP) into a compact set of
// non-uniform `[position, value]` stops that the native interpolation node
// applies to each segment's normalized ratio (binary search + linear interp).
// This mirrors the CSS `linear()` easing representation. The tolerance targets a
// sub-pixel error using the interpolation's numeric output span when known.
function sampleEasingStops(
  easing: (input: number) => number,
  outputRange: ReadonlyArray<unknown>,
): Array<[number, number]> {
  // Dense sampling resolution of the easing curve before simplification.
  const DENSE_SAMPLES = 256;
  // Target approximation error, in output units (≈ sub-pixel for layout/
  // transform props). Used to derive the simplification tolerance from the span.
  const TARGET_ERROR = 0.25;
  // Bounds on the (ratio-space) simplification tolerance.
  const MIN_TOLERANCE = 1e-4;
  const MAX_TOLERANCE = 1e-2;

  // Evenly spaced [t, easing(t)] samples.
  // e.g. quad samples: [[0, 0], [0.25, 0.0625], [0.5, 0.25], [0.75, 0.5625], [1, 1]].
  const dense: Array<[number, number]> = [];
  for (let i = 0; i <= DENSE_SAMPLES; i++) {
    const t = i / DENSE_SAMPLES;
    dense.push([t, easing(t)]);
  }

  let epsilon = MAX_TOLERANCE;
  if (typeof outputRange[0] === 'number') {
    let min = outputRange[0];
    let max = outputRange[0];
    for (const value of outputRange) {
      if (typeof value === 'number') {
        if (value < min) {
          min = value;
        }
        if (value > max) {
          max = value;
        }
      }
    }
    const span = max - min;
    if (span > 0) {
      epsilon = TARGET_ERROR / span;
    }
  } else {
    // Non-numeric output (e.g. colors): components live in [0, 255].
    epsilon = TARGET_ERROR / 255;
  }
  epsilon = Math.min(MAX_TOLERANCE, Math.max(MIN_TOLERANCE, epsilon));

  // Drops samples within `epsilon` of the chord, keeping a sparse subset. E.g. for
  // epsilon in [0.0625, 0.25) the quad samples [[0, 0], [0.25, 0.0625], [0.5, 0.25], [0.75, 0.5625], [1, 1]]
  // is trimmed to [[0, 0], [0.5, 0.25], [1, 1]].
  return simplifyByVerticalDistance(dense, epsilon);
}

export default class AnimatedInterpolation<
  OutputT extends InterpolationConfigSupportedOutputType,
> extends AnimatedWithChildren {
  _parent: AnimatedNode;
  _config: InterpolationConfigType<OutputT>;
  _interpolation: ?(input: number) => OutputT;

  constructor(parent: AnimatedNode, config: InterpolationConfigType<OutputT>) {
    super(config);
    this._parent = parent;
    this._config = config;

    if (__DEV__) {
      checkValidRanges(config.inputRange, config.outputRange);

      // Create interpolation eagerly in dev, so we can signal errors faster
      // even when using the native driver
      this._getInterpolation();
    }
  }

  _getInterpolation(): number => OutputT {
    if (!this._interpolation) {
      const config = this._config;
      if (config.outputRange && typeof config.outputRange[0] === 'string') {
        this._interpolation = createStringInterpolation(config as any) as any;
      } else if (typeof config.outputRange[0] === 'object') {
        this._interpolation = createPlatformColorInterpolation(
          config as any,
        ) as any;
      } else {
        this._interpolation = createNumericInterpolation(config as any) as any;
      }
    }
    return this._interpolation;
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this._parent.__makeNative(platformConfig);
    super.__makeNative(platformConfig);
  }

  __getValue(): OutputT {
    const parentValue: number = this._parent.__getValue();
    invariant(
      typeof parentValue === 'number',
      'Cannot interpolate an input which is not a number.',
    );
    return this._getInterpolation()(parentValue);
  }

  interpolate<NewOutputT extends number | string>(
    config: InterpolationConfigType<NewOutputT>,
  ): AnimatedInterpolation<NewOutputT> {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._parent.__addChild(this);
    super.__attach();
  }

  __detach(): void {
    this._parent.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    if (__DEV__) {
      validateInterpolation(this._config);
    }

    // Only the `outputRange` can contain strings so we don't need to transform `inputRange` here
    let outputRange = this._config.outputRange;
    let outputType = null;
    if (typeof outputRange[0] === 'string') {
      // $FlowFixMe[incompatible-type]
      outputRange = (outputRange as ReadonlyArray<string>).map(value => {
        const processedColor = processColor(value);
        if (typeof processedColor === 'number') {
          outputType = 'color';
          return processedColor;
        } else {
          return NativeAnimatedHelper.transformDataType(value);
        }
      }) as any;
    } else if (typeof outputRange[0] === 'object') {
      outputType = 'platform_color';
    }

    // An interpolation `easing` is a JS-only function. Rather than drop it (the
    // native driver would run the segment linearly), sample + simplify it into a
    // set of `[position, value]` stops the native node applies per segment. Works
    // for every output type since easing acts on the normalized ratio, not the
    // output values.
    const easing = this._config.easing;
    const easingStops =
      easing != null && easing !== Easing.linear
        ? sampleEasingStops(easing, this._config.outputRange)
        : undefined;

    return {
      inputRange: this._config.inputRange,
      outputRange,
      outputType,
      extrapolateLeft:
        this._config.extrapolateLeft || this._config.extrapolate || 'extend',
      extrapolateRight:
        this._config.extrapolateRight || this._config.extrapolate || 'extend',
      type: 'interpolation',
      easingStops,
      debugID: this.__getDebugID(),
    };
  }
}
