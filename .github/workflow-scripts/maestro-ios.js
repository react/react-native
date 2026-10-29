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
node maestro-ios.js <path to app> <app_id> <maestro_flow> <jsengine> <flavor> <working_directory> [device_model] [device_os] [test_state_path]

@param {string} appPath - Path to the app APK
@param {string} appId - App ID that needs to be launched
@param {string} maestroFlow - Path to the maestro flow to be executed
@param {string} jsengine - The JSEngine to use for the test
@param {string} flavor - Flavor of the app to be launched. Can be 'Release' or 'Debug'
@param {string} workingDirectory - Working directory from where to run Metro
@param {string} deviceModel - Optional Maestro device model, such as iPhone-17-Pro
@param {string} deviceOS - Optional Maestro device OS, such as iOS-26-2
@param {string} testStatePath - Optional file used to persist per-flow results between CI retries
==============
`;

// A flow gets one retry, on a freshly rebooted simulator. A flow that fails
// both attempts is reported as a real failure instead of being retried again.
const MAX_ATTEMPTS = 2;
const DEFAULT_STATE_PATH = '/tmp/maestro-ios-state/results.json';
const MAESTRO_LOG_DIRECTORY = '/tmp/MaestroLogs';
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

async function runMaestroFlow(appId, udid, flow, attempt) {
  const outputName = `${path.basename(flow, path.extname(flow))}-attempt-${attempt}`;
  const outputPath = path.join(MAESTRO_LOG_DIRECTORY, outputName);
  fs.mkdirSync(outputPath, {recursive: true});

  const videoPath = path.join(outputPath, 'recording.mov');
  const recProcess = startVideoRecording(udid, videoPath);
  try {
    const timeout = 1000 * 60 * 10; // 10 minutes
    const command = `$HOME/.maestro/bin/maestro --udid="${udid}" test "${flow}" --format junit --output "${outputPath}/report.xml" --debug-output "${outputPath}" --flatten-debug-output -e APP_ID="${appId}"`;
    console.info(`Executing flow: ${flow} (attempt ${attempt})`);
    console.log(command);
    childProcess.execSync(`MAESTRO_DRIVER_STARTUP_TIMEOUT=1500000 ${command}`, {
      stdio: 'inherit',
      timeout,
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
  executeFlow = runMaestroFlow,
  resetSimulator = rebootSimulator,
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

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) {
        console.info(`Retrying flow: ${flow}`);
        resetSimulator(udid);
      }
      result.attempts += 1;
      try {
        await executeFlow(appId, udid, flow, attempt);
        result.status = 'passed';
        delete result.error;
        break;
      } catch (error) {
        result.status = 'failed';
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
  if (args.length < 6 || args.length > 9) {
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
  console.info('==============================\n');

  const flows = collectFlows(maestroFlow);
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
  findAvailableSimulator,
  formatResults,
  loadState,
  runMaestroFlow,
};
