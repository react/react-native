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
import Dimensions from '../Dimensions';
import Platform from '../Platform';

describe('Dimensions', () => {
  it('should set window dimensions', () => {
    Dimensions.set({
      windowPhysicalPixels: {
        width: 400,
        height: 800,
        scale: 2,
        densityDpi: 2,
        fontScale: 3,
      },
    });

    expect(Dimensions.get('window').width).toEqual(200);
    expect(Dimensions.get('window').height).toEqual(400);
    expect(Dimensions.get('window').scale).toEqual(2);
    expect(Dimensions.get('window').fontScale).toEqual(3);
  });

  it('should set screen dimensions on Android', () => {
    // $FlowFixMe[incompatible-type] - `Platform.OS` needs to be read-only.
    Platform.OS = 'android';
    const dimensions = {
      width: 400,
      height: 800,
      scale: 2,
      densityDpi: 2,
      fontScale: 3,
    };
    Dimensions.set({
      windowPhysicalPixels: dimensions,
      screenPhysicalPixels: dimensions,
    });

    expect(Dimensions.get('screen').width).toEqual(200);
    expect(Dimensions.get('screen').height).toEqual(400);
    expect(Dimensions.get('screen').scale).toEqual(2);
    expect(Dimensions.get('screen').fontScale).toEqual(3);
  });

  it('should set screen dimensions on iOS', () => {
    // $FlowFixMe[incompatible-type] - `Platform.OS` needs to be read-only.
    Platform.OS = 'ios';
    const dimensions = {
      width: 400,
      height: 800,
      scale: 2,
      densityDpi: 2,
      fontScale: 3,
    };
    Dimensions.set({
      windowPhysicalPixels: dimensions,
    });

    expect(Dimensions.get('screen')).toEqual(Dimensions.get('window'));
  });
});
