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

/**
 * The in-repo libraries the SwiftPM autolinker names, checked against the
 * includes their sources hand-write.
 *
 * A library's Swift name is its header import prefix, so renaming one breaks
 * every `#import <Prefix/Header.h>` written against the old name. rn-tester
 * depends on both fixtures, so its SwiftPM job does catch that — as an Xcode
 * build failure on a macOS runner. This catches it in `test_js` instead, and
 * says which prefix went stale and what the library is called now.
 */

const {
  defaultReadPodspec,
  resolveSwiftName,
} = require('../expand-spm-dependencies');
const {toSwiftName} = require('../spm-utils');
const {readSwiftpmConfig, writeSwiftpmName} = require('../swiftpm-config');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '../../../../..');

const LIBRARIES = [
  {
    npmName: 'react-native-test-library-apple',
    dir: 'packages/react-native-test-library/apple',
  },
  {
    npmName: 'react-native-test-library-common',
    dir: 'packages/react-native-test-library/common',
  },
];

const SOURCE_SUFFIXES = ['.h', '.m', '.mm', '.c', '.cpp', '.swift'];

// What the autolinker resolves, exactly as it does it.
function resolve(library) {
  const root = path.join(REPO_ROOT, library.dir);
  return resolveSwiftName(
    library.npmName,
    readSwiftpmConfig(root, null),
    defaultReadPodspec(root, null),
  );
}

// The same, ignoring the declared name — what the podspec on its own says.
function resolveFromPodspec(library) {
  const root = path.join(REPO_ROOT, library.dir);
  return resolveSwiftName(
    library.npmName,
    null,
    defaultReadPodspec(root, null),
  );
}

function sourceFiles(dir) {
  return fs
    .readdirSync(path.join(REPO_ROOT, dir), {recursive: true})
    .map(entry => path.join(dir, String(entry)))
    .filter(file => SOURCE_SUFFIXES.includes(path.extname(file)))
    .filter(file => fs.statSync(path.join(REPO_ROOT, file)).isFile());
}

// Every `#import <Prefix/Header.h>` in the libraries' own sources.
function angleIncludes() {
  const found = [];
  for (const library of LIBRARIES) {
    for (const file of sourceFiles(library.dir)) {
      const source = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
      const re = /^\s*#(?:import|include)\s+<([^/>]+)\/[^>]+>/gm;
      let match;
      while ((match = re.exec(source)) != null) {
        found.push({file, prefix: match[1]});
      }
    }
  }
  return found;
}

describe('in-repo SwiftPM library names', () => {
  const resolved = new Map(
    LIBRARIES.map(library => [library.npmName, resolve(library).name]),
  );

  it('names each library from its declared name, not its npm package name', () => {
    expect(resolved.get('react-native-test-library-common')).toBe(
      'TestLibraryCommon',
    );
    expect(resolved.get('react-native-test-library-apple')).toBe(
      'TestLibraryApple',
    );
  });

  it('declares each name in package.json, so `spm scaffold` writes nothing', () => {
    // scaffold records a podspec-derived name in the library's package.json.
    // These two are tracked files, so a name they do not already declare makes
    // every scaffold run — CI's included — dirty the checkout.
    for (const library of LIBRARIES) {
      const root = path.join(REPO_ROOT, library.dir);
      expect(resolve(library).source).toBe('config');
      expect(
        writeSwiftpmName(root, resolved.get(library.npmName), {dryRun: true}),
      ).toBe('already-set');
    }
  });

  it('declares the same name its podspec derives, so CocoaPods agrees', () => {
    for (const library of LIBRARIES) {
      expect(resolveFromPodspec(library).name).toBe(
        resolved.get(library.npmName),
      );
    }
  });

  it('imports each sibling under the name the autolinker resolves for it', () => {
    // Any prefix that names an in-repo library — under a name it no longer has —
    // is a build failure waiting for whichever app links these fixtures.
    const stale = new Map();
    for (const library of LIBRARIES) {
      const name = resolved.get(library.npmName);
      for (const alias of [toSwiftName(library.npmName), library.npmName]) {
        if (alias !== name) {
          stale.set(alias, {name, npmName: library.npmName});
        }
      }
    }

    const offenders = angleIncludes()
      .filter(include => stale.has(include.prefix))
      .map(
        include =>
          `${include.file} imports <${include.prefix}/…>, but '${stale.get(include.prefix).npmName}' resolves to '${stale.get(include.prefix).name}'`,
      );
    expect(offenders).toEqual([]);
  });

  it('wires the one cross-library import in these fixtures', () => {
    const prefixes = angleIncludes()
      .filter(include => include.file.endsWith('TestLibraryApple.mm'))
      .map(include => include.prefix);
    expect(prefixes).toContain(
      resolved.get('react-native-test-library-common'),
    );
  });
});
