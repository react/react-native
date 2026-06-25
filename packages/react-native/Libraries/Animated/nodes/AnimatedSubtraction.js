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
import AnimatedValue from './AnimatedValue';
import AnimatedWithChildren from './AnimatedWithChildren';

export default class AnimatedSubtraction extends AnimatedWithChildren {
  _a: AnimatedNode;
  _b: AnimatedNode;

  constructor(
    a: AnimatedNode | number,
    b: AnimatedNode | number,
    config?: ?AnimatedNodeConfig,
  ) {
    super(config);
    this._a = typeof a === 'number' ? new AnimatedValue(a) : a;
    this._b = typeof b === 'number' ? new AnimatedValue(b) : b;
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this._a.__makeNative(platformConfig);
    this._b.__makeNative(platformConfig);
    super.__makeNative(platformConfig);
  }

  __getValue(): number {
    return this._a.__getValue() - this._b.__getValue();
  }

  interpolate<OutputT extends number | string>(
    config: InterpolationConfigType<OutputT>,
  ): AnimatedInterpolation<OutputT> {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._a.__addChild(this);
    this._b.__addChild(this);
    super.__attach();
  }

  __detach(): void {
    this._a.__removeChild(this);
    this._b.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'subtraction',
      input: [this._a.__getNativeTag(), this._b.__getNativeTag()],
      debugID: this.__getDebugID(),
    };
  }
}
