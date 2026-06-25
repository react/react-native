/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {PACKAGES_DIR} = require('../../../shared/consts');
const {getPackages} = require('../../../shared/monorepoUtils');
const {existsSync} = require('fs');
const path = require('path');

export type DependencyContext = Readonly<{
  reportUnresolvedDependency(importPath: string): void,
}>;

let cachedProjectInfo;

/**
 * Resolve the location of an import path to a file path in the project.
 *
 * This is a specific dependency resolver for type imports in the React
 * Native project/monorepo. Therefore it has limited requirements, and does
 * not need to traverse `node_modules`.
 */
async function simpleResolve(
  importPath: string,
  filePath: string,
  context: DependencyContext,
): Promise<string | null> {
  if (cachedProjectInfo == null) {
    cachedProjectInfo = await getPackages({
      includeReactNative: true,
      includePrivate: false,
    });
  }

  // Resolve exact '@react-native/<package>' import
  if (importPath in cachedProjectInfo) {
    const packageJson = cachedProjectInfo[importPath].packageJson;

    if (packageJson.main !== undefined) {
      return path.join(cachedProjectInfo[importPath].path, packageJson.main);
    }

    return path.join(cachedProjectInfo[importPath].path, 'index.js');
  }

  // Resolve relative import within the project
  if (importPath.startsWith('.')) {
    const resolvedPath = path.resolve(path.dirname(filePath), importPath);

    if (resolvedPath.startsWith(PACKAGES_DIR)) {
      if (resolvedPath.endsWith('.js') || resolvedPath.endsWith('.js.flow')) {
        return resolvedPath;
      }

      for (const ext of ['.js.flow', '.js']) {
        if (existsSync(resolvedPath + ext)) {
          return resolvedPath + ext;
        }
      }

      // Other relative files are not useful to our program, e.g. assets
      return null;
    }
  }

  context.reportUnresolvedDependency(importPath);
  return null;
}

module.exports = simpleResolve;
