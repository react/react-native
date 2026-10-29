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
node maestro-ios.js <path to app> <app_id> <maestro_flow> <jsengine> <flavor> <working_directory> [device_model] [device_os] [test_state_path] [exclude_tags]

@param {string} appPath - Path to the app APK
@param {string} appId - App ID that needs to be launched
@param {string} maestroFlow - Path to the maestro flow to be executed
@param {string} jsengine - The JSEngine to use for the test
@param {string} flavor - Flavor of the app to be launched. Can be 'Release' or 'Debug'
@param {string} workingDirectory - Working directory from where to run Metro
@param {string} deviceModel - Optional Maestro device model, such as iPhone-17-Pro
@param {string} deviceOS - Optional Maestro device OS, such as iOS-26-2
@param {string} testStatePath - Optional file used to persist per-flow results between CI retries
@param {string} excludeTags - Optional comma-separated flow tags to exclude
==============
`;

// A flow gets one retry, on a freshly rebooted simulator. A flow that fails
// both attempts is reported as a real failure instead of being retried again.
const MAX_ATTEMPTS = 2;
const DEFAULT_STATE_PATH = '/tmp/maestro-ios-state/results.json';
const MAESTRO_LOG_DIRECTORY = '/tmp/MaestroLogs';
const FLOW_TIMEOUT_MS = 10 * 60 * 1000;
const STATE_VERSION = 1;

function findAvailableSimulator(deviceModel, deviceOS) {
  const output = childProcess.execSync(
    'xcrun simctl list devices available -j',
  );
  const devicesByRuntime = JSON.parse(String(output)).devices;

  if ((deviceModel == null) !== (deviceOS == null)) {
    throw new Error('Device model and OS must be configured together');
  }

  if (deviceModel != null && deviceOS != null) {
    const runtime = `com.apple.CoreSimulator.SimRuntime.${deviceOS}`;
    const simulatorName = deviceModel.replaceAll('-', ' ');
    const simulator = devicesByRuntime[runtime]?.find(
      device => device.name === simulatorName,
    );

    if (simulator == null) {
      throw new Error(
        `Unable to find ${simulatorName} simulator on ${deviceOS}`,
      );
    }

    return simulator;
  }

  const devices = Object.values(devicesByRuntime).flat().reverse();
  const simulator = devices.find(device => /^iPhone .* Pro$/.test(device.name));

  if (simulator == null) {
    throw new Error('Unable to find an available iPhone Pro simulator');
  }

  return simulator;
}

function launchSimulator(simulator) {
  console.log(`Launching simulator ${simulator.name} (${simulator.udid})`);
  try {
    childProcess.execSync(`xcrun simctl boot "${simulator.udid}"`);
  } catch (error) {
    if (
      !error.message.includes('Unable to boot device in current state: Booted')
    ) {
      throw error;
    }
  }
}

// Shutting down and booting again recovers from simulator-level failures
// (e.g. a crashed SpringBoard) that would otherwise fail every later attempt.
// Installed apps survive the reboot.
function rebootSimulator(udid) {
  console.log(`Rebooting simulator ${udid}`);
  try {
    childProcess.execSync(`xcrun simctl shutdown "${udid}"`);
  } catch (error) {
    console.log(`Failed to shut down simulator: ${error.message}`);
  }
  childProcess.execSync(`xcrun simctl bootstatus "${udid}" -b`, {
    stdio: 'ignore',
  });
}

function installAppOnSimulator(appPath, udid) {
  console.log(`Installing app at path ${appPath}`);
  childProcess.execSync(`xcrun simctl install "${udid}" "${appPath}"`);
}

function bringSimulatorInForeground() {
  console.log('Bringing simulator in foreground');
  childProcess.execSync('open -a simulator');
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function launchAppOnSimulator(appId, udid, isDebug) {
  console.log('Launch the app');
  childProcess.execSync(`xcrun simctl launch "${udid}" "${appId}"`);

  if (isDebug) {
    console.log('Wait for metro to warm');
    await sleep(20 * 1000);
  }
}

function startVideoRecording(udid, videoPath) {
  console.log(`Start video record to ${videoPath}`);

  const recordingProcess = childProcess.spawn(
    'xcrun',
    ['simctl', 'io', udid, 'recordVideo', '--force', videoPath],
    {
      detached: true,
      stdio: 'ignore',
    },
  );

  return recordingProcess;
}

// The movie is only written after SIGINT, so returning early truncates it.
const RECORDING_SHUTDOWN_TIMEOUT_MS = 30 * 1000;

function stopVideoRecording(recordingProcess) {
  if (!recordingProcess) {
    console.log("Passed a null recording process. Can't kill it");
    return Promise.resolve();
  }

  console.log(`Stop video record using pid: ${recordingProcess.pid}`);

  if (
    recordingProcess.exitCode != null ||
    recordingProcess.signalCode != null
  ) {
    return Promise.resolve();
  }

  // Awaiting the exit is also what reaps the child: the flows run in a
  // synchronous loop, so nothing else turns the event loop.
  return new Promise(resolve => {
    let settled = false;
    const done = () => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      console.log(
        `Recorder ${recordingProcess.pid} did not exit in time, killing it`,
      );
      recordingProcess.kill('SIGKILL');
      // SIGKILL on an already-exited process is a no-op that emits no `exit`,
      // so resolve here instead of waiting for an event that may never come.
      done();
    }, RECORDING_SHUTDOWN_TIMEOUT_MS);
    timer.unref?.();

    recordingProcess.once('exit', done);
    recordingProcess.once('error', done);
    recordingProcess.kill('SIGINT');

    // The process may have exited between the guard above and attaching the
    // listeners; that `exit` event is already gone, so re-check and resolve.
    if (
      recordingProcess.exitCode != null ||
      recordingProcess.signalCode != null
    ) {
      done();
    }
  });
}

function collectFlows(flowPath) {
  if (!fs.existsSync(flowPath) || !fs.lstatSync(flowPath).isDirectory()) {
    return [flowPath];
  }

  const flows = [];
  for (const file of fs.readdirSync(flowPath).sort()) {
    const filePath = `${flowPath.replace(/\/$/, '')}/${file}`;
    if (fs.lstatSync(filePath).isDirectory()) {
      // Fragments pulled in via `runFlow`; they have no `launchApp` of their
      // own and fail when run standalone.
      if (file === 'helpers') {
        continue;
      }
      flows.push(...collectFlows(filePath));
    } else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      flows.push(filePath);
    }
  }
  return flows;
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

  return `### iOS Maestro E2E results

Passed: ${counts.passed} · Failed: ${counts.failed} · Pending: ${counts.pending}

| Status | Flow | Attempts |
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

function decodeXmlEntities(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

// Maps each flow key in a Maestro JUnit report to whether it passed, plus the
// failure message for flows that did not.
function parseJUnitReport(contents) {
  const results = new Map();
  const testCasePattern = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  for (const [, attributes, body = ''] of contents.matchAll(testCasePattern)) {
    const attribute = name =>
      attributes.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
    const file = attribute('file');
    if (file == null) {
      continue;
    }
    const status = attribute('status');
    const failure = body.match(/<failure\b[^>]*>([\s\S]*?)<\/failure>/)?.[1];
    results.set(getFlowKey(decodeXmlEntities(file)), {
      passed: status === 'SUCCESS' || status === 'WARNING',
      error: failure != null ? decodeXmlEntities(failure.trim()) : status,
    });
  }
  return results;
}

function maestroCommand(udid, flows, appId, outputPath) {
  const flowArguments = flows.map(flow => `"${flow}"`).join(' ');
  return `MAESTRO_DRIVER_STARTUP_TIMEOUT=1500000 $HOME/.maestro/bin/maestro --udid="${udid}" test ${flowArguments} --format junit --output "${outputPath}/report.xml" --debug-output "${outputPath}" --flatten-debug-output -e APP_ID="${appId}"`;
}

// Runs every flow in a single Maestro invocation, so the CLI and the XCTest
// driver start once instead of once per flow. Flows missing from the report
// (e.g. because Maestro crashed or timed out) count as failed.
function runMaestroSuite(appId, udid, flows) {
  const outputPath = path.join(MAESTRO_LOG_DIRECTORY, 'suite');
  fs.mkdirSync(outputPath, {recursive: true});

  const command = maestroCommand(udid, flows, appId, outputPath);
  console.info(`Executing ${flows.length} flow(s) in a single Maestro run`);
  console.log(command);
  let runError = null;
  try {
    childProcess.execSync(command, {
      stdio: 'inherit',
      timeout: flows.length * FLOW_TIMEOUT_MS,
    });
  } catch (error) {
    runError = error;
  }

  const reportPath = path.join(outputPath, 'report.xml');
  const report = fs.existsSync(reportPath)
    ? parseJUnitReport(fs.readFileSync(reportPath, 'utf8'))
    : new Map();
  const missingError =
    runError instanceof Error
      ? runError.message
      : 'Flow did not report a result';
  const results = new Map(
    flows.map(flow => [
      getFlowKey(flow),
      report.get(getFlowKey(flow)) ?? {passed: false, error: missingError},
    ]),
  );
  if ([...results.values()].every(result => result.passed)) {
    fs.rmSync(outputPath, {recursive: true, force: true});
  }
  return results;
}

async function runMaestroFlow(appId, udid, flow, attempt) {
  const outputName = `${path.basename(flow, path.extname(flow))}-attempt-${attempt}`;
  const outputPath = path.join(MAESTRO_LOG_DIRECTORY, outputName);
  fs.mkdirSync(outputPath, {recursive: true});

  const videoPath = path.join(outputPath, 'recording.mov');
  const recProcess = startVideoRecording(udid, videoPath);
  try {
    const command = maestroCommand(udid, [flow], appId, outputPath);
    console.info(`Executing flow: ${flow} (attempt ${attempt})`);
    console.log(command);
    childProcess.execSync(command, {
      stdio: 'inherit',
      timeout: FLOW_TIMEOUT_MS,
    });
  } catch (error) {
    await stopVideoRecording(recProcess);
    throw error;
  }

  await stopVideoRecording(recProcess);
  // Only failed attempts are worth keeping in the uploaded logs.
  fs.rmSync(outputPath, {recursive: true, force: true});
}

async function executeFlowSuite({
  flows,
  appId,
  udid,
  state,
  statePath,
  executeSuite = runMaestroSuite,
  executeFlow = runMaestroFlow,
  resetSimulator = rebootSimulator,
}) {
  const flowKeys = flows.map(getFlowKey);

  for (const flow of flowKeys) {
    state.flows[flow] ??= {status: 'pending', attempts: 0};
  }
  saveState(statePath, state);

  const flowsToRun = flows.filter((flow, index) => {
    if (state.flows[flowKeys[index]].status === 'passed') {
      console.info(`Skipping previously passed flow: ${flow}`);
      return false;
    }
    return true;
  });

  // First attempt: every flow in one Maestro run.
  if (flowsToRun.length > 0) {
    const results = await executeSuite(appId, udid, flowsToRun);
    for (const flow of flowsToRun) {
      const result = state.flows[getFlowKey(flow)];
      const {passed, error} = results.get(getFlowKey(flow));
      result.attempts += 1;
      result.status = passed ? 'passed' : 'failed';
      if (passed) {
        delete result.error;
      } else {
        result.error = error;
      }
    }
    saveState(statePath, state);
  }

  // Retries: each failed flow on its own, on a rebooted simulator.
  const failedFlows = [];
  for (const flow of flowsToRun) {
    const flowKey = getFlowKey(flow);
    const result = state.flows[flowKey];

    for (
      let attempt = 2;
      attempt <= MAX_ATTEMPTS && result.status === 'failed';
      attempt++
    ) {
      console.info(`Retrying flow: ${flow}`);
      resetSimulator(udid);
      result.attempts += 1;
      try {
        await executeFlow(appId, udid, flow, attempt);
        result.status = 'passed';
        delete result.error;
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
      } finally {
        saveState(statePath, state);
      }
    }

    if (result.status === 'failed') {
      failedFlows.push(flowKey);
      console.error(
        `Failed to execute flow ${flow} after ${MAX_ATTEMPTS} attempts.`,
      );
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
  if (args.length < 6 || args.length > 10) {
    throw new Error(`Invalid number of arguments.\n${usage}`);
  }

  const appPath = args[0];
  const appId = args[1];
  const maestroFlow = args[2];
  const jsengine = args[3];
  const isDebug = args[4] === 'Debug';
  const workingDirectory = args[5];
  const deviceModel = args[6] || null;
  const deviceOS = args[7] || null;
  const statePath = args[8] || DEFAULT_STATE_PATH;
  const excludeTags = (args[9] ?? '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  console.info('\n==============================');
  console.info('Running tests for iOS with the following parameters:');
  console.info(`APP_PATH: ${appPath}`);
  console.info(`APP_ID: ${appId}`);
  console.info(`MAESTRO_FLOW: ${maestroFlow}`);
  console.info(`JS_ENGINE: ${jsengine}`);
  console.info(`IS_DEBUG: ${isDebug}`);
  console.info(`WORKING_DIRECTORY: ${workingDirectory}`);
  console.info(`DEVICE_MODEL: ${deviceModel ?? '<automatic>'}`);
  console.info(`DEVICE_OS: ${deviceOS ?? '<automatic>'}`);
  console.info(`TEST_STATE_PATH: ${statePath}`);
  console.info(`EXCLUDE_TAGS: ${excludeTags.join(',') || '<none>'}`);
  console.info('==============================\n');

  const flows = filterFlowsByTags(collectFlows(maestroFlow), excludeTags);
  const state = loadState(statePath);

  const simulator = findAvailableSimulator(deviceModel, deviceOS);
  launchSimulator(simulator);
  installAppOnSimulator(appPath, simulator.udid);
  bringSimulatorInForeground();
  await launchAppOnSimulator(appId, simulator.udid, isDebug);
  console.info(`Start testing ${flows.length} flow(s)`);
  await executeFlowSuite({
    flows,
    appId,
    udid: simulator.udid,
    state,
    statePath,
  });
  console.log('Test finished');
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
  findAvailableSimulator,
  loadState,
  parseJUnitReport,
  runMaestroFlow,
};
