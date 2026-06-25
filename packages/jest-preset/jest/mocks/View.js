/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof * as TmockComponent from '../mockComponent';
import typeof * as TMockNativeMethods from '../MockNativeMethods';
import typeof TView from 'react-native/Libraries/Components/View/View';

const mockComponent =
  jest.requireActual<TmockComponent>('../mockComponent').default;
const MockNativeMethods = jest.requireActual<TMockNativeMethods>(
  '../MockNativeMethods',
).default;

const View = mockComponent(
  'react-native/Libraries/Components/View/View',
  MockNativeMethods, // instanceMethods
  true, // isESModule
) as TView;

export default View;
