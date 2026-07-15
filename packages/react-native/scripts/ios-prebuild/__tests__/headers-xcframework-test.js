/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {
  buildDepsHeadersXcframework,
  stubSlicesFromXcframework,
} = require('../headers-xcframework');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('buildDepsHeadersXcframework set-equality gate', () => {
  let tmp /*: string */;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-headers-test-'));
  });
  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  const mkHeaders = (namespaces /*: Array<string> */) => {
    const dir = path.join(tmp, 'Headers');
    fs.mkdirSync(dir, {recursive: true});
    for (const ns of namespaces) {
      fs.mkdirSync(path.join(dir, ns), {recursive: true});
    }
    return dir;
  };

  // Both gates throw BEFORE any staging or xcodebuild invocation, so these
  // tests run without macOS tooling.
  test('fails closed when a declared namespace is missing from the artifact', () => {
    const headers = mkHeaders(['folly']);
    expect(() =>
      buildDepsHeadersXcframework(tmp, headers, ['folly', 'glog'], []),
    ).toThrow(/missing from .*Headers: glog/);
  });

  test('fails closed when the artifact ships an undeclared namespace', () => {
    const headers = mkHeaders(['folly', 'brand-new-dep']);
    expect(() =>
      buildDepsHeadersXcframework(tmp, headers, ['folly'], []),
    ).toThrow(/undeclared in DEPS_NAMESPACES.*brand-new-dep/);
  });

  test('ignores loose files at the Headers root (directories are the namespace set)', () => {
    const headers = mkHeaders(['folly']);
    fs.writeFileSync(path.join(headers, 'stray.h'), '');
    expect(() =>
      buildDepsHeadersXcframework(tmp, headers, ['folly', 'glog'], []),
    ).toThrow(/missing from .*Headers: glog/); // throws for glog, not stray.h
  });
});

describe('stubSlicesFromXcframework', () => {
  // The plist shape is a pure function of plutil's JSON; mock it so the
  // SupportedPlatform/Variant -> key mapping and the unknown-slice guard can be
  // tested without a real xcframework or macOS tooling.
  const mockPlist = (obj /*: unknown */) =>
    jest
      .spyOn(childProcess, 'execFileSync')
      .mockReturnValue(Buffer.from(JSON.stringify(obj) ?? '', 'utf8'));

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('maps ios / ios-simulator slices to their stub recipes', () => {
    mockPlist({
      AvailableLibraries: [
        {SupportedPlatform: 'ios', SupportedArchitectures: ['arm64']},
        {
          SupportedPlatform: 'ios',
          SupportedPlatformVariant: 'simulator',
          SupportedArchitectures: ['arm64', 'x86_64'],
        },
      ],
    });
    const slices = stubSlicesFromXcframework('/fake.xcframework');
    expect(slices).toEqual([
      {name: 'ios', sdk: 'iphoneos', targets: ['arm64-apple-ios15.0']},
      {
        name: 'ios-simulator',
        sdk: 'iphonesimulator',
        targets: [
          'arm64-apple-ios15.0-simulator',
          'x86_64-apple-ios15.0-simulator',
        ],
      },
    ]);
  });

  test('throws for an unknown slice, pointing at PLATFORM_STUB_RECIPES', () => {
    mockPlist({
      AvailableLibraries: [
        {SupportedPlatform: 'watchos', SupportedArchitectures: ['arm64']},
      ],
    });
    expect(() => stubSlicesFromXcframework('/fake.xcframework')).toThrow(
      /no stub recipe for slice 'watchos'[\s\S]*PLATFORM_STUB_RECIPES/,
    );
  });
});
