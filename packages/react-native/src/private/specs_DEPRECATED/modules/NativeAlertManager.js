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

export type Args = {
  title?: string,
  message?: string,
  buttons?: Array<UnsafeObject>, // TODO(T67565166): have a better type
  type?: string,
  defaultValue?: string,
  cancelButtonKey?: string,
  destructiveButtonKey?: string,
  preferredButtonKey?: string,
  keyboardType?: string,
  userInterfaceStyle?: string,
};

export interface Spec extends TurboModule {
  readonly alertWithArgs: (
    args: Args,
    callback: (id: number, value: string) => void,
  ) => void;
}

export default TurboModuleRegistry.get<Spec>('AlertManager') as ?Spec;
