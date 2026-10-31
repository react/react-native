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

import type {ViewStyleProp} from '../../../../../Libraries/StyleSheet/StyleSheet';
import type {HostInstance} from 'react-native';

import getSafeAreaContentPadding from '../getSafeAreaContentPadding';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';

const VIEWPORT_WIDTH = 400;
const VIEWPORT_HEIGHT = 600;
const INSETS = {top: 44, right: 84, bottom: 34, left: 0};

/**
 * The frame of a child filling a container styled by the padding under test,
 * on top of the style it was computed for, as Yoga lays it out.
 */
function layoutContent(
  style: ViewStyleProp,
  horizontal: boolean,
): {x: number, y: number, width: number, height: number} {
  const root = Fantom.createRoot({
    viewportWidth: VIEWPORT_WIDTH,
    viewportHeight: VIEWPORT_HEIGHT,
  });
  const contentRef = createRef<HostInstance>();
  Fantom.runTask(() => {
    root.render(
      <View
        collapsable={false}
        style={[
          {width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT},
          style,
          getSafeAreaContentPadding(style, INSETS, horizontal),
        ]}>
        <View collapsable={false} ref={contentRef} style={{flex: 1}} />
      </View>,
    );
  });
  const {x, y, width, height} = nullthrows(
    contentRef.current,
  ).getBoundingClientRect();
  return {x, y, width, height};
}

describe('getSafeAreaContentPadding under Yoga', () => {
  test('applies and lifts the insets across renders', () => {
    const root = Fantom.createRoot({
      viewportWidth: VIEWPORT_WIDTH,
      viewportHeight: VIEWPORT_HEIGHT,
    });
    const contentRef = createRef<HostInstance>();
    const style = {paddingInlineStart: 8, paddingInlineEnd: 20};
    const render = (insets: ?typeof INSETS) => {
      Fantom.runTask(() => {
        root.render(
          <View
            collapsable={false}
            style={[
              {width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT},
              style,
              insets == null
                ? null
                : getSafeAreaContentPadding(style, insets, false),
            ]}>
            <View collapsable={false} ref={contentRef} style={{flex: 1}} />
          </View>,
        );
      });
      const {x, width} = nullthrows(contentRef.current).getBoundingClientRect();
      return {x, width};
    };

    // The style alone.
    expect(render(null)).toEqual({x: 8, width: VIEWPORT_WIDTH - 8 - 20});
    // The insets arrive: the keys the style set are reset, so the padding the
    // override emits is what applies. A `paddingInlineEnd` left in place on
    // the native side would apply over it.
    expect(render(INSETS)).toEqual({x: 8, width: VIEWPORT_WIDTH - 8 - 104});
    // The insets change: the override follows.
    expect(render({...INSETS, right: 30})).toEqual({
      x: 8,
      width: VIEWPORT_WIDTH - 8 - 50,
    });
    // The axis has no safe area any more: the style applies on its own again.
    expect(render(null)).toEqual({x: 8, width: VIEWPORT_WIDTH - 8 - 20});
  });

  test('pads the row by the insets on top of the style', () => {
    expect(layoutContent({padding: 10}, false)).toEqual({
      x: 10,
      y: 10,
      width: VIEWPORT_WIDTH - 10 - 94,
      height: VIEWPORT_HEIGHT - 20,
    });
  });

  test('pads the column by the insets on top of the style', () => {
    expect(layoutContent({paddingBlockStart: 10}, true)).toEqual({
      x: 0,
      y: 54,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT - 54 - 34,
    });
  });

  test('applies over the inline aliases', () => {
    expect(layoutContent({paddingInline: 16}, false)).toEqual({
      x: 16,
      y: 0,
      width: VIEWPORT_WIDTH - 16 - 100,
      height: VIEWPORT_HEIGHT,
    });
    expect(layoutContent({paddingInlineEnd: 20}, false)).toEqual({
      x: 0,
      y: 0,
      width: VIEWPORT_WIDTH - 104,
      height: VIEWPORT_HEIGHT,
    });
  });

  test('applies over the physical keys', () => {
    expect(layoutContent({paddingLeft: 10, paddingRight: 20}, false)).toEqual({
      x: 10,
      y: 0,
      width: VIEWPORT_WIDTH - 10 - 104,
      height: VIEWPORT_HEIGHT,
    });
  });
});
