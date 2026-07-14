/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export type LayoutAnimationType =
  'spring' | 'linear' | 'easeInEaseOut' | 'easeIn' | 'easeOut' | 'keyboard';

export type LayoutAnimationTypes = {
  [type in LayoutAnimationType]: type;
};

export type LayoutAnimationProperty =
  'opacity' | 'scaleX' | 'scaleY' | 'scaleXY';

export type LayoutAnimationProperties = {
  [prop in LayoutAnimationProperty]: prop;
};

export interface LayoutAnimationAnim {
  duration?: number | undefined;
  delay?: number | undefined;
  springDamping?: number | undefined;
  initialVelocity?: number | undefined;
  type?: LayoutAnimationType | undefined;
  property?: LayoutAnimationProperty | undefined;
}

export interface LayoutAnimationConfig {
  duration: number;
  create?: LayoutAnimationAnim | undefined;
  update?: LayoutAnimationAnim | undefined;
  delete?: LayoutAnimationAnim | undefined;
}

/** Automatically animates views to their new positions when the next layout happens.
 * A common way to use this API is to call LayoutAnimation.configureNext before
 * calling setState. */
export interface LayoutAnimationStatic {
  /** Schedules an animation to happen on the next layout.
   * @param config Specifies animation properties:
   * `duration` in milliseconds
   * `create`, config for animating in new views (see Anim type)
   * `update`, config for animating views that have been updated (see Anim type)
   * @param onAnimationDidEnd Called when the animation finished. Only supported on iOS.
   */
  configureNext: (
    config: LayoutAnimationConfig,
    onAnimationDidEnd?: () => void,
    onAnimationDidFail?: () => void,
  ) => void;
  /** Helper for creating a config for configureNext. */
  create: (
    duration: number,
    type?: LayoutAnimationType,
    creationProp?: LayoutAnimationProperty,
  ) => LayoutAnimationConfig;
  Types: LayoutAnimationTypes;
  Properties: LayoutAnimationProperties;
  configChecker: (shapeTypes: {[key: string]: any}) => any;
  Presets: {
    easeInEaseOut: LayoutAnimationConfig;
    linear: LayoutAnimationConfig;
    spring: LayoutAnimationConfig;
  };
  easeInEaseOut: (onAnimationDidEnd?: () => void) => void;
  linear: (onAnimationDidEnd?: () => void) => void;
  spring: (onAnimationDidEnd?: () => void) => void;
}

export const LayoutAnimation: LayoutAnimationStatic;
export type LayoutAnimation = LayoutAnimationStatic;
