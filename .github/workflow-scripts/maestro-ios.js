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

function launchSimulator(simulatorName) {
  console.log(`Launching simulator ${simulatorName}`);
  try {
    childProcess.execSync(`xcrun simctl boot "${simulatorName}"`);
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

function extractSimulatorUDID() {
  console.log('Retrieving device UDID');
  const command = `xcrun simctl list devices booted -j | jq -r '[.devices[]] | add | first | .udid'`;
  const udid = String(childProcess.execSync(command)).trim();
  console.log(`UDID is ${udid}`);
  return udid;
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
    `simctl io booted recordVideo --force video_record_${currentAttempt}.mov`.split(
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

function executeFlowWithRetries(appId, udid, flow, jsengine, currentAttempt) {
  const recProcess = startVideoRecording(jsengine, currentAttempt);
  try {
    const timeout = 1000 * 60 * 10; // 10 minutes
    const command = `$HOME/.maestro/bin/maestro --udid="${udid}" test "${flow}" --format junit -e APP_ID="${appId}"`;
    console.info(`Executing flow: ${flow} (attempt ${currentAttempt})`);
    console.log(command);
    childProcess.execSync(`MAESTRO_DRIVER_STARTUP_TIMEOUT=1500000 ${command}`, {
      stdio: 'inherit',
      timeout,
    });

    stopVideoRecording(recProcess);
  } catch (error) {
    stopVideoRecording(recProcess);

    if (currentAttempt < MAX_ATTEMPTS) {
      console.info(`Retrying flow: ${flow}`);
      executeFlowWithRetries(appId, udid, flow, jsengine, currentAttempt + 1);
    } else {
      console.error(
        `Failed to execute flow ${flow} after ${MAX_ATTEMPTS} attempts.`,
      );
      throw error;
    }
  }
}

function executeFlows(appId, udid, maestroFlow, jsengine) {
  if (!fs.existsSync(maestroFlow) || !fs.lstatSync(maestroFlow).isDirectory()) {
    executeFlowWithRetries(appId, udid, maestroFlow, jsengine, 1);
    return;
  }

  for (const file of fs.readdirSync(maestroFlow).sort()) {
    const filePath = `${maestroFlow.replace(/\/$/, '')}/${file}`;
    if (fs.lstatSync(filePath).isDirectory()) {
      executeFlows(appId, udid, filePath, jsengine);
    } else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      executeFlowWithRetries(appId, udid, filePath, jsengine, 1);
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

  const simulatorName = 'iPhone 16 Pro';
  launchSimulator(simulatorName);
  installAppOnSimulator(appPath);
  const udid = extractSimulatorUDID();
  bringSimulatorInForeground();
  await launchAppOnSimulator(appId, udid, isDebug);
  executeFlows(appId, udid, maestroFlow, jsengine);
  console.log('Test finished');
}

if (require.main === module) {
  main();
}

module.exports = {
  executeFlows,
};
