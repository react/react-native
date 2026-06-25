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
import type {Task} from './types';
*/

const execa = require('execa');
const os = require('os');

function task /*:: <R> */(
  order /*: number */,
  label /*: string */,
  action /*: Task<R>['action'] */,
) /*: Task<R> */ {
  return {
    action,
    label,
    order,
  };
}

const isWindows = os.platform() === 'win32';
const isMacOS = os.platform() === 'darwin';

const toPascalCase = (label /*: string */) /*: string */ =>
  label.length === 0 ? '' : label[0].toUpperCase() + label.slice(1);

/*::
type PathCheckResult = {
  found: boolean,
  dep: string,
  description: string,
};
*/

function isOnPath(
  dep /*: string */,
  description /*: string */,
) /*: PathCheckResult */ {
  const cmd = isWindows ? ['where', [dep]] : ['command', ['-v', dep]];
  try {
    return {
      dep,
      description,
      found: execa.sync(...cmd).exitCode === 0,
    };
  } catch {
    return {
      dep,
      description,
      found: false,
    };
  }
}

function assertDependencies(
  ...deps /*: ReadonlyArray<ReturnType<typeof isOnPath>> */
) {
  for (const {found, dep, description} of deps) {
    if (!found) {
      throw new Error(`"${dep}" not found, ${description}`);
    }
  }
}

module.exports = {
  assertDependencies,
  isMacOS,
  isOnPath,
  isWindows,
  task,
  toPascalCase,
};
