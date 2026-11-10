/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import warnOnce from '../Utilities/warnOnce';
import NativeI18nManager from './NativeI18nManager';

type I18nManagerConstants = {
  /**
   * @deprecated Has no effect, and is always `false`. Use `start` and `end`
   * style properties, such as `marginStart`, instead.
   */
  doLeftAndRightSwapInRTL: boolean,
  isRTL: boolean,
  localeIdentifier: string,
};

let i18nConstants: I18nManagerConstants = {
  doLeftAndRightSwapInRTL: false,
  isRTL: false,
  localeIdentifier: 'en-US',
  ...NativeI18nManager?.getConstants(),
};

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
   * @deprecated Has no effect. Set `RCTSupportsRTL` to `true` in Info.plist on
   * iOS, or `android:supportsRtl="true"` in AndroidManifest.xml on Android,
   * instead.
   */
  allowRTL: (shouldAllow: boolean): void => {
    warnOnce(
      'I18nManager.allowRTL',
      'I18nManager.allowRTL() is deprecated and has no effect. Set ' +
        '`RCTSupportsRTL` to `true` in Info.plist on iOS, or ' +
        '`android:supportsRtl="true"` in AndroidManifest.xml on Android, ' +
        'instead.',
    );
  },

  /**
   * Forces the app into RTL layout mode, regardless of the device locale.
   */
  forceRTL: (shouldForce: boolean): void => {
    if (NativeI18nManager != null) {
      const isRTL = NativeI18nManager.forceRTL(shouldForce);
      i18nConstants = {...i18nConstants, isRTL};
    }
  },

  /**
   * @deprecated Has no effect. Use `start` and `end` style properties, such as
   * `marginStart`, instead.
   */
  swapLeftAndRightInRTL: (flipStyles: boolean): void => {
    warnOnce(
      'I18nManager.swapLeftAndRightInRTL',
      'I18nManager.swapLeftAndRightInRTL() is deprecated and has no effect. ' +
        'Use `start` and `end` style properties, such as `marginStart`, ' +
        'instead.',
    );
  },

  /** Whether the current layout direction is Right-to-Left. */
  // $FlowFixMe[unsafe-getters-setters]
  get isRTL(): I18nManagerConstants['isRTL'] {
    return i18nConstants.isRTL;
  },

  /**
   * @deprecated Has no effect, and is always `false`. Use `start` and `end`
   * style properties, such as `marginStart`, instead.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get doLeftAndRightSwapInRTL(): I18nManagerConstants['doLeftAndRightSwapInRTL'] {
    warnOnce(
      'I18nManager.doLeftAndRightSwapInRTL',
      'I18nManager.doLeftAndRightSwapInRTL is deprecated and has no effect, it ' +
        'is always false. Use `start` and `end` style properties, such as ' +
        '`marginStart`, instead.',
    );
    return false;
  },
};
