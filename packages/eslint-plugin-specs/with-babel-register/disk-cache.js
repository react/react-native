/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

const {sync: makeDirSync} = require('make-dir');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const packageJson = JSON.parse(
  fs.readFileSync(require.resolve('../package.json'), 'utf8'),
);

/**
 * This file is a fork of
 * https://github.com/babel/babel/blob/2782a549e99d2ef1816332d23d7dfd5190f58a0f/packages/babel-register/src/cache.js#L1
 */

const FILENAME = path.join(
  os.tmpdir(),
  `.eslint-plugin-specs.${packageJson.version}.disk-cache.json`,
);

let data = {};

let cacheDisabled = process.env.NODE_ENV === 'test';

function isCacheDisabled() {
  return cacheDisabled;
}

/**
 * Write stringified cache to disk.
 */
function save() {
  if (isCacheDisabled()) {
    return;
  }

  let serialised = '{}';

  try {
    serialised = JSON.stringify(data, null, '  ');
  } catch (err) {
    if (err.message === 'Invalid string length') {
      err.message = "Cache too large so it's been cleared.";
      console.error(err.stack);
    } else {
      throw err;
    }
  }

  try {
    makeDirSync(path.dirname(FILENAME));
    fs.writeFileSync(FILENAME, serialised);
  } catch (e) {
    switch (e.code) {
      case 'EACCES':
      case 'EPERM':
        console.warn(
          `Could not write cache to file: ${FILENAME} due to a permission issue. Cache is disabled.`,
        );
        cacheDisabled = true;
        break;
      case 'EROFS':
        console.warn(
          `Could not write cache to file: ${FILENAME} because it resides in a readonly filesystem. Cache is disabled.`,
        );
        cacheDisabled = true;
        break;
      default:
        throw e;
    }
  }
}

/**
 * Load cache from disk and parse.
 */

function load() {
  if (isCacheDisabled()) {
    data = {};
    return;
  }

  process.on('exit', save);
  process.nextTick(save);

  let cacheContent;

  try {
    cacheContent = fs.readFileSync(FILENAME);
  } catch (e) {
    switch (e.code) {
      // check EACCES only as fs.readFileSync will never throw EPERM on Windows
      // https://github.com/libuv/libuv/blob/076df64dbbda4320f93375913a728efc40e12d37/src/win/fs.c#L735
      case 'EACCES':
        console.warn(
          `Babel could not read cache file: ${FILENAME} due to a permission issue. Cache is disabled.`,
        );
        cacheDisabled = true;
      /* fall through */
      default:
        return;
    }
  }

  try {
    data = JSON.parse(cacheContent);
  } catch {}
}

/**
 * Retrieve data from cache.
 */

function get() {
  return data;
}

module.exports = {load, get};
