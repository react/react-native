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

import type {BackgroundImageValue} from '../../../StyleSheet/StyleSheetTypes';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

type ViewStyleProp = NonNullable<React.PropOf<View, 'style'>>;

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

    it('keeps a url layer with an empty uri, like web', () => {
      expect(
        mountedProp(
          {backgroundImage: [{type: 'url', uri: ''}]},
          'backgroundImage',
        ),
      ).toBe('[url()]');
      const backgroundImage = mountedProp(
        {backgroundImage: 'url(""), linear-gradient(red, blue)'},
        'backgroundImage',
      );
      expect(backgroundImage).toContain('url()');
      expect(backgroundImage).toContain('linear-gradient');
    });

    it('drops the whole list when a url layer is invalid, like web', () => {
      const gradient: BackgroundImageValue = {
        type: 'linear-gradient',
        direction: 'to bottom',
        colorStops: [
          {color: 'red', positions: ['0%']},
          {color: 'blue', positions: ['100%']},
        ],
      };
      expect(
        mountedProp({backgroundImage: [gradient]}, 'backgroundImage'),
      ).toContain('linear-gradient');
      // An asset number that the asset registry does not know stays a number,
      // which is not a valid uri.
      expect(
        mountedProp(
          {backgroundImage: [{type: 'url', uri: 999999}, gradient]},
          'backgroundImage',
        ),
      ).toBeUndefined();
      expect(
        mountedProp(
          {backgroundImage: 'url(my photo.png), linear-gradient(red, blue)'},
          'backgroundImage',
        ),
      ).toBeUndefined();
    });

    it('resolves a require() asset in the object syntax', () => {
      expect(
        mountedProp(
          {
            backgroundImage: [
              {
                type: 'url',
                uri: require('../../../Image/__tests__/img/img1.png'),
              },
            ],
          },
          'backgroundImage',
        ),
      ).toBe(
        '[url(file://drawable-mdpi/packages_reactnative_libraries_image___tests___img_img1.png)]',
      );
    });
  });
});
