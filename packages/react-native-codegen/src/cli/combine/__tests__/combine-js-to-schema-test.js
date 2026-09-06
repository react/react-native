/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  combineSchemasInFileList,
} = require('../combine-js-to-schema');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('combine-js-to-schema', () => {
  let tmpdir;

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-combine-'));
  });

  afterEach(() => {
    fs.rmSync(tmpdir, {recursive: true, force: true});
  });

  it('expands symlinked directories into source files', () => {
    const sourceDir = path.join(tmpdir, 'source');
    const symlinkDir = path.join(tmpdir, 'symlink');
    fs.mkdirSync(sourceDir);
    fs.symlinkSync(
      sourceDir,
      symlinkDir,
      process.platform === 'win32' ? 'junction' : 'dir',
    );

    fs.writeFileSync(
      path.join(sourceDir, 'NativeSample.ts'),
      `
        import type {TurboModule} from 'react-native';
        import * as TurboModuleRegistry from 'TurboModuleRegistry';

        export interface Spec extends TurboModule {
          sampleMethod: () => void;
        }

        export default TurboModuleRegistry.get<Spec>('Sample');
      `,
    );

    const schema = combineSchemasInFileList(
      [symlinkDir],
      null,
      null,
      'SampleSpec',
    );

    expect(Object.keys(schema.modules)).toEqual(['NativeSample']);
  });
});
