/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// ----------------------------------------------------------------------------
// react-native/node-api
//
// Loads Node-API addons, like Node's `process.dlopen`.
// ----------------------------------------------------------------------------

import NativeNodeApi from './private/node-api/specs/NativeNodeApi';

/**
 * Loads a Node-API addon into the calling JavaScript runtime, like Node's
 * `process.dlopen()`.
 *
 * Opens the shared library at `filename`, calls the addon's module
 * initializer with a new `napi_env` and an empty exports object, and sets
 * `module.exports` to the value it returns. Nothing is cached: loading the
 * same addon again initializes it again, in a new env. Each env is torn down
 * with the runtime, which runs the addon's env cleanup hooks.
 *
 * @param module An object whose `exports` property is set to the addon's
 *   exports.
 * @param filename Passed to the system's `dlopen()` as is, for example
 *   `libmy_addon.so` on Android or `@rpath/my_addon.framework/my_addon` on
 *   Apple platforms.
 * @throws If the JavaScript engine doesn't implement Node-API, or if the
 *   addon can't be loaded or throws while initializing.
 */
export function dlopen(module: {exports: unknown, ...}, filename: string) {
  if (NativeNodeApi == null) {
    throw new Error(
      'Node-API is not available: the JavaScript engine does not implement it',
    );
  }
  NativeNodeApi.dlopen(module, filename);
}
