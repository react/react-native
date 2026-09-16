/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Command, Config} from '@react-native-community/cli-types';

export type CodegenCommandArgs = {
  path: string,
  platform: string,
  outputPath?: string,
  source: string,
};

const codegenCommand: Command = {
  name: 'codegen',
  options: [
    {
      name: '--path <path>',
      description: 'Path to the React Native project root.',
      default: process.cwd(),
    },
    {
      name: '--platform <string>',
      description:
        'Target platform. Supported values: "android", "ios", "all".',
      default: 'all',
    },
    {
      name: '--outputPath <path>',
      description: 'Path where generated artifacts will be output to.',
    },
    {
      name: '--source <string>',
      description: 'Whether the script is invoked from an `app` or a `library`',
      default: 'app',
    },
  ],
  func: (
    argv: Array<string>,
    config: Config,
    args: CodegenCommandArgs,
  ): void => {
    const generateArtifactsExecutor = require.resolve(
      'react-native/scripts/codegen/generate-artifacts-executor/index',
      {paths: [config.root]},
    );
    // $FlowFixMe[unsupported-syntax] dynamic require of a resolved path
    require(generateArtifactsExecutor).execute(
      args.path,
      args.platform,
      args.outputPath,
      args.source,
    );
  },
};

export default codegenCommand;
