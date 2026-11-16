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

/*::
import type {PluginObj} from '@babel/core';
import typeof * as Types from '@babel/types';

type State = Readonly<{filename?: ?string, ...}>;
*/

const {isFantomTestFile} = require('../fantomTestFiles');

/**
 * This transform injects a single `debugger;` statement at the top of every
 * Fantom test, so we can automatically stop on them when debugging.
 */
module.exports = function (
  {types: t} /*: {types: Types} */,
) /*: PluginObj<State> */ {
  return {
    name: 'inject-debugger-statements-in-tests',
    visitor: {
      Program(path, state) {
        if (state.filename != null && isFantomTestFile(state.filename)) {
          // Check if the first statement is already a debugger statement
          const first = path.node.body[0];
          if (!first || first.type !== 'DebuggerStatement') {
            path.unshiftContainer('body', t.debuggerStatement());
          }
        }
      },
    },
  };
};
