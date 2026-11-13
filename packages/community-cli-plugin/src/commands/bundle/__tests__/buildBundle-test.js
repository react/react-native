/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {BundleCommandArgs} from '../buildBundle';
import type {RunBuildOptions, RunBuildResult} from 'metro';

import {unstable_buildBundleWithConfig as buildBundle} from '../buildBundle';
import {getDefaultConfig} from 'metro-config';
import * as metroBundle from 'metro/private/shared/output/bundle';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

jest.mock('metro', () => ({runBuild: jest.fn()}));

let directory: string;
let args: BundleCommandArgs;
let bundle: RunBuildResult;
type BundleOutput = NonNullable<RunBuildOptions['output']>;
const runBuildMock: JestMockFn<
  [config: unknown, options: RunBuildOptions],
  Promise<RunBuildResult>,
> = jest.requireMock('metro').runBuild;

beforeEach(() => {
  jest.useRealTimers();
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-build-bundle-'));
  args = {
    entryFile: 'index.js',
    platform: 'ios',
    dev: false,
    resetCache: false,
    resetGlobalCache: false,
    bundleOutput: path.join(directory, 'output', 'main.jsbundle'),
    sourcemapUseAbsolutePath: false,
    verbose: false,
    unstableTransformProfile: 'default',
  };
  bundle = {
    code: 'console.log("café");',
    map: JSON.stringify({
      version: 3,
      sources: [path.join(directory, 'index.js')],
      names: [],
      mappings: '',
    }),
  };
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  // Simulate runBuild's output contract, but use the real output writer.
  runBuildMock.mockReset();
  runBuildMock.mockImplementation(async (_config, options: RunBuildOptions) => {
    const {bundleOut, platform} = options;
    if (bundleOut == null || platform == null) {
      throw new Error('Expected explicit bundle output and platform');
    }
    await (options.output ?? metroBundle).save(
      bundle,
      {
        bundleOutput: bundleOut,
        sourcemapOutput: options.sourceMapOut,
        dev: options.dev,
        platform,
      },
      () => {},
    );
    return bundle;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  fs.rmSync(directory, {recursive: true, force: true});
});

test('honors the requested bundle encoding', async () => {
  args.bundleEncoding = 'utf16le';

  await buildBundle(args, await getDefaultConfig(directory));

  expect(fs.readFileSync(args.bundleOutput)).toEqual(
    Buffer.from(bundle.code, 'utf16le'),
  );
});

test('keeps UTF-8 output when no encoding is specified', async () => {
  await buildBundle(args, await getDefaultConfig(directory));

  expect(fs.readFileSync(args.bundleOutput)).toEqual(
    Buffer.from(bundle.code, 'utf8'),
  );
});

test.each([false, true])(
  'relativizes source paths in a source map (indexed: %s)',
  async indexed => {
    const map = JSON.parse(bundle.map);
    if (indexed) {
      bundle.map = JSON.stringify({
        version: 3,
        sections: [{offset: {line: 0, column: 0}, map}],
      });
    }
    const sourcemapOutput = path.join(directory, 'output', 'main.map');
    args.sourcemapOutput = sourcemapOutput;
    args.sourcemapSourcesRoot = directory;

    await buildBundle(args, await getDefaultConfig(directory));

    const written = JSON.parse(fs.readFileSync(sourcemapOutput, 'utf8'));
    expect(indexed ? written.sections[0].map.sources : written.sources).toEqual(
      ['index.js'],
    );
  },
);

test('preserves a custom output implementation and its save options', async () => {
  args.bundleEncoding = 'ascii';
  args.sourcemapOutput = path.join(directory, 'output', 'main.map');
  args.sourcemapSourcesRoot = directory;
  const output = {
    build: jest.fn<
      Parameters<BundleOutput['build']>,
      ReturnType<BundleOutput['build']>,
    >(async () => bundle),
    save: jest.fn<
      Parameters<BundleOutput['save']>,
      ReturnType<BundleOutput['save']>,
    >(async () => {}),
  };

  await buildBundle(args, await getDefaultConfig(directory), output);

  expect(runBuildMock.mock.calls[0][1].output?.build).toBe(output.build);
  expect(output.save).toHaveBeenCalledWith(
    bundle,
    {
      bundleOutput: args.bundleOutput,
      sourcemapOutput: args.sourcemapOutput,
      dev: args.dev,
      platform: args.platform,
      bundleEncoding: 'ascii',
      sourcemapSourcesRoot: directory,
    },
    expect.any(Function),
  );
});
