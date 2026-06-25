/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/*::
import {Command} from 'commander';
*/

if (process.env.BUILD_EXCLUDE_BABEL_REGISTER == null) {
  // $FlowFixMe[cannot-resolve-module]
  require('../../scripts/shared/babelRegister').registerForMonorepo();
}

const program /*: Command */ = require('./cli.flow.js').default;

if (require.main === module) {
  program.parse();
}

module.exports = program;
