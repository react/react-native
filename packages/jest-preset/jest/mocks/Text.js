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
import typeof TText from 'react-native/Libraries/Text/Text';

const mockComponent =
  jest.requireActual<TmockComponent>('../mockComponent').default;
const MockNativeMethods = jest.requireActual<TMockNativeMethods>(
  '../MockNativeMethods',
).default;

const Text = mockComponent(
  'react-native/Libraries/Text/Text',
  MockNativeMethods, // instanceMethods
  true, // isESModule
) as TText;

export default Text;
