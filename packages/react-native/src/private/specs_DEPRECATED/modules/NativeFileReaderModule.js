/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';
import type {UnsafeObject} from '../../../../Libraries/Types/CodegenTypes';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly readAsDataURL: (data: UnsafeObject) => Promise<string>;
  readonly readAsText: (
    data: UnsafeObject,
    encoding: string,
  ) => Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'FileReaderModule',
) as Spec;
