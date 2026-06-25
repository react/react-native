/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {Program as ESTreeProgram} from 'hermes-estree';

const hermesParser = require('hermes-parser');

function parseFlowAndThrowErrors(
  code: string,
  options: Readonly<{filename?: ?string}> = {},
): ESTreeProgram {
  let ast;
  try {
    ast = hermesParser.parse(code, {
      // Produce an ESTree-compliant AST
      babel: false,
      // Parse Flow without a pragma
      flow: 'all',
      reactRuntimeTarget: '19',
      ...(options.filename != null ? {sourceFilename: options.filename} : {}),
    });
  } catch (e) {
    if (options.filename != null) {
      e.message = `Syntax error in ${options.filename}: ${e.message}`;
    }
    throw e;
  }
  return ast;
}

module.exports = {
  parseFlowAndThrowErrors,
};
