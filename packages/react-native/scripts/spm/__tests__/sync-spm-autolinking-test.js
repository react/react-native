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

const {main} = require('../sync-spm-autolinking');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('sync-spm-autolinking main', () => {
  let appRoot;
  let rnRoot;
  let logSpy;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-sync-app-'));
    rnRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-sync-rn-'));
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(appRoot, {recursive: true, force: true});
    fs.rmSync(rnRoot, {recursive: true, force: true});
  });

  function makeDeps(overrides = {}) {
    return {
      runCodegenAndInstallTemplate: jest.fn(),
      generateAutolinking: jest.fn(),
      installSpmCodegenTemplate: jest.fn(),
      buildPerAppHeaderTree: jest.fn(),
      findProjectRoot: jest.fn(() => appRoot),
      // Obsolete collaborators are deliberately supplied to prove sync does
      // not download artifacts or regenerate the runtime package graph.
      downloadArtifacts: jest.fn(),
      generatePackage: jest.fn(),
      ...overrides,
    };
  }

  function run(deps) {
    return main(['--app-root', appRoot, '--react-native-root', rnRoot], deps);
  }

  function stampPath() {
    return path.join(
      appRoot,
      'build',
      'generated',
      'autolinking',
      '.spm-sync-stamp',
    );
  }

  it('regenerates only invariant autolinking output and writes a stamp', async () => {
    const deps = makeDeps();
    await run(deps);

    expect(deps.runCodegenAndInstallTemplate).toHaveBeenCalledWith(
      appRoot,
      appRoot,
      rnRoot,
      expect.any(Object),
      {installTemplate: false},
    );
    expect(deps.installSpmCodegenTemplate).toHaveBeenCalledWith(
      appRoot,
      rnRoot,
      expect.any(Object),
    );
    expect(deps.generateAutolinking).toHaveBeenCalledWith([
      '--app-root',
      appRoot,
      '--react-native-root',
      rnRoot,
    ]);
    expect(deps.buildPerAppHeaderTree).toHaveBeenCalledWith(
      appRoot,
      expect.any(Object),
    );
    expect(deps.downloadArtifacts).not.toHaveBeenCalled();
    expect(deps.generatePackage).not.toHaveBeenCalled();
    expect(fs.existsSync(stampPath())).toBe(true);
  });

  it('continues with existing output when codegen fails', async () => {
    const deps = makeDeps({
      runCodegenAndInstallTemplate: jest.fn(() => {
        throw new Error('codegen failed');
      }),
    });
    await expect(run(deps)).resolves.toBeUndefined();
    expect(deps.generateAutolinking).toHaveBeenCalledTimes(1);
    expect(fs.existsSync(stampPath())).toBe(true);
  });

  it('installs the codegen template before fail-closed plugin execution', async () => {
    const deps = makeDeps({
      generateAutolinking: jest.fn(() => {
        throw new Error('plugin failed');
      }),
    });
    await expect(run(deps)).rejects.toThrow(/plugin failed/);
    expect(
      deps.installSpmCodegenTemplate.mock.invocationCallOrder[0],
    ).toBeLessThan(deps.generateAutolinking.mock.invocationCallOrder[0]);
    expect(fs.existsSync(stampPath())).toBe(false);
  });
});
