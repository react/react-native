/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {XcodeBuildSettings} from './xcode';
import type {Result} from 'execa';

import execa from 'execa';
import fs from 'node:fs';
import path from 'node:path';

export type IOSDevice = {
  lastBootedAt: Date,
  dataPath: string,
  dataPathSize: number,
  logPath: string,
  udid: string,
  isAvailable: boolean,
  availabilityError: string,
  logPathSize: number,
  deviceTypeIdentifier: string,
  state: 'Shutdown' | 'Booted' | 'Creating',
  name: string,
};

export async function getSimulatorDetails(
  nameOrUDID: string,
): Promise<IOSDevice> {
  const {stdout} = execa.sync('xcrun', [
    'simctl',
    'list',
    'devices',
    'iPhone',
    'available',
    '--json',
  ]);
  const json = JSON.parse(stdout);

  const allAvailableDevices: IOSDevice[] = Object.values(json.devices)
    .flatMap(devices => devices)
    .filter(device => device.isAvailable)
    .map(device => ({
      ...device,
      lastBootedAt: new Date(device.lastBootedAt),
    }));

  if (nameOrUDID.length > 0 && nameOrUDID.toLowerCase() !== 'simulator') {
    const namedDevice = allAvailableDevices.find(
      device => device.udid === nameOrUDID || device.name === nameOrUDID,
    );
    if (namedDevice == null) {
      const devices = allAvailableDevices
        .map(device => `- ${device.name}: ${device.udid}`)
        .join('\n - ');
      throw new Error(
        `Unable to find device with name or UDID: '${nameOrUDID}', found:\n\n${devices}`,
      );
    }
    return namedDevice;
  }

  const booted: IOSDevice[] = allAvailableDevices.filter(
    device =>
      device.state === 'Booted' &&
      /SimDeviceType\.iPhone/.test(device.deviceTypeIdentifier),
  );
  // Pick anything that is booted, otherwise get your user to help out
  const available = booted.sort(
    (a, b) => a.lastBootedAt.getTime() - b.lastBootedAt.getTime(),
  );

  if (available.length === 0) {
    throw new Error(
      'No simulator is available, please create on using the Simulator',
    );
  }

  return available[0];
}

export async function bootSimulator(
  device: IOSDevice,
): Promise<Result | string> {
  if (device.state === 'Shutdown') {
    return execa('xcrun', ['simctl', 'boot', device.udid]);
  }
  return Promise.resolve('Already booted');
}

export async function launchSimulator(device: IOSDevice): Promise<Result> {
  return execa('open', [
    '-a',
    'Simulator',
    '--args',
    '-CurrentDeviceUDID',
    device.udid,
  ]);
}

/**
 * Launches the app on the simulator.
 *
 * @param udid The UDID of the simulator
 * @param bundleId The bundle ID of the app
 * @param env The environment variables to set in the app environment (optional)
 */
export async function launchApp(
  udid: string,
  bundleId: string,
  env: {[string]: string} | null = null,
): Promise<Result> {
  const _env: {[string]: string | void} = {};
  if (env) {
    for (const [key, value] of Object.entries(env)) {
      _env['SIMCTL_CHILD_' + key] = value;
    }
  }
  return execa('xcrun', ['simctl', 'launch', udid, bundleId], {
    env: env == null ? _env : process.env,
  });
}

export function getXcodeBuildSettings(
  iosProjectFolder: string,
  mode: 'Release' | 'Debug',
): XcodeBuildSettings[] {
  const {stdout} = execa.sync(
    'xcodebuild',
    [
      '-workspace',
      'HelloWorld.xcworkspace',
      '-scheme',
      'HelloWorld',
      '-configuration',
      mode,
      '-sdk',
      'iphonesimulator',
      '-showBuildSettings',
      '-json',
    ],
    {cwd: iosProjectFolder},
  );
  return JSON.parse(stdout);
}

export function hasPodInstalled(iosPath: string, pkg: string): boolean {
  const containsPackage = new RegExp(`\n  - ${pkg} \\(.+\\):?\n`);
  return containsPackage.test(
    fs.readFileSync(path.join(iosPath, 'Podfile.lock'), 'utf8'),
  );
}
