/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * This class implements common easing functions. The math is pretty obscure,
 * but this cool website has nice visual illustrations of what they represent:
 * http://xaedes.de/dev/transitions/
 */
export type EasingFunction = (value: number) => number;
export interface EasingStatic {
  step0: EasingFunction;
  step1: EasingFunction;
  linear: EasingFunction;
  ease: EasingFunction;
  quad: EasingFunction;
  cubic: EasingFunction;
  poly(n: number): EasingFunction;
  sin: EasingFunction;
  circle: EasingFunction;
  exp: EasingFunction;
  elastic(bounciness: number): EasingFunction;
  back(s: number): EasingFunction;
  bounce: EasingFunction;
  bezier(x1: number, y1: number, x2: number, y2: number): EasingFunction;
  in(easing: EasingFunction): EasingFunction;
  out(easing: EasingFunction): EasingFunction;
  inOut(easing: EasingFunction): EasingFunction;
}

export type Easing = EasingStatic;
export const Easing: EasingStatic;
