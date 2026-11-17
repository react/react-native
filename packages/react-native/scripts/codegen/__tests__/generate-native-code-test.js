/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {
  generateCode,
} = require('../generate-artifacts-executor/generateNativeCode');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

jest.mock('../codegen-utils', () => ({
  getCodegen: () => ({
    generate: ({outputDirectory}: {outputDirectory: string}) => {
      const {writeFileSync} = require('node:fs');
      const {join} = require('node:path');
      writeFileSync(join(outputDirectory, 'TestSpec.h'), 'generated code');
    },
  }),
}));

let root: string;
let temp: string;
let output: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-cleanup-test-'));
  temp = path.join(root, 'temp');
  output = path.join(root, 'output');
  fs.mkdirSync(temp);
  jest.spyOn(os, 'tmpdir').mockReturnValue(temp);
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(root, {recursive: true, force: true});
});

it('removes temporary artifacts after copying the generated files', () => {
  generateCode(
    output,
    {
      library: {config: {name: 'TestSpec', type: 'modules'}},
      schema: {modules: {}},
    },
    false,
    'ios',
  );

  expect(fs.readFileSync(path.join(output, 'TestSpec.h'), 'utf8')).toBe(
    'generated code',
  );
  expect(fs.readdirSync(temp)).toEqual([]);
});

it('removes the temporary directory when code generation throws', () => {
  expect(() =>
    generateCode(
      output,
      {
        library: {config: {name: 'TestSpec', type: 'invalid'}},
        schema: {modules: {}},
      },
      false,
      'ios',
    ),
  ).toThrow('Invalid library type. invalid');
  expect(fs.readdirSync(temp)).toEqual([]);
});
