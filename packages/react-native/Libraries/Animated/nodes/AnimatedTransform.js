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
import type {AnimatedNodeConfig} from './AnimatedNode';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import {validateTransform} from '../../../src/private/animated/NativeAnimatedValidation';
import AnimatedNode from './AnimatedNode';
import AnimatedWithChildren from './AnimatedWithChildren';

type Transform<T = AnimatedNode> = {
  [string]:
    | number
    | string
    | T
    | ReadonlyArray<number | string | T>
    | {[string]: number | string | T},
};

function flatAnimatedNodes(
  transforms: ReadonlyArray<Transform<>>,
): Array<AnimatedNode> {
  const nodes = [];
  for (let ii = 0, length = transforms.length; ii < length; ii++) {
    const transform = transforms[ii];
    // There should be exactly one property in `transform`.
    for (const key in transform) {
      const value = transform[key];
      if (value instanceof AnimatedNode) {
        nodes.push(value);
      }
    }
  }
  return nodes;
}

export default class AnimatedTransform extends AnimatedWithChildren {
  // NOTE: For potentially historical reasons, some operations only operate on
  // the first level of AnimatedNode instances. This optimizes that bevavior.
  _nodes: ReadonlyArray<AnimatedNode>;

  _transforms: ReadonlyArray<Transform<>>;

  /**
   * Creates an `AnimatedTransform` if `transforms` contains `AnimatedNode`
   * instances. Otherwise, returns `null`.
   */
  static from(transforms: ReadonlyArray<Transform<>>): ?AnimatedTransform {
    const nodes = flatAnimatedNodes(
      // NOTE: This check should not be necessary, but the types are not
      // enforced as of this writing. This check should be hoisted to
      // instantiation sites.
      Array.isArray(transforms) ? transforms : [],
    );
    if (nodes.length === 0) {
      return null;
    }
    return new AnimatedTransform(nodes, transforms);
  }

  constructor(
    nodes: ReadonlyArray<AnimatedNode>,
    transforms: ReadonlyArray<Transform<>>,
    config?: ?AnimatedNodeConfig,
  ) {
    super(config);
    this._nodes = nodes;
    this._transforms = transforms;
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    const nodes = this._nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__makeNative(platformConfig);
    }
    super.__makeNative(platformConfig);
  }

  __getValue(): ReadonlyArray<Transform<any>> {
    return mapTransforms(this._transforms, animatedNode =>
      animatedNode.__getValue(),
    );
  }

  __getValueWithStaticTransforms(
    staticTransforms: ReadonlyArray<Object>,
  ): ReadonlyArray<Object> {
    const values = [];
    mapTransforms(this._transforms, node => {
      values.push(node.__getValue());
    });
    // NOTE: We can depend on `this._transforms` and `staticTransforms` sharing
    // a structure because of `useAnimatedPropsMemo`.
    return mapTransforms(staticTransforms, () => values.shift());
  }

  __getAnimatedValue(): ReadonlyArray<Transform<any>> {
    return mapTransforms(this._transforms, animatedNode =>
      animatedNode.__getAnimatedValue(),
    );
  }

  __attach(): void {
    const nodes = this._nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__addChild(this);
    }
    super.__attach();
  }

  __detach(): void {
    const nodes = this._nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__removeChild(this);
    }
    super.__detach();
  }

  __getNativeConfig(): any {
    const transformsConfig: Array<any> = [];

    const transforms = this._transforms;
    for (let ii = 0, length = transforms.length; ii < length; ii++) {
      const transform = transforms[ii];
      // There should be exactly one property in `transform`.
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          transformsConfig.push({
            type: 'animated',
            property: key,
            nodeTag: value.__getNativeTag(),
          });
        } else {
          transformsConfig.push({
            type: 'static',
            property: key,
            /* $FlowFixMe[incompatible-type] - `value` can be an array or an
               object. This is not currently handled by `transformDataType`.
               Migrating to `TransformObject` might solve this. */
            value: NativeAnimatedHelper.transformDataType(value),
          });
        }
      }
    }

    if (__DEV__) {
      validateTransform(transformsConfig);
    }
    return {
      type: 'transform',
      transforms: transformsConfig,
      debugID: this.__getDebugID(),
    };
  }
}

function mapTransforms<T>(
  transforms: ReadonlyArray<Transform<>>,
  mapFunction: AnimatedNode => T,
): ReadonlyArray<Transform<T>> {
  return transforms.map(transform => {
    const result: Transform<T> = {};
    // There should be exactly one property in `transform`.
    for (const key in transform) {
      const value = transform[key];
      if (value instanceof AnimatedNode) {
        result[key] = mapFunction(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map(element =>
          element instanceof AnimatedNode ? mapFunction(element) : element,
        );
      } else if (typeof value === 'object') {
        const object: {[string]: number | string | T} = {};
        for (const propertyName in value) {
          const propertyValue = value[propertyName];
          object[propertyName] =
            propertyValue instanceof AnimatedNode
              ? mapFunction(propertyValue)
              : propertyValue;
        }
        result[key] = object;
      } else {
        result[key] = value;
      }
    }
    return result;
  });
}
