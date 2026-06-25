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

import type {PlatformConfig} from '../AnimatedPlatformConfig';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import AnimatedNode from './AnimatedNode';

const {connectAnimatedNodes, disconnectAnimatedNodes} =
  NativeAnimatedHelper.API;

export default class AnimatedWithChildren extends AnimatedNode {
  _children: Array<AnimatedNode> = [];

  __makeNative(platformConfig: ?PlatformConfig) {
    if (!this.__isNative) {
      this.__isNative = true;

      const children = this._children;
      let length = children.length;
      if (length > 0) {
        for (let ii = 0; ii < length; ii++) {
          const child = children[ii];
          child.__makeNative(platformConfig);
          connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
        }
      }
    }
    super.__makeNative(platformConfig);
  }

  __addChild(child: AnimatedNode): void {
    if (this._children.length === 0) {
      this.__attach();
    }
    this._children.push(child);
    if (this.__isNative) {
      // Only accept "native" animated nodes as children
      child.__makeNative(this.__getPlatformConfig());
      connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
    }
  }

  __removeChild(child: AnimatedNode): void {
    const index = this._children.indexOf(child);
    if (index === -1) {
      console.warn("Trying to remove a child that doesn't exist");
      return;
    }
    if (this.__isNative && child.__isNative) {
      disconnectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
    }
    this._children.splice(index, 1);
    if (this._children.length === 0) {
      this.__detach();
    }
  }

  __getChildren(): ReadonlyArray<AnimatedNode> {
    return this._children;
  }

  __callListeners(value: number): void {
    super.__callListeners(value);
    if (!this.__isNative) {
      const children = this._children;
      for (let ii = 0, length = children.length; ii < length; ii++) {
        const child = children[ii];
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        if (child.__getValue) {
          child.__callListeners(child.__getValue());
        }
      }
    }
  }
}
