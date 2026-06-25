/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PluginObj} from '@babel/core';

import * as babel from '@babel/core';
import path from 'path';

type PackageConfig = ReadonlyArray<{
  directory: string,
  name: string,
}>;

function getReplacementInfo(
  source: string,
  rootPath: string,
  filePath: string,
  packages: PackageConfig,
) {
  const sourceDirectory = filePath.split('/').slice(0, -1).join('/');
  const pathToRoot = path.relative(sourceDirectory, rootPath);

  const packageToReplace = packages.find(({name}) => source.startsWith(name));

  return [packageToReplace, pathToRoot];
}

const visitor: PluginObj<{
  opts: {packages: PackageConfig, sourcePath: string, rootPath: string},
}> = {
  visitor: {
    ImportDeclaration(nodePath, state) {
      const [packageToReplace, pathToRoot] = getReplacementInfo(
        nodePath.node.source.value,
        state.opts.rootPath,
        state.opts.sourcePath,
        state.opts.packages,
      );

      if (!packageToReplace) {
        return;
      }

      nodePath.node.source.value = nodePath.node.source.value.replace(
        packageToReplace.name,
        path.join(pathToRoot, packageToReplace.directory),
      );
    },
    ExportNamedDeclaration(nodePath, state) {
      if (!nodePath.node.source) {
        return;
      }

      const [packageToReplace, pathToRoot] = getReplacementInfo(
        nodePath.node.source.value,
        state.opts.rootPath,
        state.opts.sourcePath,
        state.opts.packages,
      );

      if (!packageToReplace) {
        return;
      }

      // $FlowExpectedError[incompatible-use]
      nodePath.node.source.value = nodePath.node.source.value.replace(
        packageToReplace.name,
        path.join(pathToRoot, packageToReplace.directory),
      );
    },
  },
};

async function resolveCyclicImportsInDefinition(config: {
  source: string,
  sourcePath: string,
  rootPath: string,
  packages: PackageConfig,
}): Promise<string> {
  const result = await babel.transformAsync(config.source, {
    plugins: [
      '@babel/plugin-syntax-typescript',
      [
        visitor,
        {
          packages: config.packages,
          sourcePath: config.sourcePath,
          rootPath: config.rootPath,
        },
      ],
    ],
  });

  return result.code;
}

module.exports = resolveCyclicImportsInDefinition;
