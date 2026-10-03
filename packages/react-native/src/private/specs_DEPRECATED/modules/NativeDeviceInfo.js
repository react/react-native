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

export type DisplayMetricsAndroid = {
  width: number,
  height: number,
  scale: number,
  fontScale: number,
  densityDpi: number,
};

export type DisplayMetrics = {
  width: number,
  height: number,
  scale: number,
  fontScale: number,
};

// A region of the display that content should avoid, such as a hinge or a
// front-facing camera. Modeled after the reserved regions of iPhone Duo (see
// the "Designing for iPhone Duo" Human Interface Guidelines and Apple Tech
// Talk 111463, "Strike a pose with adaptive layouts on iPhone Duo") so that a
// future foldable/dual-display Android device can report through the same
// shape.
export type DisplayFeatureType = 'hinge' | 'cutout';

// The posture of a 'hinge' DisplayFeature. Always 'unknown' for 'cutout'.
export type DisplayFeatureState =
  | 'unknown'
  | 'postureFlat'
  | 'postureHalfOpened';

export type DisplayFeatureRect = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export type DisplayFeature = {
  type: DisplayFeatureType,
  state: DisplayFeatureState,
  // In the same coordinate space as the 'window' DisplayMetrics, in points.
  bounds: DisplayFeatureRect,
};

export type DimensionsPayload = {
  window?: DisplayMetrics,
  screen?: DisplayMetrics,
  windowPhysicalPixels?: DisplayMetricsAndroid,
  screenPhysicalPixels?: DisplayMetricsAndroid,
  // Empty on every platform today. iOS reserves the field pending the iOS
  // 27.1 SDK (not public as of 2026-09-10); see RCTDeviceInfo.mm.
  displayFeatures?: $ReadOnlyArray<DisplayFeature>,
};

export type DeviceInfoConstants = {
  readonly Dimensions: DimensionsPayload,
  readonly isEdgeToEdge?: boolean,
  readonly isIPhoneX_deprecated?: boolean,
};

export interface Spec extends TurboModule {
  readonly getConstants: () => DeviceInfoConstants;
}

const NativeModule: Spec = TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');

export default NativeModule;
