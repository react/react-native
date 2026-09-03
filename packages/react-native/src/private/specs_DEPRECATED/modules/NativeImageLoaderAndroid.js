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

export type ImageSize = {
  width: number,
  height: number,
  ...
};

export interface Spec extends TurboModule {
  readonly abortRequest: (requestId: number) => void;
  readonly getConstants: () => {};
  readonly getSize: (uri: string) => Promise<ImageSize>;
  readonly getSizeWithHeaders: (
    uri: string,
    headers: {[key: string]: string},
  ) => Promise<ImageSize>;
  readonly prefetchImage: (uri: string, requestId: number) => Promise<boolean>;
  readonly queryCache: (uris: Array<string>) => Promise<UnsafeObject>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ImageLoader') as Spec;
