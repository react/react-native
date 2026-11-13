/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const PixelRatio = {
  get: jest.fn().mockReturnValue(2) as () => number,
  getFontScale: jest.fn(() => PixelRatio.get()) as () => number,
  getPixelSizeForLayoutSize: jest.fn(layoutSize =>
    Math.round(layoutSize * PixelRatio.get()),
  ) as (v: number) => number,
  roundToNearestPixel: jest.fn(layoutSize => {
    const ratio = PixelRatio.get();
    return Math.round(layoutSize * ratio) / ratio;
  }) as (v: number) => number,
  startDetecting: jest.fn() as () => void,
};

export default PixelRatio;
