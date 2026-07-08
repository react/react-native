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

// $FlowFixMe[signature-verification-failure]
let reporter;

const logPath = process.env.RCT_PACKAGER_LOG_PATH;
if (logPath != null && logPath !== '') {
  const {JsonReporter} = require('metro');
  const fs = require('fs');
  const path = require('path');
  // $FlowFixMe[missing-type-arg]
  reporter = class extends JsonReporter {
    constructor() {
      fs.mkdirSync(path.dirname(logPath), {
        recursive: true,
      });
      super(fs.createWriteStream(logPath));
    }
  };
} else {
  reporter = require('metro').TerminalReporter;
}

module.exports = reporter;
