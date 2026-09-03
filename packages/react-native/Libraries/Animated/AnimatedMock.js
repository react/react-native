/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {Numeric as AnimatedNumeric} from './AnimatedImplementation';
import type {EndResult} from './animations/Animation';
import type {EndCallback} from './animations/Animation';
import type {DecayAnimationConfig} from './animations/DecayAnimation';
import type {SpringAnimationConfig} from './animations/SpringAnimation';
import type {TimingAnimationConfig} from './animations/TimingAnimation';

import {AnimatedEvent, attachNativeEventImpl} from './AnimatedEvent';
import AnimatedImplementation from './AnimatedImplementation';
import createAnimatedComponent from './createAnimatedComponent';
import AnimatedColor from './nodes/AnimatedColor';
import AnimatedInterpolation from './nodes/AnimatedInterpolation';
import AnimatedNode from './nodes/AnimatedNode';
import AnimatedValue from './nodes/AnimatedValue';
import AnimatedValueXY from './nodes/AnimatedValueXY';

/**
 * Animations are a source of flakiness in snapshot testing. This mock replaces
 * animation functions from AnimatedImplementation with empty animations for
 * predictability in tests. When possible the animation will run immediately
 * to the final state.
 */

// Prevent any callback invocation from recursively triggering another
// callback, which may trigger another animation
let inAnimationCallback = false;
function mockAnimationStart(
  start: (callback?: ?EndCallback) => void,
): (callback?: ?EndCallback) => void {
  return callback => {
    const guardedCallback =
      callback == null
        ? callback
        : (...args: Array<EndResult>) => {
            if (inAnimationCallback) {
              console.warn(
                'Ignoring recursive animation callback when running mock animations',
              );
              return;
            }
            inAnimationCallback = true;
            try {
              callback(...args);
            } finally {
              inAnimationCallback = false;
            }
          };
    start(guardedCallback);
  };
}

export type CompositeAnimation = {
  start: (callback?: ?EndCallback) => void,
  stop: () => void,
  reset: () => void,
  _startNativeLoop: (iterations?: number) => void,
  _isUsingNativeDriver: () => boolean,
  ...
};

const emptyAnimation = {
  start: () => {},
  stop: () => {},
  reset: () => {},
  _startNativeLoop: () => {},
  _isUsingNativeDriver: () => {
    return false;
  },
};

const mockCompositeAnimation = (
  animations: Array<CompositeAnimation>,
): CompositeAnimation => ({
  ...emptyAnimation,
  start: mockAnimationStart((callback?: ?EndCallback): void => {
    animations.forEach(animation => animation.start());
    callback?.({finished: true});
  }),
});

const spring = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: SpringAnimationConfig,
): CompositeAnimation {
  // $FlowFixMe[unclear-type]
  const anyValue: any = value;
  return {
    ...emptyAnimation,
    start: mockAnimationStart((callback?: ?EndCallback): void => {
      anyValue.setValue(config.toValue);
      callback?.({finished: true});
    }),
  };
};

const timing = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: TimingAnimationConfig,
): CompositeAnimation {
  // $FlowFixMe[unclear-type]
  const anyValue: any = value;
  return {
    ...emptyAnimation,
    start: mockAnimationStart((callback?: ?EndCallback): void => {
      anyValue.setValue(config.toValue);
      callback?.({finished: true});
    }),
  };
};

const decay = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: DecayAnimationConfig,
): CompositeAnimation {
  return emptyAnimation;
};

const sequence = function (
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  return mockCompositeAnimation(animations);
};

type ParallelConfig = {stopTogether?: boolean, ...};
const parallel = function (
  animations: Array<CompositeAnimation>,
  config?: ?ParallelConfig,
): CompositeAnimation {
  return mockCompositeAnimation(animations);
};

const delay = function (time: number): CompositeAnimation {
  return emptyAnimation;
};

const stagger = function (
  time: number,
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  return mockCompositeAnimation(animations);
};

type LoopAnimationConfig = {
  iterations: number,
  resetBeforeIteration?: boolean,
  ...
};

const loop = function (
  animation: CompositeAnimation,
  // $FlowFixMe[incompatible-type]
  {iterations = -1}: LoopAnimationConfig = {},
): CompositeAnimation {
  return emptyAnimation;
};

export type {AnimatedNumeric as Numeric};

export default {
  Value: AnimatedValue,
  ValueXY: AnimatedValueXY,
  Color: AnimatedColor,
  Interpolation: AnimatedInterpolation,
  Node: AnimatedNode,
  decay,
  timing,
  spring,
  add: AnimatedImplementation.add,
  subtract: AnimatedImplementation.subtract,
  divide: AnimatedImplementation.divide,
  multiply: AnimatedImplementation.multiply,
  modulo: AnimatedImplementation.modulo,
  diffClamp: AnimatedImplementation.diffClamp,
  delay,
  sequence,
  parallel,
  stagger,
  loop,
  event: AnimatedImplementation.event,
  createAnimatedComponent,
  attachNativeEvent: attachNativeEventImpl,
  forkEvent: AnimatedImplementation.forkEvent,
  unforkEvent: AnimatedImplementation.unforkEvent,
  Event: AnimatedEvent,
} as typeof AnimatedImplementation;
