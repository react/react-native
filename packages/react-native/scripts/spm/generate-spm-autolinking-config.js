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
 * The config command can be overridden by `--config-command` or
 * `RCT_SPM_AUTOLINKING_CONFIG_COMMAND`, in that order, before the default.
 *
 * No filtering or reshaping happens here — the downstream consumer
 * (generate-spm-autolinking.js) does its own iOS-only filtering when reading
 * the file.
 *
 * Removes the implicit `pod install` dependency the SPM flow has today for
 * external dep discovery.
 */

const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

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

function parseConfigCommandJson(
  raw /*: string */,
  source /*: string */,
) /*: Array<string> */ {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `${source}: config command must be a JSON array of strings. Example: '["npx","@react-native-community/cli","config"]'`,
    );
  }

  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    !parsed.every(value => typeof value === 'string' && value.length > 0)
  ) {
    throw new Error(
      `${source}: config command must be a non-empty JSON array of non-empty strings`,
    );
  }

  return parsed;
}

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

const ENV_CONFIG_COMMAND = 'RCT_SPM_AUTOLINKING_CONFIG_COMMAND';

// The raw env override, or null when unset or blank. Exported so callers that
// only need to know whether the override is in play (setup-apple-spm.js) share
// this blankness rule instead of re-deriving it.
function readEnvConfigCommand() /*: ?string */ {
  const raw = process.env[ENV_CONFIG_COMMAND];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : null;
}

// The env override, parsed and validated, or null when unset or blank. Throws
// on a set-but-invalid value — never silently degrades to the default.
function resolveEnvConfigCommand() /*: ?Array<string> */ {
  const raw = readEnvConfigCommand();
  return raw == null ? null : parseConfigCommandJson(raw, ENV_CONFIG_COMMAND);
}

// Env-var / default resolution for the autolinking config command. An explicit
// `configCommand` (e.g. from `--config-command`) is handled upstream by
// generateAutolinkingConfig's destructuring default, so it never reaches here —
// this only decides between the env-var override and the built-in default.
function resolveConfigCommand(projectRoot /*: string */) /*: Array<string> */ {
  return resolveEnvConfigCommand() ?? resolveDefaultConfigCommand(projectRoot);
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
    configCommand = resolveConfigCommand(projectRoot),
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

module.exports = {
  generateAutolinkingConfig,
  parseConfigCommandJson,
  readEnvConfigCommand,
  resolveConfigCommand,
  resolveDefaultConfigCommand,
  resolveEnvConfigCommand,
};
