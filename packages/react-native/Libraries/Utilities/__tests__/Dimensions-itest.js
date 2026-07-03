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
  const dimensions = {
    width: 400,
    height: 800,
    scale: 2,
    densityDpi: 2,
    fontScale: 3,
  };

  it('should set window dimensions', () => {
    const newDimensions = {...dimensions};
    Dimensions.set({
      windowPhysicalPixels: newDimensions,
    });

    expect(Dimensions.get('window').width).toEqual(200);
    expect(Dimensions.get('window').height).toEqual(400);
    expect(Dimensions.get('window').scale).toEqual(2);
    expect(Dimensions.get('window').fontScale).toEqual(3);
  });

  it('should set screen dimensions on Android', () => {
    // $FlowFixMe[incompatible-type] - `Platform.OS` needs to be read-only.
    Platform.OS = 'android';
    const newDimensions = {...dimensions};
    Dimensions.set({
      windowPhysicalPixels: newDimensions,
      screenPhysicalPixels: newDimensions,
    });

    expect(Dimensions.get('screen').width).toEqual(200);
    expect(Dimensions.get('screen').height).toEqual(400);
    expect(Dimensions.get('screen').scale).toEqual(2);
    expect(Dimensions.get('screen').fontScale).toEqual(3);
  });

  it('should set screen dimensions on iOS', () => {
    // $FlowFixMe[incompatible-type] - `Platform.OS` needs to be read-only.
    Platform.OS = 'ios';
    Dimensions.set({
      windowPhysicalPixels: dimensions,
    });

    expect(Dimensions.get('screen')).toEqual(Dimensions.get('window'));
  });

  it('should call a listener on each dimension change', () => {
    const listener = jest.fn();
    const newDimensions1 = {...dimensions, width: 10};
    const newDimensions2 = {...dimensions, width: 30};
    const sub = Dimensions.addEventListener('change', listener);

    Dimensions.set({windowPhysicalPixels: newDimensions1});
    Dimensions.set({windowPhysicalPixels: newDimensions2});

    expect(listener).toBeCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, {
      screen: {fontScale: 3, height: 400, scale: 2, width: 5},
      window: {fontScale: 3, height: 400, scale: 2, width: 5},
    });
    expect(listener).toHaveBeenNthCalledWith(2, {
      screen: {fontScale: 3, height: 400, scale: 2, width: 15},
      window: {fontScale: 3, height: 400, scale: 2, width: 15},
    });
    sub.remove();
  });

  it('should call a listener once', () => {
    const listener = jest.fn();
    const newDimensions1 = {...dimensions, fontScale: 1};
    const newDimensions2 = {...dimensions, fontScale: 2};
    Dimensions.addEventListener('change', listener, {once: true});

    Dimensions.set({windowPhysicalPixels: newDimensions1});
    Dimensions.set({windowPhysicalPixels: newDimensions2});

    expect(listener).toBeCalledTimes(1);
    expect(listener).toBeCalledWith({
      screen: {fontScale: 1, height: 400, scale: 2, width: 200},
      window: {fontScale: 1, height: 400, scale: 2, width: 200},
    });
  });

  it('should remove a listener on a signal abort', () => {
    const listener = jest.fn();
    const newDimensions1 = {...dimensions, fontScale: 1};
    const newDimensions2 = {...dimensions, fontScale: 2};
    const c = new AbortController();
    Dimensions.addEventListener('change', listener, {signal: c.signal});

    Dimensions.set({windowPhysicalPixels: newDimensions2});
    c.abort(); // remove listener
    Dimensions.set({windowPhysicalPixels: newDimensions1});

    expect(listener).toBeCalledTimes(1);
    expect(listener).toBeCalledWith({
      screen: {fontScale: 2, height: 400, scale: 2, width: 200},
      window: {fontScale: 2, height: 400, scale: 2, width: 200},
    });
  });
});
