/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import Dimensions from '../Dimensions';

describe('Dimensions.getDisplayFeatures', () => {
  it('defaults to an empty array', () => {
    Dimensions.set({window: {width: 1, height: 1, scale: 1, fontScale: 1}});
    expect(Dimensions.getDisplayFeatures()).toEqual([]);
  });

  it('reports the display features passed to set()', () => {
    const displayFeatures = [
      {
        type: 'hinge',
        state: 'postureHalfOpened',
        bounds: {x: 0, y: 410, width: 820, height: 24},
      },
    ];
    Dimensions.set({
      window: {width: 820, height: 1180, scale: 3, fontScale: 1},
      displayFeatures,
    });
    expect(Dimensions.getDisplayFeatures()).toEqual(displayFeatures);
  });

  it('falls back to an empty array when a later update omits displayFeatures', () => {
    Dimensions.set({
      window: {width: 820, height: 1180, scale: 3, fontScale: 1},
      displayFeatures: [
        {
          type: 'cutout',
          state: 'unknown',
          bounds: {x: 0, y: 0, width: 40, height: 40},
        },
      ],
    });
    expect(Dimensions.getDisplayFeatures()).toHaveLength(1);

    Dimensions.set({window: {width: 390, height: 844, scale: 3, fontScale: 1}});
    expect(Dimensions.getDisplayFeatures()).toEqual([]);
  });
});
