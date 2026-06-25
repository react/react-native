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
  FailureDetail,
  TestCaseResult,
  TestSuiteResult,
} from '../runtime/setup';
import type {
  TestInlineSnapshotResults,
  TestSnapshotResults,
} from '../runtime/snapshotContext';
import type {BenchmarkResult} from '../src/Benchmark';
import type {CoverageMap} from './coverage/types.flow';
import type {PendingInlineSnapshot} from './snapshotUtils';
import type {
  AsyncCommandResult,
  ConsoleLogMessage,
  EnvironmentOverrides,
  HermesVariant,
} from './utils';

import {printBenchmarkResultsRanking} from './benchmarkUtils';
import {createBundle, createSourceMap} from './bundling';
import {shouldCollectCoverage} from './coverageUtils';
import entrypointTemplate from './entrypoint-template';
import * as EnvironmentOptions from './EnvironmentOptions';
import {run as runHermesCompiler} from './executables/hermesc';
import {
  getFantomTesterPath,
  run as runFantomTester,
} from './executables/tester';
import formatFantomConfig from './formatFantomConfig';
import getFantomTestConfigs from './getFantomTestConfigs';
import processLLVMCoverage from './llvm/processLLVMCoverage';
import {
  JS_HEAP_SNAPSHOTS_OUTPUT_PATH,
  JS_TRACES_OUTPUT_PATH,
  buildJSHeapSnapshotsOutputPathTemplate,
  buildJSTracesOutputPath,
  getTestBuildOutputPath,
} from './paths';
import {
  getInitialSnapshotData,
  processInlineSnapshotResults,
  saveInlineSnapshotsToSource,
  updateSnapshotsAndGetJestSnapshotResult,
} from './snapshotUtils';
import {
  HermesVariant as HermesVariantEnum,
  getDebugInfoFromCommandResult,
  printConsoleLog,
  runCommand,
  symbolicateJSTrace,
  symbolicateStackTrace,
} from './utils';
import fs from 'fs';
// $FlowExpectedError[untyped-import]
import {formatResultsErrors} from 'jest-message-util';
import {SnapshotState, buildSnapshotResolver} from 'jest-snapshot';
import nullthrows from 'nullthrows';
import path from 'path';
import readline from 'readline';

const TEST_BUILD_OUTPUT_PATH = getTestBuildOutputPath();
fs.mkdirSync(TEST_BUILD_OUTPUT_PATH, {recursive: true});
fs.mkdirSync(JS_HEAP_SNAPSHOTS_OUTPUT_PATH, {recursive: true});

if (EnvironmentOptions.profileJS) {
  fs.mkdirSync(JS_TRACES_OUTPUT_PATH, {recursive: true});
}

function buildError(
  failureDetail: FailureDetail,
  sourceMapPath: string,
): Error {
  const error = new Error(failureDetail.message);
  if (failureDetail.stack != null) {
    error.stack = symbolicateStackTrace(sourceMapPath, failureDetail.stack);
  }
  if (failureDetail.cause != null) {
    error.cause = buildError(failureDetail.cause, sourceMapPath);
  }
  return error;
}

async function processRNTesterCommandResult(
  result: AsyncCommandResult,
): Promise<[TestSuiteResult, ?BenchmarkResult]> {
  const stdoutChunks = [];
  const stderrChunks = [];

  result.childProcess.stdout.on('data', chunk => {
    stdoutChunks.push(chunk);
  });

  result.childProcess.stderr.on('data', chunk => {
    stderrChunks.push(chunk);
  });

  let testResult, benchmarkResult;

  const rl = readline.createInterface({input: result.childProcess.stdout});
  rl.on('line', (rawLine: string) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    let parsed: ConsoleLogMessage;
    try {
      parsed = JSON.parse(line);
    } catch {
      parsed = {
        type: 'console-log',
        level: 'info',
        message: line,
      };
    }

    switch (parsed?.type) {
      case 'test-result':
        testResult = parsed;
        break;
      case 'benchmark-result':
        benchmarkResult = parsed;
        break;
      case 'console-log':
        printConsoleLog(parsed);
        break;
      default:
        printConsoleLog({
          type: 'console-log',
          level: 'info',
          message: line,
        });
        break;
    }
  });

  await result.done;

  const getResultWithOutput = (): AsyncCommandResult => ({
    ...result,
    stdout: stdoutChunks.join(''),
    stderr: stderrChunks.join(''),
  });

  if (result.status !== 0) {
    throw new Error(getDebugInfoFromCommandResult(getResultWithOutput()));
  }

  if (EnvironmentOptions.printCLIOutput) {
    console.log(getDebugInfoFromCommandResult(getResultWithOutput()));
  }

  if (testResult == null) {
    throw new Error(
      'Failed to find test results in RN tester binary output.\n' +
        getDebugInfoFromCommandResult(result),
    );
  }

  return [testResult, benchmarkResult];
}

function generateBytecodeBundle({
  sourcePath,
  bytecodePath,
  enableOptimized,
  hermesVariant,
  enableCoverage,
}: {
  bytecodePath: string,
  enableCoverage: boolean,
  enableOptimized: boolean,
  hermesVariant: HermesVariant,
  sourcePath: string,
}): void {
  const hermesCompilerCommandResult = runHermesCompiler(
    [
      '-emit-binary',
      enableOptimized ? '-O' : null,
      '-max-diagnostic-width',
      '80',
      '-out',
      bytecodePath,
      sourcePath,
    ].filter(Boolean),
    {
      enableOptimized,
      hermesVariant,
      enableCoverage,
    },
  );

  if (hermesCompilerCommandResult.status !== 0) {
    throw new Error(getDebugInfoFromCommandResult(hermesCompilerCommandResult));
  }
}

module.exports = async function runTest(
  globalConfig: {
    updateSnapshot: 'all' | 'new' | 'none',
    collectCoverage: boolean,
    ...
  },
  config: {
    rootDir: string,
    prettierPath: string,
    snapshotFormat: {...},
    ...
  },
  environment: {...},
  runtime: {...},
  testPath: string,
): unknown {
  let coverageMap: CoverageMap = {};
  const snapshotResolver = await buildSnapshotResolver(config);
  const snapshotPath = snapshotResolver.resolveSnapshotPath(testPath);
  const snapshotState = new SnapshotState(snapshotPath, {
    updateSnapshot: globalConfig.updateSnapshot,
    snapshotFormat: config.snapshotFormat,
    prettierPath: config.prettierPath,
    rootDir: config.rootDir,
  });

  const startTime = Date.now();

  const testContents = fs.readFileSync(testPath, 'utf8');
  const testConfigs = getFantomTestConfigs(testPath, testContents);

  const setupModulePath = path.resolve(__dirname, '../runtime/setup.js');
  const featureFlagsModulePath = path.resolve(
    __dirname,
    '../../../packages/react-native/src/private/featureflags/ReactNativeFeatureFlags.js',
  );

  const testResultsByConfig = [];
  const benchmarkResults = [];
  const allPendingInlineSnapshots: Array<PendingInlineSnapshot> = [];

  const skippedTestResults = ({
    ancestorTitles,
    title,
  }: {
    ancestorTitles: string[],
    title: string,
  }) => [
    {
      ancestorTitles,
      duration: 0,
      failureDetails: [] as Array<Error>,
      failureMessages: [] as Array<string>,
      fullName: title,
      numPassingAsserts: 0,
      snapshotResults: {} as TestSnapshotResults,
      inlineSnapshotResults: [] as TestInlineSnapshotResults,
      status: 'pending' as TestCaseResult['status'],
      testFilePath: testPath,
      title,
    },
  ];

  for (const testConfig of testConfigs) {
    if (EnvironmentOptions.isOSS && testConfig.isNativeOptimized) {
      testResultsByConfig.push(
        skippedTestResults({
          ancestorTitles: ['"@fantom_mode opt" in docblock'],
          title: 'Optimized mode is not yet supported in OSS',
        }),
      );
      continue;
    }

    if (
      EnvironmentOptions.isOSS &&
      testConfig.hermesVariant !== HermesVariantEnum.Hermes
    ) {
      testResultsByConfig.push(
        skippedTestResults({
          ancestorTitles: [
            '"@fantom_hermes_variant static_hermes" in docblock (shermes 🧪)',
          ],
          title: 'Static Hermes is not yet supported in OSS',
        }),
      );
      continue;
    }

    if (EnvironmentOptions.isOSS && testConfig.isJsBytecode) {
      testResultsByConfig.push(
        skippedTestResults({
          ancestorTitles: ['"@fantom_mode dev" in docblock'],
          title: 'Hermes bytecode is not yet supported in OSS',
        }),
      );
      continue;
    }

    const jsTraceOutputPath = EnvironmentOptions.profileJS
      ? buildJSTracesOutputPath({
          testPath,
          testConfig,
          isMultiConfigTest: testConfigs.length > 1,
        })
      : null;

    const [
      jsHeapSnapshotOutputPathTemplate,
      jsHeapSnapshotOutputPathTemplateToken,
    ] = buildJSHeapSnapshotsOutputPathTemplate({
      testPath,
      testConfig,
      isMultiConfigTest: testConfigs.length > 1,
    });

    const entrypointContents = entrypointTemplate({
      testPath: `${path.relative(TEST_BUILD_OUTPUT_PATH, testPath)}`,
      setupModulePath: `${path.relative(TEST_BUILD_OUTPUT_PATH, setupModulePath)}`,
      featureFlagsModulePath: `${path.relative(TEST_BUILD_OUTPUT_PATH, featureFlagsModulePath)}`,
      testConfig,
      snapshotConfig: {
        updateSnapshot: snapshotState._updateSnapshot,
        data: getInitialSnapshotData(snapshotState),
      },
      jsHeapSnapshotOutputPathTemplate,
      jsHeapSnapshotOutputPathTemplateToken,
      jsTraceOutputPath,
    });

    const entrypointPath = path.join(
      TEST_BUILD_OUTPUT_PATH,
      `${Date.now()}-${path.basename(testPath)}`,
    );
    const testJSBundlePath = entrypointPath + '.bundle.js';
    const testBytecodeBundlePath = testJSBundlePath + '.hbc';
    const testCoveragePath = entrypointPath + '.profraw';

    fs.mkdirSync(path.dirname(entrypointPath), {recursive: true});
    fs.writeFileSync(entrypointPath, entrypointContents, 'utf8');

    const sourceMapPath = path.join(
      path.dirname(testJSBundlePath),
      path.basename(testJSBundlePath, '.js') + '.map',
    );

    const collectCoverage = shouldCollectCoverage(
      testPath,
      testContents,
      globalConfig,
    );

    const bundleOptions = {
      testPath,
      entry: entrypointPath,
      platform: 'android',
      minify: testConfig.isJsOptimized,
      dev: !testConfig.isJsOptimized,
      sourceMap: true,
      sourceMapUrl: sourceMapPath,
      customTransformOptions: {
        collectCoverage,
      },
    };

    await createBundle({
      ...bundleOptions,
      out: testJSBundlePath,
    });

    if (testConfig.isJsBytecode) {
      generateBytecodeBundle({
        sourcePath: testJSBundlePath,
        bytecodePath: testBytecodeBundlePath,
        enableCoverage: collectCoverage,
        enableOptimized: testConfig.isJsOptimized,
        hermesVariant: testConfig.hermesVariant,
      });
    }

    const rnTesterCommandArgs = [
      '--bundlePath',
      !testConfig.isJsBytecode ? testJSBundlePath : testBytecodeBundlePath,
      '--featureFlags',
      JSON.stringify(testConfig.flags.common),
      '--minLogLevel',
      EnvironmentOptions.printCLIOutput ? 'info' : 'error',
    ];

    if (EnvironmentOptions.debugJS) {
      rnTesterCommandArgs.push(
        '--inspectorPort',
        nullthrows(process.env.__FANTOM_METRO_PORT__),
      );
    }

    const env: EnvironmentOverrides = {
      LLVM_PROFILE_FILE: collectCoverage ? testCoveragePath : undefined,
    };

    const rnTesterOptions = {
      enableOptimized: testConfig.isNativeOptimized,
      hermesVariant: testConfig.hermesVariant,
      enableCoverage: collectCoverage,
    };
    const rnTesterCommandResult = EnvironmentOptions.isOSS
      ? runCommand(
          path.join(__dirname, '..', 'build', 'tester', 'fantom_tester'),
          rnTesterCommandArgs,
          env,
        )
      : runFantomTester(rnTesterCommandArgs, rnTesterOptions, env);

    const [processedResult, benchmarkResult] =
      await processRNTesterCommandResult(rnTesterCommandResult);

    const hasInlineSnapshotUpdates =
      processedResult.testResults?.some(r =>
        r.inlineSnapshotResults.some(ir => !ir.pass),
      ) ?? false;

    if (
      containsError(processedResult) ||
      EnvironmentOptions.profileJS ||
      hasInlineSnapshotUpdates
    ) {
      await createSourceMap({
        ...bundleOptions,
        out: sourceMapPath,
      }).catch(error => {
        console.error('Failed to generate source map', error);
      });
    }

    if (EnvironmentOptions.profileJS && jsTraceOutputPath != null) {
      symbolicateJSTrace(jsTraceOutputPath, sourceMapPath);
      console.info(
        '🔥 JS sampling profiler trace saved to',
        jsTraceOutputPath,
        '\n',
      );
    }

    const testResultError = processedResult.error;
    if (testResultError) {
      const error = buildError(testResultError, sourceMapPath);
      throw error;
    }

    const testResults =
      nullthrows(processedResult.testResults).map(testResult => ({
        ancestorTitles: [] as Array<string>,
        testFilePath: testPath,
        ...testResult,
        failureMessages: testResult.failureMessages.map(maybeStackTrace =>
          symbolicateStackTrace(sourceMapPath, maybeStackTrace),
        ),
        failureDetails: testResult.failureDetails.map(failureDetails =>
          buildError(failureDetails, sourceMapPath),
        ),
        snapshotResults: testResult.snapshotResults,
      })) ?? [];

    // Process inline snapshot results (requires source map for symbolication)
    if (hasInlineSnapshotUpdates) {
      const inlineResults = nullthrows(processedResult.testResults).map(
        r => r.inlineSnapshotResults,
      );
      const pending = processInlineSnapshotResults(
        snapshotState,
        inlineResults,
        sourceMapPath,
        testPath,
      );
      allPendingInlineSnapshots.push(...pending);
    }

    // Display the Fantom test configuration as a suffix of the name of the root
    // `describe` block of the test, or adds one if the test doesn't have it.
    const maybeCommonAncestor = testResults[0]?.ancestorTitles?.[0];
    if (
      maybeCommonAncestor != null &&
      testResults.every(
        result => result.ancestorTitles?.[0] === maybeCommonAncestor,
      )
    ) {
      testResults.forEach(result => {
        const formattedFantomConfig = formatFantomConfig(testConfig);
        if (formattedFantomConfig) {
          result.ancestorTitles[0] += ` (${formattedFantomConfig})`;
        }
      });
    } else {
      testResults.forEach(result => {
        const formattedFantomConfig = formatFantomConfig(testConfig);
        if (formattedFantomConfig) {
          result.ancestorTitles.unshift(
            `${path.basename(testPath, '-itest.js')} (${formatFantomConfig(testConfig)})`,
          );
        }
      });
    }

    if (benchmarkResult != null) {
      benchmarkResults.push({
        title: testResults[0]?.ancestorTitles?.[0] ?? maybeCommonAncestor,
        result: benchmarkResult,
      });
    }

    testResultsByConfig.push(testResults);

    coverageMap = processedResult.coverageMap || {};

    if (globalConfig.collectCoverage) {
      try {
        const binaryPath = EnvironmentOptions.isOSS
          ? path.join(__dirname, '..', 'build', 'tester', 'fantom_tester')
          : getFantomTesterPath(rnTesterOptions);

        const cppCoverageMap = await processLLVMCoverage(
          testCoveragePath,
          binaryPath,
        );

        Object.entries(cppCoverageMap || {}).forEach(
          ([filename, fileCoverage]) => {
            coverageMap[filename] = fileCoverage;
          },
        );
      } catch (error) {
        printConsoleLog({
          type: 'console-log',
          level: 'warn',
          message: `Failed to process C++ coverage: ${String(error)} ${String(error.stack)}`,
        });
      }
    }
  }

  // Write pending inline snapshots to the test source file
  saveInlineSnapshotsToSource(testPath, allPendingInlineSnapshots);

  const endTime = Date.now();

  const testResults = testResultsByConfig.flat();

  const snapshotResults = testResults.map(
    testResult => testResult.snapshotResults,
  );

  const snapshotResult = updateSnapshotsAndGetJestSnapshotResult(
    snapshotState,
    snapshotResults,
  );

  printBenchmarkResultsRanking(benchmarkResults);

  return {
    testFilePath: testPath,
    failureMessage: formatResultsErrors(
      testResults,
      config,
      globalConfig,
      testPath,
    ),
    coverage: coverageMap,
    leaks: false,
    openHandles: [],
    perfStats: {
      start: startTime,
      end: endTime,
      duration: endTime - startTime,
      runtime: endTime - startTime,
      slow: false,
    },
    snapshot: snapshotResult,
    numTotalTests: testResults.length,
    numPassingTests: testResults.filter(test => test.status === 'passed')
      .length,
    numFailingTests: testResults.filter(test => test.status === 'failed')
      .length,
    numPendingTests: testResults.filter(test => test.status === 'pending')
      .length,
    numTodoTests: 0,
    skipped: false,
    testResults,
  };
};

function containsError(testResult: TestSuiteResult): boolean {
  return (
    testResult.error != null ||
    testResult.testResults.some(
      result =>
        result.failureDetails.length > 0 || result.failureMessages.length > 0,
    )
  );
}
