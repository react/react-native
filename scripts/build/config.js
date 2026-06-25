/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {BabelCoreOptions} from '@babel/core';

const {ModuleResolutionKind} = require('typescript');

export type BuildOptions = Readonly<{
  // The target runtime to compile for.
  target: 'node',

  // Whether to emit Flow definition files (.js.flow) (default: true).
  emitFlowDefs?: boolean,

  // Whether to emit TypeScript definition files (.d.ts) (default: false).
  emitTypeScriptDefs?: boolean,
}>;

export type BuildConfig = Readonly<{
  // The packages to include for build and their build options.
  packages: Readonly<{[packageName: string]: BuildOptions}>,
}>;

/**
 * - BUILD CONFIG -
 *
 * Add packages here to configure them as part of the monorepo `yarn build`
 * setup. These must use a consistent package structure and (today) target
 * Node.js packages only.
 */
const buildConfig: BuildConfig = {
  /* eslint sort-keys: "error" */
  packages: {
    'community-cli-plugin': {
      target: 'node',
    },
    'debugger-shell': {
      emitTypeScriptDefs: true,
      target: 'node',
    },
    'dev-middleware': {
      emitTypeScriptDefs: true,
      target: 'node',
    },
    'metro-config': {
      emitTypeScriptDefs: true,
      target: 'node',
    },
    'react-native-compatibility-check': {
      emitTypeScriptDefs: true,
      target: 'node',
    },
  },
};

const defaultBuildOptions = {
  emitFlowDefs: true,
  emitTypeScriptDefs: false,
};

function getBuildOptions(
  packageName: keyof BuildConfig['packages'],
): Required<BuildOptions> {
  return {
    ...defaultBuildOptions,
    ...buildConfig.packages[packageName],
  };
}

function getBabelConfig(
  packageName: keyof BuildConfig['packages'],
): BabelCoreOptions {
  const {target} = getBuildOptions(packageName);

  switch (target) {
    case 'node':
      return require('./babel/node.config.js');
  }
}

function getTypeScriptCompilerOptions(
  packageName: keyof BuildConfig['packages'],
): Object {
  const {target} = getBuildOptions(packageName);

  switch (target) {
    case 'node':
      return {
        ...require('@tsconfig/node22/tsconfig.json').compilerOptions,
        moduleResolution: ModuleResolutionKind.Node16,
      };
  }
}

module.exports = {
  buildConfig,
  getBabelConfig,
  getBuildOptions,
  getTypeScriptCompilerOptions,
};
