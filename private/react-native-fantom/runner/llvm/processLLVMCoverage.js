/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  LLVMFileData,
  LLVMFunctionData,
} from '../coverage/convertLLVMCoverage';
import type {FileCoverageData} from '../coverage/types.flow';

import convertLLVMCoverage from '../coverage/convertLLVMCoverage';
import * as EnvironmentOptions from '../EnvironmentOptions';
import {
  getDebugInfoFromCommandResult,
  printConsoleLog,
  runCommand,
  runCommandSync,
} from '../utils';
import fs from 'fs';
import os from 'os';
import path from 'path';

const FANTOM_DIR = path.resolve(__dirname, '..', '..');
const RN_ROOT = path.resolve(FANTOM_DIR, '..', '..');

let _repoRoot: ?string = null;
function getRepoRoot(): string {
  if (_repoRoot != null) {
    return _repoRoot;
  }

  const res = runCommandSync('hg', ['root'], {});
  if (res.status !== 0) {
    throw new Error(
      `Failed to get repo root: ${getDebugInfoFromCommandResult(res)}`,
    );
  }
  _repoRoot = res.stdout.trim();
  return _repoRoot;
}

function getLLVMCommand(command: 'llvm-profdata' | 'llvm-cov'): string {
  return path.join(
    getRepoRoot(),
    'arvr',
    'third-party',
    'toolchains',
    'platform010',
    'build',
    'llvm-fb',
    '17',
    'bin',
    command,
  );
}

export default async function processLLVMCoverage(
  profrawFilePath: string,
  binaryPath: string,
): Promise<{[string]: FileCoverageData}> {
  if (!fs.existsSync(profrawFilePath)) {
    printConsoleLog({
      type: 'console-log',
      level: 'warn',
      message: `No .profraw file found at ${profrawFilePath}, skipping C++ coverage`,
    });
    return {};
  }

  const profdataFilePath = profrawFilePath.replace('.profraw', '.profdata');
  const coverageJsonPath = profrawFilePath.replace('.profraw', '-cpp.json');

  if (os.platform() !== 'linux') {
    printConsoleLog({
      type: 'console-log',
      level: 'warn',
      message: `C++ coverage is only supported on Linux`,
    });
    return {};
  }

  if (EnvironmentOptions.isOSS) {
    printConsoleLog({
      type: 'console-log',
      level: 'warn',
      message: `C++ coverage is not supported in OSS mode`,
    });
    return {};
  }

  try {
    const mergeResult = runCommandSync(
      getLLVMCommand('llvm-profdata'),
      ['merge', '-sparse', profrawFilePath, '-o', profdataFilePath],
      {},
    );

    if (mergeResult.status !== 0) {
      printConsoleLog({
        type: 'console-log',
        level: 'error',
        message: `Failed to merge .profraw file`,
      });
      return {};
    }
    const exportCommand = runCommand(
      'sh',
      [
        '-c',
        `${getLLVMCommand('llvm-cov')} ${[
          'export',
          `-instr-profile=${profdataFilePath}`,
          '-format=text',
          `-path-equivalence=/re_cwd,${getRepoRoot()}`,
          binaryPath,
          '--sources',
          RN_ROOT,
        ]
          .map(arg => `"${arg}"`)
          .join(' ')} > "${coverageJsonPath}"`,
      ],
      {},
    );

    const exportResult = await exportCommand.done;

    if (exportResult.status !== 0) {
      printConsoleLog({
        type: 'console-log',
        level: 'error',
        message: `Failed to export coverage data: ${getDebugInfoFromCommandResult(exportResult)}`,
      });
      return {};
    }

    const coverageData = fs.readFileSync(coverageJsonPath, 'utf8');
    // Parse the JSON data
    const {data} = JSON.parse(coverageData) as {
      data: Array<{
        files: Array<LLVMFileData>,
        functions: Array<LLVMFunctionData>,
      }>,
    };

    // Group functions by filename
    const functionsMap: Map<string, Array<LLVMFunctionData>> = new Map();
    for (const {functions} of data) {
      for (const func of functions) {
        for (const filename of func.filenames) {
          let funcList = functionsMap.get(filename);
          if (funcList == null) {
            funcList = [];
            functionsMap.set(filename, funcList);
          }
          funcList.push(func);
        }
      }
    }

    const result: {[filename: string]: FileCoverageData} = {};
    for (const {files} of data) {
      for (const file of files) {
        const funcList = functionsMap.get(file.filename) ?? [];
        const fileCoverage = convertLLVMCoverage(file, funcList);
        fileCoverage.path = fileCoverage.path.replace(
          /^\/re_cwd/,
          getRepoRoot(),
        );
        result[fileCoverage.path] = fileCoverage;
      }
    }

    return result;
  } catch (error) {
    printConsoleLog({
      type: 'console-log',
      level: 'error',
      message: `Error processing C++ coverage: ${String(error)}`,
    });
    return {};
  }
}
