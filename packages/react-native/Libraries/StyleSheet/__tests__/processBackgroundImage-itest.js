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

const {OS} = require('../../Utilities/Platform').default;
const PlatformColorAndroid =
  // $FlowFixMe[missing-platform-support]
  require('../PlatformColorValueTypes.android').PlatformColor;
const PlatformColorIOS =
  // $FlowFixMe[missing-platform-support]
  require('../PlatformColorValueTypes.ios').PlatformColor;
const DynamicColorIOS =
  // $FlowFixMe[missing-platform-support]
  require('../PlatformColorValueTypesIOS.ios').DynamicColorIOS;
const processColor = require('../processColor').default;

describe('processBackgroundImage', () => {
  it('should process a simple linear gradient string', () => {
    const input = 'linear-gradient(to right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linear-gradient' as const,
        direction: {type: 'angle', value: 90},
        colorStops: [
          {color: processColor('red'), position: null},
          {color: processColor('blue'), position: null},
        ],
      },
    ]);
  });

  it('should process a diagonal linear gradient', () => {
    const input = 'linear-gradient(to bottom right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linear-gradient' as const,
        direction: {type: 'keyword', value: 'to bottom right'},
        colorStops: [
          {color: processColor('red'), position: null},
          {color: processColor('blue'), position: null},
        ],
      },
    ]);
  });

  it('should return empty array for null values', () => {
    let result = processBackgroundImage('');
    expect(result).toEqual([]);
    result = processBackgroundImage(null);
    expect(result).toEqual([]);
    result = processBackgroundImage(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid values', () => {
    let result = processBackgroundImage('linear-');
    expect(result).toEqual([]);
  });

  it('should process a linear gradient with whitespaces in direction keyword', () => {
    const input = 'linear-gradient(to   bottom   right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linear-gradient' as const,
        direction: {type: 'keyword', value: 'to bottom right'},
        colorStops: [
          {color: processColor('red'), position: null},
          {color: processColor('blue'), position: null},
        ],
      },
    ]);
  });

  it('should process a linear gradient with random whitespaces', () => {
    const input =
      ' linear-gradient(to   bottom   right,  red  30%,  blue  80%) ';
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linear-gradient' as const,
        direction: {type: 'keyword', value: 'to bottom right'},
        colorStops: [
          {color: processColor('red'), position: '30%'},
          {color: processColor('blue'), position: '80%'},
        ],
      },
    ]);
  });

  it('should process a linear gradient with angle', () => {
    const input = 'linear-gradient(45deg, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linear-gradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 45});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
  });

  it('should process a linear gradient with case-insensitive angle', () => {
    const input = 'linear-gradient(45Deg, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linear-gradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 45});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
  });

  it('should process a linear gradient object style with case-insensitive direction keyword', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        direction: 'To Bottom',
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linear-gradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 180});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
  });

  it('should process a linear gradient object style with case-insensitive angle', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        direction: '45DEG',
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linear-gradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 45});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
  });

  it('linear gradient case-insensitive string', () => {
    const input = 'LiNeAr-GradieNt(To Bottom, Red, Blue)';
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linear-gradient');
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 180,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
  });

  it('should process a linear gradient with case-insensitive direction enum', () => {
    const input = 'linear-gradient(tO Right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 90,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
  });

  it('should process a linear gradient with case-insensitive colors', () => {
    const input =
      'linear-gradient(TO LEFT, Rgba(0, 0, 0, 0.5), Blue, Hsla(0, 100%, 50%, 0.5))';
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 270,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('rgba(0, 0, 0, 0.5)'), position: null},
      {color: processColor('blue'), position: null},
      {color: processColor('hsla(0, 100%, 50%, 0.5)'), position: null},
    ]);
  });

  it('should process multiple linear gradients', () => {
    const input = `
      linear-gradient(to top, red, blue),
      linear-gradient(to bottom, green, yellow)`;
    const result = processBackgroundImage(input);
    expect(result).toHaveLength(2);
    expect(result[0].type).toEqual('linear-gradient');
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 0,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
    expect(result[1].type).toEqual('linear-gradient');
    expect(result[1].direction).toEqual({
      type: 'angle',
      value: 180,
    });

    expect(result[1].colorStops).toEqual([
      {color: processColor('green'), position: null},
      {color: processColor('yellow'), position: null},
    ]);
  });

  it('should process multiple linear gradients with newlines', () => {
    const input = `
      linear-gradient(to left, red, blue),\n
      linear-gradient(to bottom, green, yellow)`;
    const result = processBackgroundImage(input);
    expect(result).toHaveLength(2);
    expect(result[0].type).toEqual('linear-gradient');
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 270,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
    expect(result[1].type).toEqual('linear-gradient');
    expect(result[1].direction).toEqual({
      type: 'angle',
      value: 180,
    });

    expect(result[1].colorStops).toEqual([
      {color: processColor('green'), position: null},
      {color: processColor('yellow'), position: null},
    ]);
  });

  it('should process a linear gradient with multiple color stops', () => {
    const input = 'linear-gradient(to bottom, red 0%, green 50%, blue 100%)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '0%'},
      {color: processColor('green'), position: '50%'},
      {color: processColor('blue'), position: '100%'},
    ]);
  });

  it('should add color stop postion if position is not specified', () => {
    const input =
      'linear-gradient(to right, red, green, blue 60%, yellow, purple)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('green'), position: null},
      {color: processColor('blue'), position: '60%'},
      {color: processColor('yellow'), position: null},
      {color: processColor('purple'), position: null},
    ]);
  });

  it('should process a linear gradient with rgba colors', () => {
    const input =
      'linear-gradient(to right, rgba(255,0,0,0.5), rgba(0,0,255,0.8))';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('rgba(255,0,0,0.5)'), position: null},
      {color: processColor('rgba(0,0,255,0.8)'), position: null},
    ]);
  });

  it('should process a linear gradient with hsl colors', () => {
    const input = `linear-gradient(hsl(330, 100%, 45.1%), hsl(0, 100%, 50%))`;
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('hsl(330, 100%, 45.1%)'), position: null},
      {color: processColor('hsl(0, 100%, 50%)'), position: null},
    ]);
  });

  it('should process a linear gradient without direction', () => {
    const input = 'linear-gradient(#e66465, #9198e5)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('#e66465'), position: null},
      {color: processColor('#9198e5'), position: null},
    ]);
  });

  it('should process multiple gradients with spaces', () => {
    const input = `linear-gradient(to right ,
    rgba(255,0,0,0.5), rgba(0,0,255,0.8)),
              linear-gradient(to bottom , rgba(255,0,0,0.9)  , rgba(0,0,255,0.2)  )`;
    const result = processBackgroundImage(input);
    expect(result).toHaveLength(2);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 90,
    });
    expect(result[1].direction).toEqual({
      type: 'angle',
      value: 180,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('rgba(255,0,0,0.5)'), position: null},
      {color: processColor('rgba(0,0,255,0.8)'), position: null},
    ]);
    expect(result[1].colorStops).toEqual([
      {color: processColor('rgba(255,0,0,0.9)'), position: null},
      {color: processColor('rgba(0,0,255,0.2)'), position: null},
    ]);
  });

  it('should return empty array for invalid color in linear gradient', () => {
    const input = 'linear-gradient(45deg, rede, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid angle in linear gradient', () => {
    const input = 'linear-gradient(45 deg, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid direction enum in linear gradient', () => {
    const input = 'linear-gradient(to left2, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid color stop unit', () => {
    const input = 'linear-gradient(to left, red 5, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
  });

  it('should process an array of style objects', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        direction: 'to bottom right',
        colorStops: [
          {color: 'red', positions: ['0%']},
          {color: 'blue', positions: ['100%']},
        ],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linear-gradient' as const,
        direction: {type: 'keyword', value: 'to bottom right'},
        colorStops: [
          {color: processColor('red'), position: '0%'},
          {color: processColor('blue'), position: '100%'},
        ],
      },
    ]);
  });

  it('should process an style object with default direction', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 180,
    });
  });

  it('should process style object with direction enum', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        direction: 'to right',
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 90,
    });
  });

  it('should process style object with direction angle', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        direction: '45deg',
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 45,
    });
  });

  it('should fix up stop positions #1', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        colorStops: [
          {color: 'red', positions: ['40%']},
          {color: 'blue'},
          {color: 'green'},
          {color: 'purple'},
        ],
      },
    ];
    const output = [
      {
        color: processColor('red'),
        position: '40%',
      },
      {
        color: processColor('blue'),
        position: null,
      },
      {
        color: processColor('green'),
        position: null,
      },
      {
        color: processColor('purple'),
        position: null,
      },
    ];
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(
      `linear-gradient(red 40%, blue, green, purple)`,
    );
    expect(result[0].colorStops).toEqual(output);
    expect(result1[0].colorStops).toEqual(output);
  });

  it('should process multiple stop positions', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        colorStops: [
          {color: 'red', positions: ['40%', '80%']},
          {color: 'blue'},
          {color: 'green'},
        ],
      },
    ];
    const result = processBackgroundImage(input);
    const result2 = processBackgroundImage(
      `linear-gradient(red 40%  80%, blue, green)`,
    );
    const output = [
      {
        color: processColor('red'),
        position: '40%',
      },
      {
        color: processColor('red'),
        position: '80%',
      },
      {
        color: processColor('blue'),
        position: null,
      },
      {
        color: processColor('green'),
        position: null,
      },
    ];
    expect(result[0].colorStops).toEqual(output);
    expect(result2[0].colorStops).toEqual(output);
  });

  it('should fix up stop positions #2', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        colorStops: [
          {color: 'red'},
          {color: 'blue', positions: ['20%']},
          {color: 'green'},
        ],
      },
    ];
    const output = [
      {
        color: processColor('red'),
        position: null,
      },
      {
        color: processColor('blue'),
        position: '20%',
      },
      {
        color: processColor('green'),
        position: null,
      },
    ];
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(
      `linear-gradient(red , blue  20%, green)`,
    );
    expect(result[0].colorStops).toEqual(output);
    expect(result1[0].colorStops).toEqual(output);
  });

  it('should fix up stop positions #3', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        colorStops: [
          {color: 'red', positions: ['-50%']},
          {color: 'blue'},
          {color: 'green'},
        ],
      },
    ];
    const output = [
      {
        color: processColor('red'),
        position: '-50%',
      },
      {
        color: processColor('blue'),
        position: null,
      },
      {
        color: processColor('green'),
        position: null,
      },
    ];
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(
      `linear-gradient(red -50%, blue, green)`,
    );
    expect(result[0].colorStops).toEqual(output);
    expect(result1[0].colorStops).toEqual(output);
  });

  it('should fix up stop positions #4', () => {
    const input: ReadonlyArray<BackgroundImageValue> | string = [
      {
        type: 'linear-gradient' as const,
        colorStops: [
          {color: 'red'},
          {color: 'blue', positions: ['-50%']},
          {color: 'green', positions: ['150%']},
          {color: 'yellow'},
        ],
      },
    ];
    const output = [
      {
        color: processColor('red'),
        position: null,
      },
      {
        color: processColor('blue'),
        position: '-50%',
      },
      {
        color: processColor('green'),
        position: '150%',
      },
      {
        color: processColor('yellow'),
        position: null,
      },
    ];
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(
      `linear-gradient(red, blue -50%, green 150%, yellow)`,
    );
    expect(result[0].colorStops).toEqual(output);
    expect(result1[0].colorStops).toEqual(output);
  });

  it('should fix up stop positions #5', () => {
    const result = processBackgroundImage(
      'linear-gradient(red 40%  20%, blue 90%  120% , green)',
    );
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '40%'},
      {color: processColor('red'), position: '20%'},
      {color: processColor('blue'), position: '90%'},
      {color: processColor('blue'), position: '120%'},
      {color: processColor('green'), position: null},
    ]);
  });

  it('should fix up stop positions #6', () => {
    const result = processBackgroundImage(
      'linear-gradient(red 40%  20%, blue 90%  120% , green 200% 300%)',
    );
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '40%'},
      {color: processColor('red'), position: '20%'},
      {color: processColor('blue'), position: '90%'},
      {color: processColor('blue'), position: '120%'},
      {color: processColor('green'), position: '200%'},
      {color: processColor('green'), position: '300%'},
    ]);
  });

  it('should return empty array for invalid multiple stop positions', () => {
    const result = processBackgroundImage([
      {
        type: 'linear-gradient' as const,
        colorStops: [
          {color: 'red', positions: ['40%  20']},
          {color: 'blue', positions: ['90%  120%']},
          {color: 'green', positions: ['200% 300%']},
        ],
      },
    ]);
    const result1 = processBackgroundImage(
      'linear-gradient(red 40%  20, blue 90%  120% , green 200% 300%)',
    );
    expect(result).toEqual([]);
    expect(result1).toEqual([]);
  });

  describe('iOS', () => {
    if (OS === 'ios') {
      it('should process iOS PlatformColor colors', () => {
        const result = processBackgroundImage([
          {
            type: 'linear-gradient' as const,
            colorStops: [
              {color: PlatformColorIOS('systemRedColor'), positions: ['0%']},
              {color: 'red', positions: ['100%']},
            ],
          },
        ]);
        expect(result[0].colorStops[0].color).toEqual({
          semantic: ['systemRedColor'],
        });
      });
      it('should process iOS Dynamic colors', () => {
        const result = processBackgroundImage([
          {
            type: 'linear-gradient' as const,
            colorStops: [
              {
                color: DynamicColorIOS({light: 'black', dark: 'white'}),
                positions: ['0%'],
              },
              {color: 'red', positions: ['100%']},
            ],
          },
        ]);
        expect(result[0].colorStops[0].color).toEqual({
          dynamic: {light: 0xff000000, dark: 0xffffffff},
        });
      });
    }
  });

  describe('Android', () => {
    if (OS === 'android') {
      it('should process Android PlatformColor colors', () => {
        const result = processBackgroundImage([
          {
            type: 'linear-gradient' as const,
            colorStops: [
              {
                color: PlatformColorAndroid('?attr/colorPrimary'),
                positions: ['0%'],
              },
              {color: 'red', positions: ['100%']},
            ],
          },
        ]);
        expect(result[0].colorStops[0].color).toEqual({
          resource_paths: ['?attr/colorPrimary'],
        });
      });
    }
  });

  it('should process color transition hint in object style', () => {
    const input = [
      {
        type: 'linear-gradient' as const,
        direction: 'To Bottom',
        colorStops: [{color: 'red'}, {positions: ['20%']}, {color: 'blue'}],
      },
    ];
    // $FlowFixMe[incompatible-type] - `positions` is missing types.
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linear-gradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 180});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: null, position: '20%'},
      {color: processColor('blue'), position: null},
    ]);
  });

  it('should process color transition hint', () => {
    const input = 'linear-gradient(red, 40%, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linear-gradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 180});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: null, position: '40%'},
      {color: processColor('blue'), position: null},
    ]);
  });

  it('should return empty array for invalid transition hints', () => {
    let result = processBackgroundImage('linear-gradient(red, 40, blue)');
    expect(result).toEqual([]);

    // Multiple hints in a row
    result = processBackgroundImage('linear-gradient(red, 20%, 40%, blue)');
    expect(result).toEqual([]);

    // Invalid object syntax
    // $FlowFixMe[incompatible-type] - `positions` is missing types.
    result = processBackgroundImage([
      {
        type: 'linear-gradient' as const,
        colorStops: [{color: 'red'}, {positions: ['40']}, {color: 'blue'}],
      },
    ]);
    expect(result).toEqual([]);
  });

  it('should process complex gradients with multiple transitioon hints', () => {
    const input = 'linear-gradient(red, 20%, blue, 60%, green, 80%, yellow)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: null, position: '20%'},
      {color: processColor('blue'), position: null},
      {color: null, position: '60%'},
      {color: processColor('green'), position: null},
      {color: null, position: '80%'},
      {color: processColor('yellow'), position: null},
    ]);
  });

  it('should process object syntax with multiple hints', () => {
    const input = [
      {
        type: 'linear-gradient' as const,
        direction: 'to right',
        colorStops: [
          {color: 'red'},
          {positions: ['20%']},
          {color: 'blue'},
          {positions: ['60%']},
          {color: 'green'},
          {positions: ['80%']},
          {color: 'yellow'},
        ],
      },
    ];
    // $FlowFixMe[incompatible-type] - `positions` is missing types.
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: null, position: '20%'},
      {color: processColor('blue'), position: null},
      {color: null, position: '60%'},
      {color: processColor('green'), position: null},
      {color: null, position: '80%'},
      {color: processColor('yellow'), position: null},
    ]);
  });

  it('should process hints with explicit color stops', () => {
    const input = 'linear-gradient(red 0%, 25%, blue 50%, 75%, green 100%)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '0%'},
      {color: null, position: '25%'},
      {color: processColor('blue'), position: '50%'},
      {color: null, position: '75%'},
      {color: processColor('green'), position: '100%'},
    ]);
  });

  it('should handle very complex gradients', () => {
    const input = `linear-gradient(
      red 0%,
      20% ,
      blue 30%,
      45%,
      green 50%,
      65%,
      yellow 70%  ,
      85%,
      purple 100%
    )`;
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '0%'},
      {color: null, position: '20%'},
      {color: processColor('blue'), position: '30%'},
      {color: null, position: '45%'},
      {color: processColor('green'), position: '50%'},
      {color: null, position: '65%'},
      {color: processColor('yellow'), position: '70%'},
      {color: null, position: '85%'},
      {color: processColor('purple'), position: '100%'},
    ]);
  });

  it('should handle multiple gradients with hints', () => {
    const input = `
      linear-gradient(red, 30%, blue),
      linear-gradient(to right, green, 60%, yellow)
    `;
    const result = processBackgroundImage(input);
    expect(result).toHaveLength(2);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: null, position: '30%'},
      {color: processColor('blue'), position: null},
    ]);
    expect(result[1].colorStops).toEqual([
      {color: processColor('green'), position: null},
      {color: null, position: '60%'},
      {color: processColor('yellow'), position: null},
    ]);
  });

  it('should handle invalid transition hint', () => {
    const input = `
      linear-gradient(red, 30%, blue, 60%, green, 80%)
    `;
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
    const input1 = `
    linear-gradient(red, 30%, 60%, green)
  `;
    const result1 = processBackgroundImage(input1);
    expect(result1).toEqual([]);

    const input2 = `
    linear-gradient(20%, red, green)
  `;
    const result2 = processBackgroundImage(input2);
    expect(result2).toEqual([]);
  });

  it('should process gradient with % and px color stop positions', () => {
    const input = 'linear-gradient(red 10%, 20px, blue 30%, purple 40px)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '10%'},
      {color: null, position: 20},
      {color: processColor('blue'), position: '30%'},
      {color: processColor('purple'), position: 40},
    ]);

    const input1 = [
      {
        type: 'linear-gradient' as const,
        colorStops: [
          {color: 'red', positions: ['10%', 20]},
          {color: 'blue', positions: ['30%', 40]},
        ],
      },
    ];
    // $FlowFixMe[incompatible-type] - `positions` is missing types.
    const result1 = processBackgroundImage(input1);
    expect(result1[0].colorStops).toEqual([
      {color: processColor('red'), position: '10%'},
      {color: processColor('red'), position: 20},
      {color: processColor('blue'), position: '30%'},
      {color: processColor('blue'), position: 40},
    ]);
  });

  it('should process radial gradient object syntax', () => {
    const input = [
      {
        type: 'radial-gradient' as const,
        shape: 'circle',
        colorStops: [
          {color: 'red', positions: ['10%', 20]},
          {color: 'blue', positions: ['30%', 40]},
        ],
        position: {top: '50%', left: '50%'},
        size: 'closest-side',
      },
      {
        type: 'radial-gradient' as const,
        shape: 'circle',
        colorStops: [
          {color: 'red', positions: ['10%', 20]},
          {color: 'blue', positions: ['30%', 40]},
        ],
        position: {top: '50%', left: 50},
        size: {
          x: 100,
          y: 100,
        },
      },
    ];
    // $FlowFixMe[incompatible-type] - `positions` is missing types.
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '10%'},
      {color: processColor('red'), position: 20},
      {color: processColor('blue'), position: '30%'},
      {color: processColor('blue'), position: 40},
    ]);
    expect(result[0].position).toEqual({top: '50%', left: '50%'});
    expect(result[0].size).toEqual('closest-side');
    expect(result[0].shape).toEqual('circle');
    expect(result[0].type).toEqual('radial-gradient');

    expect(result[1].size).toEqual({
      x: 100,
      y: 100,
    });
  });

  it('should process radial gradient without shape, size and position', () => {
    const input = 'radial-gradient(red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
    expect(result[0].position).toEqual({top: '50%', left: '50%'});
    expect(result[0].size).toEqual('farthest-corner');
    expect(result[0].shape).toEqual('ellipse');
    expect(result[0].type).toEqual('radial-gradient');
  });

  it('should process radial gradient with shape circle', () => {
    const input = 'radial-gradient(circle, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
    expect(result[0].position).toEqual({top: '50%', left: '50%'});
    expect(result[0].size).toEqual('farthest-corner');
    expect(result[0].shape).toEqual('circle');
    expect(result[0].type).toEqual('radial-gradient');
  });

  it('should infer radial gradient circle shape from single length', () => {
    const input = 'radial-gradient(100px, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].size).toEqual({x: 100, y: 100});
    expect(result[0].shape).toEqual('circle');
  });

  it('should infer radial gradient ellipse shape from double length', () => {
    const input = 'radial-gradient(100px 50px, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].size).toEqual({x: 100, y: 50});
    expect(result[0].shape).toEqual('ellipse');
  });

  it('should handle radial gradient with explicit shape with size', () => {
    const input = 'radial-gradient(circle 100px at center, red, blue 80%)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: '80%'},
    ]);
    expect(result[0].position).toEqual({top: '50%', left: '50%'});
    expect(result[0].size).toEqual({x: 100, y: 100});
    expect(result[0].shape).toEqual('circle');
    expect(result[0].type).toEqual('radial-gradient');
  });

  // 1. position syntax: [ left | center | right | top | bottom | <length-percentage> ]
  it('should handle radial gradient position length syntax', () => {
    const input = 'radial-gradient(circle at 20px, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].position).toEqual({left: 20, top: '50%'});
  });

  // 2. position syntax: [ left | center | right ] && [ top | center | bottom ]
  it('should handle radial gradient position keywords syntax', () => {
    const input = 'radial-gradient(circle at left top, red, blue)';
    const input1 = 'radial-gradient(circle at top left, red, blue)';
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(input1);
    expect(result[0].position).toEqual({left: '0%', top: '0%'});
    expect(result1[0].position).toEqual({left: '0%', top: '0%'});
  });

  // 3. position syntax: [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]
  it('should handle left position top position syntax', () => {
    const input = 'radial-gradient(circle at left 20px, red, blue)';
    const input1 = 'radial-gradient(circle at 20px 20px, red, blue)';
    const input2 = 'radial-gradient(circle at right 50px, red, blue)';
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(input1);
    const result2 = processBackgroundImage(input2);
    expect(result[0].position).toEqual({left: '0%', top: 20});
    expect(result1[0].position).toEqual({left: 20, top: 20});
    expect(result2[0].position).toEqual({left: '100%', top: 50});
  });

  // 4. position syntax: [ [ left | right ] <length-percentage> ] && [ [ top | bottom ] <length-percentage> ]
  it('should handle position with separate left and top percentages', () => {
    const input = 'radial-gradient(at top 0% right 10%, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].position).toEqual({right: '10%', top: '0%'});
  });

  it('should handle color stops with transition hints in radial gradients', () => {
    const input =
      'radial-gradient(circle, red 0%, 25%, blue 50%, 75%, green 100%)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '0%'},
      {color: null, position: '25%'},
      {color: processColor('blue'), position: '50%'},
      {color: null, position: '75%'},
      {color: processColor('green'), position: '100%'},
    ]);
    expect(result[0].shape).toEqual('circle');
    expect(result[0].type).toEqual('radial-gradient');
  });

  it('should process multiple gradients with both radial and linear', () => {
    const input = `
      radial-gradient(circle at top left, red, blue),
      linear-gradient(to bottom, green, yellow)
    `;
    const result = processBackgroundImage(input);
    expect(result).toHaveLength(2);
    expect(result[0].type).toEqual('radial-gradient');
    expect(result[0].shape).toEqual('circle');
    expect(result[0].position).toEqual({top: '0%', left: '0%'});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
    expect(result[1].type).toEqual('linear-gradient');
    expect(result[1].direction).toEqual({
      type: 'angle',
      value: 180,
    });
    expect(result[1].colorStops).toEqual([
      {color: processColor('green'), position: null},
      {color: processColor('yellow'), position: null},
    ]);
  });

  it('should handle mixed case in radial gradient syntax', () => {
    const input = 'RaDiAl-GrAdIeNt(CiRcLe ClOsEsT-sIdE aT cEnTeR, rEd, bLuE)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: null},
      {color: processColor('blue'), position: null},
    ]);
    expect(result[0].position).toEqual({top: '50%', left: '50%'});
    expect(result[0].size).toEqual('closest-side');
    expect(result[0].shape).toEqual('circle');
    expect(result[0].type).toEqual('radial-gradient');
  });

  it('should handle whitespace variations in radial gradients', () => {
    const input =
      'radial-gradient(   circle    farthest-corner    at    25%    75%   ,   red   0%   ,   blue    100%   )';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '0%'},
      {color: processColor('blue'), position: '100%'},
    ]);
    expect(result[0].position).toEqual({left: '25%', top: '75%'});
    expect(result[0].size).toEqual('farthest-corner');
    expect(result[0].shape).toEqual('circle');
    expect(result[0].type).toEqual('radial-gradient');
  });

  it('should handle position keywords in different orders', () => {
    const input1 = 'radial-gradient(circle at top left, red, blue)';
    const input2 = 'radial-gradient(circle at left top, red, blue)';
    const result1 = processBackgroundImage(input1);
    const result2 = processBackgroundImage(input2);

    expect(result1[0].position).toEqual({top: '0%', left: '0%'});
    expect(result2[0].position).toEqual({top: '0%', left: '0%'});
  });

  it('should handle invalid radial gradient syntax', () => {
    const input = 'radial-gradient(circle at top leftt, red, blue, green)';
    const input1 = 'radial-gradient(circle at, red, blue, green)';
    const input2 = 'radial-gradient(ellipse 100px, red, blue, green)';
    const input3 =
      'radial-gradient(ellipse at top 20% top 50%, red, blue, green)';
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(input1);
    const result2 = processBackgroundImage(input2);
    const result3 = processBackgroundImage(input3);
    expect(result).toEqual([]);
    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
    expect(result3).toEqual([]);
  });

  it('should handle multiple color stops with radial gradient syntax', () => {
    const input = 'radial-gradient(red 0%, yellow 30%, green 60%, blue 100%)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: '0%'},
      {color: processColor('yellow'), position: '30%'},
      {color: processColor('green'), position: '60%'},
      {color: processColor('blue'), position: '100%'},
    ]);
  });

  it('should not process invalid gradient syntax', () => {
    const input =
      'aoeusntial-gradient(red 0%, yellow 30%, green 60%, blue 100%)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
  });

  it('should not process negative radius in radial gradient syntax', () => {
    const input1 = 'radial-gradient(circle -100px, red, blue)';
    const input2 = 'radial-gradient(ellipse 100px -40px, red, blue)';
    const result1 = processBackgroundImage(input1);
    const result2 = processBackgroundImage(input2);
    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
  });
});
