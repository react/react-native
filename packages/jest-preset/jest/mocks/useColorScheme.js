/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {ColorSchemeName} from 'react-native/Libraries/Utilities/NativeAppearance';

const useColorScheme = jest.fn(() => 'light') as JestMockFn<
  [],
  ColorSchemeName,
>;

export default useColorScheme;
