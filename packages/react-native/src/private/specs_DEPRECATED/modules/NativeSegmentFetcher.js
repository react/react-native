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
    options: Object, // flowlint-line unclear-type: off
    callback: (error: ?Object) => void, // flowlint-line unclear-type: off
  ) => void;
  readonly getSegment?: (
    segmentId: number,
    options: Object, // flowlint-line unclear-type: off
    callback: (error: ?Object, path: ?string) => void, // flowlint-line unclear-type: off
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SegmentFetcher') as Spec;
