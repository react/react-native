/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const usage = `
=== Usage ===
node maestro-android.js <path to app> <app_id> <maestro_flow> <flavor> <working_directory> [test_state_path] [exclude_tags]

@param {string} appPath - Path to the app APK
@param {string} appId - App ID that needs to be launched
@param {string} maestroFlow - Path to the Maestro flow or folder to execute
@param {string} flavor - Flavor of the app to be launched. Can be 'release' or 'debug'
@param {string} workingDirectory - Working directory from where to run Metro
@param {string} testStatePath - File used to persist per-flow results between CI retries
@param {string} excludeTags - Comma-separated flow tags to exclude
==============
`;

const DEFAULT_STATE_PATH = '/tmp/maestro-android-state/results.json';
const MAESTRO_LOG_DIRECTORY = '/tmp/MaestroLogs';
const DIAGNOSTIC_COMMAND_TIMEOUT = 15000;
const STATE_VERSION = 1;

function logAndroidAbiConfiguration() {
  const properties = [
    'ro.product.cpu.abi',
    'ro.product.cpu.abilist',
    'ro.dalvik.vm.native.bridge',
  ];

  console.info('Android ABI configuration:');
  for (const property of properties) {
    const value = childProcess
      .execFileSync('adb', ['shell', 'getprop', property], {encoding: 'utf8'})
      .trim();
    console.info(`- ${property}: ${value || '<empty>'}`);
  }
}

function collectFlows(flowPath) {
  if (!fs.existsSync(flowPath) || !fs.lstatSync(flowPath).isDirectory()) {
    return [flowPath];
  }

  const flows = [];
  for (const file of fs.readdirSync(flowPath).sort()) {
    const filePath = path.join(flowPath, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      flows.push(...collectFlows(filePath));
    } else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      flows.push(filePath);
    }
    // Skip non-flow files (e.g. screenshot baselines under screenshots/).
  }
  return flows;
}

function getFlowTags(flow) {
  const contents = fs.readFileSync(flow, 'utf8');
  const tags = [];
  const tagBlockPattern = /^tags:\s*\r?\n((?:^[ \t]+-[ \t]*[^\r\n]+\r?\n?)*)/gm;

  for (const match of contents.matchAll(tagBlockPattern)) {
    for (const line of match[1].split(/\r?\n/)) {
      const tag = line.match(/^[ \t]+-[ \t]*(.+?)\s*$/)?.[1];
      if (tag != null) {
        tags.push(tag);
      }
    }
  }

  return tags;
}

function filterFlowsByTags(flows, excludeTags) {
  if (excludeTags.length === 0) {
    return flows;
  }

  return flows.filter(flow => {
    const tags = getFlowTags(flow);
    const excludedTag = tags.find(tag => excludeTags.includes(tag));
    if (excludedTag != null) {
      console.info(`Skipping flow tagged ${excludedTag}: ${flow}`);
      return false;
    }
    return true;
  });
}

function getFlowKey(flow) {
  return path
    .relative(process.cwd(), path.resolve(flow))
    .split(path.sep)
    .join('/');
}

function createEmptyState() {
  return {version: STATE_VERSION, flows: {}};
}

function loadState(statePath) {
  if (!fs.existsSync(statePath)) {
    return createEmptyState();
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  if (
    state.version !== STATE_VERSION ||
    state.flows == null ||
    typeof state.flows !== 'object'
  ) {
    throw new Error(`Invalid Maestro test state at ${statePath}`);
  }
  return state;
}

function saveState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), {recursive: true});
  const temporaryPath = `${statePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(temporaryPath, statePath);
}

function runMaestroFlow(flow, appId) {
  console.info(`Executing flow: ${flow}`);
  const timeout = 1000 * 60 * 10; // 10 minutes
  try {
    childProcess.execSync(
      `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000 $HOME/.maestro/bin/maestro test "${flow}" --format junit -e APP_ID="${appId}" --debug-output ${MAESTRO_LOG_DIRECTORY}`,
      {stdio: 'inherit', timeout},
    );
  } catch (error) {
    captureFailureArtifacts(flow);
    throw error;
  }
}

function captureFailureArtifacts(flow) {
  fs.mkdirSync(MAESTRO_LOG_DIRECTORY, {recursive: true});
  const artifactName = path.basename(flow, path.extname(flow));

  try {
    const screenshot = childProcess.execFileSync(
      'adb',
      ['exec-out', 'screencap', '-p'],
      {maxBuffer: 20 * 1024 * 1024, timeout: DIAGNOSTIC_COMMAND_TIMEOUT},
    );
    fs.writeFileSync(
      path.join(MAESTRO_LOG_DIRECTORY, `${artifactName}-failure.png`),
      screenshot,
    );
  } catch (error) {
    console.error(`Failed to capture screenshot for ${flow}: ${error}`);
  }

  try {
    childProcess.execFileSync(
      'adb',
      ['shell', 'uiautomator', 'dump', '/sdcard/window.xml'],
      {stdio: 'ignore', timeout: DIAGNOSTIC_COMMAND_TIMEOUT},
    );
    const hierarchy = childProcess.execFileSync(
      'adb',
      ['exec-out', 'cat', '/sdcard/window.xml'],
      {maxBuffer: 20 * 1024 * 1024, timeout: DIAGNOSTIC_COMMAND_TIMEOUT},
    );
    fs.writeFileSync(
      path.join(MAESTRO_LOG_DIRECTORY, `${artifactName}-failure.xml`),
      hierarchy,
    );
  } catch (error) {
    console.error(`Failed to capture UI hierarchy for ${flow}: ${error}`);
  }

  try {
    const logcat = childProcess.execFileSync(
      'adb',
      ['logcat', '-d', '-v', 'threadtime'],
      {maxBuffer: 50 * 1024 * 1024, timeout: DIAGNOSTIC_COMMAND_TIMEOUT},
    );
    fs.writeFileSync(
      path.join(MAESTRO_LOG_DIRECTORY, `${artifactName}-logcat.txt`),
      logcat,
    );
  } catch (error) {
    console.error(`Failed to capture logcat for ${flow}: ${error}`);
  }
}

async function stopScreenRecording(screenrecordProcess) {
  try {
    childProcess.execFileSync('adb', ['shell', 'pkill', '-2', 'screenrecord'], {
      stdio: 'ignore',
    });
  } catch {
    screenrecordProcess.kill('SIGINT');
  }

  if (
    screenrecordProcess.exitCode == null &&
    screenrecordProcess.signalCode == null
  ) {
    await Promise.race([
      new Promise(resolve => screenrecordProcess.once('close', resolve)),
      sleep(5000),
    ]);
  }

  if (
    screenrecordProcess.exitCode == null &&
    screenrecordProcess.signalCode == null
  ) {
    screenrecordProcess.kill('SIGKILL');
  }
}

function formatResults(flowKeys, state) {
  const results = flowKeys.map(flow => ({flow, ...state.flows[flow]}));
  const counts = results.reduce(
    (result, flow) => {
      result[flow.status] += 1;
      return result;
    },
    {passed: 0, failed: 0, pending: 0},
  );
  const rows = results
    .map(
      result =>
        `| ${result.status} | \`${result.flow.replaceAll('|', '\\|')}\` | ${result.attempts} |`,
    )
    .join('\n');

  return `### Android Maestro E2E results

Passed: ${counts.passed} · Failed: ${counts.failed} · Pending: ${counts.pending}

| Status | Flow | CI attempts |
| --- | --- | ---: |
${rows}
`;
}

function writeResultsSummary(flowKeys, state) {
  const summary = formatResults(flowKeys, state);
  console.info(`\n${summary}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}

function executeFlowSuite({
  flows,
  appId,
  state,
  statePath,
  executeFlow = runMaestroFlow,
}) {
  const flowKeys = flows.map(getFlowKey);

  for (const flow of flowKeys) {
    state.flows[flow] ??= {status: 'pending', attempts: 0};
  }
  saveState(statePath, state);

  const failedFlows = [];
  for (let index = 0; index < flows.length; index++) {
    const flow = flows[index];
    const flowKey = flowKeys[index];
    const result = state.flows[flowKey];

    if (result.status === 'passed') {
      console.info(`Skipping previously passed flow: ${flow}`);
      continue;
    }

    result.attempts += 1;
    try {
      executeFlow(flow, appId);
      result.status = 'passed';
      delete result.error;
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
      failedFlows.push(flowKey);
      console.error(`Flow failed: ${flow}`);
    } finally {
      saveState(statePath, state);
    }
  }

  writeResultsSummary(flowKeys, state);

  if (failedFlows.length > 0) {
    throw new Error(
      `${failedFlows.length} Maestro flow(s) failed:\n${failedFlows.join('\n')}`,
    );
  }
}

async function main(args = process.argv.slice(2)) {
  if (args.length < 5 || args.length > 7) {
    throw new Error(`Invalid number of arguments.\n${usage}`);
  }

  const appPath = args[0];
  const appId = args[1];
  const maestroFlow = args[2];
  const isDebug = args[3] === 'debug';
  const workingDirectory = args[4];
  const statePath = args[5] ?? DEFAULT_STATE_PATH;
  const excludeTags = (args[6] ?? '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  console.info('\n==============================');
  console.info('Running tests for Android with the following parameters:');
  console.info(`APP_PATH: ${appPath}`);
  console.info(`APP_ID: ${appId}`);
  console.info(`MAESTRO_FLOW: ${maestroFlow}`);
  console.info(`IS_DEBUG: ${isDebug}`);
  console.info(`WORKING_DIRECTORY: ${workingDirectory}`);
  console.info(`TEST_STATE_PATH: ${statePath}`);
  console.info(`EXCLUDE_TAGS: ${excludeTags.join(',') || '<none>'}`);
  console.info('==============================\n');

  logAndroidAbiConfiguration();

  console.info('Install app');
  childProcess.execSync(`adb install ${appPath}`, {stdio: 'ignore'});

  let metroProcess = null;
  if (isDebug) {
    console.info('Start Metro');
    fs.mkdirSync(MAESTRO_LOG_DIRECTORY, {recursive: true});
    const metroLog = fs.openSync(
      path.join(MAESTRO_LOG_DIRECTORY, 'metro.log'),
      'a',
    );
    metroProcess = childProcess.spawn('yarn', ['start'], {
      cwd: workingDirectory,
      stdio: ['ignore', metroLog, metroLog],
      detached: true,
    });
    fs.closeSync(metroLog);
    metroProcess.unref();
    console.info(`- Metro PID: ${metroProcess.pid}`);

    console.info('Wait For Metro to Start');
    await sleep(5000);
  }

  console.info('Start the app');
  childProcess.execSync(`adb shell monkey -p ${appId} 1`, {stdio: 'ignore'});

  if (isDebug) {
    console.info('Wait For App to warm from Metro');
    await sleep(10000);
  }

  console.info('Start recording to /sdcard/screen.mp4');
  const screenrecordProcess = childProcess.spawn(
    'adb',
    ['shell', 'screenrecord', '/sdcard/screen.mp4'],
    {stdio: 'ignore'},
  );

  let error = null;
  try {
    const flows = filterFlowsByTags(collectFlows(maestroFlow), excludeTags);
    const state = loadState(statePath);
    console.info(`Start testing ${flows.length} flow(s)`);
    executeFlowSuite({flows, appId, state, statePath});
  } catch (caughtError) {
    error = caughtError;
  } finally {
    console.info('Stop recording');
    await stopScreenRecording(screenrecordProcess);
    childProcess.execSync('adb pull /sdcard/screen.mp4', {stdio: 'ignore'});

    if (isDebug && metroProcess != null) {
      const pid = metroProcess.pid;
      console.info(`Kill Metro. PID: ${pid}`);
      process.kill(pid);
      console.info('Metro Killed');
    }
  }

  if (error) {
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  collectFlows,
  executeFlowSuite,
  filterFlowsByTags,
  formatResults,
  loadState,
};
