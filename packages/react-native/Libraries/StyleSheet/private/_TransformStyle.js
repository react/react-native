/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type AnimatedNode from '../../Animated/nodes/AnimatedNode';

// Helper types to enforce that a single key is used in a transform object
// after generating a TypeScript definition file from the Flow types.
// $FlowExpectedError[unclear-type]
type KeysOfUnion<T> = T extends any ? keyof T : empty;
// $FlowExpectedError[unclear-type]
type ValueOfUnion<T, K> = T extends any
  ? K extends keyof T
    ? T[K]
    : empty
  : empty;
type MergeUnion<T> = {
  [K in KeysOfUnion<T>]?: ValueOfUnion<T, K>,
};
type MaximumOneOf<T extends {...}> = Values<{
  [K in keyof T]: $Exact<{
    [P in keyof T]?: P extends K ? T[P] : empty,
  }>,
}>;

export type ____TransformStyle_Internal = Readonly<{
  /**
   * `transform` accepts an array of transformation objects. Each object specifies
   * the property that will be transformed as the key, and the value to use in the
   * transformation. Objects should not be combined. Use a single key/value pair
   * per object.
   *
   * The rotate transformations require a string so that the transform may be
   * expressed in degrees (deg) or radians (rad). For example:
   *
   * `transform([{ rotateX: '45deg' }, { rotateZ: '0.785398rad' }])`
   *
   * The skew transformations require a string so that the transform may be
   * expressed in degrees (deg). For example:
   *
   * `transform([{ skewX: '45deg' }])`
   */
  transform?:
    | ReadonlyArray<
        Readonly<
          MaximumOneOf<
            MergeUnion<
              | {readonly perspective: number | AnimatedNode}
              | {readonly rotate: string | AnimatedNode}
              | {readonly rotateX: string | AnimatedNode}
              | {readonly rotateY: string | AnimatedNode}
              | {readonly rotateZ: string | AnimatedNode}
              | {readonly scale: number | AnimatedNode}
              | {readonly scaleX: number | AnimatedNode}
              | {readonly scaleY: number | AnimatedNode}
              | {readonly translateX: number | string | AnimatedNode}
              | {readonly translateY: number | string | AnimatedNode}
              | {
                  readonly translate:
                    | [
                        number | string | AnimatedNode,
                        number | string | AnimatedNode,
                      ]
                    | AnimatedNode,
                }
              | {readonly skewX: string | AnimatedNode}
              | {readonly skewY: string | AnimatedNode}
              // TODO: what is the actual type it expects?
              | {
                  readonly matrix:
                    ReadonlyArray<number | AnimatedNode> | AnimatedNode,
                },
            >,
          >,
        >,
      >
    | string,
  /**
   * `transformOrigin` accepts an array with 3 elements - each element either being
   * a number, or a string of a number ending with `%`. The last element cannot be
   * a percentage, so must be a number.
   *
   * E.g. transformOrigin: ['30%', '80%', 15]
   *
   * Alternatively accepts a string of the CSS syntax. You must use `%` or `px`.
   *
   * E.g. transformOrigin: '30% 80% 15px'
   */
  transformOrigin?:
    [string | number, string | number, string | number] | string,
}>;
