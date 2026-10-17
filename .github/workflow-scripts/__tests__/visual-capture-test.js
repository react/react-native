/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {
  collectFlows,
  failedFlowsFromJUnit,
  maestroArgs,
} = require('../visual/capture');
const {environmentKey} = require('../visual/manifest');
const {ANDROID_ENVIRONMENT} = require('./__fixtures__/visual');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('visual capture', () => {
  let directory;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-test-'));
  });

  afterEach(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });

  describe('environmentKey', () => {
    test('is readable and stable', () => {
      expect(environmentKey('android', ANDROID_ENVIRONMENT)).toMatch(
        /^android-api35-x86-64-1080x2400-420dpi-[0-9a-f]{8}$/,
      );
      expect(environmentKey('android', {...ANDROID_ENVIRONMENT})).toBe(
        environmentKey('android', ANDROID_ENVIRONMENT),
      );
    });

    test.each([
      ['fontScale', '1.15'],
      ['emulatorVersion', '37.3.1'],
    ])('changes when %s drifts', (property, value) => {
      expect(
        environmentKey('android', {...ANDROID_ENVIRONMENT, [property]: value}),
      ).not.toBe(environmentKey('android', ANDROID_ENVIRONMENT));
    });

    test('ignores properties that are only recorded', () => {
      expect(
        environmentKey('ios', {
          runtime: 'iOS-26-2',
          deviceType: 'iPhone-17-Pro',
          appearance: 'light',
          contentSizeCategory: 'large',
          locale: 'en_US',
          xcode: 'Xcode 26.2',
        }),
      ).toBe(
        environmentKey('ios', {
          runtime: 'iOS-26-2',
          deviceType: 'iPhone-17-Pro',
          appearance: 'light',
          contentSizeCategory: 'large',
          locale: 'en_US',
          xcode: 'Xcode 26.3',
        }),
      );
    });
    test('names iOS keys by runtime and device', () => {
      expect(
        environmentKey('ios', {
          runtime: 'iOS-26-2',
          deviceType: 'iPhone-17-Pro',
        }),
      ).toMatch(/^ios-26-2-iphone-17-pro-[0-9a-f]{8}$/);
    });
  });

  describe('capture', () => {
    test('collects top-level flows in order and ignores other files', () => {
      fs.writeFileSync(path.join(directory, 'b.yml'), '');
      fs.writeFileSync(path.join(directory, 'a.yaml'), '');
      fs.writeFileSync(path.join(directory, 'notes.md'), '');
      fs.mkdirSync(path.join(directory, 'helpers'));
      fs.writeFileSync(path.join(directory, 'helpers/open.yml'), '');
      expect(collectFlows(directory)).toEqual([
        path.join(directory, 'a.yaml'),
        path.join(directory, 'b.yml'),
      ]);
    });

    test('rejects flows Maestro would report under the same name', () => {
      fs.writeFileSync(path.join(directory, 'a.yml'), '');
      fs.writeFileSync(path.join(directory, 'a.yaml'), '');
      expect(() => collectFlows(directory)).toThrow("both report as 'a'");
    });

    test('reads failed flows from a Maestro JUnit report', () => {
      const flows = ['/flows/text-a.yml', '/flows/text-b.yml', '/flows/c.yml'];
      const report = [
        '<testcase id="text-b" name="text-b" file="/flows/text-b.yml" status="ERROR">',
        '<testcase id="text-a" name="text-a" file="/flows/text-a.yml" status="SUCCESS"/>',
        '<testcase id="c" name="c" status="ERROR">',
      ].join('\n');
      expect(failedFlowsFromJUnit(report, flows)).toEqual([
        '/flows/text-b.yml',
        '/flows/c.yml',
      ]);
      expect(() =>
        failedFlowsFromJUnit('<testcase name="other" status="ERROR">', flows),
      ).toThrow("unknown flow 'other'");
      expect(failedFlowsFromJUnit('', flows)).toEqual([]);
    });

    test.each([
      [1, undefined, false],
      [2, 'UDID', true],
    ])('builds Maestro arguments for attempt %d', (attempt, udid, reuse) => {
      const args = maestroArgs({
        flows: ['/f/a.yml', '/f/b.yml'],
        appId: 'com.example',
        outputDir: '/out',
        reportPath: '/r.xml',
        udid,
        attempt,
      });
      expect(
        args.slice(args.indexOf('test'), args.indexOf('test') + 3),
      ).toEqual(['test', '/f/a.yml', '/f/b.yml']);
      expect(args).toEqual(
        expect.arrayContaining([
          '--format=junit',
          '--output=/r.xml',
          'APP_ID=com.example',
          'VISUAL_OUTPUT_DIR=/out',
        ]),
      );
      expect(args.includes('--no-reinstall-driver')).toBe(reuse);
      expect(args.includes('--udid=UDID')).toBe(udid != null);
    });
  });
});
