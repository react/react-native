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
import type {HostComponent} from 'react-native/src/private/types/HostComponent';

const mockNativeComponent = jest.requireActual<TmockNativeComponent>(
  '../mockNativeComponent',
).default;

export default function requireNativeComponent<T extends {...}>(
  uiViewClassName: string,
): HostComponent<T> {
  return mockNativeComponent<T>(uiViewClassName);
}
