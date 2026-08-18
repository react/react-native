/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {EmitterSubscription} from '../vendor/emitter/EventEmitter';

// Used by Dimensions below
export interface ScaledSize {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/**
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
 * @param dim Name of dimension as defined when calling `set`.
 * @returns Value for the dimension.
 * @see https://reactnative.dev/docs/dimensions#content
 */
export interface Dimensions {
  /**
       * Initial dimensions are set before runApplication is called so they
       * should be available before any other require's are run, but may be
       * updated later.
       * Note: Although dimensions are available immediately, they may
       * change (e.g due to device rotation) so any rendering logic or
       * styles that depend on these constants should try to call this
       * function on every render, rather than caching the value (for
       * example, using inline styles rather than setting a value in a
       * StyleSheet).
       * Example: const {height, width} = Dimensions.get('window');
       @param dim Name of dimension as defined when calling set.
       @returns Value for the dimension.
       */
  get(dim: 'window' | 'screen'): ScaledSize;

  /**
   * This should only be called from native code by sending the didUpdateDimensions event.
   * @param dims Simple string-keyed object of dimensions to set
   */
  set(dims: {[key: string]: any}): void;

  /**
   * Add an event listener for dimension changes
   *
   * @param type the type of event to listen to
   * @param handler the event handler
   */
  addEventListener(
    type: 'change',
    handler: ({
      window,
      screen,
    }: {
      window: ScaledSize;
      screen: ScaledSize;
    }) => void,
  ): EmitterSubscription;
}

export function useWindowDimensions(): ScaledSize;

export const Dimensions: Dimensions;
