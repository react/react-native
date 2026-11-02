/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

const {compareCapture, compareImages, policyFor} = require('../visual/compare');
const {resolveContext} = require('../visual/compare-run');
const {buildManifest, sha256} = require('../visual/manifest');
const {readPngDimensions} = require('../visual/png');
const {validateCapture} = require('../visual/validate');
const {ANDROID_ENVIRONMENT, SHA_A, SHA_B} = require('./__fixtures__/visual');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {PNG} = require('pngjs');

function makePng(width, height, paint = () => [255, 255, 255, 255]) {
  const png = new PNG({width, height});
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const [r, g, b, a] = paint(x, y);
      png.data[offset] = r;
      png.data[offset + 1] = g;
      png.data[offset + 2] = b;
      png.data[offset + 3] = a;
    }
  }
  return PNG.sync.write(png);
}

function writeCapture(directory, images, overrides = {}) {
  for (const [id, buffer] of Object.entries(images)) {
    const filePath = path.join(directory, `${id}.png`);
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
    fs.writeFileSync(filePath, buffer);
  }
  const manifest = buildManifest({
    captureDir: directory,
    platform: 'android',
    environment: ANDROID_ENVIRONMENT,
    git: {testedSha: SHA_A, baseSha: SHA_B, headSha: SHA_A},
  });
  const finalManifest = {...manifest, ...overrides};
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify(finalManifest),
  );
  return finalManifest;
}

describe('visual comparison', () => {
  let directory;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-test-'));
  });

  afterEach(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });

  describe('readPngDimensions', () => {
    test('reads the IHDR dimensions', () => {
      expect(readPngDimensions(makePng(3, 2))).toEqual({width: 3, height: 2});
    });

    test.each([
      [Buffer.from('not a png at all, but long enough')],
      [Buffer.alloc(0)],
    ])('rejects non-PNG data', buffer => {
      expect(readPngDimensions(buffer)).toBeNull();
    });
  });

  describe('validateCapture', () => {
    test('accepts a well-formed capture', () => {
      const manifest = writeCapture(directory, {
        'text/width-mode/default': makePng(4, 4),
      });
      expect(validateCapture(directory)).toEqual(manifest);
    });

    test.each([
      ['../escape/a/b'],
      ['/absolute/a/b'],
      ['Text/Upper/case'],
      ['too/few'],
      ['a/b/c/d'],
    ])('rejects test ID %s', id => {
      writeCapture(directory, {'text/width-mode/default': makePng(4, 4)});
      const manifest = JSON.parse(
        fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'),
      );
      manifest.images[0] = {...manifest.images[0], id, path: `${id}.png`};
      fs.writeFileSync(
        path.join(directory, 'manifest.json'),
        JSON.stringify(manifest),
      );
      expect(() => validateCapture(directory)).toThrow('Invalid test ID');
    });

    test('rejects a path that does not match the ID', () => {
      const manifest = writeCapture(directory, {
        'text/width-mode/default': makePng(4, 4),
      });
      manifest.images[0].path = '../../etc/passwd';
      fs.writeFileSync(
        path.join(directory, 'manifest.json'),
        JSON.stringify(manifest),
      );
      expect(() => validateCapture(directory)).toThrow('path must be');
    });

    test('rejects duplicates, mismatched hashes and unlisted files', () => {
      const manifest = writeCapture(directory, {
        'text/width-mode/default': makePng(4, 4),
      });
      manifest.images.push({...manifest.images[0]});
      manifest.images[0] = {...manifest.images[0], sha256: '0'.repeat(64)};
      fs.writeFileSync(
        path.join(directory, 'manifest.json'),
        JSON.stringify(manifest),
      );
      fs.writeFileSync(path.join(directory, 'extra.sh'), 'echo hi');
      let message = '';
      try {
        validateCapture(directory);
      } catch (error) {
        message = error.message;
      }
      expect(message).toContain('Duplicate test ID');
      expect(message).toContain('does not match its manifest entry');
      expect(message).toContain('Files not in the manifest: extra.sh');
    });

    test('rejects non-PNG content and oversized images', () => {
      writeCapture(directory, {
        'text/width-mode/default': makePng(4, 4),
        'text/width-mode/large': makePng(20, 4),
      });
      fs.writeFileSync(
        path.join(directory, 'text/width-mode/default.png'),
        'not a png',
      );
      expect(() =>
        validateCapture(directory, {
          maxImages: 10,
          maxImageBytes: 1024 * 1024,
          maxTotalBytes: 1024 * 1024,
          maxDimension: 10,
          maxManifestBytes: 1024 * 1024,
        }),
      ).toThrow(/default: not a PNG[\s\S]*large: 20x4 is outside/);
    });

    test('rejects symlinks', () => {
      writeCapture(directory, {'text/width-mode/default': makePng(4, 4)});
      fs.rmSync(path.join(directory, 'text/width-mode/default.png'));
      fs.symlinkSync(
        '/etc/hosts',
        path.join(directory, 'text/width-mode/default.png'),
      );
      expect(() => validateCapture(directory)).toThrow(
        'file is missing or not a regular file',
      );
    });

    test('rejects invalid SHAs and environment keys', () => {
      writeCapture(
        directory,
        {'text/width-mode/default': makePng(4, 4)},
        {
          environmentKey: 'ios-../../x',
          git: {testedSha: 'HEAD', baseSha: SHA_B, headSha: SHA_A},
        },
      );
      expect(() => validateCapture(directory)).toThrow(
        /Invalid environment key[\s\S]*Invalid git.testedSha/,
      );
    });
  });

  describe('compareImages', () => {
    const strict = policyFor('a/b/c', null);

    test('identical images are unchanged', () => {
      expect(compareImages(makePng(8, 8), makePng(8, 8), strict)).toMatchObject(
        {status: 'unchanged', diffPixels: 0, diff: null},
      );
    });

    test('a single changed pixel fails the strict policy', () => {
      const changed = makePng(8, 8, (x, y) =>
        x === 3 && y === 3 ? [254, 255, 255, 255] : [255, 255, 255, 255],
      );
      const result = compareImages(makePng(8, 8), changed, strict);
      expect(result).toMatchObject({status: 'changed', diffPixels: 1});
      expect(readPngDimensions(result.diff)).toEqual({width: 8, height: 8});
    });

    test('a per-test tolerance can absorb a known amount of noise', () => {
      const changed = makePng(8, 8, (x, y) =>
        x === 3 && y === 3 ? [0, 0, 0, 255] : [255, 255, 255, 255],
      );
      const policy = policyFor('a/b/c', {tests: {'a/b/c': {maxDiffPixels: 1}}});
      expect(compareImages(makePng(8, 8), changed, policy).status).toBe(
        'unchanged',
      );
      expect(
        policyFor('a/b/d', {tests: {'a/b/c': {maxDiffPixels: 1}}}),
      ).toEqual(strict);
    });

    test('different dimensions are reported, not compared', () => {
      expect(compareImages(makePng(8, 8), makePng(8, 9), strict)).toMatchObject(
        {
          status: 'dimension-mismatch',
          expectedSize: {width: 8, height: 8},
          capturedSize: {width: 8, height: 9},
        },
      );
    });
  });

  describe('compareCapture', () => {
    test('classifies unchanged, changed, added and removed tests', async () => {
      const white = makePng(4, 4);
      const black = makePng(4, 4, () => [0, 0, 0, 255]);
      const image = (id, buffer) => ({id, sha256: sha256(buffer)});
      const results = await compareCapture({
        manifest: {
          images: [
            image('a/a/same', white),
            image('a/a/changed', black),
            image('a/a/added', white),
          ],
        },
        baselineManifest: {
          images: [
            image('a/a/same', white),
            image('a/a/changed', white),
            image('a/a/removed', white),
          ],
        },
        readExpected: async () => white,
        readCaptured: async () => black,
        config: null,
      });
      expect(results.map(result => [result.id, result.status])).toEqual([
        ['a/a/added', 'added'],
        ['a/a/changed', 'changed'],
        ['a/a/removed', 'removed'],
        ['a/a/same', 'unchanged'],
      ]);
    });
  });

  describe('resolveContext', () => {
    const ENV = {
      CAPTURE_HEAD_SHA: SHA_A,
      CAPTURE_HEAD_REPOSITORY: 'someone/react-native',
      CAPTURE_RUN_ID: '34',
      CAPTURE_RUN_ATTEMPT: '1',
      DEFAULT_BRANCH: 'main',
    };
    const savedEnv = {...process.env};

    afterEach(() => {
      process.env = {...savedEnv};
    });

    function resolve(env, pull) {
      Object.assign(process.env, ENV, env);
      return resolveContext({
        repository: 'react/react-native',
        findPullRequest: async () => pull,
      });
    }

    test.each([
      ['main', 'pull'],
      ['0.85-stable', null],
    ])('a pull request into %s resolves to %s', async (base, kind) => {
      const context = await resolve(
        {CAPTURE_EVENT: 'pull_request', CAPTURE_HEAD_BRANCH: 'feature'},
        {number: 12, base: {ref: base}},
      );
      expect(context?.kind ?? null).toBe(kind);
    });

    test.each([
      ['main', 'react/react-native', 'main'],
      ['0.85-stable', 'react/react-native', null],
      ['main', 'someone/react-native', null],
    ])(
      'a push to %s in %s resolves to %s',
      async (branch, repository, kind) => {
        const context = await resolve(
          {
            CAPTURE_EVENT: 'push',
            CAPTURE_HEAD_BRANCH: branch,
            CAPTURE_HEAD_REPOSITORY: repository,
          },
          null,
        );
        expect(context?.kind ?? null).toBe(kind);
      },
    );
  });
});
