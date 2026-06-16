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
import type AnimatedValue from '../nodes/AnimatedValue';
import type {AnimationConfig, EndCallback} from './Animation';

import Animation from './Animation';

export type DecayAnimationConfig = Readonly<{
  ...AnimationConfig,
  velocity:
    | number
    | Readonly<{
        x: number,
        y: number,
        ...
      }>,
  deceleration?: number,
  ...
}>;

export type DecayAnimationConfigSingle = Readonly<{
  ...AnimationConfig,
  velocity: number,
  deceleration?: number,
  ...
}>;

export default class DecayAnimation extends Animation {
  _startTime: number;
  _lastValue: number;
  _fromValue: number;
  _deceleration: number;
  _velocity: number;
  _onUpdate: (value: number) => void;
  _animationFrame: ?AnimationFrameID;
  _platformConfig: ?PlatformConfig;

  constructor(config: DecayAnimationConfigSingle) {
    super(config);

    this._deceleration = config.deceleration ?? 0.998;
    this._velocity = config.velocity;
    this._platformConfig = config.platformConfig;
  }

  __getNativeAnimationConfig(): Readonly<{
    deceleration: number,
    iterations: number,
    platformConfig: ?PlatformConfig,
    type: 'decay',
    velocity: number,
    ...
  }> {
    return {
      type: 'decay',
      deceleration: this._deceleration,
      velocity: this._velocity,
      iterations: this.__iterations,
      platformConfig: this._platformConfig,
      debugID: this.__getDebugID(),
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

    this._lastValue = fromValue;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this._startTime = Date.now();

    const useNativeDriver = this.__startAnimationIfNative(animatedValue);
    // TODO: T274006331 - Remove js-only animation once shared backend is fully rolled out
    if (!useNativeDriver) {
      this._animationFrame = requestAnimationFrame(() => this.onUpdate());
    }
  }

  onUpdate(): void {
    const now = Date.now();

    const value =
      this._fromValue +
      (this._velocity / (1 - this._deceleration)) *
        (1 - Math.exp(-(1 - this._deceleration) * (now - this._startTime)));

    this._onUpdate(value);

    if (Math.abs(this._lastValue - value) < 0.1) {
      this.__notifyAnimationEnd({finished: true});
      return;
    }

    this._lastValue = value;
    if (this.__active) {
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
    }
  }

  stop(): void {
    super.stop();
    if (this._animationFrame != null) {
      global.cancelAnimationFrame(this._animationFrame);
    }
    this.__notifyAnimationEnd({finished: false});
  }
}
