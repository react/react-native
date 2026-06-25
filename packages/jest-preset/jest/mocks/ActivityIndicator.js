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
import typeof TActivityIndicator from 'react-native/Libraries/Components/ActivityIndicator/ActivityIndicator';

const mockComponent =
  jest.requireActual<TmockComponent>('../mockComponent').default;

const ActivityIndicator = mockComponent(
  'react-native/Libraries/Components/ActivityIndicator/ActivityIndicator',
  null, // instanceMethods
  true, // isESModule
) as TActivityIndicator;

export default ActivityIndicator;
