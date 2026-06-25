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
import typeof TImage from 'react-native/Libraries/Image/Image';

const mockComponent =
  jest.requireActual<TmockComponent>('../mockComponent').default;

const Image = mockComponent(
  'react-native/Libraries/Image/Image',
  null, // instanceMethods
  true, // isESModule
) as TImage;

export default Image;
