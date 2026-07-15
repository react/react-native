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

// Regression test for the fresh-consumer-app failure: `plist` is NOT a
// dependency of the react-native package, so it only resolves inside this
// monorepo via hoisting. A generated app running `spm add` gets
// "Cannot find module 'plist'". flavored-frameworks.js must therefore never
// require it — Info.plist parsing goes through plutil instead.
jest.mock('plist', () => {
  throw new Error(
    "Cannot find module 'plist' — flavored-frameworks.js must not depend on it",
  );
});

// plutil is macOS-only; stand in with a portable plist-parse so the suite is
// hermetic on Linux CI. Module-level mock because flavored-frameworks.js
// destructures execFileSync at require time (same pattern the old
// swap-flavor-test used).
jest.mock('child_process', () => {
  const actual = jest.requireActual<$FlowFixMe>('child_process');
  return {
    ...actual,
    execFileSync: (cmd, args, opts) => {
      if (cmd === 'plutil') {
        const fs = require('fs');
        const plist = jest.requireActual<$FlowFixMe>('plist');
        const file = args[args.length - 1];
        return Buffer.from(
          JSON.stringify(plist.parse(fs.readFileSync(file, 'utf8'))),
        );
      }
      return actual.execFileSync(cmd, args, opts);
    },
  };
});

const fs = require('fs');
const os = require('os');
const path = require('path');

const realPlist = jest.requireActual<$FlowFixMe>('plist');

function makeXcframework(root /*: string */) /*: string */ {
  const xcframework = path.join(root, 'React.xcframework');
  const sliceId = 'ios-arm64';
  fs.mkdirSync(path.join(xcframework, sliceId, 'React.framework'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(xcframework, sliceId, 'React.framework', 'React'),
    'not-a-real-mach-o',
  );
  fs.writeFileSync(
    path.join(xcframework, 'Info.plist'),
    realPlist.build({
      AvailableLibraries: [
        {
          LibraryIdentifier: sliceId,
          LibraryPath: 'React.framework',
          SupportedPlatform: 'ios',
          SupportedArchitectures: ['arm64'],
        },
      ],
      CFBundlePackageType: 'XFWK',
      XCFrameworkFormatVersion: '1.0',
    }),
  );
  return xcframework;
}

describe('flavored-frameworks without the plist module', () => {
  let tmp;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-plist-dep-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  it('loads without requiring plist', () => {
    expect(() => require('../flavored-frameworks')).not.toThrow();
  });

  it('parses an xcframework Info.plist via plutil', () => {
    const {parseXcframework} = require('../flavored-frameworks');
    const parsed = parseXcframework(makeXcframework(tmp));
    expect(parsed.slices).toHaveLength(1);
    expect(parsed.slices[0].libraryIdentifier).toBe('ios-arm64');
    expect(parsed.slices[0].platform).toBe('ios');
  });
});
