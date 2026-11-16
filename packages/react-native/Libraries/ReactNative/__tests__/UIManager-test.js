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

import type {UIManagerJSInterface} from '../../Types/UIManagerJSInterface';

jest.mock('../../Utilities/Platform', () => ({
  OS: 'android',
  select: spec => spec.android ?? spec.native ?? spec.default,
}));
jest.unmock('../UIManager');

describe('UIManager', () => {
  it('preserves lazy ViewManager getters when composing the Bridgeless implementation', () => {
    const originalBridgelessValue = global.RN$Bridgeless;
    const originalGetConstants = global.RN$LegacyInterop_UIManager_getConstants;
    const originalGetConstantsForViewManager =
      global.RN$LegacyInterop_UIManager_getConstantsForViewManager;
    const originalGetDefaultEventTypes =
      global.RN$LegacyInterop_UIManager_getDefaultEventTypes;
    const viewManagerConfig = {Commands: {focus: 1}};
    const getConstants = jest.fn(() => ({
      LazyViewManagersEnabled: true,
      ViewManagerNames: ['RCTTestView'],
    }));
    const getConstantsForViewManager = jest.fn(() => viewManagerConfig);

    jest.resetModules();
    try {
      // $FlowExpectedError[cannot-write]
      global.RN$Bridgeless = true;
      // $FlowExpectedError[cannot-write]
      global.RN$LegacyInterop_UIManager_getConstants = getConstants;
      // $FlowExpectedError[cannot-write]
      global.RN$LegacyInterop_UIManager_getConstantsForViewManager =
        getConstantsForViewManager;
      // $FlowExpectedError[cannot-write]
      global.RN$LegacyInterop_UIManager_getDefaultEventTypes = jest.fn(
        () => ({}),
      );

      const UIManager = require('../UIManager').default;

      expect(getConstants).toHaveBeenCalledTimes(1);
      expect(getConstantsForViewManager).not.toHaveBeenCalled();
      expect(
        Object.getOwnPropertyDescriptor(UIManager, 'RCTTestView'),
      ).toBeDefined();
      expect(Object.keys(UIManager)).toContain('RCTTestView');

      expect(Reflect.get(UIManager, 'RCTTestView')).toBe(viewManagerConfig);
      expect(Reflect.get(UIManager, 'RCTTestView')).toBe(viewManagerConfig);
      expect(getConstantsForViewManager).toHaveBeenCalledTimes(1);
    } finally {
      // $FlowExpectedError[cannot-write]
      global.RN$Bridgeless = originalBridgelessValue;
      // $FlowExpectedError[cannot-write]
      global.RN$LegacyInterop_UIManager_getConstants = originalGetConstants;
      // $FlowExpectedError[cannot-write]
      global.RN$LegacyInterop_UIManager_getConstantsForViewManager =
        originalGetConstantsForViewManager;
      // $FlowExpectedError[cannot-write]
      global.RN$LegacyInterop_UIManager_getDefaultEventTypes =
        originalGetDefaultEventTypes;
      jest.resetModules();
    }
  });

  describe('with lazyLegacyUIManagerConstants', () => {
    const lazyViewManagerConfig = {Commands: {focus: 1}};
    const eagerViewManagerConfig = {Commands: {blur: 2}};

    function withLazyBridgelessUIManager(
      callback: (
        UIManager: UIManagerJSInterface,
        mocks: {
          getConstants: JestMockFn<[], {readonly [name: string]: unknown}>,
          getConstantsForViewManager: JestMockFn<[string], {...}>,
        },
      ) => void,
      {
        hasConstantsForViewManagerBinding = true,
      }: {hasConstantsForViewManagerBinding?: boolean} = {},
    ): void {
      const originalBridgelessValue = global.RN$Bridgeless;
      const originalGetConstants =
        global.RN$LegacyInterop_UIManager_getConstants;
      const originalGetConstantsForViewManager =
        global.RN$LegacyInterop_UIManager_getConstantsForViewManager;
      const originalGetDefaultEventTypes =
        global.RN$LegacyInterop_UIManager_getDefaultEventTypes;
      const getConstants = jest.fn((): {readonly [name: string]: unknown} => ({
        LazyViewManagersEnabled: true,
        RCTEagerView: eagerViewManagerConfig,
        ViewManagerNames: ['RCTLazyView'],
      }));
      const getConstantsForViewManager = jest.fn(
        (_name: string): {...} => lazyViewManagerConfig,
      );

      jest.resetModules();
      try {
        // $FlowExpectedError[cannot-write]
        global.RN$Bridgeless = true;
        // $FlowExpectedError[cannot-write]
        global.RN$LegacyInterop_UIManager_getConstants = getConstants;
        // $FlowExpectedError[cannot-write]
        global.RN$LegacyInterop_UIManager_getConstantsForViewManager =
          hasConstantsForViewManagerBinding ? getConstantsForViewManager : null;
        // $FlowExpectedError[cannot-write]
        global.RN$LegacyInterop_UIManager_getDefaultEventTypes = jest.fn(
          () => ({}),
        );
        jest.doMock(
          '../../../src/private/featureflags/specs/NativeReactNativeFeatureFlags',
          () => ({
            __esModule: true,
            default: {lazyLegacyUIManagerConstants: () => true},
          }),
        );

        callback(require('../UIManager').default, {
          getConstants,
          getConstantsForViewManager,
        });
      } finally {
        // $FlowExpectedError[cannot-write]
        global.RN$Bridgeless = originalBridgelessValue;
        // $FlowExpectedError[cannot-write]
        global.RN$LegacyInterop_UIManager_getConstants = originalGetConstants;
        // $FlowExpectedError[cannot-write]
        global.RN$LegacyInterop_UIManager_getConstantsForViewManager =
          originalGetConstantsForViewManager;
        // $FlowExpectedError[cannot-write]
        global.RN$LegacyInterop_UIManager_getDefaultEventTypes =
          originalGetDefaultEventTypes;
        jest.resetModules();
      }
    }

    test('does not build the legacy constants on import', () => {
      withLazyBridgelessUIManager((UIManager, {getConstants}) => {
        expect(getConstants).not.toHaveBeenCalled();
        expect(typeof UIManager.measure).toBe('function');
        expect(getConstants).not.toHaveBeenCalled();
      });
    });

    test('resolves eager view manager configs when read', () => {
      withLazyBridgelessUIManager(
        (UIManager, {getConstants, getConstantsForViewManager}) => {
          expect(Reflect.get(UIManager, 'RCTEagerView')).toBe(
            eagerViewManagerConfig,
          );
          expect(Reflect.get(UIManager, 'RCTEagerView')).toBe(
            eagerViewManagerConfig,
          );
          expect(getConstants).toHaveBeenCalledTimes(1);
          expect(getConstantsForViewManager).not.toHaveBeenCalled();
        },
      );
    });

    test('resolves lazy view manager configs once when read', () => {
      withLazyBridgelessUIManager((UIManager, {getConstantsForViewManager}) => {
        expect(Reflect.get(UIManager, 'RCTLazyView')).toBe(
          lazyViewManagerConfig,
        );
        expect(Reflect.get(UIManager, 'RCTLazyView')).toBe(
          lazyViewManagerConfig,
        );
        expect(getConstantsForViewManager).toHaveBeenCalledTimes(1);
        expect(getConstantsForViewManager).toHaveBeenCalledWith('RCTLazyView');
      });
    });

    test.each([['RCTEagerView'], ['RCTLazyView']])(
      'reports %s as a property',
      name => {
        withLazyBridgelessUIManager(UIManager => {
          expect(name in UIManager).toBe(true);
          expect(Object.hasOwn(UIManager, name)).toBe(true);
        });
      },
    );

    test('returns undefined for unknown names', () => {
      withLazyBridgelessUIManager((UIManager, {getConstantsForViewManager}) => {
        expect(Reflect.get(UIManager, 'RCTMissingView')).toBeUndefined();
        expect('RCTMissingView' in UIManager).toBe(false);
        expect(getConstantsForViewManager).not.toHaveBeenCalled();
      });
    });

    test('looks up a single view manager in getViewManagerConfig', () => {
      withLazyBridgelessUIManager(
        (UIManager, {getConstants, getConstantsForViewManager}) => {
          const config = UIManager.getViewManagerConfig('RCTEagerView');
          expect(config).toBe(lazyViewManagerConfig);
          expect(UIManager.getViewManagerConfig('RCTEagerView')).toBe(config);
          expect(Reflect.get(UIManager, 'RCTEagerView')).toBe(config);
          expect(getConstants).not.toHaveBeenCalled();
          expect(getConstantsForViewManager).toHaveBeenCalledTimes(1);
          expect(getConstantsForViewManager).toHaveBeenCalledWith(
            'RCTEagerView',
          );
        },
      );
    });

    test('uses the legacy constants in getViewManagerConfig without a per-view binding', () => {
      withLazyBridgelessUIManager(
        (UIManager, {getConstants}) => {
          expect(UIManager.getViewManagerConfig('RCTEagerView')).toBe(
            eagerViewManagerConfig,
          );
          expect(getConstants).toHaveBeenCalledTimes(1);
        },
        {hasConstantsForViewManagerBinding: false},
      );
    });
  });
});
