/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type {RgbaValue} from '../nodes/AnimatedColor';
import type AnimatedInterpolation from '../nodes/AnimatedInterpolation';
import type AnimatedValue from '../nodes/AnimatedValue';
import type AnimatedValueXY from '../nodes/AnimatedValueXY';
import type {AnimationConfig, EndCallback} from './Animation';

import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import AnimatedColor from '../nodes/AnimatedColor';
import Animation from './Animation';

export type TimingAnimationConfig = Readonly<{
  ...AnimationConfig,
  toValue:
    | number
    | AnimatedValue
    | Readonly<{
        x: number,
        y: number,
        ...
      }>
    | AnimatedValueXY
    | RgbaValue
    | AnimatedColor
    | AnimatedInterpolation<number>,
  easing?: (value: number) => number,
  duration?: number,
  delay?: number,
  ...
}>;

export type TimingAnimationConfigSingle = Readonly<{
  ...AnimationConfig,
  toValue: number,
  easing?: (value: number) => number,
  duration?: number,
  delay?: number,
  ...
}>;

let _easeInOut;
function easeInOut() {
  /* $FlowFixMe[constant-condition] Error discovered during Constant Condition
   * roll out. See https://fburl.com/workplace/1v97vimq. */
  if (!_easeInOut) {
    const Easing = require('../Easing').default;
    _easeInOut = Easing.inOut(Easing.ease);
  }
  return _easeInOut;
}

export default class TimingAnimation extends Animation {
  _startTime: number;
  _fromValue: number;
  _toValue: number;
  _duration: number;
  _delay: number;
  _easing: (value: number) => number;
  _onUpdate: (value: number) => void;
  _animationFrame: ?AnimationFrameID;
  _timeout: ?TimeoutID;
  _platformConfig: ?PlatformConfig;
  _deferredStart: boolean;

  constructor(config: TimingAnimationConfigSingle) {
    super(config);

    this._toValue = config.toValue;
    this._easing = config.easing ?? easeInOut();
    this._duration = config.duration ?? 500;
    this._delay = config.delay ?? 0;
    this._platformConfig = config.platformConfig;
    this._deferredStart = false;
  }

  __getNativeAnimationConfig(): Readonly<{
    type: 'frames',
    frames: ReadonlyArray<number>,
    toValue: number,
    iterations: number,
    platformConfig: ?PlatformConfig,
    ...
  }> {
    const frameDuration = 1000.0 / 60.0;
    const frames = [];
    const numFrames = Math.round(this._duration / frameDuration);
    for (let frame = 0; frame < numFrames; frame++) {
      frames.push(this._easing(frame / numFrames));
    }
    frames.push(this._easing(1));
    return {
      type: 'frames',
      frames,
      toValue: this._toValue,
      iterations: this.__iterations,
      platformConfig: this._platformConfig,
      debugID: this.__getDebugID(),
      deferredStart: this._deferredStart,
    };
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
    animatedValue: AnimatedValue,
  ): void {
    super.start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue);

    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    if (ReactNativeFeatureFlags.animatedDeferStartOfTimingAnimations()) {
      this._deferredStart = animatedValue.__deferAnimationStart;
      animatedValue.__deferAnimationStart = false;
    }

    const start = () => {
      this._startTime = Date.now();

      const useNativeDriver = this.__startAnimationIfNative(animatedValue);
      // TODO: T274006331 - Remove js-only animation once shared backend is fully rolled out
      if (!useNativeDriver) {
        // Animations that sometimes have 0 duration and sometimes do not
        // still need to use the native driver when duration is 0 so as to
        // not cause intermixed JS and native animations.
        if (this._duration === 0) {
          this._onUpdate(this._toValue);
          this.__notifyAnimationEnd({finished: true});
        } else {
          this._animationFrame = requestAnimationFrame(() => this.onUpdate());
        }
      }
    };
    if (this._delay) {
      this._timeout = setTimeout(start, this._delay);
    } else {
      start();
    }
  }

  onUpdate(): void {
    const now = Date.now();
    if (now >= this._startTime + this._duration) {
      if (this._duration === 0) {
        this._onUpdate(this._toValue);
      } else {
        this._onUpdate(
          this._fromValue + this._easing(1) * (this._toValue - this._fromValue),
        );
      }
      this.__notifyAnimationEnd({finished: true});
      return;
    }

    this._onUpdate(
      this._fromValue +
        this._easing((now - this._startTime) / this._duration) *
          (this._toValue - this._fromValue),
    );
    if (this.__active) {
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }

  stop(): void {
    super.stop();
    clearTimeout(this._timeout);
    if (this._animationFrame != null) {
      global.cancelAnimationFrame(this._animationFrame);
    }
    this.__notifyAnimationEnd({finished: false});
  }
}
