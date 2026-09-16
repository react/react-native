/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import AnimatedImplementation from '../AnimatedImplementation';
import AnimatedMock from '../AnimatedMock';

describe('Animated Mock', () => {
  it('matches implementation keys', () => {
    expect(Object.keys(AnimatedMock)).toEqual(
      Object.keys(AnimatedImplementation),
    );
  });
  it('matches implementation params', () => {
    Object.keys(AnimatedImplementation).forEach(key => {
      if (AnimatedImplementation[key].length !== AnimatedMock[key].length) {
        throw new Error(
          'key ' +
            key +
            ' had different lengths: ' +
            JSON.stringify(
              {
                impl: {
                  len: AnimatedImplementation[key].length,
                  type: typeof AnimatedImplementation[key],
                  val: AnimatedImplementation[key].toString(),
                },
                mock: {
                  len: AnimatedMock[key].length,
                  type: typeof AnimatedMock[key],
                  val: AnimatedMock[key].toString(),
                },
              },
              null,
              2,
            ),
        );
      }
    });
  });
});
