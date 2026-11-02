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
  readonly fetchSegment: (
    segmentId: number,
    options: LegacyObject,
    callback: (error: ?LegacyObject) => void,
  ) => void;
  readonly getSegment?: (
    segmentId: number,
    options: LegacyObject,
    callback: (error: ?LegacyObject, path: ?string) => void,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SegmentFetcher') as Spec;
