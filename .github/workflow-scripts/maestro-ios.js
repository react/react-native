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

const usage = `
=== Usage ===
node maestro-android.js <path to app> <app_id> <maestro_flow> <flavor> <working_directory>

@param {string} appPath - Path to the app APK
@param {string} appId - App ID that needs to be launched
@param {string} maestroFlow - Path to the maestro flow to be executed
@param {string} jsengine - The JSEngine to use for the test
@param {string} flavor - Flavor of the app to be launched. Can be 'Release' or 'Debug'
@param {string} workingDirectory - Working directory from where to run Metro
==============
`;

const MAX_ATTEMPTS = 5;

function findAvailableSimulator() {
  const output = childProcess.execSync(
    'xcrun simctl list devices available -j',
  );
  const devices = Object.values(JSON.parse(String(output)).devices)
    .flat()
    .reverse();
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

function installAppOnSimulator(appPath) {
  console.log(`Installing app at path ${appPath}`);
  childProcess.execSync(`xcrun simctl install booted "${appPath}"`);
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

function startVideoRecording(jsengine, currentAttempt) {
  console.log(
    `Start video record using pid: video_record_${currentAttempt}.pid`,
  );

  const recordingArgs =
    `simctl io booted recordVideo video_record_${currentAttempt}.mov`.split(
      ' ',
    );
  const recordingProcess = childProcess.spawn('xcrun', recordingArgs, {
    detached: true,
    stdio: 'ignore',
  });

  return recordingProcess;
}

function stopVideoRecording(recordingProcess) {
  if (!recordingProcess) {
    console.log("Passed a null recording process. Can't kill it");
    return;
  }

  console.log(`Stop video record using pid: ${recordingProcess.pid}`);

  recordingProcess.kill('SIGINT');
}

function executeTestsWithRetries(
  appId,
  udid,
  maestroFlow,
  jsengine,
  currentAttempt,
) {
  const recProcess = startVideoRecording(jsengine, currentAttempt);
  try {
    const timeout = 1000 * 60 * 10; // 10 minutes
    const command = `$HOME/.maestro/bin/maestro --udid="${udid}" test "${maestroFlow}" --format junit -e APP_ID="${appId}"`;
    console.log(command);
    childProcess.execSync(`MAESTRO_DRIVER_STARTUP_TIMEOUT=1500000 ${command}`, {
      stdio: 'inherit',
      timeout,
    });

    stopVideoRecording(recProcess);
  } catch (error) {
    // Can't put this in the finally block because it will be executed after the
    // recursive call of executeTestsWithRetries
    stopVideoRecording(recProcess);

    if (currentAttempt < MAX_ATTEMPTS) {
      executeTestsWithRetries(
        appId,
        udid,
        maestroFlow,
        jsengine,
        currentAttempt + 1,
      );
    } else {
      console.error(`Failed to execute flow after ${MAX_ATTEMPTS} attempts.`);
      throw error;
    }
  }
}

async function main(args = process.argv.slice(2)) {
  if (args.length !== 6) {
    throw new Error(`Invalid number of arguments.\n${usage}`);
  }

  const appPath = args[0];
  const appId = args[1];
  const maestroFlow = args[2];
  const jsengine = args[3];
  const isDebug = args[4] === 'Debug';
  const workingDirectory = args[5];

  console.info('\n==============================');
  console.info('Running tests for iOS with the following parameters:');
  console.info(`APP_PATH: ${appPath}`);
  console.info(`APP_ID: ${appId}`);
  console.info(`MAESTRO_FLOW: ${maestroFlow}`);
  console.info(`JS_ENGINE: ${jsengine}`);
  console.info(`IS_DEBUG: ${isDebug}`);
  console.info(`WORKING_DIRECTORY: ${workingDirectory}`);
  console.info('==============================\n');

  const simulator = findAvailableSimulator();
  launchSimulator(simulator);
  installAppOnSimulator(appPath);
  bringSimulatorInForeground();
  await launchAppOnSimulator(appId, simulator.udid, isDebug);
  executeTestsWithRetries(appId, simulator.udid, maestroFlow, jsengine, 1);
  console.log('Test finished');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  findAvailableSimulator,
};
