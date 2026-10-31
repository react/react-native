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

/*:: import typeof createScreenshotReporterType from './ScreenshotReporter'; */

require('../../../scripts/shared/babelRegister').registerForMonorepo();

const createScreenshotReporter /*: createScreenshotReporterType */ =
  require('./ScreenshotReporter').default;

module.exports = createScreenshotReporter;
