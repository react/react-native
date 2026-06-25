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

import type {HostComponent} from '../../src/private/types/HostComponent';

const createReactNativeComponentClass =
  require('../Renderer/shims/createReactNativeComponentClass').default;
const getNativeComponentAttributes =
  require('./getNativeComponentAttributes').default;

/**
 * Creates values that can be used like React components which represent native
 * view managers. You should create JavaScript modules that wrap these values so
 * that the results are memoized. Example:
 *
 *   const View = requireNativeComponent('RCTView');
 *
 */

const requireNativeComponent = <T extends {...}>(
  uiViewClassName: string,
): HostComponent<T> =>
  createReactNativeComponentClass(uiViewClassName, () =>
    getNativeComponentAttributes(uiViewClassName),
  ) as any as HostComponent<T>;

export default requireNativeComponent;
