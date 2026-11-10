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
import type {UnsafeObject} from '../../../../Libraries/Types/CodegenTypes';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly dlopen: (module: UnsafeObject, filename: string) => void;
}

// Only provided by JavaScript engines that implement Node-API.
export default TurboModuleRegistry.get<Spec>('NativeNodeApiCxx') as ?Spec;
