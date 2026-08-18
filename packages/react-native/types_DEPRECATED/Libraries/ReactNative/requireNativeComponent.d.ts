/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {HostComponent} from '../../public/ReactNativeTypes';

/**
 * Creates values that can be used like React components which represent native
 * view managers. You should create JavaScript modules that wrap these values so
 * that the results are memoized. Example:
 *
 *   const View = requireNativeComponent('RCTView');
 *
 * The concrete return type of `requireNativeComponent` is a string, but the declared type is
 * `HostComponent` because TypeScript assumes anonymous JSX intrinsics (e.g. a `string`) not
 * to have any props.
 */
export function requireNativeComponent<T>(viewName: string): HostComponent<T>;
