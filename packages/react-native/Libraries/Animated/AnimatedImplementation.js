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

import type {EventConfig, Mapping} from './AnimatedEvent';
import type {
  AnimationConfig,
  EndCallback,
  EndResult,
} from './animations/Animation';
import type {DecayAnimationConfig} from './animations/DecayAnimation';
import type {SpringAnimationConfig} from './animations/SpringAnimation';
import type {TimingAnimationConfig} from './animations/TimingAnimation';

import NativeAnimatedHelper from '../../src/private/animated/NativeAnimatedHelper';
import {AnimatedEvent, attachNativeEventImpl} from './AnimatedEvent';
import DecayAnimation from './animations/DecayAnimation';
import SpringAnimation from './animations/SpringAnimation';
import TimingAnimation from './animations/TimingAnimation';
import createAnimatedComponent from './createAnimatedComponent';
import AnimatedAddition from './nodes/AnimatedAddition';
import AnimatedColor from './nodes/AnimatedColor';
import AnimatedDiffClamp from './nodes/AnimatedDiffClamp';
import AnimatedDivision from './nodes/AnimatedDivision';
import AnimatedInterpolation from './nodes/AnimatedInterpolation';
import AnimatedModulo from './nodes/AnimatedModulo';
import AnimatedMultiplication from './nodes/AnimatedMultiplication';
import AnimatedNode from './nodes/AnimatedNode';
import AnimatedSubtraction from './nodes/AnimatedSubtraction';
import AnimatedTracking from './nodes/AnimatedTracking';
import AnimatedValue from './nodes/AnimatedValue';
import AnimatedValueXY from './nodes/AnimatedValueXY';

export type CompositeAnimation = {
  start: (callback?: ?EndCallback, isLooping?: boolean) => void,
  stop: () => void,
  reset: () => void,
  _startNativeLoop: (iterations?: number) => void,
  _isUsingNativeDriver: () => boolean,
  ...
};

const addImpl = function (
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedAddition {
  return new AnimatedAddition(a, b);
};

const subtractImpl = function (
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedSubtraction {
  return new AnimatedSubtraction(a, b);
};

const divideImpl = function (
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedDivision {
  return new AnimatedDivision(a, b);
};

const multiplyImpl = function (
  a: AnimatedNode | number,
  b: AnimatedNode | number,
): AnimatedMultiplication {
  return new AnimatedMultiplication(a, b);
};

const moduloImpl = function (a: AnimatedNode, modulus: number): AnimatedModulo {
  return new AnimatedModulo(a, modulus);
};

const diffClampImpl = function (
  a: AnimatedNode,
  min: number,
  max: number,
): AnimatedDiffClamp {
  return new AnimatedDiffClamp(a, min, max);
};

const _combineCallbacks = function (
  callback: ?EndCallback,
  config: Readonly<{...AnimationConfig, ...}>,
) {
  if (callback && config.onComplete) {
    return (...args: Array<EndResult>) => {
      config.onComplete && config.onComplete(...args);
      /* $FlowFixMe[constant-condition] Error discovered during Constant
       * Condition roll out. See https://fburl.com/workplace/1v97vimq. */
      callback && callback(...args);
    };
  } else {
    return callback || config.onComplete;
  }
};

const maybeVectorAnim = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: Object,
  anim: (value: AnimatedValue, config: Object) => CompositeAnimation,
): ?CompositeAnimation {
  if (value instanceof AnimatedValueXY) {
    const configX = {...config};
    const configY = {...config};
    for (const key in config) {
      const {x, y} = config[key];
      if (x !== undefined && y !== undefined) {
        configX[key] = x;
        configY[key] = y;
      }
    }
    const aX = anim((value as AnimatedValueXY).x, configX);
    const aY = anim((value as AnimatedValueXY).y, configY);
    // We use `stopTogether: false` here because otherwise tracking will break
    // because the second animation will get stopped before it can update.
    return parallelImpl([aX, aY], {stopTogether: false});
  } else if (value instanceof AnimatedColor) {
    const configR = {...config};
    const configG = {...config};
    const configB = {...config};
    const configA = {...config};
    for (const key in config) {
      const {r, g, b, a} = config[key];
      if (
        r !== undefined &&
        g !== undefined &&
        b !== undefined &&
        a !== undefined
      ) {
        configR[key] = r;
        configG[key] = g;
        configB[key] = b;
        configA[key] = a;
      }
    }
    const aR = anim((value as AnimatedColor).r, configR);
    const aG = anim((value as AnimatedColor).g, configG);
    const aB = anim((value as AnimatedColor).b, configB);
    const aA = anim((value as AnimatedColor).a, configA);
    // We use `stopTogether: false` here because otherwise tracking will break
    // because the second animation will get stopped before it can update.
    return parallelImpl([aR, aG, aB, aA], {stopTogether: false});
  }
  return null;
};

const springImpl = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: SpringAnimationConfig,
): CompositeAnimation {
  const start = function (
    animatedValue: AnimatedValue | AnimatedValueXY | AnimatedColor,
    configuration: SpringAnimationConfig,
    callback?: ?EndCallback,
  ): void {
    callback = _combineCallbacks(callback, configuration);
    const singleValue: any = animatedValue;
    const singleConfig: any = configuration;
    singleValue.stopTracking();
    if (configuration.toValue instanceof AnimatedNode) {
      singleValue.track(
        new AnimatedTracking(
          singleValue,
          configuration.toValue,
          SpringAnimation,
          singleConfig,
          callback,
        ),
      );
    } else {
      singleValue.animate(new SpringAnimation(singleConfig), callback);
    }
  };
  return (
    maybeVectorAnim(value, config, springImpl) || {
      start: function (callback?: ?EndCallback): void {
        start(value, config, callback);
      },

      stop: function (): void {
        value.stopAnimation();
      },

      reset: function (): void {
        value.resetAnimation();
      },

      _startNativeLoop: function (iterations?: number): void {
        const singleConfig = {...config, iterations};
        start(value, singleConfig);
      },

      _isUsingNativeDriver: function (): boolean {
        return (
          NativeAnimatedHelper.isNativeDriverForced?.() ||
          config.useNativeDriver ||
          false
        );
      },
    }
  );
};

const timingImpl = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: TimingAnimationConfig,
): CompositeAnimation {
  const start = function (
    animatedValue: AnimatedValue | AnimatedValueXY | AnimatedColor,
    configuration: TimingAnimationConfig,
    callback?: ?EndCallback,
  ): void {
    callback = _combineCallbacks(callback, configuration);
    const singleValue: any = animatedValue;
    const singleConfig: any = configuration;
    singleValue.stopTracking();
    if (configuration.toValue instanceof AnimatedNode) {
      singleValue.track(
        new AnimatedTracking(
          singleValue,
          configuration.toValue,
          TimingAnimation,
          singleConfig,
          callback,
        ),
      );
    } else {
      singleValue.animate(new TimingAnimation(singleConfig), callback);
    }
  };

  return (
    maybeVectorAnim(value, config, timingImpl) || {
      start: function (callback?: ?EndCallback, isLooping?: boolean): void {
        start(value, {...config, isLooping}, callback);
      },

      stop: function (): void {
        value.stopAnimation();
      },

      reset: function (): void {
        value.resetAnimation();
      },

      _startNativeLoop: function (iterations?: number): void {
        const singleConfig = {...config, iterations};
        start(value, singleConfig);
      },

      _isUsingNativeDriver: function (): boolean {
        return (
          NativeAnimatedHelper.isNativeDriverForced?.() ||
          config.useNativeDriver ||
          false
        );
      },
    }
  );
};

const decayImpl = function (
  value: AnimatedValue | AnimatedValueXY | AnimatedColor,
  config: DecayAnimationConfig,
): CompositeAnimation {
  const start = function (
    animatedValue: AnimatedValue | AnimatedValueXY | AnimatedColor,
    configuration: DecayAnimationConfig,
    callback?: ?EndCallback,
  ): void {
    callback = _combineCallbacks(callback, configuration);
    const singleValue: any = animatedValue;
    const singleConfig: any = configuration;
    singleValue.stopTracking();
    singleValue.animate(new DecayAnimation(singleConfig), callback);
  };

  return (
    maybeVectorAnim(value, config, decayImpl) || {
      start: function (callback?: ?EndCallback): void {
        start(value, config, callback);
      },

      stop: function (): void {
        value.stopAnimation();
      },

      reset: function (): void {
        value.resetAnimation();
      },

      _startNativeLoop: function (iterations?: number): void {
        const singleConfig = {...config, iterations};
        start(value, singleConfig);
      },

      _isUsingNativeDriver: function (): boolean {
        return (
          NativeAnimatedHelper.isNativeDriverForced?.() ||
          config.useNativeDriver ||
          false
        );
      },
    }
  );
};

const sequenceImpl = function (
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  let current = 0;
  return {
    start: function (callback?: ?EndCallback, isLooping?: boolean) {
      const onComplete = function (result: EndResult) {
        if (!result.finished) {
          callback && callback(result);
          return;
        }

        current++;

        if (current === animations.length) {
          // if the start is called, even without a reset, it should start from the beginning
          current = 0;
          callback && callback(result);
          return;
        }

        animations[current].start(onComplete, isLooping);
      };

      if (animations.length === 0) {
        callback && callback({finished: true});
      } else {
        animations[current].start(onComplete, isLooping);
      }
    },

    stop: function () {
      if (current < animations.length) {
        animations[current].stop();
      }
    },

    reset: function () {
      animations.forEach((animation, idx) => {
        if (idx <= current) {
          animation.reset();
        }
      });
      current = 0;
    },

    _startNativeLoop: function () {
      throw new Error(
        'Loops run using the native driver cannot contain Animated.sequence animations',
      );
    },

    _isUsingNativeDriver: function (): boolean {
      return false;
    },
  };
};

type ParallelConfig = {
  // If one is stopped, stop all.  default: true
  stopTogether?: boolean,
  ...
};
const parallelImpl = function (
  animations: Array<CompositeAnimation>,
  config?: ?ParallelConfig,
): CompositeAnimation {
  let doneCount = 0;
  // Make sure we only call stop() at most once for each animation
  const hasEnded: {[number]: boolean} = {};
  const stopTogether = !(config && config.stopTogether === false);

  const result: CompositeAnimation = {
    start: function (callback?: ?EndCallback, isLooping?: boolean) {
      if (doneCount === animations.length) {
        callback && callback({finished: true});
        return;
      }

      animations.forEach((animation, idx) => {
        const cb = function (endResult: EndResult) {
          hasEnded[idx] = true;
          doneCount++;
          if (doneCount === animations.length) {
            doneCount = 0;
            callback && callback(endResult);
            return;
          }

          if (!endResult.finished && stopTogether) {
            result.stop();
          }
        };

        if (!animation) {
          cb({finished: true});
        } else {
          animation.start(cb, isLooping);
        }
      });
    },

    stop: function (): void {
      animations.forEach((animation, idx) => {
        !hasEnded[idx] && animation.stop();
        hasEnded[idx] = true;
      });
    },

    reset: function (): void {
      animations.forEach((animation, idx) => {
        animation.reset();
        hasEnded[idx] = false;
        doneCount = 0;
      });
    },

    _startNativeLoop: function (): empty {
      throw new Error(
        'Loops run using the native driver cannot contain Animated.parallel animations',
      );
    },

    _isUsingNativeDriver: function (): boolean {
      return false;
    },
  };

  return result;
};

const delayImpl = function (time: number): CompositeAnimation {
  // Would be nice to make a specialized implementation
  return timingImpl(new AnimatedValue(0), {
    toValue: 0,
    delay: time,
    duration: 0,
    useNativeDriver: false,
  });
};

const staggerImpl = function (
  time: number,
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  return parallelImpl(
    animations.map((animation, i) => {
      return sequenceImpl([delayImpl(time * i), animation]);
    }),
  );
};

type LoopAnimationConfig = {
  iterations: number,
  resetBeforeIteration?: boolean,
  ...
};

const loopImpl = function (
  animation: CompositeAnimation,
  // $FlowFixMe[incompatible-type]
  {iterations = -1, resetBeforeIteration = true}: LoopAnimationConfig = {},
): CompositeAnimation {
  let isFinished = false;
  let iterationsSoFar = 0;
  return {
    start: function (callback?: ?EndCallback) {
      const restart = function (result: EndResult = {finished: true}): void {
        if (
          isFinished ||
          iterationsSoFar === iterations ||
          result.finished === false
        ) {
          callback && callback(result);
        } else {
          iterationsSoFar++;
          resetBeforeIteration && animation.reset();
          animation.start(restart, iterations === -1);
        }
      };
      if (!animation || iterations === 0) {
        callback && callback({finished: true});
      } else {
        if (animation._isUsingNativeDriver()) {
          animation._startNativeLoop(iterations);
        } else {
          restart(); // Start looping recursively on the js thread
        }
      }
    },

    stop: function (): void {
      isFinished = true;
      animation.stop();
    },

    reset: function (): void {
      iterationsSoFar = 0;
      isFinished = false;
      animation.reset();
    },

    _startNativeLoop: function () {
      throw new Error(
        'Loops run using the native driver cannot contain Animated.loop animations',
      );
    },

    _isUsingNativeDriver: function (): boolean {
      return animation._isUsingNativeDriver();
    },
  };
};

function forkEventImpl(
  event: ?AnimatedEvent | ?Function,
  listener: Function,
): AnimatedEvent | Function {
  if (!event) {
    return listener;
  } else if (event instanceof AnimatedEvent) {
    event.__addListener(listener);
    return event;
  } else {
    return (...args) => {
      typeof event === 'function' && event(...args);
      listener(...args);
    };
  }
}

function unforkEventImpl(
  event: ?AnimatedEvent | ?Function,
  listener: Function,
): void {
  if (event && event instanceof AnimatedEvent) {
    event.__removeListener(listener);
  }
}

const eventImpl = function <T>(
  argMapping: ReadonlyArray<?Mapping>,
  config: EventConfig<T>,
): any {
  const animatedEvent = new AnimatedEvent(argMapping, config);
  if (animatedEvent.__isNative) {
    return animatedEvent;
  } else {
    return animatedEvent.__getHandler();
  }
};

// All types of animated nodes that represent scalar numbers and can be interpolated (etc)
type AnimatedNumeric =
  | AnimatedAddition
  | AnimatedDiffClamp
  | AnimatedDivision
  | AnimatedInterpolation<number>
  | AnimatedModulo
  | AnimatedMultiplication
  | AnimatedSubtraction
  | AnimatedValue;

export type {AnimatedNumeric as Numeric};

/**
 * The `Animated` library is designed to make animations fluid, powerful, and
 * easy to build and maintain. `Animated` focuses on declarative relationships
 * between inputs and outputs, with configurable transforms in between, and
 * simple `start`/`stop` methods to control time-based animation execution.
 * If additional transforms are added, be sure to include them in
 * AnimatedMock.js as well.
 *
 * See https://reactnative.dev/docs/animated
 */
export default {
  /**
   * Standard value class for driving animations.  Typically initialized with
   * `new Animated.Value(0);`
   *
   * See https://reactnative.dev/docs/animated#value
   */
  Value: AnimatedValue,
  /**
   * 2D value class for driving 2D animations, such as pan gestures.
   *
   * See https://reactnative.dev/docs/animatedvaluexy
   */
  ValueXY: AnimatedValueXY,
  /**
   * Value class for driving color animations.
   */
  Color: AnimatedColor,
  /**
   * Exported to use the Interpolation type in flow.
   *
   * See https://reactnative.dev/docs/animated#interpolation
   */
  Interpolation: AnimatedInterpolation,
  /**
   * Exported for ease of type checking. All animated values derive from this
   * class.
   *
   * See https://reactnative.dev/docs/animated#node
   */
  Node: AnimatedNode,
  decay: decayImpl,
  timing: timingImpl,
  spring: springImpl,
  add: addImpl,
  subtract: subtractImpl,
  divide: divideImpl,
  multiply: multiplyImpl,
  modulo: moduloImpl,
  diffClamp: diffClampImpl,
  delay: delayImpl,
  sequence: sequenceImpl,
  parallel: parallelImpl,
  stagger: staggerImpl,
  loop: loopImpl,
  event: eventImpl,
  createAnimatedComponent,
  attachNativeEvent: attachNativeEventImpl,
  forkEvent: forkEventImpl,
  unforkEvent: unforkEventImpl,

  /**
   * Expose Event class, so it can be used as a type for type checkers.
   */
  Event: AnimatedEvent,
};
