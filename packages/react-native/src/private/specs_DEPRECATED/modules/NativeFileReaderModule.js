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

type BlobDescriptor = {
  blobId: string,
  offset: number,
  size: number,
  name?: string,
  type?: string,
  lastModified?: number,
  ...
};

export interface Spec extends TurboModule {
  readonly readAsArrayBuffer: (data: BlobDescriptor) => Promise<ArrayBuffer>;
  readonly readAsDataURL: (data: BlobDescriptor) => Promise<string>;
  readonly readAsText: (
    data: BlobDescriptor,
    encoding: string,
  ) => Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'FileReaderModule',
) as Spec;
