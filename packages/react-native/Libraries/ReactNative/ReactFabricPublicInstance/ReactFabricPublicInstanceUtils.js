/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * IMPORTANT!!
 *
 * This module cannot import `ReactFabric` (directly or indirectly)
 * because it can be used by apps only using the legacy renderer.
 * In that case `nativeFabricUIManager` isn't defined and `ReactFabric` throws.
 */

export function isPublicInstance(maybeInstance: unknown): boolean {
  return (
    maybeInstance != null &&
    // TODO: implement a better check when the instance is defined in the React Native repository.
    (maybeInstance.__nativeTag != null ||
      // TODO: remove this check when syncing the new version of the renderer from React to React Native.
      isLegacyFabricInstance(maybeInstance))
  );
}

function isLegacyFabricInstance(maybeInstance: unknown): boolean {
  /* eslint-disable dot-notation */
  return (
    maybeInstance != null &&
    // $FlowExpectedError[incompatible-use]
    maybeInstance['_internalInstanceHandle'] != null &&
    maybeInstance['_internalInstanceHandle'].stateNode != null &&
    maybeInstance['_internalInstanceHandle'].stateNode.canonical != null
  );
}
