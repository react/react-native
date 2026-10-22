/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export interface I18nManagerStatic {
  getConstants: () => {
    /**
     * @deprecated Has no effect, and is always `false`. Use `start` and `end`
     * style properties, such as `marginStart`, instead.
     */
    doLeftAndRightSwapInRTL: boolean;
    isRTL: boolean;
    localeIdentifier: string;
  };
  /**
   * @deprecated Has no effect. Set `RCTSupportsRTL` to `true` in Info.plist on
   * iOS, or `android:supportsRtl="true"` in AndroidManifest.xml on Android,
   * instead.
   */
  allowRTL: (allowRTL: boolean) => void;
  forceRTL: (forceRTL: boolean) => void;
  /**
   * @deprecated Has no effect. Use `start` and `end` style properties, such as
   * `marginStart`, instead.
   */
  swapLeftAndRightInRTL: (swapLeftAndRight: boolean) => void;
  isRTL: boolean;
  /**
   * @deprecated Has no effect, and is always `false`. Use `start` and `end`
   * style properties, such as `marginStart`, instead.
   */
  doLeftAndRightSwapInRTL: boolean;
}

/** https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps */
export const I18nManager: I18nManagerStatic;
export type I18nManager = I18nManagerStatic;
