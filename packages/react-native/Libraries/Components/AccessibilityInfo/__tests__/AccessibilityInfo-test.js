/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

jest.unmock('../AccessibilityInfo');

const mockGetCurrentPrefersCrossFadeTransitionsState = jest.fn(
  (onSuccess, onError) => onSuccess(true),
);
const mockGetCurrentDarkerSystemColorsState = jest.fn((onSuccess, onError) =>
  onSuccess(true),
);
const mockGetCurrentBoldTextState = jest.fn((onSuccess, onError) =>
  onSuccess(true),
);
const mockGetCurrentGrayscaleState = jest.fn((onSuccess, onError) =>
  onSuccess(true),
);
const mockGetCurrentInvertColorsState = jest.fn((onSuccess, onError) =>
  onSuccess(true),
);
const mockGetCurrentReduceMotionState = jest.fn((onSuccess, onError) =>
  onSuccess(true),
);
const mockGetCurrentReduceTransparencyState = jest.fn((onSuccess, onError) =>
  onSuccess(true),
);
const mockGetCurrentVoiceOverState = jest.fn((onSuccess, onError) =>
  onSuccess(true),
);
let mockNativeAccessibilityManagerIOS: {
  getCurrentPrefersCrossFadeTransitionsState: JestMockFn<
    [
      onSuccess: (prefersCrossFadeTransitions: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
  getCurrentDarkerSystemColorsState: JestMockFn<
    [
      onSuccess: (isDarkerSystemColorsEnabled: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
  getCurrentBoldTextState: JestMockFn<
    [
      onSuccess: (isBoldTextEnabled: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
  getCurrentGrayscaleState: JestMockFn<
    [
      onSuccess: (isGrayscaleEnabled: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
  getCurrentInvertColorsState: JestMockFn<
    [
      onSuccess: (isInvertColorsEnabled: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
  getCurrentReduceMotionState: JestMockFn<
    [
      onSuccess: (isReduceMotionEnabled: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
  getCurrentReduceTransparencyState: JestMockFn<
    [
      onSuccess: (isReduceTransparencyEnabled: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
  getCurrentVoiceOverState: JestMockFn<
    [
      onSuccess: (isVoiceOverEnabled: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
} = {
  getCurrentPrefersCrossFadeTransitionsState:
    mockGetCurrentPrefersCrossFadeTransitionsState,
  getCurrentDarkerSystemColorsState: mockGetCurrentDarkerSystemColorsState,
  getCurrentBoldTextState: mockGetCurrentBoldTextState,
  getCurrentGrayscaleState: mockGetCurrentGrayscaleState,
  getCurrentInvertColorsState: mockGetCurrentInvertColorsState,
  getCurrentReduceMotionState: mockGetCurrentReduceMotionState,
  getCurrentReduceTransparencyState: mockGetCurrentReduceTransparencyState,
  getCurrentVoiceOverState: mockGetCurrentVoiceOverState,
};

const ANDROID_RECOMMENDED_TIMEOUT = 6000;
const mockIsHighTextContrastEnabled = jest.fn(onSuccess => onSuccess(true));
const mockIsGrayscaleEnabled = jest.fn(onSuccess => onSuccess(true));
const mockIsInvertColorsEnabled = jest.fn(onSuccess => onSuccess(true));
const mockIsReduceMotionEnabled = jest.fn(onSuccess => onSuccess(true));
const mockIsTouchExplorationEnabled = jest.fn(onSuccess => onSuccess(true));
const mockIsAccessibilityServiceEnabled = jest.fn(onSuccess => onSuccess(true));
const mockGetRecommendedTimeoutMillis = jest.fn((originalTimeout, onSuccess) =>
  onSuccess(ANDROID_RECOMMENDED_TIMEOUT),
);
let mockNativeAccessibilityInfoAndroid: {
  isHighTextContrastEnabled: JestMockFn<
    [onSuccess: (isHighTextContrastEnabled: boolean) => void],
    void,
  > | null,
  isGrayscaleEnabled: JestMockFn<
    [onSuccess: (isGrayscaleEnabled: boolean) => void],
    void,
  > | null,
  isInvertColorsEnabled: JestMockFn<
    [onSuccess: (isInvertColorsEnabled: boolean) => void],
    void,
  > | null,
  isReduceMotionEnabled: JestMockFn<
    [onSuccess: (isReduceMotionEnabled: boolean) => void],
    void,
  > | null,
  isTouchExplorationEnabled: JestMockFn<
    [onSuccess: (isTouchExplorationEnabled: boolean) => void],
    void,
  > | null,
  isAccessibilityServiceEnabled: JestMockFn<
    [onSuccess: (isAccessibilityServiceEnabled: boolean) => void],
    void,
  > | null,
  getRecommendedTimeoutMillis: JestMockFn<
    [originalTimeout: number, onSuccess: (recommendedTimeout: number) => void],
    void,
  > | null,
} = {
  isHighTextContrastEnabled: mockIsHighTextContrastEnabled,
  isGrayscaleEnabled: mockIsGrayscaleEnabled,
  isInvertColorsEnabled: mockIsInvertColorsEnabled,
  isReduceMotionEnabled: mockIsReduceMotionEnabled,
  isTouchExplorationEnabled: mockIsTouchExplorationEnabled,
  isAccessibilityServiceEnabled: mockIsAccessibilityServiceEnabled,
  getRecommendedTimeoutMillis: mockGetRecommendedTimeoutMillis,
};

jest.mock('../NativeAccessibilityManager', () => ({
  __esModule: true,
  default: mockNativeAccessibilityManagerIOS,
}));

jest.mock('../NativeAccessibilityInfo', () => ({
  __esModule: true,
  default: mockNativeAccessibilityInfoAndroid,
}));

const Platform = require('../../../Utilities/Platform').default;
const AccessibilityInfo = require('../AccessibilityInfo').default;
const invariant = require('invariant');

describe('AccessibilityInfo', () => {
  let originalPlatform;

  beforeEach(() => {
    originalPlatform = Platform.OS;
    jest.clearAllMocks();
  });

  describe('isBoldTextEnabled', () => {
    describe('Android', () => {
      it('should return immediately', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();

        expect(isBoldTextEnabled).toBe(false);
      });
    });

    describe('iOS', () => {
      it('should call getCurrentBoldTextState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();

        expect(mockGetCurrentBoldTextState).toHaveBeenCalled();
        expect(isBoldTextEnabled).toBe(true);
      });

      it('should reject if NativeAccessibilityManagerIOS module is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const nativeAccessibilityManagerModule = jest.requireMock(
          '../NativeAccessibilityManager',
        );
        nativeAccessibilityManagerModule.default = null;

        const result: unknown =
          await AccessibilityInfo.isBoldTextEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isBoldTextEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS is not available',
        );
      });
    });
  });

  describe('isGrayscaleEnabled', () => {
    describe('Android', () => {
      it('should call isGrayscaleEnabled if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isGrayscaleEnabled = await AccessibilityInfo.isGrayscaleEnabled();

        expect(mockIsGrayscaleEnabled).toHaveBeenCalled();
        expect(isGrayscaleEnabled).toBe(true);
      });

      it('should throw error if isGrayscaleEnabled is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        mockNativeAccessibilityInfoAndroid.isGrayscaleEnabled = null;

        const result: unknown =
          await AccessibilityInfo.isGrayscaleEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isGrayscaleEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityInfoAndroid.isGrayscaleEnabled is not available',
        );
      });
    });

    describe('iOS', () => {
      it('should call getCurrentGrayscaleState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isGrayscaleEnabled = await AccessibilityInfo.isGrayscaleEnabled();

        expect(mockGetCurrentGrayscaleState).toHaveBeenCalled();
        expect(isGrayscaleEnabled).toBe(true);
      });

      it('should reject if NativeAccessibilityManagerIOS module is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const nativeAccessibilityManagerModule = jest.requireMock(
          '../NativeAccessibilityManager',
        );
        nativeAccessibilityManagerModule.default = null;

        const result: unknown =
          await AccessibilityInfo.isGrayscaleEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isGrayscaleEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS is not available',
        );
      });
    });
  });

  describe('isInvertColorsEnabled', () => {
    describe('Android', () => {
      it('should call isInvertColorsEnabled if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isInvertColorsEnabled =
          await AccessibilityInfo.isInvertColorsEnabled();

        expect(mockIsInvertColorsEnabled).toHaveBeenCalled();
        expect(isInvertColorsEnabled).toBe(true);
      });

      it('should throw error if isInvertColorsEnabled is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        mockNativeAccessibilityInfoAndroid.isInvertColorsEnabled = null;

        const result: unknown =
          await AccessibilityInfo.isInvertColorsEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isInvertColorsEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityInfoAndroid.isInvertColorsEnabled is not available',
        );
      });
    });

    describe('iOS', () => {
      it('should call getCurrentInvertColorsState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isInvertColorsEnabled =
          await AccessibilityInfo.isInvertColorsEnabled();

        expect(mockGetCurrentInvertColorsState).toHaveBeenCalled();
        expect(isInvertColorsEnabled).toBe(true);
      });

      it('should reject if NativeAccessibilityManagerIOS module is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const nativeAccessibilityManagerModule = jest.requireMock(
          '../NativeAccessibilityManager',
        );
        nativeAccessibilityManagerModule.default = null;

        const result: unknown =
          await AccessibilityInfo.isInvertColorsEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isInvertColorsEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS is not available',
        );
      });
    });
  });

  describe('isReduceTransparencyEnabled', () => {
    describe('Android', () => {
      it('should return immediately', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isReduceTransparencyEnabled =
          await AccessibilityInfo.isReduceTransparencyEnabled();

        expect(isReduceTransparencyEnabled).toBe(false);
      });
    });

    describe('iOS', () => {
      it('should call getCurrentReduceTransparencyState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isReduceTransparencyEnabled =
          await AccessibilityInfo.isReduceTransparencyEnabled();

        expect(mockGetCurrentReduceTransparencyState).toHaveBeenCalled();
        expect(isReduceTransparencyEnabled).toBe(true);
      });

      it('should reject if NativeAccessibilityManagerIOS module is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const nativeAccessibilityManagerModule = jest.requireMock(
          '../NativeAccessibilityManager',
        );
        nativeAccessibilityManagerModule.default = null;

        const result: unknown =
          await AccessibilityInfo.isReduceTransparencyEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isReduceTransparencyEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS is not available',
        );
      });
    });
  });

  describe('isScreenReaderEnabled', () => {
    describe('Android', () => {
      it('should call isScreenReaderEnabled if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isScreenReaderEnabled =
          await AccessibilityInfo.isScreenReaderEnabled();

        expect(mockIsTouchExplorationEnabled).toHaveBeenCalled();
        expect(isScreenReaderEnabled).toBe(true);
      });

      it('should throw error if NativeAccessibilityInfoAndroid is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const nativeAccessibilityInfoModule = jest.requireMock(
          '../NativeAccessibilityInfo',
        );
        nativeAccessibilityInfoModule.default = null;

        const result: unknown =
          await AccessibilityInfo.isScreenReaderEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isScreenReaderEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityInfoAndroid is not available',
        );
      });
    });

    describe('iOS', () => {
      it('should call getCurrentVoiceOverState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isScreenReaderEnabled =
          await AccessibilityInfo.isScreenReaderEnabled();

        expect(mockGetCurrentVoiceOverState).toHaveBeenCalled();
        expect(isScreenReaderEnabled).toBe(true);
      });

      it('should reject if NativeAccessibilityManagerIOS module is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const nativeAccessibilityManagerModule = jest.requireMock(
          '../NativeAccessibilityManager',
        );
        nativeAccessibilityManagerModule.default = null;

        const result: unknown =
          await AccessibilityInfo.isScreenReaderEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isScreenReaderEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS is not available',
        );
      });
    });
  });

  describe('isAccessibilityServiceEnabled', () => {
    describe('Android', () => {
      it('should call isAccessibilityServiceEnabled if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isAccessibilityServiceEnabled =
          await AccessibilityInfo.isAccessibilityServiceEnabled();

        expect(mockIsAccessibilityServiceEnabled).toHaveBeenCalled();
        expect(isAccessibilityServiceEnabled).toBe(true);
      });

      it('should throw error if isAccessibilityServiceEnabled is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        mockNativeAccessibilityInfoAndroid.isAccessibilityServiceEnabled = null;

        const result: unknown =
          await AccessibilityInfo.isAccessibilityServiceEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isAccessibilityServiceEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityInfoAndroid.isAccessibilityServiceEnabled is not available',
        );
      });

      it('should throw error if NativeAccessibilityInfoAndroid is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const nativeAccessibilityInfoModule = jest.requireMock(
          '../NativeAccessibilityInfo',
        );
        nativeAccessibilityInfoModule.default = null;

        const result: unknown =
          await AccessibilityInfo.isAccessibilityServiceEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isAccessibilityServiceEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityInfoAndroid.isAccessibilityServiceEnabled is not available',
        );
      });
    });

    describe('iOS', () => {
      it('should reject because isAccessibilityServiceEnabled is only available on Android', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const result: unknown =
          await AccessibilityInfo.isAccessibilityServiceEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isAccessibilityServiceEnabled to reject',
        );
        expect(result.message).toEqual(
          'isAccessibilityServiceEnabled is only available on Android',
        );
      });
    });
  });

  describe('isReduceMotionEnabled', () => {
    describe('Android', () => {
      it('should call isReduceMotionEnabled if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isReduceMotionEnabled =
          await AccessibilityInfo.isReduceMotionEnabled();

        expect(mockIsReduceMotionEnabled).toHaveBeenCalled();
        expect(isReduceMotionEnabled).toBe(true);
      });

      it('should throw error if NativeAccessibilityInfoAndroid is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const nativeAccessibilityInfoModule = jest.requireMock(
          '../NativeAccessibilityInfo',
        );
        nativeAccessibilityInfoModule.default = null;

        const result: unknown =
          await AccessibilityInfo.isReduceMotionEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isReduceMotionEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityInfoAndroid is not available',
        );
      });
    });

    describe('iOS', () => {
      it('should call getCurrentReduceMotionState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isReduceMotionEnabled =
          await AccessibilityInfo.isReduceMotionEnabled();

        expect(mockGetCurrentReduceMotionState).toHaveBeenCalled();
        expect(isReduceMotionEnabled).toBe(true);
      });

      it('should reject if NativeAccessibilityManagerIOS module is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const nativeAccessibilityManagerModule = jest.requireMock(
          '../NativeAccessibilityManager',
        );
        nativeAccessibilityManagerModule.default = null;

        const result: unknown =
          await AccessibilityInfo.isReduceMotionEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isReduceMotionEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS is not available',
        );
      });
    });
  });

  describe('prefersCrossFadeTransitions', () => {
    describe('Android', () => {
      it('should return immediately', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const prefersCrossFadeTransitions =
          await AccessibilityInfo.prefersCrossFadeTransitions();

        expect(prefersCrossFadeTransitions).toBe(false);
      });
    });

    describe('iOS', () => {
      it('should call getCurrentPrefersCrossFadeTransitionsState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const prefersCrossFadeTransitions =
          await AccessibilityInfo.prefersCrossFadeTransitions();

        expect(
          mockGetCurrentPrefersCrossFadeTransitionsState,
        ).toHaveBeenCalled();
        expect(prefersCrossFadeTransitions).toBe(true);
      });

      it('should throw error if getCurrentPrefersCrossFadeTransitionsState is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        mockNativeAccessibilityManagerIOS.getCurrentPrefersCrossFadeTransitionsState =
          null;

        const result: unknown =
          await AccessibilityInfo.prefersCrossFadeTransitions().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected prefersCrossFadeTransitions to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS.getCurrentPrefersCrossFadeTransitionsState is not available',
        );
      });
    });
  });

  describe('isDarkerSystemColorsEnabled', () => {
    describe('Android', () => {
      it('should return immediately', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isDarkerSystemColorsEnabled =
          await AccessibilityInfo.isDarkerSystemColorsEnabled();

        expect(isDarkerSystemColorsEnabled).toBe(false);
      });
    });

    describe('iOS', () => {
      it('should call getCurrentDarkerSystemColorsState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isDarkerSystemColorsEnabled =
          await AccessibilityInfo.isDarkerSystemColorsEnabled();

        expect(mockGetCurrentDarkerSystemColorsState).toHaveBeenCalled();
        expect(isDarkerSystemColorsEnabled).toBe(true);
      });

      it('should throw error if getCurrentDarkerSystemColorsState is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        mockNativeAccessibilityManagerIOS.getCurrentDarkerSystemColorsState =
          null;

        const result: unknown =
          await AccessibilityInfo.isDarkerSystemColorsEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isDarkerSystemColorsEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS.getCurrentDarkerSystemColorsState is not available',
        );
      });
    });
  });

  describe('isHighTextContrastEnabled', () => {
    describe('Android', () => {
      it('should call isHighTextContrastEnabled if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isHighTextContrastEnabled =
          await AccessibilityInfo.isHighTextContrastEnabled();

        expect(mockIsHighTextContrastEnabled).toHaveBeenCalled();
        expect(isHighTextContrastEnabled).toBe(true);
      });

      it('should throw error if isHighTextContrastEnabled is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        mockNativeAccessibilityInfoAndroid.isHighTextContrastEnabled = null;

        const result: unknown =
          await AccessibilityInfo.isHighTextContrastEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isHighTextContrastEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityInfoAndroid.isHighTextContrastEnabled is not available',
        );
      });
    });

    describe('iOS', () => {
      it('should return false', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isHighTextContrastEnabled =
          await AccessibilityInfo.isHighTextContrastEnabled();

        expect(isHighTextContrastEnabled).toBe(false);
      });
    });
  });

  describe('getRecommendedTimeoutMillis', () => {
    describe('Android', () => {
      it('should return the system recommended timeout value', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const recommendedTimeoutMillis =
          await AccessibilityInfo.getRecommendedTimeoutMillis(5000);

        expect(recommendedTimeoutMillis).toBe(ANDROID_RECOMMENDED_TIMEOUT);
      });

      it('should return originalTimeout if getRecommendedTimeoutMillis is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        mockNativeAccessibilityInfoAndroid.getRecommendedTimeoutMillis = null;

        const recommendedTimeoutMillis =
          await AccessibilityInfo.getRecommendedTimeoutMillis(5000);

        expect(recommendedTimeoutMillis).toBe(5000);
      });
    });

    describe('iOS', () => {
      it('should return originalTimeout', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const recommendedTimeoutMillis =
          await AccessibilityInfo.getRecommendedTimeoutMillis(5000);

        expect(recommendedTimeoutMillis).toBe(5000);
      });
    });
  });

  afterEach(() => {
    mockNativeAccessibilityManagerIOS = {
      getCurrentPrefersCrossFadeTransitionsState:
        mockGetCurrentPrefersCrossFadeTransitionsState,
      getCurrentDarkerSystemColorsState: mockGetCurrentDarkerSystemColorsState,
      getCurrentBoldTextState: mockGetCurrentBoldTextState,
      getCurrentGrayscaleState: mockGetCurrentGrayscaleState,
      getCurrentInvertColorsState: mockGetCurrentInvertColorsState,
      getCurrentReduceMotionState: mockGetCurrentReduceMotionState,
      getCurrentReduceTransparencyState: mockGetCurrentReduceTransparencyState,
      getCurrentVoiceOverState: mockGetCurrentVoiceOverState,
    };
    jest.requireMock('../NativeAccessibilityManager').default =
      mockNativeAccessibilityManagerIOS;

    mockNativeAccessibilityInfoAndroid = {
      isHighTextContrastEnabled: mockIsHighTextContrastEnabled,
      isGrayscaleEnabled: mockIsGrayscaleEnabled,
      isInvertColorsEnabled: mockIsInvertColorsEnabled,
      isReduceMotionEnabled: mockIsReduceMotionEnabled,
      isTouchExplorationEnabled: mockIsTouchExplorationEnabled,
      isAccessibilityServiceEnabled: mockIsAccessibilityServiceEnabled,
      getRecommendedTimeoutMillis: mockGetRecommendedTimeoutMillis,
    };
    jest.requireMock('../NativeAccessibilityInfo').default =
      mockNativeAccessibilityInfoAndroid;

    /* $FlowFixMe[incompatible-type] */
    Platform.OS = originalPlatform;
  });
});
