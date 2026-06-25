/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as path from 'path';

const {readHermesTag, setHermesTag} = require('../hermes-utils');
// $FlowFixMe[untyped-import] (OSS) memfs
const {memfs} = require('memfs');

const hermesTag = '250829098.0.13';
const ROOT_DIR = path.normalize(path.join(__dirname, '../../..'));
const SDKS_DIR = path.join(ROOT_DIR, 'sdks');

let fs: $FlowFixMe;

describe('hermes-utils', () => {
  beforeEach(() => {
    jest.resetModules();

    jest.mock('fs', () => memfs().fs);
    fs = require('fs');

    fs.mkdirSync(SDKS_DIR, {
      recursive: true,
    });

    // Silence logs.
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  describe('Versioning Hermes', () => {
    describe('readHermesTag', () => {
      it('should throw if .hermesv1version does not exist', () => {
        expect(() => {
          readHermesTag();
        }).toThrow('[Hermes] .hermesv1version does not exist.');
      });
      it('should fail if hermes tag is empty', () => {
        fs.writeFileSync(path.join(SDKS_DIR, '.hermesv1version'), '');
        expect(() => {
          readHermesTag();
        }).toThrow('[Hermes] .hermesv1version file is empty.');
      });
      it('should return tag from .hermesv1version if file exists', () => {
        fs.writeFileSync(path.join(SDKS_DIR, '.hermesv1version'), hermesTag);
        expect(readHermesTag()).toEqual(hermesTag);
      });
    });

    describe('setHermesTag', () => {
      it('should write tag to .hermesv1version file', async () => {
        await setHermesTag(hermesTag);
        expect(
          fs.readFileSync(path.join(SDKS_DIR, '.hermesv1version'), {
            encoding: 'utf8',
            flag: 'r',
          }),
        ).toEqual(hermesTag);
      });
      it('should set Hermes tag and read it back', async () => {
        await setHermesTag(hermesTag);
        expect(readHermesTag()).toEqual(hermesTag);
      });
    });
  });
});
