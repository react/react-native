/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/**
 * Serializes a view configuration object to a JSON string for debugging and logging.
 *
 * Handles special cases like function properties by representing them with the
 * Unicode function symbol (ƒ) followed by the function name.
 *
 * @param {any} viewConfig - The view configuration object to stringify
 * @returns {string} Formatted JSON string with 2-space indentation
 *
 * @example
 *   const config = { name: 'View', style: { flex: 1 }, onPress: [Function] };
 *   const json = stringifyViewConfig(config);
 *   // Returns: "{ ... name: 'View', style: { flex: 1 }, onPress: ƒ onPress ... }"
 */
export default function stringifyViewConfig(viewConfig: any): string {
  return JSON.stringify(
    viewConfig,
    (key, val) => {
      if (typeof val === 'function') {
        return `ƒ ${val.name}`;
      }
      return val;
    },
    2,
  );
}
