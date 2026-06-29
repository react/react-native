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
@param {string} flavor - Flavor of the app to be launched. Can be 'release' or 'debug'
@param {string} workingDirectory - Working directory from where to run Metro
==============
`;

const args = process.argv.slice(2);

if (args.length !== 5) {
  throw new Error(`Invalid number of arguments.\n${usage}`);
}

const APP_PATH = args[0];
const APP_ID = args[1];
const MAESTRO_FLOW = args[2];
const IS_DEBUG = args[3] === 'debug';
const WORKING_DIRECTORY = args[4];

const MAX_ATTEMPTS = 3;

async function executeFlowWithRetries(flow, currentAttempt) {
  try {
    console.info(`Executing flow: ${flow}`);
    const timeout = 1000 * 60 * 10; // 10 minutes
    childProcess.execSync(
      `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000 $HOME/.maestro/bin/maestro test ${flow} --format junit -e APP_ID=${APP_ID} --debug-output /tmp/MaestroLogs`,
      {stdio: 'inherit', timeout},
    );
  } catch (err) {
    if (currentAttempt < MAX_ATTEMPTS) {
      console.info(`Retrying...`);
      await executeFlowWithRetries(flow, currentAttempt + 1);
    } else {
      throw err;
    }
  }
}

async function executeFlowInFolder(flowFolder) {
  const files = fs.readdirSync(flowFolder);
  for (const file of files) {
    const filePath = `${flowFolder}/${file}`;
    if (fs.lstatSync(filePath).isDirectory()) {
      await executeFlowInFolder(filePath);
    } else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      await executeFlowWithRetries(filePath, 0);
    }
    // Skip non-flow files (e.g. screenshot baselines under screenshots/).
  }
}

async function main() {
  console.info('\n==============================');
  console.info('Running tests for Android with the following parameters:');
  console.info(`APP_PATH: ${APP_PATH}`);
  console.info(`APP_ID: ${APP_ID}`);
  console.info(`MAESTRO_FLOW: ${MAESTRO_FLOW}`);
  console.info(`IS_DEBUG: ${IS_DEBUG}`);
  console.info(`WORKING_DIRECTORY: ${WORKING_DIRECTORY}`);
  console.info('==============================\n');

  console.info('Install app');
  childProcess.execSync(`adb install ${APP_PATH}`, {stdio: 'ignore'});

  let metroProcess = null;
  if (IS_DEBUG) {
    console.info('Start Metro');
    childProcess.execSync(`cd ${WORKING_DIRECTORY}`, {stdio: 'ignore'});
    metroProcess = childProcess.spawn('yarn', ['start', '&'], {
      cwd: WORKING_DIRECTORY,
      stdio: 'ignore',
      detached: true,
    });
    metroProcess.unref();
    console.info(`- Metro PID: ${metroProcess.pid}`);

    console.info('Wait For Metro to Start');
    await sleep(5000);
  }

  console.info('Start the app');
  childProcess.execSync(`adb shell monkey -p ${APP_ID} 1`, {stdio: 'ignore'});

  if (IS_DEBUG) {
    console.info('Wait For App to warm from Metro');
    await sleep(10000);
  }

  console.info('Start recording to /sdcard/screen.mp4');
  childProcess
    .exec('adb shell screenrecord /sdcard/screen.mp4', {
      stdio: 'ignore',
      detached: true,
    })
    .unref();

  console.info(`Start testing ${MAESTRO_FLOW}`);
  let error = null;
  try {
    //check if MAESTRO_FLOW is a folder
    if (
      fs.existsSync(MAESTRO_FLOW) &&
      fs.lstatSync(MAESTRO_FLOW).isDirectory()
    ) {
      await executeFlowInFolder(MAESTRO_FLOW);
    } else {
      await executeFlowWithRetries(MAESTRO_FLOW, 0);
    }
  } catch (err) {
    error = err;
  } finally {
    console.info('Stop recording');
    childProcess.execSync('adb pull /sdcard/screen.mp4', {stdio: 'ignore'});

    if (IS_DEBUG && metroProcess != null) {
      const pid = metroProcess.pid;
      console.info(`Kill Metro. PID: ${pid}`);
      process.kill(pid);
      console.info(`Metro Killed`);
    }
  }

  if (error) {
    throw error;
  }
  process.exit();
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

main();
