/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * generate-spm-autolinking-config.js — JS port of the autolinking.json
 * generation step in packages/react-native/scripts/cocoapods/autolinking.rb.
 *
 * Invokes the React Native community CLI to produce its config and writes the
 * raw JSON to <project.ios.sourceDir>/build/generated/autolinking/autolinking.json.
 *
 * No filtering or reshaping happens here — the downstream consumer
 * (generate-spm-autolinking.js) does its own iOS-only filtering when reading
 * the file.
 *
 * Removes the implicit `pod install` dependency the SPM flow has today for
 * external dep discovery.
 */

const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');

/*::
import type {CliConfigJson} from './spm-types';

type CliRunnerResult = {
  stdout: string,
  stderr: string,
  exitCode: number,
};
type CliRunner = (
  command: Array<string>,
  opts: {cwd: string},
) => CliRunnerResult;
type Options = {
  projectRoot: string,
  configCommand?: Array<string>,
  cliRunner?: CliRunner,
};
type GenerateAutolinkingConfigResult = {
  config: CliConfigJson,
  outputPath: string,
  rawJson: string,
};
*/

const FALLBACK_CONFIG_COMMAND = [
  'npx',
  '--no-install',
  '@react-native-community/cli',
  'config',
];

function resolveDefaultConfigCommand(
  projectRoot /*: string */,
) /*: Array<string> */ {
  try {
    const pkgJsonPath = require.resolve(
      '@react-native-community/cli/package.json',
      {paths: [projectRoot]},
    );
    // $FlowFixMe[unclear-type] package.json has dynamic shape
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const bin = pkgJson.bin;
    const binPath =
      typeof bin === 'string'
        ? bin
        : typeof bin?.['rnc-cli'] === 'string'
          ? bin['rnc-cli']
          : bin != null && typeof bin === 'object'
            ? bin[Object.keys(bin)[0]]
            : null;

    if (typeof binPath === 'string' && binPath.length > 0) {
      return [
        process.execPath,
        path.join(path.dirname(pkgJsonPath), binPath),
        'config',
      ];
    }
  } catch {
    // Fall through to a no-install npx invocation for older layouts.
  }

  return FALLBACK_CONFIG_COMMAND;
}

function defaultCliRunner(
  command /*: Array<string> */,
  opts /*: {cwd: string} */,
) /*: CliRunnerResult */ {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: opts.cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    stdout: typeof result.stdout === 'string' ? result.stdout : '',
    stderr: typeof result.stderr === 'string' ? result.stderr : '',
    exitCode: typeof result.status === 'number' ? result.status : 1,
  };
}

function generateAutolinkingConfig(
  opts /*: Options */,
) /*: GenerateAutolinkingConfigResult */ {
  const {
    projectRoot,
    configCommand = resolveDefaultConfigCommand(projectRoot),
    cliRunner = defaultCliRunner,
  } = opts;

  if (!Array.isArray(configCommand) || configCommand.length === 0) {
    throw new Error(
      'generate-spm-autolinking-config: config command must be a non-empty array of strings',
    );
  }

  const result = cliRunner(configCommand, {cwd: projectRoot});

  if (result.exitCode !== 0) {
    throw new Error(
      `generate-spm-autolinking-config: '${configCommand.join(' ')}' exited with status ${result.exitCode}\n${result.stderr}`,
    );
  }

  const rawJson = result.stdout;
  const config /*: CliConfigJson */ = JSON.parse(rawJson);

  const iosSourceDir = config?.project?.ios?.sourceDir;
  if (typeof iosSourceDir !== 'string' || iosSourceDir.length === 0) {
    throw new Error(
      'generate-spm-autolinking-config: CLI config did not provide project.ios.sourceDir',
    );
  }

  const outPath = path.join(
    iosSourceDir,
    'build',
    'generated',
    'autolinking',
    'autolinking.json',
  );

  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, rawJson);

  return {config, outputPath: outPath, rawJson};
}

module.exports = {generateAutolinkingConfig, resolveDefaultConfigCommand};
