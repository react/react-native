/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/**
 * NOTE: This is React Native specific export type.
 *
 * DEPRECATED_RCTExport is an interface type that allows native code generation
 * for React Native native modules. It exists as a hint to the codegen tool that
 * any interface that extends it needs to be codegen'ed. Example usage:
 *
 *   export interface RCTFoobar extends DEPRECATED_RCTExport<void> {}
 *
 * Native definition for RCTFoobar will then be generated.
 *
 * The type param T is a placeholder for future codegen hinting, like versioning
 * information, native base classes, etc. For now, simply use `void` type as
 * there's nothing to give hint about.
 *
 * NOTE: This export is deprecated. Please use TurboModule.
 */

// eslint-disable-next-line no-unused-vars
export interface DEPRECATED_RCTExport<T extends void = void> {
  readonly getConstants?: () => {...};
}

export interface TurboModule extends DEPRECATED_RCTExport<void> {}

export type {RootTag} from '../Types/RootTagTypes.js';
