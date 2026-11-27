/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {getDefaultConfig} from '..';

describe('getDefaultConfig', () => {
  test('treats internal React Native modules as third party', () => {
    const {serializer} = getDefaultConfig(__dirname);

    expect(
      serializer.isThirdPartyModule({
        path: '/app/packages/react-native/Libraries/Core/ExceptionsManager.js',
      }),
    ).toBe(true);
    expect(serializer.isThirdPartyModule({path: '/app/src/App.js'})).toBe(
      false,
    );
  });
});
