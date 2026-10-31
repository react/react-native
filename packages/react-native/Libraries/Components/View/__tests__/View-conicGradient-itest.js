/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @fantom_flags enableNativeCSSParsing:*
 * @fantom_flags enableCppPropsIteratorSetter:*
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {ColorValue} from '../../../StyleSheet/StyleSheet';
import type {
  BackgroundImageValue,
  RadialGradientPosition,
} from '../../../StyleSheet/StyleSheetTypes';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

type BackgroundImage = string | ReadonlyArray<BackgroundImageValue>;

function mountedBackgroundImage(backgroundImage: BackgroundImage): ?string {
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<View collapsable={false} style={{backgroundImage}} />);
  });
  return root.getRenderedOutput({props: ['backgroundImage']}).toJSONObject()
    .props.backgroundImage;
}

const colors: ReadonlyArray<{
  color: ColorValue,
  positions?: ReadonlyArray<string>,
}> = [{color: 'red'}, {color: 'blue'}];
const serializedColors = 'rgba(255, 0, 0, 1), rgba(0, 0, 255, 1)';

describe('conic gradient native props', () => {
  // Assert the complete native value: matching only the right/bottom suffix
  // would miss stale top/left defaults, which take precedence on iOS.
  const positions: Array<{
    css: string,
    object: RadialGradientPosition,
    expected: string,
  }> = [
    {css: 'center', object: {left: '50%', top: '50%'}, expected: '50% 50%'},
    {
      css: 'top center',
      object: {left: '50%', top: '0%'},
      expected: '50% 0%',
    },
    {
      css: 'bottom center',
      object: {left: '50%', top: '100%'},
      expected: '50% 100%',
    },
    {
      css: 'center left',
      object: {left: '0%', top: '50%'},
      expected: '0% 50%',
    },
    {
      css: 'center right',
      object: {left: '100%', top: '50%'},
      expected: '100% 50%',
    },
    {css: '25% 75%', object: {left: '25%', top: '75%'}, expected: '25% 75%'},
    {
      css: 'left 10px top 20px',
      object: {left: 10, top: 20},
      expected: '10px 20px',
    },
    {
      css: 'right 10px top 20px',
      object: {right: 10, top: 20},
      expected: '20px 10px',
    },
    {
      css: 'left 10px bottom 20px',
      object: {left: 10, bottom: 20},
      expected: '10px 20px',
    },
    {
      css: 'right 10px bottom 20px',
      object: {right: 10, bottom: 20},
      expected: '10px 20px',
    },
    {
      css: 'bottom 20px right 10px',
      object: {bottom: 20, right: 10},
      expected: '10px 20px',
    },
    {
      css: 'right 0px bottom 0px',
      object: {right: 0, bottom: 0},
      expected: '0px 0px',
    },
    {
      css: 'right 10% bottom 20%',
      object: {right: '10%', bottom: '20%'},
      expected: '10% 20%',
    },
    {
      css: 'right -10px bottom -20px',
      object: {right: -10, bottom: -20},
      expected: '-10px -20px',
    },
    {
      css: 'right 110% bottom 120%',
      object: {right: '110%', bottom: '120%'},
      expected: '110% 120%',
    },
    {
      css: 'right 0.5px bottom 1.25px',
      object: {right: 0.5, bottom: 1.25},
      expected: '0.5px 1.25px',
    },
  ];

  for (const {css, object, expected} of positions) {
    it(`preserves string position ${css}`, () => {
      expect(
        mountedBackgroundImage(
          `conic-gradient(from 0deg at ${css}, red, blue)`,
        ),
      ).toBe(
        `[conic-gradient(from 0deg at ${expected} , ${serializedColors})]`,
      );
    });
    it(`preserves object position ${JSON.stringify(object)}`, () => {
      expect(
        mountedBackgroundImage([
          {type: 'conic-gradient', position: object, colorStops: colors},
        ]),
      ).toBe(
        `[conic-gradient(from 0deg at ${expected} , ${serializedColors})]`,
      );
    });
  }

  for (const {position, expected} of [
    {position: {right: 10}, expected: '50% 10px'},
    {position: {bottom: 20}, expected: '50% 20px'},
    {position: {left: 10}, expected: '10px 50%'},
    {position: {top: 20}, expected: '50% 20px'},
  ]) {
    it(`centers only the unspecified axis for ${JSON.stringify(position)}`, () => {
      expect(
        // $FlowFixMe[incompatible-type] - exercise partial positions from untyped callers.
        mountedBackgroundImage([
          {type: 'conic-gradient', position, colorStops: colors},
        ]),
      ).toBe(
        `[conic-gradient(from 0deg at ${expected} , ${serializedColors})]`,
      );
    });
  }

  for (const [angle, expected] of [
    ['0', '0'],
    ['90deg', '90'],
    ['100grad', '90'],
    ['0.25turn', '90'],
    ['-90deg', '-90'],
    ['720deg', '720'],
  ]) {
    for (const syntax of ['string', 'object']) {
      it(`preserves ${angle} in ${syntax} syntax`, () => {
        const input: BackgroundImage =
          syntax === 'string'
            ? `conic-gradient(from ${angle}, red, blue)`
            : [{type: 'conic-gradient', from: angle, colorStops: colors}];
        expect(mountedBackgroundImage(input)).toBe(
          `[conic-gradient(from ${expected}deg at 50% 50% , ${serializedColors})]`,
        );
      });
    }
  }

  it('expands two-position hard stops without losing their order', () => {
    expect(
      mountedBackgroundImage(
        'conic-gradient(red 0deg 90deg, blue 90deg 1turn)',
      ),
    ).toBe(
      '[conic-gradient(from 0deg at 50% 50% , rgba(255, 0, 0, 1) 0%, rgba(255, 0, 0, 1) 25%, rgba(0, 0, 255, 1) 25%, rgba(0, 0, 255, 1) 100%)]',
    );
  });

  it('accepts a single two-position hard stop', () => {
    expect(mountedBackgroundImage('conic-gradient(red 0deg 360deg)')).toBe(
      '[conic-gradient(from 0deg at 50% 50% , rgba(255, 0, 0, 1) 0%, rgba(255, 0, 0, 1) 100%)]',
    );
  });

  for (const invalid of [
    'conic-gradient()',
    'conic-gradient(red)',
    'conic-gradient(from 10px, red, blue)',
    'conic-gradient(from 1, red, blue)',
    'conic-gradient(from 50%, red, blue)',
    'conic-gradient(from, red, blue)',
    'conic-gradient(at, red, blue)',
    'conic-gradient(at right left, red, blue)',
    'conic-gradient(at left right, red, blue)',
    'conic-gradient(at right 10px left 20px, red, blue)',
    'conic-gradient(at 20px left, red, blue)',
    'conic-gradient(at 20px right, red, blue)',
    'conic-gradient(at top 20px, red, blue)',
    'conic-gradient(at bottom 20px, red, blue)',
    'conic-gradient(red 10px, blue)',
    'conic-gradient(red 20, blue)',
    'conic-gradient(20%, red, blue)',
    'conic-gradient(red, blue, 20%)',
    'conic-gradient(red, 20%, 30%, blue)',
    'conic-gradient(red,, blue)',
    'conic-gradient(, red, blue)',
    'conic-gradient(red, blue,)',
    'conic-gradient(red, not-a-color)',
    'conic-gradient(from 90deg red, blue)',
    'conic-gradient(at center red, blue)',
  ]) {
    it(`rejects ${invalid}`, () => {
      expect(mountedBackgroundImage(invalid)).toBeUndefined();
    });
  }

  for (const colorStops of [
    [{color: 'red', positions: ['0deg', '45deg', '90deg']}, {color: 'blue'}],
    [{positions: ['20%']}, {color: 'red'}, {color: 'blue'}],
    [{color: 'red'}, {color: 'blue'}, {positions: ['20%']}],
    [
      {color: 'red'},
      {positions: ['20%']},
      {positions: ['30%']},
      {color: 'blue'},
    ],
    [{color: 'red'}, {positions: ['20%', '30%']}, {color: 'blue'}],
    [
      {color: 'red'},
      {color: 'not-a-color', positions: ['25%']},
      {color: 'blue'},
    ],
  ]) {
    it(`rejects malformed object stops through native props: ${JSON.stringify(colorStops)}`, () => {
      const input = [{type: 'conic-gradient', colorStops}];
      // $FlowFixMe[incompatible-type] - exercise malformed stops from untyped callers.
      expect(mountedBackgroundImage(input)).toBeUndefined();
    });
  }

  for (const color of [undefined, null]) {
    it(`preserves a valid object hint with color ${String(color)}`, () => {
      const input: BackgroundImage = [
        {
          type: 'conic-gradient',
          colorStops: [
            {color: 'red'},
            {color, positions: ['90deg']},
            {color: 'blue'},
          ],
        },
      ];
      expect(mountedBackgroundImage(input)).toBe(
        '[conic-gradient(from 0deg at 50% 50% , rgba(255, 0, 0, 1), rgba(0, 0, 0, 0) 25%, rgba(0, 0, 255, 1))]',
      );
    });
  }

  it('preserves layer order when conic, linear, and radial gradients are mixed', () => {
    expect(
      mountedBackgroundImage(
        'conic-gradient(red, blue), linear-gradient(red, blue), radial-gradient(red, blue)',
      ),
    ).toBe(
      `[conic-gradient(from 0deg at 50% 50% , ${serializedColors}), linear-gradient(180deg, ${serializedColors}), radial-gradient(ellipse farthest-corner at 50% 50% , ${serializedColors})]`,
    );
  });

  const updates: Array<{
    name: string,
    before: BackgroundImage,
    after: BackgroundImage | void,
    expected: ?string,
  }> = [
    {
      name: 'replaces left/top with right/bottom',
      before: 'conic-gradient(at left 30px top 40px, red, blue)',
      after: [
        {
          type: 'conic-gradient',
          position: {right: 10, bottom: 20},
          colorStops: colors,
        },
      ],
      expected: `[conic-gradient(from 0deg at 10px 20px , ${serializedColors})]`,
    },
    {
      name: 'resets edge offsets to the default center',
      before: 'conic-gradient(at right 10px bottom 20px, red, blue)',
      after: 'conic-gradient(red, blue)',
      expected: `[conic-gradient(from 0deg at 50% 50% , ${serializedColors})]`,
    },
    {
      name: 'removes a gradient with an empty list',
      before: 'conic-gradient(red, blue)',
      after: [],
      expected: undefined,
    },
    {
      name: 'removes a gradient with undefined',
      before: 'conic-gradient(red, blue)',
      after: undefined,
      expected: undefined,
    },
    {
      name: 'clears a gradient after an invalid replacement',
      before: 'conic-gradient(red, blue)',
      after: 'conic-gradient(red 10px, blue)',
      expected: undefined,
    },
    {
      name: 'replaces a conic gradient with a linear gradient',
      before: 'conic-gradient(red, blue)',
      after: 'linear-gradient(red, blue)',
      expected: `[linear-gradient(180deg, ${serializedColors})]`,
    },
    {
      name: 'recovers after invalid input',
      before: 'conic-gradient(red 10px, blue)',
      after: 'conic-gradient(red, blue)',
      expected: `[conic-gradient(from 0deg at 50% 50% , ${serializedColors})]`,
    },
  ];
  for (const {name, before, after, expected} of updates) {
    it(name, () => {
      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(
          <View collapsable={false} style={{backgroundImage: before}} />,
        );
      });
      Fantom.runTask(() => {
        root.render(
          <View collapsable={false} style={{backgroundImage: after}} />,
        );
      });
      expect(
        root.getRenderedOutput({props: ['backgroundImage']}).toJSONObject()
          .props.backgroundImage,
      ).toBe(expected);
    });
  }
});
