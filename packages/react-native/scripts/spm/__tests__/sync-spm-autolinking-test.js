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

const {MissingManifestError} = require('../generate-spm-autolinking');
const {PluginFrameworkMismatchError} = require('../generate-spm-xcodeproj');
const {RemoteVersionError} = require('../spm-utils');
const {main, reportFailure} = require('../sync-spm-autolinking');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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
      assertPluginFrameworksLinked: jest.fn(),
      findProjectRoot: jest.fn(() => appRoot),
      // Obsolete collaborators are deliberately supplied to prove sync does
      // not download artifacts or regenerate the runtime package graph.
      downloadArtifacts: jest.fn(),
      generatePackage: jest.fn(),
      ...overrides,
    };
  }

  function baseArgv() {
    return ['--app-root', appRoot, '--react-native-root', rnRoot];
  }

  function run(deps) {
    return main(baseArgv(), deps);
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
    expect(deps.assertPluginFrameworksLinked).toHaveBeenCalledWith(appRoot);
    expect(deps.downloadArtifacts).not.toHaveBeenCalled();
    expect(deps.generatePackage).not.toHaveBeenCalled();
    expect(fs.existsSync(stampPath())).toBe(true);
  });

  it('forwards --ios-deployment-target to the autolinker only when given', async () => {
    const withFlag = makeDeps();
    await main([...baseArgv(), '--ios-deployment-target', '16.4'], withFlag);
    expect(withFlag.generateAutolinking).toHaveBeenCalledWith([
      ...baseArgv(),
      '--ios-deployment-target',
      '16.4',
    ]);

    const withoutFlag = makeDeps();
    await run(withoutFlag);
    expect(withoutFlag.generateAutolinking).toHaveBeenCalledWith(baseArgv());
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

  function mismatchPath() {
    return path.join(
      appRoot,
      'build',
      'generated',
      'autolinking',
      '.spm-plugin-mismatch',
    );
  }

  it('records the errors and refreshes the stamp when plugin frameworks and the project disagree', async () => {
    fs.mkdirSync(path.dirname(stampPath()), {recursive: true});
    fs.writeFileSync(stampPath(), 'earlier sync\n');
    const mismatch = new PluginFrameworkMismatchError([
      'error: first problem',
      'error: second problem',
    ]);
    const deps = makeDeps({
      assertPluginFrameworksLinked: jest.fn(() => {
        throw mismatch;
      }),
    });
    await expect(run(deps)).rejects.toBe(mismatch);
    expect(deps.generateAutolinking.mock.invocationCallOrder[0]).toBeLessThan(
      deps.assertPluginFrameworksLinked.mock.invocationCallOrder[0],
    );
    expect(fs.readFileSync(mismatchPath(), 'utf8')).toBe(
      'error: first problem\nerror: second problem\n',
    );
    expect(fs.readFileSync(stampPath(), 'utf8')).not.toBe('earlier sync\n');
  });

  it('removes the recorded errors when the check passes', async () => {
    fs.mkdirSync(path.dirname(mismatchPath()), {recursive: true});
    fs.writeFileSync(mismatchPath(), 'error: earlier problem\n');
    await run(makeDeps());
    expect(fs.existsSync(mismatchPath())).toBe(false);
  });

  it('leaves the stamp alone when the check fails for another reason', async () => {
    const deps = makeDeps({
      assertPluginFrameworksLinked: jest.fn(() => {
        throw new Error('unreadable marker');
      }),
    });
    await expect(run(deps)).rejects.toThrow(/unreadable marker/);
    expect(fs.existsSync(stampPath())).toBe(false);
    expect(fs.existsSync(mismatchPath())).toBe(false);
  });
});

describe('sync-spm-autolinking reportFailure', () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.exitCode = undefined;
  });

  it.each([
    ['a remote version error', new RemoteVersionError('bad remote version')],
    ['a missing manifest', new MissingManifestError([])],
    [
      'a plugin framework mismatch',
      new PluginFrameworkMismatchError(['error: a problem']),
    ],
  ])('exits 2 with only the message for %s', (_, error) => {
    reportFailure(error);
    expect(process.exitCode).toBe(2);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.map(call => call.join(' '))).toEqual([
      expect.stringContaining(error.message),
    ]);
    expect(logSpy.mock.calls[0].join(' ')).not.toContain(' at ');
  });

  it('exits 1 with the stack trace for any other error', () => {
    const error = new Error('unexpected');
    reportFailure(error);
    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(error);
  });
});
