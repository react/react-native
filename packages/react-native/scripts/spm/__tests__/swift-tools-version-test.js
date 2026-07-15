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

// ---------------------------------------------------------------------------
// SPM requires `// swift-tools-version: X.Y` on the FIRST LINE of Package.swift.
// When the directive isn't on line 1, SPM silently treats the manifest as
// tools-version 3.1.0 and recent Xcode rejects it outright:
//
//   error: package 'package.swift' is using Swift tools version 3.1.0 which
//   is no longer supported; consider using '// swift-tools-version: 6.3'
//
// This regression test pins every Package.swift our generators emit to that
// rule, and asserts the same for the static codegen template.
// ---------------------------------------------------------------------------

const {
  generateAutolinkedPackageSwift,
  generateSynthPackageSwift,
} = require('../generate-spm-autolinking');
const {generateXCFrameworksPackageSwift} = require('../generate-spm-package');
const {emitScaffoldedPackageSwift} = require('../scaffold-package-swift');
const fs = require('fs');
const path = require('path');

const TOOLS_VERSION_RE = /^\/\/ swift-tools-version: \d+\.\d+/;

function firstLineOf(s) {
  return s.split('\n', 1)[0];
}

describe('swift-tools-version directive must be on line 1', () => {
  it('generateXCFrameworksPackageSwift (xcframeworks sub-package)', () => {
    const out = generateXCFrameworksPackageSwift(
      ['React', 'ReactNativeDependencies', 'hermes-engine'],
      '/tmp/cache/0.85.3/debug',
    );
    expect(firstLineOf(out)).toMatch(TOOLS_VERSION_RE);
  });

  it('generateAutolinkedPackageSwift (autolinker aggregator)', () => {
    const out = generateAutolinkedPackageSwift({});
    expect(firstLineOf(out)).toMatch(TOOLS_VERSION_RE);
  });

  it('generateSynthPackageSwift (per-dep synth wrapper)', () => {
    const out = generateSynthPackageSwift({
      swiftName: 'MyDep',
      exclude: [],
      publicHeadersPath: '.',
      spmDependencies: [],
      hasReactDep: false,
      hasXcfwHeaders: false,
      hasDepsHeaders: false,
      codegenHeadersIncluded: false,
    });
    expect(firstLineOf(out)).toMatch(TOOLS_VERSION_RE);
  });

  it('emitScaffoldedPackageSwift (community-lib scaffold)', () => {
    const out = emitScaffoldedPackageSwift({
      swiftName: 'foo',
      sources: [],
      headerSearchPaths: [],
      coreReactNative: false,
      siblingNames: [],
      extraFrameworks: [],
      weakFrameworks: [],
      compilerFlags: [],
      publicHeadersPath: null,
      resources: [],
      warnings: [],
    });
    expect(firstLineOf(out)).toMatch(TOOLS_VERSION_RE);
  });

  it('codegen Package.swift.spm-template (static file)', () => {
    const templatePath = path.resolve(
      __dirname,
      '..',
      '..',
      'codegen',
      'templates',
      'Package.swift.spm-template',
    );
    const out = fs.readFileSync(templatePath, 'utf8');
    expect(firstLineOf(out)).toMatch(TOOLS_VERSION_RE);
  });
});
