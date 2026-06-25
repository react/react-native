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
export type {Task} from './private/types';
*/

const {tasks: android} = require('./private/android.js');
const {tasks: app} = require('./private/app.js');
const {tasks: apple} = require('./private/apple.js');
const {tasks: clean} = require('./private/clean.js');
const version = require('./public/version.js');

module.exports = {android, app, apple, clean, version};
