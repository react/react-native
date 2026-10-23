/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

const {buildManifest} = require('../visual/manifest');
const {
  flowsTaking,
  judgeRetakes,
  retakeCandidates,
  screenshotIds,
} = require('../visual/retake');
const {ANDROID_ENVIRONMENT} = require('./__fixtures__/visual');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const baselineManifest = {
  images: [
    {id: 'switch/basic/default', sha256: 'a'},
    {id: 'switch/basic/toggled', sha256: 'b'},
  ],
};

const images = [
  {id: 'switch/basic/default', sha256: 'a'},
  {id: 'switch/basic/toggled', sha256: 'x'},
  {id: 'view/basic/default', sha256: 'n'},
];

describe('visual retake', () => {
  test('reads the test IDs a flow captures', () => {
    const flow = [
      'appId: ${APP_ID}',
      '---',
      '- takeScreenshot:',
      '    path: ${VISUAL_OUTPUT_DIR}/switch/basic/default',
      '    cropOn:',
      "      id: 'switch-basic'",
      '- takeScreenshot:',
      "    path: '${VISUAL_OUTPUT_DIR}/switch/basic/toggled'",
    ].join('\n');
    expect(screenshotIds(flow)).toEqual([
      'switch/basic/default',
      'switch/basic/toggled',
    ]);
  });

  test('selects only the flows that take the given IDs', () => {
    const files = {
      '/flows/switch.yml':
        '- takeScreenshot: ${VISUAL_OUTPUT_DIR}/switch/basic/toggled',
      '/flows/text.yml':
        '- takeScreenshot: ${VISUAL_OUTPUT_DIR}/text/width-mode/default',
      '/flows/view.yml':
        '- takeScreenshot: ${VISUAL_OUTPUT_DIR}/view/basic/default',
    };
    expect(
      flowsTaking(
        Object.keys(files),
        ['text/width-mode/default', 'switch/basic/toggled'],
        file => files[file],
      ),
    ).toEqual(['/flows/switch.yml', '/flows/text.yml']);
  });

  test('retakes changed and new screenshots but not unchanged ones', () => {
    expect(retakeCandidates(images, baselineManifest)).toEqual({
      changed: ['switch/basic/toggled'],
      added: ['view/basic/default'],
    });
  });

  test.each([
    ['matches the baseline', 'b', ['switch/basic/toggled']],
    ['still differs', 'y', []],
    ['is missing', null, []],
  ])('replaces a changed screenshot if its retake %s', (_, sha, replaced) => {
    expect(
      judgeRetakes({
        changed: ['switch/basic/toggled'],
        added: [],
        images,
        baselineManifest,
        retakeSha: () => sha,
      }).replaced,
    ).toEqual(replaced);
  });

  test.each([
    ['is identical', 'n', []],
    ['differs', 'y', ['view/basic/default']],
    ['is missing', null, ['view/basic/default']],
  ])('marks a new screenshot unstable if its retake %s', (_, sha, unstable) => {
    expect(
      judgeRetakes({
        changed: [],
        added: ['view/basic/default'],
        images,
        baselineManifest,
        retakeSha: () => sha,
      }).unstable,
    ).toEqual(unstable);
  });

  test('marks unstable screenshots in the manifest', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-test-'));
    try {
      const png = fs.readFileSync(
        path.join(__dirname, '../../../packages/rn-tester/js/assets/bunny.png'),
      );
      for (const id of ['view/basic/default', 'view/basic/flaky']) {
        fs.mkdirSync(path.join(directory, path.dirname(id)), {recursive: true});
        fs.writeFileSync(path.join(directory, `${id}.png`), png);
      }
      const manifest = buildManifest({
        captureDir: directory,
        platform: 'android',
        environment: ANDROID_ENVIRONMENT,
        git: null,
        unstableIds: ['view/basic/flaky'],
      });
      expect(manifest.images.map(({id, unstable}) => ({id, unstable}))).toEqual(
        [
          {id: 'view/basic/default', unstable: undefined},
          {id: 'view/basic/flaky', unstable: true},
        ],
      );
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });
});
