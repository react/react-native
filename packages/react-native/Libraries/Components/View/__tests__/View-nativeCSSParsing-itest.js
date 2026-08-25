/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @fantom_flags enableNativeCSSParsing:true
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

// These tests render <View> with string-valued CSS properties. With
// `enableNativeCSSParsing` forced on, the strings are parsed by the C++ CSS
// parsers (color functions, transforms, filters, box shadows, gradients), and
// we assert the resulting mounted props. `collapsable={false}` keeps views that
// carry only a non-layout prop present in the mounting layer.
function mountedProp(style: ViewStyleProp, prop: string): string {
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<View collapsable={false} style={style} />);
  });
  return root.getRenderedOutput({props: [prop]}).toJSONObject().props[prop];
}

describe('<View> native CSS parsing', () => {
  describe('color functions', () => {
    it('parses hwb() into an rgba color', () => {
      // hwb(0 0% 0%) is pure red.
      expect(
        mountedProp({backgroundColor: 'hwb(0 0% 0%)'}, 'backgroundColor'),
      ).toBe('rgba(255, 0, 0, 1)');
    });

    it('parses hsl() into an rgba color', () => {
      // hsl(120, 100%, 50%) is pure green.
      expect(
        mountedProp(
          {backgroundColor: 'hsl(120, 100%, 50%)'},
          'backgroundColor',
        ),
      ).toBe('rgba(0, 255, 0, 1)');
    });
  });

  describe('transform', () => {
    it('parses string transform syntax', () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<View style={{transform: 'translateX(10px)'}} />);
      });
      expect(root.getRenderedOutput({props: ['transform']}).toJSX()).toEqual(
        <rn-view transform='[{"translateX": 10}]' />,
      );
    });
  });

  describe('backgroundImage', () => {
    it('parses a linear-gradient()', () => {
      const backgroundImage = mountedProp(
        {backgroundImage: 'linear-gradient(#e66465, #9198e5)'},
        'backgroundImage',
      );
      expect(backgroundImage).toContain('linear-gradient');
      expect(backgroundImage).toContain('rgba(230, 100, 101, 1)');
    });

    it('parses a conic-gradient()', () => {
      const backgroundImage = mountedProp(
        {
          backgroundImage: 'conic-gradient(from 45deg, #e66465, #9198e5)',
        },
        'backgroundImage',
      );
      expect(backgroundImage).toBe(
        '[conic-gradient(from 45deg at 50% 50% , rgba(230, 100, 101, 1), rgba(145, 152, 229, 1))]',
      );
    });

    it('parses a four-value conic-gradient position', () => {
      expect(
        mountedProp(
          {
            backgroundImage: 'conic-gradient(at top 20px left 10px, red, blue)',
          },
          'backgroundImage',
        ),
      ).toContain('at 10px 20px');
    });
  });
});
