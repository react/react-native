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

type Options = {
  readonly offset: {
    readonly x: number,
    readonly y: number,
  },
  readonly size: {
    readonly width: number,
    readonly height: number,
  },
  readonly displaySize?: ?{
    readonly width: number,
    readonly height: number,
  },
  /**
   * Enum with potential values:
   *  - cover
   *  - contain
   *  - stretch
   *  - center
   *  - repeat
   */
  readonly resizeMode?: ?string,
  readonly allowExternalStorage?: boolean,
};

export interface Spec extends TurboModule {
  readonly getConstants: () => {};
  readonly cropImage: (
    uri: string,
    cropData: Options,
    successCallback: (uri: string) => void,
    errorCallback: (error: string) => void,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ImageEditingManager',
) as Spec;
