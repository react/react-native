/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import typeof * as TmockNativeComponent from '../mockNativeComponent';

const mockNativeComponent = jest.requireActual<TmockNativeComponent>(
  '../mockNativeComponent',
).default;

export const get = jest.fn((name, viewConfigProvider) => {
  return mockNativeComponent(name);
}) as JestMockFn<$FlowFixMe, $FlowFixMe>;

export const getWithFallback_DEPRECATED = jest.fn(
  (name, viewConfigProvider) => {
    return mockNativeComponent(name);
  },
) as JestMockFn<$FlowFixMe, $FlowFixMe>;

export const setRuntimeConfigProvider = jest.fn() as JestMockFn<
  $FlowFixMe,
  $FlowFixMe,
>;
