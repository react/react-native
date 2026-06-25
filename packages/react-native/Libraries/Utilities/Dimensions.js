/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import EventEmitter, {
  type EventSubscription,
} from '../vendor/emitter/EventEmitter';
import NativeDeviceInfo, {
  type DimensionsPayload,
  type DisplayMetrics,
  type DisplayMetricsAndroid,
} from './NativeDeviceInfo';
import invariant from 'invariant';

export type {DimensionsPayload, DisplayMetrics, DisplayMetricsAndroid};

/** @deprecated Use DisplayMetrics */
export type ScaledSize = DisplayMetrics;

const eventEmitter = new EventEmitter<{
  change: [DimensionsPayload],
}>();
let dimensionsInitialized = false;
let dimensions: DimensionsPayload;

class Dimensions {
  /**
   * NOTE: `useWindowDimensions` is the preferred API for React components.
   *
   * Initial dimensions are set before `runApplication` is called so they should
   * be available before any other require's are run, but may be updated later.
   *
   * Note: Although dimensions are available immediately, they may change (e.g
   * due to device rotation) so any rendering logic or styles that depend on
   * these constants should try to call this function on every render, rather
   * than caching the value (for example, using inline styles rather than
   * setting a value in a `StyleSheet`).
   *
   * Example: `const {height, width} = Dimensions.get('window');`
   *
   * @param {string} dim Name of dimension as defined when calling `set`.
   * @returns {DisplayMetrics? | DisplayMetricsAndroid?} Value for the dimension.
   */
  static get(dim: string): DisplayMetrics | DisplayMetricsAndroid {
    // $FlowFixMe[invalid-computed-prop]
    invariant(dimensions[dim], 'No dimension set for key ' + dim);
    return dimensions[dim];
  }

  /**
   * This should only be called from native code by sending the
   * didUpdateDimensions event.
   *
   * @param {DimensionsPayload} dims Simple string-keyed object of dimensions to set
   */
  static set(dims: Readonly<DimensionsPayload>): void {
    // We calculate the window dimensions in JS so that we don't encounter loss of
    // precision in transferring the dimensions (which could be non-integers) over
    // the bridge.
    let {screen, window} = dims;
    const {windowPhysicalPixels} = dims;
    if (windowPhysicalPixels) {
      window = {
        width: windowPhysicalPixels.width / windowPhysicalPixels.scale,
        height: windowPhysicalPixels.height / windowPhysicalPixels.scale,
        scale: windowPhysicalPixels.scale,
        fontScale: windowPhysicalPixels.fontScale,
      };
    }
    const {screenPhysicalPixels} = dims;
    if (screenPhysicalPixels) {
      screen = {
        width: screenPhysicalPixels.width / screenPhysicalPixels.scale,
        height: screenPhysicalPixels.height / screenPhysicalPixels.scale,
        scale: screenPhysicalPixels.scale,
        fontScale: screenPhysicalPixels.fontScale,
      };
    } else if (screen == null) {
      screen = window;
    }

    dimensions = {window, screen};
    if (dimensionsInitialized) {
      // Don't fire 'change' the first time the dimensions are set.
      eventEmitter.emit('change', dimensions);
    } else {
      dimensionsInitialized = true;
    }
  }

  /**
   * Add an event handler. Supported events:
   *
   * - `change`: Fires when a property within the `Dimensions` object changes. The argument
   *   to the event handler is an object with `window` and `screen` properties whose values
   *   are the same as the return values of `Dimensions.get('window')` and
   *   `Dimensions.get('screen')`, respectively.
   */
  static addEventListener(
    type: 'change',
    handler: Function,
  ): EventSubscription {
    invariant(
      type === 'change',
      'Trying to subscribe to unknown event: "%s"',
      type,
    );
    return eventEmitter.addListener(type, handler);
  }
}

// Subscribe before calling getConstants to make sure we don't miss any updates in between.
RCTDeviceEventEmitter.addListener(
  'didUpdateDimensions',
  (update: DimensionsPayload) => {
    Dimensions.set(update);
  },
);
Dimensions.set(NativeDeviceInfo.getConstants().Dimensions);

export default Dimensions;
