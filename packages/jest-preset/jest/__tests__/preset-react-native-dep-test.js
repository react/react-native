/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';

const RN_ISSUE = 'https://github.com/react/react-native/issues/56641';

test(`isolated preset loads when the consumer provides react-native (${RN_ISSUE})`, () => {
  const presetDir = path.resolve(__dirname, '..', '..');
  const presetRequire = createRequire(path.join(presetDir, 'package.json'));
  const scratch = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rn-jest-preset-56641-'),
  );
  try {
    const isoDir = path.join(scratch, 'isolated-preset');
    const consumerDir = path.join(scratch, 'consumer');
    fs.mkdirSync(consumerDir, {recursive: true});

    // Mimic pnpm/Yarn pnpm-mode isolation: copy the preset so bare
    // specifiers resolve from the copy, which sees only what a package
    // manager would install there. Exclude node_modules: an open-source
    // Yarn install can create a per-package one, and if it contained
    // react-native or babel-jest the copy would inherit it and the test
    // would pass when it should fail.
    fs.cpSync(presetDir, isoDir, {
      recursive: true,
      filter: src => !src.split(path.sep).includes('node_modules'),
    });

    // Mirror a package-manager install of declared dependencies into the
    // isolated copy. This intentionally provides nothing beyond what the
    // manifest declares: every dependency, peer, and optional peer is
    // linked from the repo, so `require.resolve` from the copy sees exactly
    // the declared surface (notably `babel-jest`, needed by `jest-preset.js`
    // itself, as well as `react-native` when declared).
    const pkg = JSON.parse(
      fs.readFileSync(path.join(presetDir, 'package.json'), 'utf8'),
    );
    const declared = new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
      ...Object.keys(pkg.optionalDependencies ?? {}),
    ]);
    for (const name of declared) {
      const target = path.join(isoDir, 'node_modules', name);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      const depDir = path.dirname(
        presetRequire.resolve(`${name}/package.json`),
      );
      fs.symlinkSync(depDir, target, 'dir');
    }

    // A consuming project always has its own copy.
    const consumerRnDir = path.dirname(
      presetRequire.resolve('react-native/package.json'),
    );
    const consumerTarget = path.join(
      consumerDir,
      'node_modules',
      'react-native',
    );
    fs.mkdirSync(path.dirname(consumerTarget), {recursive: true});
    fs.symlinkSync(consumerRnDir, consumerTarget, 'dir');

    // Strip resolution-affecting env so the child is genuinely isolated:
    // inherited lookup paths can otherwise make the copy resolve more
    // than the directory layout alone provides.
    const childEnv: {[string]: string} = {};
    for (const key of Object.keys(process.env)) {
      if (key === 'NODE_PATH' || key === 'NODE_OPTIONS') {
        continue;
      }
      const value = process.env[key];
      if (value != null) {
        childEnv[key] = value;
      }
    }

    // The child probes what the isolated copy can actually resolve, prints
    // the outcome, then loads the preset. Both probes use the isolated
    // copy as the resolution scope.
    const isoPreset = path.join(isoDir, 'jest-preset.js');
    const probeScript = [
      `const isoDir = ${JSON.stringify(isoDir)};`,
      `const isoPreset = ${JSON.stringify(isoPreset)};`,
      `console.log('CHILD_NODE_PATH:' + (process.env.NODE_PATH ?? '(unset)'));`,
      `console.log('LOOKUP:' + JSON.stringify(require('module')._nodeModulePaths(isoDir)));`,
      `let probe;`,
      `try { probe = 'RESOLVED:' + require.resolve('react-native', {paths: [isoDir]}); } catch (e) { probe = 'UNREACHABLE:' + e.code + ':' + String(e.message).split('\\n')[0]; }`,
      `console.log('PROBE:' + probe);`,
      `require(isoPreset);`,
      `console.log('PRESET_LOADED');`,
    ].join('\n');
    const child = spawnSync(process.execPath, ['-e', probeScript], {
      cwd: consumerDir,
      encoding: 'utf8',
      env: childEnv,
    });
    const stdout = String(child.stdout ?? '');
    if (child.status !== 0) {
      throw new Error(
        `Isolated preset failed to load (${RN_ISSUE}).\n` +
          `Child output:\n${stdout}\n` +
          `Child stderr:\n${String(child.stderr ?? '')}`,
      );
    }
  } finally {
    fs.rmSync(scratch, {recursive: true, force: true});
  }
});
