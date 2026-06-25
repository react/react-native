/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as EnvironmentOptions from './EnvironmentOptions';
import {spawn, spawnSync} from 'child_process';
import fs from 'fs';
import os from 'os';
// $FlowExpectedError[untyped-import]
import {SourceMapConsumer} from 'source-map';

const BUCK_ISOLATION_DIR = 'react-native-fantom-buck-out';

export enum HermesVariant {
  Hermes,
  StaticHermesStable, // Static Hermes Stable
  // This creates too many combinations and it's not worth the cost for now.
  StaticHermesExperimental, // Static Hermes Trunk
}

export type EnvironmentOverrides = {
  LLVM_PROFILE_FILE?: string,
};

export function getBuckOptionsForHermes(
  variant: HermesVariant,
): ReadonlyArray<string> {
  const baseOptions = EnvironmentOptions.enableJSMemoryInstrumentation
    ? ['-c hermes.memory_instrumentation=true']
    : [];
  switch (variant) {
    case HermesVariant.Hermes:
      return [...baseOptions, '-c hermes.static_hermes=legacy'];
    case HermesVariant.StaticHermesStable:
      return [...baseOptions, '-c hermes.static_hermes=stable'];
    case HermesVariant.StaticHermesExperimental:
      return [...baseOptions, '-c hermes.static_hermes=trunk'];
  }
}

export function getHermesCompilerTarget(variant: HermesVariant): string {
  switch (variant) {
    case HermesVariant.Hermes:
      return '//xplat/hermes/tools/hermesc:hermesc';
    case HermesVariant.StaticHermesStable:
      return '//xplat/shermes/stable:hermesc';
    case HermesVariant.StaticHermesExperimental:
      return '//xplat/static_h:hermesc';
  }
}

export function getBuckModesForPlatform({
  enableCoverage,
  enableOptimized,
}: {
  enableCoverage: boolean,
  enableOptimized: boolean,
}): ReadonlyArray<string> {
  let mode = enableCoverage ? 'code-coverage' : enableOptimized ? 'opt' : 'dev';

  if (enableOptimized) {
    if (EnvironmentOptions.enableASAN || EnvironmentOptions.enableTSAN) {
      printConsoleLog({
        type: 'console-log',
        level: 'warn',
        message:
          'ASAN and TSAN are not supported in release mode. Use dev mode instead.',
      });
    }
  } else {
    if (EnvironmentOptions.enableASAN && EnvironmentOptions.enableTSAN) {
      printConsoleLog({
        type: 'console-log',
        level: 'warn',
        message:
          'ASAN and TSAN modes cannot be used together. Using ASAN mode as a fallback.',
      });
      mode = 'dev-asan';
    } else if (EnvironmentOptions.enableASAN) {
      mode = 'dev-asan';
    } else if (EnvironmentOptions.enableTSAN) {
      mode = 'dev-tsan';
    }
  }

  let osPlatform;
  switch (os.platform()) {
    case 'linux':
      osPlatform = `@//arvr/mode/linux/${mode}`;
      break;
    case 'darwin':
      osPlatform =
        /* $FlowFixMe[invalid-compare] Error discovered during Constant
         * Condition roll out. See https://fburl.com/workplace/4oq3zi07. */
        os.arch() === 'arm64'
          ? `@//arvr/mode/mac-arm/${mode}`
          : `@//arvr/mode/mac/${mode}`;
      break;
    case 'win32':
      osPlatform = `@//arvr/mode/win/${mode}`;
      break;
    default:
      throw new Error(`Unsupported platform: ${os.platform()}`);
  }

  const result: Array<string> = [
    '@//xplat/mode/react-native/granite',
    osPlatform,
  ];

  if (enableCoverage) {
    result.push(
      '-c',
      'code_coverage.enabled=filtered',
      '-c',
      'code_coverage.folder_path_filter=xplat/js/react-native-github',
    );
  }

  // The coverage platform (e.g. `@//arvr/mode/linux/code-coverage`) pins the
  // `core_build_mode` constraint to `opt`. `get_react_native_preprocessor_flags()`
  // in `tools/build_defs/oss/rn_defs.bzl` selects on that constraint
  // (`ovr_config//build_mode/constraints:{dev,opt}`) to decide between
  // `-DREACT_NATIVE_DEBUG` and `-DREACT_NATIVE_PRODUCTION`. Under coverage it
  // therefore compiles the native tester with `REACT_NATIVE_PRODUCTION`, which
  // breaks dev-mode tests that use debug-only native APIs (e.g. timer mocking
  // via `installHighResTimeStampMock`).
  //
  // Explicitly stack the `core_build_mode` constraint so the build reflects the
  // test's intended dev/opt mode. This only overrides `core_build_mode`; the
  // coverage instrumentation constraint and `-c code_coverage.*` flags above are
  // left intact, so coverage is still collected.
  if (enableCoverage) {
    result.push(
      '--modifier',
      enableOptimized
        ? 'ovr_config//build_mode/constraints:opt'
        : 'ovr_config//build_mode/constraints:dev',
    );
  }

  return result;
}

export type AsyncCommandResult = {
  originalCommand: string,
  childProcess: ReturnType<typeof spawn>,
  done: Promise<AsyncCommandResult>,
  pid: number,
  status: ?number,
  signal: ?string,
  error: ?Error,
  stdout: ?string,
  stderr: ?string,
};

export type SyncCommandResult = {
  originalCommand: string,
  pid: number,
  status: number,
  signal: ?string,
  error: ?Error,
  stdout: string,
  stderr: string,
};

function maybeLogCommand(command: string, args: ReadonlyArray<string>): void {
  if (EnvironmentOptions.logCommands) {
    console.log(`RUNNING \`${command} ${args.join(' ')}\``);
  }
}

function toEnv(env: EnvironmentOverrides): {[string]: string} {
  return Object.keys(env).reduce<{[string]: string}>((acc, key) => {
    if (env[key] != null) {
      acc[key] = env[key];
    }
    return acc;
  }, {});
}

export function runCommand(
  command: string,
  args: ReadonlyArray<string>,
  env: EnvironmentOverrides,
): AsyncCommandResult {
  maybeLogCommand(command, args);

  const childProcess = spawn(
    command,
    // spawn is typed with Array instead of with $ReadOnlyArray
    [...args],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        ...toEnv(env),
        PATH: `/usr/local/bin:/usr/bin:${process.env.PATH ?? ''}`,
      },
    },
  );

  const result: AsyncCommandResult = {
    childProcess,
    done: new Promise(resolve => {
      childProcess.on('close', (code: number, signal: string) => {
        result.status = code;
        result.signal = signal;
        resolve(result);
      });
    }),
    originalCommand: `${command} ${args.join(' ')}`,
    pid: childProcess.pid,
    status: null,
    signal: null,
    error: null,
    stdout: null,
    stderr: null,
  };

  childProcess.on('error', error => {
    result.error = error;
  });

  return result;
}

export function runCommandSync(
  command: string,
  args: ReadonlyArray<string>,
  env: EnvironmentOverrides,
): SyncCommandResult {
  maybeLogCommand(command, args);

  const result = spawnSync(command, [...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ...toEnv(env),
      PATH: `/usr/local/bin:/usr/bin:${process.env.PATH ?? ''}`,
    },
  });

  return {
    originalCommand: `${command} ${args.join(' ')}`,
    pid: result.pid,
    status: result.status,
    signal: result.signal,
    error: result.error,
    stdout: result.stdout.toString(),
    stderr: result.stderr?.toString() ?? '',
  };
}

export function getDebugInfoFromCommandResult(
  commandResult: SyncCommandResult | AsyncCommandResult,
): string {
  const maybeSignal =
    commandResult.signal != null ? `, signal: ${commandResult.signal}` : '';
  const resultByStatus =
    commandResult.status === 0
      ? 'succeeded'
      : `failed (status code: ${commandResult.status ?? '(empty)'}${maybeSignal})`;

  const logLines = [
    `Command ${resultByStatus}: ${commandResult.originalCommand}`,
    '',
    'stdout:',
    // $FlowExpectedError[sketchy-null-string]
    commandResult.stdout || '(empty)',
    '',
    'stderr:',
    // $FlowExpectedError[sketchy-null-string]
    commandResult.stderr || '(empty)',
  ];

  if (commandResult.error) {
    logLines.push('', 'error:', String(commandResult.error));
  }

  return logLines.join('\n');
}

function getCommandAndArgsWithFDB(
  command: string,
  args: Array<string>,
  useFDB: boolean,
) {
  if (useFDB) {
    return ['fdb', [command].concat(args)];
  } else {
    return [command, args];
  }
}

export function runBuck2(
  args: Array<string>,
  env: EnvironmentOverrides,
  options?: {withFDB: boolean},
): AsyncCommandResult {
  const [actualCommand, actualArgs] = getCommandAndArgsWithFDB(
    'buck2',
    processArgsForBuck(args),
    options?.withFDB ?? false,
  );
  return runCommand(actualCommand, actualArgs, env);
}

export function runBuck2Sync(
  args: Array<string>,
  env: EnvironmentOverrides,
  options?: {withFDB: boolean},
): SyncCommandResult {
  const [actualCommand, actualArgs] = getCommandAndArgsWithFDB(
    'buck2',
    processArgsForBuck(args),
    options?.withFDB ?? false,
  );
  return runCommandSync(actualCommand, actualArgs, env);
}

function processArgsForBuck(args: Array<string>): Array<string> {
  // If these tests are already running from withing a buck2 process, e.g. when
  // they are scheduled by a `buck2 test` wrapper, calling `buck2` again would
  // cause a daemon-level deadlock.
  // To prevent this - explicitly pass custom `--isolation-dir`. Reuse the same
  // dir across tests (even running in different jest processes) to properly
  // employ caching.
  if (process.env.BUCK2_WRAPPER != null) {
    return ['--isolation-dir', BUCK_ISOLATION_DIR].concat(args);
  }

  return args;
}

export function symbolicateStackTrace(
  sourceMapPath: string,
  stackTrace: string,
): string {
  const sourceMapData = JSON.parse(fs.readFileSync(sourceMapPath, 'utf8'));
  const consumer = new SourceMapConsumer(sourceMapData);

  return stackTrace
    .split('\n')
    .map(line => {
      const match = line.match(/at (.*) \((.*):(\d+):(\d+)\)/);
      if (match) {
        const functionName = match[1];
        // const fileName = match[2];
        const lineNumber = parseInt(match[3], 10);
        const columnNumber = parseInt(match[4], 10);
        // Get the original position
        const originalPosition = consumer.originalPositionFor({
          line: lineNumber,
          column: columnNumber,
        });
        return `at ${originalPosition.name ?? functionName} (${originalPosition.source}:${originalPosition.line}:${originalPosition.column})`;
      } else {
        return line;
      }
    })
    .join('\n');
}

type ChromeDevToolsTraceNode = {
  id: number,
  callFrame: {
    functionName: string,
    scriptId: string,
    url: string,
    lineNumber: number,
    columnNumber: number,
    ...
  },
  children: Array<number>,
  ...
};

type ChromeDevToolsTrace = {
  samples: Array<number>,
  timeDeltas: Array<number>,
  nodes: Array<ChromeDevToolsTraceNode>,
};

export function symbolicateJSTrace(
  jsTraceOutputPath: string,
  sourceMapPath: string,
) {
  const traceContents: ChromeDevToolsTrace = JSON.parse(
    fs.readFileSync(jsTraceOutputPath, 'utf8'),
  );
  const sourceMapData = JSON.parse(fs.readFileSync(sourceMapPath, 'utf8'));
  const consumer = new SourceMapConsumer(sourceMapData);

  for (const node of traceContents.nodes) {
    const {lineNumber, columnNumber} = node.callFrame;

    if (lineNumber === 0 || columnNumber === 0) {
      continue;
    }

    const originalPosition = consumer.originalPositionFor({
      line: lineNumber,
      column: columnNumber,
    });

    if (originalPosition.name) {
      node.callFrame.functionName = originalPosition.name;
    }

    if (originalPosition.source) {
      node.callFrame.url = `file://${originalPosition.source}`;
    }

    if (originalPosition.line && originalPosition.line > 0) {
      node.callFrame.lineNumber = originalPosition.line - 1;
    }

    if (originalPosition.column && originalPosition.column > 0) {
      node.callFrame.columnNumber = originalPosition.column;
    }
  }

  fs.writeFileSync(jsTraceOutputPath, JSON.stringify(traceContents), 'utf8');
}

export type ConsoleLogMessage = {
  type: 'console-log',
  level: 'info' | 'warn' | 'error',
  message: string,
};

export function printConsoleLog(log: ConsoleLogMessage): void {
  if (process.env.SANDCASTLE != null) {
    return;
  }

  switch (log.type) {
    case 'console-log':
      switch (log.level) {
        case 'info':
          console.log(log.message);
          break;
        case 'warn':
          console.warn(log.message);
          break;
        case 'error':
          console.error(log.message);
          break;
      }
      break;
  }
}

// Returns a markdown table corresponding to the given data, adopted from the RN console.table polyfill implementation
export function markdownTable(
  data: {[string]: {[string]: string}},
  indexColumnName?: string = '',
): string {
  const repeat = (element: string, n: number) =>
    Array.apply(null, Array(n)).map(() => element);

  const rows = Object.keys(data).map((key: string) => ({
    [indexColumnName]: key,
    ...data[key],
  }));

  if (rows.length === 0) {
    return '';
  }

  const columns = Array.from(
    rows.reduce((columnSet: Set<string>, row) => {
      Object.keys(row).forEach(key => columnSet.add(key));
      return columnSet;
    }, new Set()),
  );
  const stringRows: Array<Array<string>> = [];
  const columnWidths = [];

  // Figure out max cell width for each column
  columns.forEach((k, i) => {
    columnWidths[i] = k.length;
    for (let j = 0; j < rows.length; j++) {
      const cellStr = rows[j][k];
      stringRows[j] = stringRows[j] || [];
      stringRows[j][i] = cellStr;
      columnWidths[i] = Math.max(columnWidths[i], cellStr.length);
    }
  });

  // Join all elements in the row into a single string with | separators
  // (appends extra spaces to each cell to make separators  | aligned)
  const joinRow = (row: Array<string>, space?: string = ' ') => {
    const cells = row.map((cell: string, i) => {
      const extraSpaces = repeat(' ', columnWidths[i] - cell.length).join('');
      return cell + extraSpaces;
    });
    return '| ' + cells.join(space + '|' + space) + ' |';
  };

  const separators = columnWidths.map(columnWidth =>
    repeat('-', columnWidth).join(''),
  );
  const separatorRow = joinRow(separators);
  const header = joinRow(columns);
  const table = [header, separatorRow];

  for (let i = 0; i < rows.length; i++) {
    table.push(joinRow(stringRows[i]));
  }

  return '\n' + table.join('\n');
}
