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

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Text, View} from 'react-native';

// A non-integer screen density, as shipped by many Android devices. One
// physical pixel is 1/2.75 dp.
const DEVICE_PIXEL_RATIO = 2.75;

// 23 physical pixels, as a float32 dp value. Android measures text in whole
// physical pixels and hands Yoga the dp equivalent, so `TEXT_WIDTH * 2.75`
// lands a hair under 23 (22.999999046) rather than exactly on it.
const TEXT_WIDTH = 8.363636016845703;
const TEXT_WIDTH_IN_PIXELS = 23;

function measureTextWidthInPixels(paddingLeft: number): number {
  const root = Fantom.createRoot({devicePixelRatio: DEVICE_PIXEL_RATIO});
  const textRef = createRef<HostInstance>();

  try {
    Fantom.runTask(() => {
      root.render(
        <View collapsable={false} style={{paddingLeft}}>
          <Text ref={textRef} style={{width: TEXT_WIDTH}}>
            text
          </Text>
        </View>,
      );
    });

    const {width} = nullthrows(textRef.current).getBoundingClientRect();
    return Math.round(width * DEVICE_PIXEL_RATIO);
  } finally {
    root.destroy();
  }
}

// The text node's edges land on opposite sides of the tolerance Yoga uses to
// decide whether a value already sits on the pixel grid: the left edge falls on
// 103.9999008 scaled units and is snapped up to 104, while the right edge falls
// on 126.9998999, misses the tolerance, and is floored to 126. Rounding the two
// edges independently then produced a 22 pixel wide box for 23 pixels of text,
// and the view dropped the trailing glyph when it re-broke the text at that
// width.
test('does not round a text node below the width it measured', () => {
  expect(measureTextWidthInPixels(37.818145751953125)).toBe(
    TEXT_WIDTH_IN_PIXELS,
  );
});

// The counterpart: a text node that already rounds to the width it measured
// must not gain a pixel. Here the left edge falls on 28.875 scaled units, well
// clear of the tolerance, and both edges floor consistently. Forcing the right
// edge to ceil unconditionally would widen this node to 24 pixels.
test('does not widen a text node that already fits', () => {
  expect(measureTextWidthInPixels(10.5)).toBe(TEXT_WIDTH_IN_PIXELS);
});
