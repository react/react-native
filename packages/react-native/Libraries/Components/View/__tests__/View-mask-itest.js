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

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

// `mask-image` reuses the `background-image` value syntax, so these tests check
// that the style plumbing reaches the `maskImage` prop of the mounted view for
// each accepted form. `collapsable={false}` is not needed here: a non-empty
// `mask-image` makes the view form a stacking context on its own.
function mountedMaskImage(style: ViewStyleProp): string {
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<View style={style} />);
  });
  return root.getRenderedOutput({props: ['maskImage']}).toJSONObject().props
    .maskImage;
}

describe('<View> mask-image', () => {
  it('accepts a linear-gradient() shorthand', () => {
    const maskImage = mountedMaskImage({
      maskImage: 'linear-gradient(#e66465, #9198e5)',
    });
    expect(maskImage).toContain('linear-gradient');
    expect(maskImage).toContain('rgba(230, 100, 101, 1)');
  });

  it('accepts a radial-gradient() shorthand', () => {
    expect(
      mountedMaskImage({maskImage: 'radial-gradient(circle, black, white)'}),
    ).toContain('radial-gradient');
  });

  it('accepts a url() shorthand', () => {
    expect(
      mountedMaskImage({maskImage: 'url(https://example.com/mask.png)'}),
    ).toContain('https://example.com/mask.png');
  });

  it('accepts an array of layers', () => {
    const maskImage = mountedMaskImage({
      maskImage: [
        {type: 'url', uri: 'https://example.com/mask.png'},
        {
          type: 'linear-gradient',
          direction: 'to right',
          colorStops: [{color: 'black'}, {color: 'white'}],
        },
      ],
    });
    expect(maskImage).toContain('https://example.com/mask.png');
    expect(maskImage).toContain('linear-gradient');
  });

  it('is unset when no mask-image is given', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View collapsable={false} />);
    });
    expect(
      root.getRenderedOutput({props: ['maskImage']}).toJSONObject().props
        .maskImage,
    ).toBeUndefined();
  });
});
