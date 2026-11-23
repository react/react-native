/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

jest.mock('execa', () => ({sync: jest.fn(() => ({stdout: '[]'}))}));

const {getDependencyManager, getXcodeBuildSettings} = require('../ios');
const execa = require('execa');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let iosPath;
beforeEach(() => {
  iosPath = fs.mkdtempSync(path.join(os.tmpdir(), 'helloworld-ios-'));
  fs.mkdirSync(path.join(iosPath, 'HelloWorld.xcodeproj'));
  execa.sync.mockClear();
});
afterEach(() => {
  fs.rmSync(iosPath, {recursive: true, force: true});
});

function convertToSwiftPM() {
  fs.writeFileSync(
    path.join(iosPath, 'HelloWorld.xcodeproj', '.spm-injected.json'),
    '{}',
  );
}

describe('getDependencyManager', () => {
  it('is cocoapods for the project as checked in', () => {
    expect(getDependencyManager(iosPath)).toBe('cocoapods');
  });

  it('is swiftpm after `react-native spm add` converted the project', () => {
    convertToSwiftPM();
    expect(getDependencyManager(iosPath)).toBe('swiftpm');
  });
});

describe('getXcodeBuildSettings', () => {
  const xcodebuildArgs = () => execa.sync.mock.calls[0][1];

  it('reads the CocoaPods workspace', () => {
    getXcodeBuildSettings(iosPath, 'Debug');
    expect(xcodebuildArgs()).toEqual(
      expect.arrayContaining(['-workspace', 'HelloWorld.xcworkspace']),
    );
  });

  it('reads the Xcode project of a SwiftPM app', () => {
    convertToSwiftPM();
    getXcodeBuildSettings(iosPath, 'Debug');
    expect(xcodebuildArgs()).toEqual(
      expect.arrayContaining(['-project', 'HelloWorld.xcodeproj']),
    );
    expect(xcodebuildArgs()).not.toContain('-workspace');
  });
});
