/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

require('../../../scripts/shared/babelRegister').registerForMonorepo();

const runRepl = require('./runRepl').default;

runRepl().catch(error => {
  console.error(error);
  process.exit(1);
});
