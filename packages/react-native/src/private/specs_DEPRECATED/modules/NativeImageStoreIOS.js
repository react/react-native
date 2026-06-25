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
  readonly getConstants: () => {};
  readonly getBase64ForTag: (
    uri: string,
    successCallback: (base64ImageData: string) => void,
    errorCallback: (error: {message: string}) => void,
  ) => void;
  readonly hasImageForTag: (
    uri: string,
    callback: (hasImage: boolean) => void,
  ) => void;
  readonly removeImageForTag: (uri: string) => void;
  readonly addImageFromBase64: (
    base64ImageData: string,
    successCallback: (uri: string) => void,
    errorCallback: (error: {message: string}) => void,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ImageStoreManager',
) as Spec;
