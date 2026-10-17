/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {readPngDimensions} = require('./png');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MANIFEST_VERSION = 1;
const PLATFORMS = ['android', 'ios'];

// <component>/<scenario>/<checkpoint>, each segment lowercase kebab-case.
const TEST_ID_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){2}$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;

// Environment properties that select a baseline. Anything else in the
// environment is recorded for diagnosis but does not change the key.
const KEYED_PROPERTIES = {
  android: [
    'apiLevel',
    'abi',
    'nativeBridge',
    'systemImage',
    'screenSize',
    'density',
    'fontScale',
    'locale',
    'animatorDurationScale',
    'emulatorVersion',
  ],
  ios: ['runtime', 'deviceType', 'appearance', 'contentSizeCategory', 'locale'],
};

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value != null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * A readable prefix for the properties people look for first, followed by a
 * hash of every keyed property so that drift in any of them selects a
 * different baseline instead of producing a spurious diff.
 */
function environmentKey(platform, environment) {
  const keyed = {};
  for (const property of KEYED_PROPERTIES[platform]) {
    keyed[property] = environment[property] ?? null;
  }
  const hash = sha256(Buffer.from(canonicalJson({platform, keyed}))).slice(
    0,
    8,
  );
  const readable =
    platform === 'android'
      ? [
          'android',
          `api${environment.apiLevel}`,
          environment.abi,
          environment.screenSize,
          `${environment.density}dpi`,
        ]
      : [
          'ios',
          String(environment.runtime).replace(/^iOS-/, ''),
          environment.deviceType,
        ];
  return [...readable.map(slug), hash].join('-');
}

function collectImages(captureDir) {
  const images = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.png')) {
        images.push(entryPath);
      }
    }
  };
  visit(captureDir);
  return images.sort();
}

function buildManifest({captureDir, platform, environment, git}) {
  const images = collectImages(captureDir).map(imagePath => {
    const relativePath = path
      .relative(captureDir, imagePath)
      .split(path.sep)
      .join('/');
    const buffer = fs.readFileSync(imagePath);
    const dimensions = readPngDimensions(buffer);
    if (dimensions == null) {
      throw new Error(`Not a PNG: ${relativePath}`);
    }
    return {
      id: relativePath.replace(/\.png$/, ''),
      path: relativePath,
      ...dimensions,
      bytes: buffer.length,
      sha256: sha256(buffer),
    };
  });

  return {
    version: MANIFEST_VERSION,
    platform,
    environmentKey: environmentKey(platform, environment),
    environment,
    git,
    images,
  };
}

function run(command, args) {
  return childProcess
    .execFileSync(command, args, {encoding: 'utf8', timeout: 30000})
    .trim();
}

/** The emulator package's version, from the Android SDK. */
function readEmulatorVersion() {
  const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  if (sdk == null) {
    return null;
  }
  const properties = fs.readFileSync(
    path.join(sdk, 'emulator', 'source.properties'),
    'utf8',
  );
  return /^Pkg\.Revision=(\S+)$/m.exec(properties)?.[1] ?? null;
}

function readAndroidEnvironment() {
  const getprop = name => run('adb', ['shell', 'getprop', name]);
  const setting = (namespace, name) =>
    run('adb', ['shell', 'settings', 'get', namespace, name]);
  const wm = name => {
    const output = run('adb', ['shell', 'wm', name]);
    const override = /Override \w+: (\S+)/.exec(output);
    return (override ?? /Physical \w+: (\S+)/.exec(output))?.[1] ?? output;
  };
  return {
    apiLevel: Number(getprop('ro.build.version.sdk')),
    abi: getprop('ro.product.cpu.abi'),
    nativeBridge: getprop('ro.dalvik.vm.native.bridge'),
    systemImage: getprop('ro.build.fingerprint'),
    screenSize: wm('size'),
    density: Number(wm('density')),
    fontScale: setting('system', 'font_scale'),
    locale: getprop('persist.sys.locale') || getprop('ro.product.locale'),
    animatorDurationScale: setting('global', 'animator_duration_scale'),
    emulatorVersion: readEmulatorVersion(),
  };
}

function readIosEnvironment(udid) {
  const devices = JSON.parse(
    run('xcrun', ['simctl', 'list', 'devices', '-j']),
  ).devices;
  let device = null;
  let runtime = null;
  for (const [runtimeId, runtimeDevices] of Object.entries(devices)) {
    const match = runtimeDevices.find(candidate => candidate.udid === udid);
    if (match != null) {
      device = match;
      runtime = runtimeId.replace('com.apple.CoreSimulator.SimRuntime.', '');
    }
  }
  if (device == null) {
    throw new Error(`Simulator ${udid} not found`);
  }
  const ui = name => run('xcrun', ['simctl', 'ui', udid, name]);
  return {
    runtime,
    deviceType: device.deviceTypeIdentifier.replace(
      'com.apple.CoreSimulator.SimDeviceType.',
      '',
    ),
    appearance: ui('appearance'),
    contentSizeCategory: ui('content_size'),
    locale: run('xcrun', [
      'simctl',
      'spawn',
      udid,
      'defaults',
      'read',
      '-g',
      'AppleLocale',
    ]),
    xcode: run('xcodebuild', ['-version']).split('\n').join(' '),
  };
}

function readGitInfo() {
  const git = args => run('git', args);
  return {
    // For pull_request events actions/checkout tests the merge commit, whose
    // first parent is the base branch commit the PR was tested against.
    testedSha: git(['rev-parse', 'HEAD']),
    baseSha: git(['rev-parse', 'HEAD^1']),
    headSha: process.env.VISUAL_HEAD_SHA || git(['rev-parse', 'HEAD']),
    event: process.env.GITHUB_EVENT_NAME ?? null,
    ref: process.env.GITHUB_REF ?? null,
  };
}

const usage = `
node manifest.js <platform> <capture_dir> <output_path> [ios_udid]

Writes a manifest for the PNGs under <capture_dir>, reading the environment
from the running emulator (adb) or the simulator with <ios_udid>.
`;

function main(args = process.argv.slice(2)) {
  const [platform, captureDir, outputPath, udid] = args;
  if (
    !PLATFORMS.includes(platform) ||
    captureDir == null ||
    outputPath == null
  ) {
    throw new Error(usage);
  }
  const environment =
    platform === 'android'
      ? readAndroidEnvironment()
      : readIosEnvironment(udid);
  const manifest = buildManifest({
    captureDir,
    platform,
    environment,
    git: readGitInfo(),
  });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.info(
    `Wrote ${manifest.images.length} image(s) for ${manifest.environmentKey} to ${outputPath}`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  KEYED_PROPERTIES,
  MANIFEST_VERSION,
  PLATFORMS,
  SHA_PATTERN,
  TEST_ID_PATTERN,
  buildManifest,
  canonicalJson,
  environmentKey,
  sha256,
};
