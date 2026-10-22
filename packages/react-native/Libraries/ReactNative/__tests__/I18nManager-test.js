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

import type {I18nManagerConstants} from '../NativeI18nManager';

const nativeConstants: I18nManagerConstants = {
  isRTL: false,
  localeIdentifier: 'en-US',
};

const nativeModule = {
  getConstants: jest.fn(() => nativeConstants),
  forceRTL: jest.fn((forceRTL: boolean) => forceRTL),
};

jest.mock('../NativeI18nManager', () => ({
  __esModule: true,
  default: nativeModule,
}));

describe('I18nManager', () => {
  it('updates the constants when forceRTL returns', () => {
    const I18nManager = require('../I18nManager').default;

    I18nManager.forceRTL(true);

    expect(nativeModule.forceRTL).toHaveBeenCalledWith(true);
    expect(nativeModule.getConstants).toHaveBeenCalledTimes(1);
    expect(I18nManager.isRTL).toBe(true);

    expect(I18nManager.getConstants()).toEqual({
      doLeftAndRightSwapInRTL: false,
      isRTL: true,
      localeIdentifier: 'en-US',
    });
  });
});
