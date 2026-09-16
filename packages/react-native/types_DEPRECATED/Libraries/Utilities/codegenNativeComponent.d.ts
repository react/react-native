/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {HostComponent} from 'react-native';

interface Options {
  readonly interfaceOnly?: boolean | undefined;
  readonly paperComponentName?: string | undefined;
  readonly paperComponentNameDeprecated?: string | undefined;
  readonly excludedPlatforms?: ReadonlyArray<'iOS' | 'android'> | undefined;
  readonly generateOptionalProperties?: boolean | undefined;
  readonly generateOptionalObjectProperties?: boolean | undefined;
}

type NativeComponentType<T> = HostComponent<T>;

declare function codegenNativeComponent<Props extends object>(
  componentName: string,
  options?: Options,
): NativeComponentType<Props>;

export default codegenNativeComponent;
