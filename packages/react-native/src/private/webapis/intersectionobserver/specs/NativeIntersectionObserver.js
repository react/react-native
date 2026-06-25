/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

export type NativeIntersectionObserverEntry = {
  intersectionObserverId: number,
  targetInstanceHandle: unknown,
  targetRect: ReadonlyArray<number>, // It's actually a tuple with x, y, width and height
  rootRect: ReadonlyArray<number>, // It's actually a tuple with x, y, width and height
  // TODO(T209328432) - Remove optionality of intersectionRect when native changes are released
  intersectionRect: ?ReadonlyArray<number>, // It's actually a tuple with x, y, width and height
  isIntersectingAboveThresholds: boolean,
  time: number,
};

export type NativeIntersectionObserverObserveOptions = {
  intersectionObserverId: number,
  rootShadowNode?: ?unknown,
  targetShadowNode: unknown,
  thresholds: ReadonlyArray<number>,
  rootThresholds?: ?ReadonlyArray<number>,
  rootMargin?: ?string,
};

export opaque type NativeIntersectionObserverToken = unknown;

export interface Spec extends TurboModule {
  readonly observeV2?: (
    options: NativeIntersectionObserverObserveOptions,
  ) => NativeIntersectionObserverToken;
  readonly unobserveV2?: (
    intersectionObserverId: number,
    token: NativeIntersectionObserverToken,
  ) => void;
  readonly connect: (notifyIntersectionObserversCallback: () => void) => void;
  readonly disconnect: () => void;
  readonly takeRecords: () => ReadonlyArray<NativeIntersectionObserverEntry>;
}

export default TurboModuleRegistry.get<Spec>(
  'NativeIntersectionObserverCxx',
) as ?Spec;
