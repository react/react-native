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

/**
 * Intentional info-level logging for clear separation from ad-hoc console debug logging.
 */
function infoLog(...args: Array<unknown>): void {
  return console.log(...args);
}

export default infoLog;
