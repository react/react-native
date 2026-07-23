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

const {FlowParser} = require('../../parsers/flow/parser');
const {TypeScriptParser} = require('../../parsers/typescript/parser');
const path = require('node:path');

const flowParser = new FlowParser();
const typescriptParser = new TypeScriptParser();

function parseFiles(files: Array<string>) {
  files.forEach(filename => {
    const isTypeScript =
      path.extname(filename) === '.ts' || path.extname(filename) === '.tsx';

    const parser = isTypeScript ? typescriptParser : flowParser;

    console.log(filename, JSON.stringify(parser.parseFile(filename), null, 2));
  });
}

module.exports = parseFiles;
