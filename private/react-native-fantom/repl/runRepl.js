/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AsyncCommandResult} from '../runner/utils';

import {isCI, isOSS} from '../runner/EnvironmentOptions';
import {run as runTester} from '../runner/executables/tester';
import getHostPlatform from '../runner/getHostPlatform';
import {getTestBuildOutputPath} from '../runner/paths';
import {HermesVariant, runCommand} from '../runner/utils';
import {
  PROJECT_ROOT,
  buildWarmupBundle,
  fetchDeltaBundle,
} from './replBundling';
import {startMetroServer, stopMetroServer} from './replMetro';
import {isRecoverableError, transform} from './replTransform';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import repl from 'repl';
import tty from 'tty';

type ReplMessage =
  | {type: 'console-log', level: 'info' | 'warn' | 'error', message: string}
  | {type: 'repl-result', text: string}
  | {type: 'repl-error', message: string, stack: string}
  | {type: 'repl-completions', names: Array<string>}
  | {type: 'repl-eval-complete', id: number};

type PendingEval = {
  result: ?string,
  error: ?{message: string, stack: string},
  completions: ?Array<string>,
  resolve: () => void,
};

type FrameResult = {
  result: ?string,
  error: ?{message: string, stack: string},
  completions: ?Array<string>,
};

type CliOptions =
  | {mode: 'repl'}
  | {mode: 'eval', code: string}
  | {mode: 'file', filePath: string};

// Mirrors Node: no args -> REPL, `-e <code>` -> evaluate and exit, a filename
// -> run that script and exit.
function parseArgs(argv: ReadonlyArray<string>): CliOptions {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-e' || arg === '--eval') {
      const code = argv[i + 1];
      if (code == null) {
        throw new Error(`${arg} requires an argument`);
      }
      return {mode: 'eval', code};
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    return {mode: 'file', filePath: path.resolve(process.cwd(), arg)};
  }
  return {mode: 'repl'};
}

const SUPPORTS_COLOR: boolean = tty.isatty(1);
const SUPPORTS_COLOR_STDERR: boolean = tty.isatty(2);

function paint(code: string, text: string, enabled: boolean): string {
  return enabled ? `\x1b[${code}m${text}\x1b[0m` : text;
}

function buildBanner(): string {
  return (
    paint(
      '36',
      '👻 Fantom REPL — evaluating against Hermes inside the Fantom runtime.',
      SUPPORTS_COLOR,
    ) +
    '\n' +
    paint(
      '33',
      '   ⚠️  Experimental: behavior and APIs may change.',
      SUPPORTS_COLOR,
    ) +
    '\n' +
    paint(
      '90',
      '   `React`, `ReactNative` and `Fantom` are available globally. Ctrl-D to exit.',
      SUPPORTS_COLOR,
    ) +
    '\n'
  );
}

function spawnTester(args: ReadonlyArray<string>): AsyncCommandResult {
  if (isOSS) {
    const ossPath = path.resolve(
      __dirname,
      '..',
      'build',
      'tester',
      'fantom_tester',
    );
    return runCommand(ossPath, args, {});
  }

  return runTester(
    args,
    {
      hermesVariant: HermesVariant.Hermes,
      enableOptimized: false,
      enableCoverage: false,
    },
    {},
  );
}

export default async function runRepl(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  await startMetroServer();

  const outputDir = getTestBuildOutputPath();
  fs.mkdirSync(outputDir, {recursive: true});

  const warmupBundlePath = path.join(outputDir, 'repl-warmup.bundle.js');
  await buildWarmupBundle(warmupBundlePath);

  const result = spawnTester([
    '--interactive',
    '--bundlePath',
    warmupBundlePath,
    '--featureFlags',
    '{}',
    '--minLogLevel',
    'error',
  ]);
  const child = result.childProcess;

  const stdout = child.stdout;
  const stdin = child.stdin;
  if (stdout == null || stdin == null) {
    throw new Error('Fantom tester process did not expose stdio pipes');
  }

  if (child.stderr != null) {
    child.stderr.pipe(process.stderr);
  }

  let pending: ?PendingEval = null;

  const lineReader = readline.createInterface({input: stdout});
  lineReader.on('line', (rawLine: string) => {
    const line = rawLine.trim();
    if (line === '') {
      return;
    }

    let message: ?ReplMessage;
    try {
      message = JSON.parse(line);
    } catch {
      // Not a structured message — surface it directly.
      process.stdout.write(rawLine + '\n');
      return;
    }

    switch (message?.type) {
      case 'console-log':
        if (message.level === 'error') {
          process.stderr.write(message.message + '\n');
        } else {
          process.stdout.write(message.message + '\n');
        }
        break;
      case 'repl-result':
        if (pending != null) {
          pending.result = message.text;
        }
        break;
      case 'repl-error':
        if (pending != null) {
          pending.error = {message: message.message, stack: message.stack};
        }
        break;
      case 'repl-completions':
        if (pending != null) {
          pending.completions = message.names;
        }
        break;
      case 'repl-eval-complete': {
        const current = pending;
        pending = null;
        if (current != null) {
          current.resolve();
        }
        break;
      }
      default:
        break;
    }
  });

  function evaluateFrame(payload: string): Promise<FrameResult> {
    return new Promise(resolve => {
      const state: PendingEval = {
        result: null,
        error: null,
        completions: null,
        resolve: () =>
          resolve({
            result: state.result,
            error: state.error,
            completions: state.completions,
          }),
      };
      pending = state;

      const buffer = Buffer.from(payload, 'utf8');
      stdin.write(String(buffer.length) + '\n');
      stdin.write(buffer);
    });
  }

  let childExited = false;
  child.on('exit', () => {
    childExited = true;
    if (pending != null) {
      const current = pending;
      pending = null;
      current.resolve();
    }
  });

  // Wait for the warm-up to finish (the binary only reads stdin after the
  // warm-up bundle has been evaluated) and configure the runtime once, on
  // startup, with the constants computed here and whether to colorize output.
  const colorsEnabled = options.mode === 'repl' && SUPPORTS_COLOR;
  const constants = {
    isOSS,
    isRunningFromCI: isCI,
    runBenchmarks: false,
    fantomConfigSummary: '',
    jsHeapSnapshotOutputPathTemplate: '',
    jsHeapSnapshotOutputPathTemplateToken: '',
    jsTraceOutputPath: null,
    hostPlatform: getHostPlatform(),
  };
  await evaluateFrame(
    `globalThis.$$ReplConfigure$$(${JSON.stringify({
      colors: colorsEnabled,
      constants,
    })});\n`,
  );

  if (childExited) {
    throw new Error(
      'Fantom tester exited before the REPL was ready. See logs above.',
    );
  }

  const priorNames = new Set<string>();
  let evalCounter = 0;
  let evalChain: Promise<void> = Promise.resolve();

  async function shutdownAndExit(code: number): Promise<void> {
    try {
      stdin.end();
    } catch {}
    try {
      await stopMetroServer();
    } catch {}
    // Make sure buffered stdout (e.g. console output from a script) is flushed
    // before exiting.
    await new Promise<void>(resolve => {
      if (process.stdout.write('')) {
        resolve();
      } else {
        process.stdout.once('drain', () => resolve());
      }
    });
    process.exit(code);
  }

  function replEval(
    input: string,
    context: unknown,
    filename: string,
    callback: (error: ?Error, result: unknown) => void,
  ): void {
    // Node's REPL does not wait for our async callback before reading the next
    // line when stdin is not a TTY (e.g. piped input or scripts). Serialize
    // evaluations so they run one at a time and in order.
    evalChain = evalChain.then(() => evalInput(input, callback));
  }

  async function evalInput(
    rawInput: string,
    callback: (error: ?Error, result: unknown) => void,
  ): Promise<void> {
    try {
      await evalInputUnsafe(rawInput, callback);
    } catch (error: unknown) {
      callback(null, formatError(error));
    }
  }

  async function evalInputUnsafe(
    rawInput: string,
    callback: (error: ?Error, result: unknown) => void,
  ): Promise<void> {
    const input = rawInput.trim();
    if (input === '') {
      callback(null, undefined);
      return;
    }

    let transformed;
    try {
      transformed = transform(input, priorNames);
    } catch (parseError: unknown) {
      if (isRecoverableError(parseError)) {
        callback(new repl.Recoverable(toError(parseError)), undefined);
      } else {
        callback(null, formatError(parseError));
      }
      return;
    }

    const id = evalCounter++;
    const entryPath = path.join(outputDir, `repl-${process.pid}-${id}.js`);
    fs.writeFileSync(entryPath, transformed.code, 'utf8');

    let deltaText;
    try {
      deltaText = await fetchDeltaBundle(entryPath);
    } catch (bundleError: unknown) {
      callback(null, formatError(bundleError));
      return;
    } finally {
      try {
        fs.unlinkSync(entryPath);
      } catch {}
    }

    const payload = deltaText + '\n;globalThis.$$ReplReport$$();\n';
    const {result: evalResult, error: evalError} = await evaluateFrame(payload);

    if (childExited) {
      callback(new Error('Fantom tester process exited.'), undefined);
      return;
    }

    if (evalError != null) {
      callback(
        null,
        paint(
          '31',
          evalError.stack !== '' ? evalError.stack : evalError.message,
          SUPPORTS_COLOR,
        ),
      );
      return;
    }

    // Only commit the new bindings to our view of the scope once the evaluation
    // succeeded (the runtime only writes them back to $$REPL_SCOPE$$ on success).
    priorNames.clear();
    for (const name of transformed.newNames) {
      priorNames.add(name);
    }

    callback(null, transformed.hasResult ? evalResult : undefined);
  }

  // Queries the runtime for completion candidates: either the global
  // identifiers + REPL scope bindings (objectExpr == null), or the property
  // names of `objectExpr` (a simple member chain evaluated with REPL scope
  // bridged in). Property names only — values/getters are never read.
  async function queryCompletionNames(
    objectExpr: ?string,
  ): Promise<Array<string>> {
    let payload;
    if (objectExpr == null) {
      payload = 'globalThis.$$ReplComplete$$(null);\n';
    } else {
      const bridge =
        priorNames.size > 0
          ? `let {${[...priorNames].join(', ')}} = globalThis.$$REPL_SCOPE$$;\n`
          : '';
      payload = `(() => { ${bridge}globalThis.$$ReplComplete$$(() => (${objectExpr})); })();\n`;
    }
    const {completions} = await evaluateFrame(payload);
    return completions ?? [];
  }

  async function computeCompletions(
    line: string,
  ): Promise<[Array<string>, string]> {
    const partialMatch = line.match(/[A-Za-z_$][\w$]*$/);
    const partial = partialMatch != null ? partialMatch[0] : '';
    const beforePartial = line.slice(0, line.length - partial.length);

    let names: Array<string>;
    if (beforePartial.endsWith('.')) {
      const objectSource = beforePartial.slice(0, -1);
      // Only complete members of a simple dotted identifier chain to avoid
      // evaluating calls/indexing with side effects.
      const chainMatch = objectSource.match(
        /[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/,
      );
      if (chainMatch == null) {
        return [[], partial];
      }
      names = await queryCompletionNames(chainMatch[0]);
    } else {
      names = await queryCompletionNames(null);
    }

    const hits = names.filter(name => name.startsWith(partial)).sort();
    return [hits, partial];
  }

  function completer(
    line: string,
    callback: (error: ?Error, result: [Array<string>, string]) => void,
  ): void {
    computeCompletions(line).then(
      completions => callback(null, completions),
      () => callback(null, [[], line]),
    );
  }

  // One-shot evaluation for `-e <code>` and for running a script file. Unlike
  // the REPL, the value of a trailing expression is not printed (matching
  // `node -e` / running a script); use `console.log` to print.
  async function runOnce(entryPath: string, cleanup: boolean): Promise<void> {
    let deltaText;
    try {
      deltaText = await fetchDeltaBundle(entryPath);
    } catch (bundleError: unknown) {
      process.stderr.write(
        paint('31', formatError(bundleError), SUPPORTS_COLOR_STDERR) + '\n',
      );
      await shutdownAndExit(1);
      return;
    } finally {
      if (cleanup) {
        try {
          fs.unlinkSync(entryPath);
        } catch {}
      }
    }

    // `$$ReplReport$$` surfaces any error captured during evaluation. The raw
    // code does not set a result, so (unlike the REPL) nothing is auto-printed
    // on success — matching `node -e` / running a script.
    const {error} = await evaluateFrame(
      deltaText + '\n;globalThis.$$ReplReport$$();\n',
    );

    if (childExited) {
      process.stderr.write('Fantom tester process exited.\n');
      await shutdownAndExit(1);
      return;
    }
    if (error != null) {
      process.stderr.write(
        paint(
          '31',
          error.stack !== '' ? error.stack : error.message,
          SUPPORTS_COLOR_STDERR,
        ) + '\n',
      );
      await shutdownAndExit(1);
      return;
    }
    await shutdownAndExit(0);
  }

  if (options.mode === 'eval') {
    const id = evalCounter++;
    const entryPath = path.join(outputDir, `repl-eval-${process.pid}-${id}.js`);
    fs.writeFileSync(entryPath, options.code, 'utf8');
    await runOnce(entryPath, true);
    return;
  }

  if (options.mode === 'file') {
    if (!fs.existsSync(options.filePath)) {
      process.stderr.write(`Cannot find script '${options.filePath}'\n`);
      await shutdownAndExit(1);
      return;
    }
    // Metro can only bundle files inside the repo (the bundle URL is the path
    // relative to PROJECT_ROOT), so reject scripts outside it with a clear error.
    const relativeToRoot = path.relative(PROJECT_ROOT, options.filePath);
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
      process.stderr.write(
        `Script must be inside the React Native repository (${PROJECT_ROOT}): ${options.filePath}\n`,
      );
      await shutdownAndExit(1);
      return;
    }
    await runOnce(options.filePath, false);
    return;
  }

  process.stdout.write(buildBanner());

  // Node's readline accepts an async completer with a `(line, callback)`
  // signature (required here because computing completions needs an async
  // round-trip to the runtime), and we verified it works via a pseudo-terminal.
  // The Node Flow libdef, however, only types the synchronous
  // `(line) => [completions, line]` form, so it rejects the async signature.
  // $FlowFixMe[incompatible-type]
  const replServer = repl.start({
    prompt: 'fantom> ',
    eval: replEval,
    completer,
    writer: (output: unknown) => (output == null ? '' : String(output)),
    ignoreUndefined: true,
  });

  replServer.on('exit', () => {
    void shutdownAndExit(0);
  });
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
}
