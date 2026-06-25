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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Image, View} from 'react-native';

it('renders assets based on relative path', () => {
  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(
      <View>
        <Image source={require('./img/img1.png')} />
        <Image source={require('./img/img2.png')} />
      </View>,
    );
  });

  expect(root.getRenderedOutput({props: ['source-uri']}).toJSX()).toEqual(
    <>
      <rn-image
        key="0"
        source-uri="file://drawable-mdpi/packages_reactnative_libraries_image___tests___img_img1.png"
      />
      <rn-image
        key="1"
        source-uri="file://drawable-mdpi/packages_reactnative_libraries_image___tests___img_img2.png"
      />
    </>,
  );
});
