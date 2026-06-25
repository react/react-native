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

/**
 * This is an internal native module meant to be used for performance
 * measurements and benchmarks. It is not meant to be used in production.
 */
export interface Spec extends TurboModule {
  readonly getCPUTimeNanos: () => number;
  readonly hasAccurateCPUTimeNanosForBenchmarks: () => boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CPUTimeCxx') as Spec;
