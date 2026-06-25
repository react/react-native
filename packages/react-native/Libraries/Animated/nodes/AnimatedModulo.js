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

import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type {InterpolationConfigType} from './AnimatedInterpolation';
import type AnimatedNode from './AnimatedNode';
import type {AnimatedNodeConfig} from './AnimatedNode';

import AnimatedInterpolation from './AnimatedInterpolation';
import AnimatedWithChildren from './AnimatedWithChildren';

export default class AnimatedModulo extends AnimatedWithChildren {
  _a: AnimatedNode;
  _modulus: number;

  constructor(a: AnimatedNode, modulus: number, config?: ?AnimatedNodeConfig) {
    super(config);
    this._a = a;
    this._modulus = modulus;
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this._a.__makeNative(platformConfig);
    super.__makeNative(platformConfig);
  }

  __getValue(): number {
    return (
      ((this._a.__getValue() % this._modulus) + this._modulus) % this._modulus
    );
  }

  interpolate<OutputT extends number | string>(
    config: InterpolationConfigType<OutputT>,
  ): AnimatedInterpolation<OutputT> {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._a.__addChild(this);
    super.__attach();
  }

  __detach(): void {
    this._a.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'modulus',
      input: this._a.__getNativeTag(),
      modulus: this._modulus,
      debugID: this.__getDebugID(),
    };
  }
}
