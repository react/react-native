/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// $FlowFixMe[cannot-resolve-module]
import typeof TNativeAnimatedHelper from 'react-native/src/private/animated/NativeAnimatedHelper';

const NativeAnimatedHelper = jest.requireActual<{
  default: TNativeAnimatedHelper,
}>('react-native/src/private/animated/NativeAnimatedHelper').default;

const NativeAnimatedHelperMock: TNativeAnimatedHelper = {
  ...NativeAnimatedHelper,
  assertNativeAnimatedModule: jest.fn(),
};

export default NativeAnimatedHelperMock;
