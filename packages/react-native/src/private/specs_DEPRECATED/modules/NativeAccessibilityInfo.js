/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly isReduceMotionEnabled: (
    onSuccess: (isReduceMotionEnabled: boolean) => void,
  ) => void;
  readonly isInvertColorsEnabled?: (
    onSuccess: (isInvertColorsEnabled: boolean) => void,
  ) => void;
  readonly isHighTextContrastEnabled?: (
    onSuccess: (isHighTextContrastEnabled: boolean) => void,
  ) => void;
  readonly isTouchExplorationEnabled: (
    onSuccess: (isScreenReaderEnabled: boolean) => void,
  ) => void;
  readonly isAccessibilityServiceEnabled?: ?(
    onSuccess: (isAccessibilityServiceEnabled: boolean) => void,
  ) => void;
  readonly setAccessibilityFocus: (reactTag: number) => void;
  readonly announceForAccessibility: (announcement: string) => void;
  readonly getRecommendedTimeoutMillis?: (
    mSec: number,
    onSuccess: (recommendedTimeoutMillis: number) => void,
  ) => void;
  readonly isGrayscaleEnabled?: (
    onSuccess: (isGrayscaleEnabled: boolean) => void,
  ) => void;
}

export default TurboModuleRegistry.get<Spec>('AccessibilityInfo') as ?Spec;
