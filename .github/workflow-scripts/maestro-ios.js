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
node maestro-ios.js <path to app> <app_id> <maestro_flow> <jsengine> <flavor> <working_directory> [device_model] [device_os]

@param {string} appPath - Path to the app APK
@param {string} appId - App ID that needs to be launched
@param {string} maestroFlow - Path to the maestro flow to be executed
@param {string} jsengine - The JSEngine to use for the test
@param {string} flavor - Flavor of the app to be launched. Can be 'Release' or 'Debug'
@param {string} workingDirectory - Working directory from where to run Metro
@param {string} deviceModel - Optional Maestro device model, such as iPhone-17-Pro
@param {string} deviceOS - Optional Maestro device OS, such as iOS-26-2
==============
`;

const MAX_ATTEMPTS = 5;

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
  childProcess.execFileSync(
    'xcrun',
    ['simctl', 'bootstatus', simulator.udid, '-b'],
    {
      stdio: 'inherit',
      timeout: 10 * 60 * 1000,
      killSignal: 'SIGKILL',
    },
  );
}

function installAppOnSimulator(appPath, udid) {
  console.log(`Installing app at path ${appPath}`);
  childProcess.execFileSync('xcrun', ['simctl', 'install', udid, appPath], {
    stdio: 'inherit',
    timeout: 60 * 1000,
    killSignal: 'SIGKILL',
  });
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
  childProcess.execFileSync('xcrun', ['simctl', 'launch', udid, appId], {
    stdio: 'inherit',
    timeout: 60 * 1000,
    killSignal: 'SIGKILL',
  });

  if (isDebug) {
    console.log('Wait for metro to warm');
    await sleep(20 * 1000);
  }
}

function startVideoRecording(udid, outputPath) {
  console.log(`Start video recording: ${outputPath}`);

  const recordingProcess = childProcess.spawn(
    'xcrun',
    ['simctl', 'io', udid, 'recordVideo', '--force', outputPath],
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

async function executeFlowWithRetries(
  appId,
  udid,
  flow,
  reportDirectory,
  options,
) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const attemptDirectory = path.resolve(
      reportDirectory,
      `attempt-${attempt}`,
    );
    fs.mkdirSync(attemptDirectory, {recursive: true});
    let recordingProcess;

    try {
      let flowPath = flow;
      if (options.resetApp) {
        // Uninstall first so the old process cannot repopulate the keychain.
        for (const args of [
          ['uninstall', udid, appId],
          ['keychain', udid, 'reset'],
          ['install', udid, options.appPath],
          ['privacy', udid, 'reset', 'all', appId],
          ['ui', udid, 'appearance', 'light'],
        ]) {
          childProcess.execFileSync('xcrun', ['simctl', ...args], {
            stdio: 'inherit',
            timeout: 60 * 1000,
            killSignal: 'SIGKILL',
          });
        }

        flowPath = path.join(attemptDirectory, 'flow.yml');
        fs.writeFileSync(
          flowPath,
          `appId: ${JSON.stringify(appId)}
---
- setOrientation: portrait
- launchApp
- runFlow: ${JSON.stringify(path.resolve(flow))}
`,
        );
      }

      recordingProcess = startVideoRecording(
        udid,
        path.join(attemptDirectory, 'video.mov'),
      );
      console.info(`Executing flow: ${flow} (attempt ${attempt})`);
      childProcess.execFileSync(
        path.join(process.env.HOME, '.maestro', 'bin', 'maestro'),
        [
          '--udid',
          udid,
          'test',
          flowPath,
          '--format',
          'junit',
          '--output',
          path.join(attemptDirectory, 'report.xml'),
          '--debug-output',
          path.join(attemptDirectory, 'logs'),
          '--test-output-dir',
          attemptDirectory,
          '-e',
          `APP_ID=${appId}`,
        ],
        {
          env: {...process.env, MAESTRO_DRIVER_STARTUP_TIMEOUT: '1500000'},
          stdio: 'inherit',
          timeout: 1000 * 60 * 10,
          killSignal: 'SIGKILL',
        },
      );
      return;
    } catch (error) {
      fs.writeFileSync(path.join(attemptDirectory, 'error.txt'), String(error));
      if (attempt === MAX_ATTEMPTS) {
        console.error(
          `Failed to execute flow ${flow} after ${MAX_ATTEMPTS} attempts.`,
        );
        throw error;
      }
      console.info(`Retrying flow: ${flow}`);
    } finally {
      await stopVideoRecording(recordingProcess);
    }
  }
}

async function executeFlows(appId, udid, maestroFlow, jsengine, options = {}) {
  const {
    shardIndex = 0,
    shardCount = 1,
    reportDirectory = 'maestro-reports',
  } = options;
  if (
    !Number.isInteger(shardCount) ||
    shardCount < 1 ||
    !Number.isInteger(shardIndex) ||
    shardIndex < 0 ||
    shardIndex >= shardCount
  ) {
    throw new Error(`Invalid shard ${shardIndex} of ${shardCount}`);
  }
  if (options.resetApp && !options.appPath) {
    throw new Error('Resetting app state requires an app path');
  }

  function collectFlows(directory) {
    if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) {
      return [directory];
    }
    const flows = [];
    for (const file of fs.readdirSync(directory).sort()) {
      const filePath = path.join(directory, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        // Helper fragments are only runnable via their parent flow.
        if (file !== 'helpers') {
          flows.push(...collectFlows(filePath));
        }
      } else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        flows.push(filePath);
      }
    }
    return flows;
  }

  const flows = collectFlows(maestroFlow);
  if (flows.length === 0) {
    throw new Error(`No Maestro flows found at ${maestroFlow}`);
  }
  const selectedFlows = flows.filter(
    (_, index) => index % shardCount === shardIndex,
  );
  fs.mkdirSync(reportDirectory, {recursive: true});
  fs.writeFileSync(
    path.join(reportDirectory, 'manifest.json'),
    JSON.stringify({shardIndex, shardCount, flows: selectedFlows}, null, 2),
  );
  console.info(
    `Shard ${shardIndex + 1}/${shardCount}: ${selectedFlows.length}/${flows.length} flows`,
  );

  const failures = [];
  for (let index = 0; index < selectedFlows.length; index++) {
    const flow = selectedFlows[index];
    try {
      await executeFlowWithRetries(
        appId,
        udid,
        flow,
        path.join(reportDirectory, `${index}-${path.basename(flow)}`),
        options,
      );
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length > 0) {
    throw new AggregateError(
      failures,
      `${failures.length} Maestro flow(s) failed`,
    );
  }
}

async function main(args = process.argv.slice(2)) {
  if (args.length < 6 || args.length > 8) {
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
  const options = {
    appPath,
    resetApp: process.env.MAESTRO_RESET_APP === 'true',
    shardIndex: Number(process.env.MAESTRO_SHARD_INDEX ?? 0),
    shardCount: Number(process.env.MAESTRO_SHARD_COUNT ?? 1),
  };

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
  console.info('==============================\n');

  const simulator = findAvailableSimulator(deviceModel, deviceOS);
  launchSimulator(simulator);
  installAppOnSimulator(appPath, simulator.udid);
  bringSimulatorInForeground();
  await launchAppOnSimulator(appId, simulator.udid, isDebug);
  await executeFlows(appId, simulator.udid, maestroFlow, jsengine, options);
  console.log('Test finished');
}

if (require.main === module) {
  main();
}

module.exports = {
  executeFlows,
  findAvailableSimulator,
  main,
};
