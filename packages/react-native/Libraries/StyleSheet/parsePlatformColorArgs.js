/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * Splits the variadic `PlatformColor(...)` arguments into the leading color
 * token names and the optional trailing `{fallback}` options object. The
 * per-platform `PlatformColor` implementations differ only in the native object
 * they build from this result, so the argument parsing is shared here.
 */
export default function parsePlatformColorArgs(
  args: Array<string | {fallback: string}>,
): {names: Array<string>, fallback: ?string} {
  const lastArg = args[args.length - 1];
  if (__DEV__) {
    args.forEach((arg, index) => {
      if (typeof arg !== 'object' || arg == null) {
        return;
      }
      if (index !== args.length - 1) {
        console.error(
          'PlatformColor: an options object is only honored as the final argument; one in any other position is ignored.',
        );
      } else if (typeof arg.fallback !== 'string') {
        console.error(
          'PlatformColor: the trailing options object must be of the form {fallback: string}; it is ignored.',
        );
      }
    });
  }
  // The {fallback} options object is only honored as the trailing argument.
  const fallback =
    lastArg != null &&
    typeof lastArg === 'object' &&
    typeof lastArg.fallback === 'string'
      ? lastArg.fallback
      : null;
  // Collect the leading string tokens; a non-string non-trailing arg (a lint
  // error) is dropped.
  const names: Array<string> = [];
  const nameCount = fallback == null ? args.length : args.length - 1;
  for (let i = 0; i < nameCount; i++) {
    const arg = args[i];
    if (typeof arg === 'string') {
      names.push(arg);
    }
  }
  return {names, fallback};
}
