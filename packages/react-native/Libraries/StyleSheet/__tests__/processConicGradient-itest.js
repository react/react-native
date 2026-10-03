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

import type {BackgroundImageValue} from '../StyleSheetTypes';

import processBackgroundImage from '../processBackgroundImage';
import processColor from '../processColor';

const red = processColor('red');
const blue = processColor('blue');

describe('conic gradient processing', () => {
  for (const [angle, degrees] of [
    ['0', 0],
    ['-0deg', 0],
    ['90deg', 90],
    ['100grad', 90],
    ['0.25turn', 90],
    ['1.5707963267948966rad', 90],
    ['-0.25turn', -90],
    ['2turn', 720],
    ['.5deg', 0.5],
  ]) {
    it(`converts ${angle} in string and object syntax`, () => {
      const inputs: Array<string | ReadonlyArray<BackgroundImageValue>> = [
        `conic-gradient(from ${angle}, red, blue)`,
        [
          {
            type: 'conic-gradient',
            from: angle,
            colorStops: [{color: 'red'}, {color: 'blue'}],
          },
        ],
      ];
      for (const input of inputs) {
        const result = processBackgroundImage(input);
        expect(result).toHaveLength(1);
        expect(result[0].from).toBeCloseTo(degrees);
        expect(result[0].position).toEqual({left: '50%', top: '50%'});
        expect(result[0].colorStops).toEqual([
          {color: red, position: null},
          {color: blue, position: null},
        ]);
      }
    });
  }

  for (const [css, expected] of [
    [
      'red 0, blue 1turn',
      [
        {color: red, position: '0%'},
        {color: blue, position: '100%'},
      ],
    ],
    [
      'red -90deg, blue 450deg',
      [
        {color: red, position: '-25%'},
        {color: blue, position: '125%'},
      ],
    ],
    [
      'red 75%, blue 25%',
      [
        {color: red, position: '75%'},
        {color: blue, position: '25%'},
      ],
    ],
    [
      'red 100grad, blue .5turn',
      [
        {color: red, position: '25%'},
        {color: blue, position: '50%'},
      ],
    ],
    [
      'red 0deg 90deg, blue 90deg 360deg',
      [
        {color: red, position: '0%'},
        {color: red, position: '25%'},
        {color: blue, position: '25%'},
        {color: blue, position: '100%'},
      ],
    ],
    [
      'red, 90deg, blue',
      [
        {color: red, position: null},
        {color: null, position: '25%'},
        {color: blue, position: null},
      ],
    ],
    [
      'red 0%, 25%, blue 100%',
      [
        {color: red, position: '0%'},
        {color: null, position: '25%'},
        {color: blue, position: '100%'},
      ],
    ],
  ]) {
    it(`preserves color stops for ${css}`, () => {
      expect(processBackgroundImage(`conic-gradient(${css})`)).toEqual([
        {
          type: 'conic-gradient',
          from: 0,
          position: {left: '50%', top: '50%'},
          colorStops: expected,
        },
      ]);
    });
  }

  it('handles commas within color functions and transparent stops', () => {
    expect(
      processBackgroundImage(
        'conic-gradient(rgba(255, 0, 0, 0.5) 0%, transparent 50%, rgb(0, 0, 255) 100%)',
      ),
    ).toEqual([
      {
        type: 'conic-gradient',
        from: 0,
        position: {left: '50%', top: '50%'},
        colorStops: [
          {color: processColor('rgba(255, 0, 0, 0.5)'), position: '0%'},
          {color: processColor('transparent'), position: '50%'},
          {color: blue, position: '100%'},
        ],
      },
    ]);
  });

  it('preserves an object transition hint between two colors', () => {
    const input = [
      {
        type: 'conic-gradient',
        colorStops: [{color: 'red'}, {positions: ['90deg']}, {color: 'blue'}],
      },
    ];
    // $FlowFixMe[incompatible-type] - gradient hint types currently require a color.
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'conic-gradient',
        from: 0,
        position: {left: '50%', top: '50%'},
        colorStops: [
          {color: red, position: null},
          {color: null, position: '25%'},
          {color: blue, position: null},
        ],
      },
    ]);
  });

  for (const from of [
    '1',
    '10px',
    '50%',
    'NaNdeg',
    'Infinitydeg',
    '90deg junk',
    '',
  ]) {
    it(`rejects invalid object angle ${JSON.stringify(from)}`, () => {
      expect(
        processBackgroundImage([
          {
            type: 'conic-gradient',
            from,
            colorStops: [{color: 'red'}, {color: 'blue'}],
          },
        ]),
      ).toEqual([]);
    });
  }

  const invalidStops = [
    [],
    [{color: 'red'}],
    [{color: 'red', positions: ['10px']}, {color: 'blue'}],
    [{color: 'red', positions: ['0deg', '45deg', '90deg']}, {color: 'blue'}],
    [{positions: ['20%']}, {color: 'red'}, {color: 'blue'}],
    [{color: 'red'}, {color: 'blue'}, {positions: ['20%']}],
    [
      {color: 'red'},
      {positions: ['20%']},
      {positions: ['30%']},
      {color: 'blue'},
    ],
    [{color: 'red'}, {color: 'not-a-color'}],
  ];
  for (const colorStops of invalidStops) {
    it(`rejects invalid object stops ${JSON.stringify(colorStops)}`, () => {
      expect(
        // $FlowFixMe[incompatible-type] - exercise malformed stops from untyped callers.
        processBackgroundImage([{type: 'conic-gradient', colorStops}]),
      ).toEqual([]);
    });
  }

  for (const input of [
    'conic-gradient(red, blue), conic-gradient(red 10px, blue)',
    'conic-gradient(red 10px, blue), conic-gradient(red, blue)',
    'conic-gradient(red 10px, blue), conic-gradient(red, blue), conic-gradient(red 10px, blue)',
  ]) {
    it(`preserves existing per-layer filtering for ${input}`, () => {
      expect(processBackgroundImage(input)).toEqual([
        {
          type: 'conic-gradient',
          from: 0,
          position: {left: '50%', top: '50%'},
          colorStops: [
            {color: red, position: null},
            {color: blue, position: null},
          ],
        },
      ]);
    });
  }

  it('does not mutate reusable style objects', () => {
    const input: ReadonlyArray<BackgroundImageValue> = [
      {
        type: 'conic-gradient',
        from: '.25turn',
        position: {right: 10, bottom: 20},
        colorStops: [
          {color: 'red', positions: ['0deg', '90deg']},
          {color: 'blue'},
        ],
      },
    ];
    for (const gradient of input) {
      for (const stop of gradient.colorStops) {
        if (stop.positions != null) {
          Object.freeze(stop.positions);
        }
        Object.freeze(stop);
      }
      Object.freeze(gradient.colorStops);
      if (gradient.type === 'conic-gradient') {
        Object.freeze(gradient.position);
      }
      Object.freeze(gradient);
    }
    Object.freeze(input);
    const expected = [
      {
        type: 'conic-gradient',
        from: 90,
        position: {right: 10, bottom: 20},
        colorStops: [
          {color: red, position: '0%'},
          {color: red, position: '25%'},
          {color: blue, position: null},
        ],
      },
    ];
    expect(processBackgroundImage(input)).toEqual(expected);
    expect(processBackgroundImage(input)).toEqual(expected);
    expect(input).toEqual([
      {
        type: 'conic-gradient',
        from: '.25turn',
        position: {right: 10, bottom: 20},
        colorStops: [
          {color: 'red', positions: ['0deg', '90deg']},
          {color: 'blue'},
        ],
      },
    ]);
    expect(input[0].colorStops[0].positions).toEqual(['0deg', '90deg']);
  });
});
