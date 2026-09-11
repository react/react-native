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

jest.unmock('../Linking');

const mockNativeLinkingManager = {
  openSettings: jest.fn(() => Promise.resolve()),
  openNotificationSettings: jest.fn(() => Promise.resolve()),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

const mockNativeIntentAndroid = {
  openSettings: jest.fn(() => Promise.resolve()),
  openNotificationSettings: jest.fn(() => Promise.resolve()),
};

jest.mock('../NativeLinkingManager', () => ({
  __esModule: true,
  default: mockNativeLinkingManager,
}));

jest.mock('../NativeIntentAndroid', () => ({
  __esModule: true,
  default: mockNativeIntentAndroid,
}));

function requireLinkingForPlatform(os: 'ios' | 'android') {
  jest.resetModules();
  jest.doMock('../../Utilities/Platform', () => ({
    __esModule: true,
    default: {OS: os, select: (obj: {[string]: unknown}) => obj[os]},
  }));
  return require('../Linking').default;
}

describe('Linking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('openNotificationSettings', () => {
    it('calls NativeLinkingManager on iOS', async () => {
      const Linking = requireLinkingForPlatform('ios');
      await Linking.openNotificationSettings();
      expect(
        mockNativeLinkingManager.openNotificationSettings,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockNativeIntentAndroid.openNotificationSettings,
      ).not.toHaveBeenCalled();
    });

    it('calls NativeIntentAndroid on Android', async () => {
      const Linking = requireLinkingForPlatform('android');
      await Linking.openNotificationSettings();
      expect(
        mockNativeIntentAndroid.openNotificationSettings,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockNativeLinkingManager.openNotificationSettings,
      ).not.toHaveBeenCalled();
    });
  });

  describe('openSettings', () => {
    it('calls NativeLinkingManager on iOS', async () => {
      const Linking = requireLinkingForPlatform('ios');
      await Linking.openSettings();
      expect(mockNativeLinkingManager.openSettings).toHaveBeenCalledTimes(1);
      expect(mockNativeIntentAndroid.openSettings).not.toHaveBeenCalled();
    });

    it('calls NativeIntentAndroid on Android', async () => {
      const Linking = requireLinkingForPlatform('android');
      await Linking.openSettings();
      expect(mockNativeIntentAndroid.openSettings).toHaveBeenCalledTimes(1);
      expect(mockNativeLinkingManager.openSettings).not.toHaveBeenCalled();
    });
  });
});
