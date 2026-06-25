/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CodegenTypes, TurboModule} from 'react-native';

import {TurboModuleRegistry} from 'react-native';

export type ScreenshotManagerOptions = CodegenTypes.UnsafeObject;

export interface Spec extends TurboModule {
  readonly getConstants: () => {};
  takeScreenshot(
    id: string,
    options: ScreenshotManagerOptions,
  ): Promise<string>;
}

const NativeModule = TurboModuleRegistry.get<Spec>('ScreenshotManager');
export function takeScreenshot(
  id: string,
  options: ScreenshotManagerOptions,
): Promise<string> {
  if (NativeModule != null) {
    return NativeModule.takeScreenshot(id, options);
  }
  return Promise.reject(new Error('ScreenshotManager is not defined.'));
}
