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
    isRTL: boolean;
    doLeftAndRightSwapInRTL: boolean;
    localeIdentifier?: string | null | undefined;
  };
  allowRTL: (allowRTL: boolean) => void;
  forceRTL: (forceRTL: boolean) => void;
  swapLeftAndRightInRTL: (swapLeftAndRight: boolean) => void;
  isRTL: boolean;
  doLeftAndRightSwapInRTL: boolean;
}

/** https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps */
export const I18nManager: I18nManagerStatic;
export type I18nManager = I18nManagerStatic;
