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
  readonly readAsDataURL: (data: Object) => Promise<string>;
  readonly readAsText: (data: Object, encoding: string) => Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'FileReaderModule',
) as Spec;
