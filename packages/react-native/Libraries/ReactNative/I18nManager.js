/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {I18nManagerConstants} from './NativeI18nManager';

import NativeI18nManager from './NativeI18nManager';

const i18nConstants: I18nManagerConstants = getI18nManagerConstants();

function getI18nManagerConstants(): I18nManagerConstants {
  if (NativeI18nManager) {
    const {isRTL, doLeftAndRightSwapInRTL, localeIdentifier} =
      NativeI18nManager.getConstants();
    return {isRTL, doLeftAndRightSwapInRTL, localeIdentifier};
  }

  return {
    isRTL: false,
    doLeftAndRightSwapInRTL: true,
  };
}

/**
 * Utilities for managing Right-to-Left (RTL) layout support.
 *
 * @see https://reactnative.dev/docs/i18nmanager
 */
export default {
  getConstants: (): I18nManagerConstants => {
    return i18nConstants;
  },

  /**
   * Allows the app to opt in to RTL layout behavior. Should be called early
   * in app startup. Takes effect on the next app reload.
   */
  allowRTL: (shouldAllow: boolean) => {
    if (!NativeI18nManager) {
      return;
    }

    NativeI18nManager.allowRTL(shouldAllow);
  },

  /**
   * Forces the app into RTL layout mode, regardless of the device locale.
   * Takes effect on the next app reload.
   */
  forceRTL: (shouldForce: boolean) => {
    if (!NativeI18nManager) {
      return;
    }

    NativeI18nManager.forceRTL(shouldForce);
  },

  /**
   * Controls whether `left`/`right` style properties are automatically swapped
   * in RTL layouts. When enabled, `left` becomes `right` and vice versa.
   */
  swapLeftAndRightInRTL: (flipStyles: boolean) => {
    if (!NativeI18nManager) {
      return;
    }

    NativeI18nManager.swapLeftAndRightInRTL(flipStyles);
  },

  /** Whether the current layout direction is Right-to-Left. */
  isRTL: i18nConstants.isRTL as I18nManagerConstants['isRTL'],

  /** Whether left and right style properties are swapped in RTL mode. */
  doLeftAndRightSwapInRTL:
    i18nConstants.doLeftAndRightSwapInRTL as I18nManagerConstants['doLeftAndRightSwapInRTL'],
};
