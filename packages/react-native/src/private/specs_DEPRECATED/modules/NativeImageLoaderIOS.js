/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../../../../Libraries/TurboModule/RCTExport';
import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getConstants: () => {};
  // Return [width, height] of image uri
  readonly getSize: (uri: string) => Promise<ReadonlyArray<number>>;
  readonly getSizeWithHeaders: (
    uri: string,
    headers: Object,
  ) => Promise<{
    width: number,
    height: number,
    ...
  }>;
  readonly prefetchImage: (uri: string) => Promise<boolean>;
  readonly prefetchImageWithMetadata?: (
    uri: string,
    queryRootName: string,
    rootTag: RootTag,
  ) => Promise<boolean>;
  readonly queryCache: (uris: Array<string>) => Promise<Object>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ImageLoader') as Spec;
