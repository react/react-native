/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getCurrentBoldTextState: (
    onSuccess: (isBoldTextEnabled: boolean) => void,
    onError: (error: Object) => void,
  ) => void;
  readonly getCurrentGrayscaleState: (
    onSuccess: (isGrayscaleEnabled: boolean) => void,
    onError: (error: Object) => void,
  ) => void;
  readonly getCurrentInvertColorsState: (
    onSuccess: (isInvertColorsEnabled: boolean) => void,
    onError: (error: Object) => void,
  ) => void;
  readonly getCurrentReduceMotionState: (
    onSuccess: (isReduceMotionEnabled: boolean) => void,
    onError: (error: Object) => void,
  ) => void;
  readonly getCurrentDarkerSystemColorsState?: (
    onSuccess: (isDarkerSystemColorsEnabled: boolean) => void,
    onError: (error: Object) => void,
  ) => void;
  readonly getCurrentPrefersCrossFadeTransitionsState?: (
    onSuccess: (prefersCrossFadeTransitions: boolean) => void,
    onError: (error: Object) => void,
  ) => void;
  readonly getCurrentReduceTransparencyState: (
    onSuccess: (isReduceTransparencyEnabled: boolean) => void,
    onError: (error: Object) => void,
  ) => void;
  readonly getCurrentVoiceOverState: (
    onSuccess: (isScreenReaderEnabled: boolean) => void,
    onError: (error: Object) => void,
  ) => void;
  readonly setAccessibilityContentSizeMultipliers: (JSMultipliers: {
    readonly extraSmall?: ?number,
    readonly small?: ?number,
    readonly medium?: ?number,
    readonly large?: ?number,
    readonly extraLarge?: ?number,
    readonly extraExtraLarge?: ?number,
    readonly extraExtraExtraLarge?: ?number,
    readonly accessibilityMedium?: ?number,
    readonly accessibilityLarge?: ?number,
    readonly accessibilityExtraLarge?: ?number,
    readonly accessibilityExtraExtraLarge?: ?number,
    readonly accessibilityExtraExtraExtraLarge?: ?number,
  }) => void;
  readonly setAccessibilityFocus: (reactTag: number) => void;
  readonly announceForAccessibility: (announcement: string) => void;
  readonly announceForAccessibilityWithOptions?: (
    announcement: string,
    options: {queue?: boolean, priority?: 'low' | 'default' | 'high'},
  ) => void;
}

export default TurboModuleRegistry.get<Spec>('AccessibilityManager') as ?Spec;
