/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export interface PixelRatioStatic {
  /*
          Returns the device pixel density. Some examples:
              PixelRatio.get() === 1
              mdpi Android devices (160 dpi)
              PixelRatio.get() === 1.5
              hdpi Android devices (240 dpi)
              PixelRatio.get() === 2
              iPhone 4, 4S
              iPhone 5, 5c, 5s
              iPhone 6
              xhdpi Android devices (320 dpi)
              PixelRatio.get() === 3
              iPhone 6 plus
              xxhdpi Android devices (480 dpi)
              PixelRatio.get() === 3.5
              Nexus 6
      */
  get(): number;

  /*
          Returns the scaling factor for font sizes. This is the ratio that is
          used to calculate the absolute font size, so any elements that
          heavily depend on that should use this to do calculations.

          * on Android value reflects the user preference set in Settings > Display > Font size
          * on iOS value reflects the user preference set in Settings > Display & Brightness > Text Size,
            value can also be updated in Settings > Accessibility > Display & Text Size > Larger Text

          If a font scale is not set, this returns the device pixel ratio.
          */
  getFontScale(): number;

  /**
   * Converts a layout size (dp) to pixel size (px).
   * Guaranteed to return an integer number.
   */
  getPixelSizeForLayoutSize(layoutSize: number): number;

  /**
   * Rounds a layout size (dp) to the nearest layout size that
   * corresponds to an integer number of pixels. For example,
   * on a device with a PixelRatio of 3,
   * PixelRatio.roundToNearestPixel(8.4) = 8.33,
   * which corresponds to exactly (8.33 * 3) = 25 pixels.
   */
  roundToNearestPixel(layoutSize: number): number;

  /**
   * No-op for iOS, but used on the web. Should not be documented. [sic]
   */
  startDetecting(): void;
}

export const PixelRatio: PixelRatioStatic;
