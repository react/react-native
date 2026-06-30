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

const Dimensions = require('./Dimensions').default;

/**
 * Provides access to the device's pixel density and font scale.
 *
 * ## Fetching a correctly sized image
 *
 * You should get a higher resolution image if you are on a high pixel density
 * device. A good rule of thumb is to multiply the size of the image you display
 * by the pixel ratio.
 *
 * Example:
 *
 * ```tsx
 * var image = getImage({
 *   width: PixelRatio.getPixelSizeForLayoutSize(200),
 *   height: PixelRatio.getPixelSizeForLayoutSize(100),
 * });
 * <Image source={image} style={{width: 200, height: 100}} />
 * ```
 *
 * ## Pixel grid snapping
 *
 * In iOS, you can specify positions and dimensions for elements with arbitrary
 * precision, for example 29.674825. But, ultimately the physical display only
 * have a fixed number of pixels, for example 640×960 for iPhone 4 or 750×1334
 * for iPhone 6. iOS tries to be as faithful as possible to the user value by
 * spreading one original pixel into multiple ones to trick the eye. The
 * downside of this technique is that it makes the resulting element look
 * blurry.
 *
 * In practice, we found out that developers do not want this feature and they
 * have to work around it by doing manual rounding in order to avoid having
 * blurry elements. In React Native, we are rounding all the pixels
 * automatically.
 *
 * We have to be careful when to do this rounding. You never want to work with
 * rounded and unrounded values at the same time as you're going to accumulate
 * rounding errors. Having even one rounding error is deadly because a one
 * pixel border may vanish or be twice as big.
 *
 * In React Native, everything in JavaScript and within the layout engine works
 * with arbitrary precision numbers. It's only when we set the position and
 * dimensions of the native element on the main thread that we round. Also,
 * rounding is done relative to the root rather than the parent, again to avoid
 * accumulating rounding errors.
 *
 * @see https://reactnative.dev/docs/pixelratio
 */
class PixelRatio {
  /**
   * Returns the device pixel density. Some examples:
   *
   *   - PixelRatio.get() === 1
   *     - mdpi Android devices (160 dpi)
   *   - PixelRatio.get() === 1.5
   *     - hdpi Android devices (240 dpi)
   *   - PixelRatio.get() === 2
   *     - iPhone 4, 4S
   *     - iPhone 5, 5c, 5s
   *     - iPhone 6
   *     - iPhone 7
   *     - iPhone 8
   *     - iPhone SE
   *     - xhdpi Android devices (320 dpi)
   *   - PixelRatio.get() === 3
   *     - iPhone 6 Plus
   *     - iPhone 7 Plus
   *     - iPhone 8 Plus
   *     - iPhone X
   *     - xxhdpi Android devices (480 dpi)
   *   - PixelRatio.get() === 3.5
   *     - Nexus 6
   */
  static get(): number {
    return Dimensions.get('window').scale;
  }

  /**
   * Returns the scaling factor for font sizes. This is the ratio that is used to calculate the
   * absolute font size, so any elements that heavily depend on that should use this to do
   * calculations.
   *
   * If a font scale is not set, this returns the device pixel ratio.
   *
   * This reflects the user preference set in:
   *  - Settings > Display > Font size on Android,
   *  - Settings > Display & Brightness > Text Size on iOS.
   */
  static getFontScale(): number {
    return Dimensions.get('window').fontScale || PixelRatio.get();
  }

  /**
   * Converts a layout size (dp) to pixel size (px).
   *
   * Guaranteed to return an integer number.
   */
  static getPixelSizeForLayoutSize(layoutSize: number): number {
    return Math.round(layoutSize * PixelRatio.get());
  }

  /**
   * Rounds a layout size (dp) to the nearest layout size that corresponds to
   * an integer number of pixels. For example, on a device with a PixelRatio
   * of 3, `PixelRatio.roundToNearestPixel(8.4) = 8.33`, which corresponds to
   * exactly (8.33 * 3) = 25 pixels.
   */
  static roundToNearestPixel(layoutSize: number): number {
    const ratio = PixelRatio.get();
    return Math.round(layoutSize * ratio) / ratio;
  }

  // No-op for iOS, but used on the web. Should not be documented.
  static startDetecting() {}
}

export default PixelRatio;
