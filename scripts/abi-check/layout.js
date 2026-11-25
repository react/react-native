/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const path = require('node:path');

/**
 * The headers that one side of a comparison ships, and how clang finds them.
 */
export type HeaderLayout = {
  /** The `-I` directories, in search order. */
  readonly includeDirs: ReadonlyArray<string>,
  /** The `-F` directories, in search order. */
  readonly frameworkDirs: ReadonlyArray<string>,
  /**
   * Each header by its include path, the path written in `#include <...>`.
   * A header's include path is its identity in every layout.
   */
  readonly headers: ReadonlyMap<string, string>,
};

/**
 * The layout of the headers in `entries`, the archive paths of the files
 * extracted to `dir`. Each distinct match of `headerRoot` at the start of an
 * entry is an include directory, in sorted order. The archive paths keep
 * their case where a case-insensitive file system merges folders such as
 * `React/` and `react/`.
 */
function layoutFromEntries(
  dir: string,
  entries: ReadonlyArray<string>,
  headerRoot: RegExp,
): HeaderLayout {
  const roots: Map<string, Array<string>> = new Map();
  for (const entry of entries) {
    const root = entry.match(headerRoot)?.[0];
    if (root != null && entry.endsWith('.h')) {
      roots.set(root, [...(roots.get(root) ?? []), entry]);
    }
  }
  return mergeLayouts(
    [...roots.keys()].sort().map(root => ({
      includeDirs: [path.join(dir, root)],
      frameworkDirs: [],
      headers: new Map(
        (roots.get(root) ?? []).map(entry => [
          entry.slice(root.length),
          path.join(dir, entry),
        ]),
      ),
    })),
  );
}

/**
 * Searches the layouts in order. A header in more than one layout is the one
 * clang finds first.
 */
function mergeLayouts(layouts: ReadonlyArray<HeaderLayout>): HeaderLayout {
  const headers: Map<string, string> = new Map();
  for (const layout of layouts) {
    for (const [includePath, file] of layout.headers) {
      if (!headers.has(includePath)) {
        headers.set(includePath, file);
      }
    }
  }
  return {
    includeDirs: layouts.flatMap(layout => layout.includeDirs),
    frameworkDirs: layouts.flatMap(layout => layout.frameworkDirs),
    headers,
  };
}

module.exports = {layoutFromEntries, mergeLayouts};
