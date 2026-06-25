/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {REPO_ROOT} = require('../../../shared/consts');
const debug = require('debug')('build-types:resolution');
const fs = require('fs');
const path = require('path');

const TYPEDEF_MAPPING: Record<string, ReadonlyArray<string>> = {
  '.android.js': ['.js.flow', '.js'],
  '.ios.js': ['.js.flow', '.js'],
  '.js': ['.js.flow'],
};

const cached = new Map<string, ?string>();

/**
 * Resolve the Flow file defining the type interface for a given source file.
 *
 * Ensures common interface file (js.flow) or base implementation (.js) exists for
 * platform-specific files (.android.js or .ios.js).
 */
function resolveTypeInputFile(file: string): ?string {
  if (cached.has(file)) {
    return cached.get(file);
  }

  const [pathWithoutExt, extension] = splitPathAndExtension(file);

  const extsToCheck = TYPEDEF_MAPPING[extension];

  if (!extsToCheck) {
    cached.set(file, null);
    return null;
  }

  for (const ext of extsToCheck) {
    const interfaceFile = pathWithoutExt + ext;

    if (fs.existsSync(interfaceFile)) {
      debug(
        'Resolved %s to %s',
        path.relative(REPO_ROOT, file),
        path.relative(REPO_ROOT, interfaceFile),
      );
      cached.set(file, interfaceFile);
      return interfaceFile;
    }
  }

  if (extension === '.js') {
    // .js files do not require a common interface
    cached.set(file, null);
    return null;
  }

  throw new Error(
    `No common interface found for ${file}.[android|ios].js. This ` +
      'should either be a base .js implementation or a .js.flow interface file.',
  );
}

function splitPathAndExtension(file: string): [string, string] {
  const lastSep = file.lastIndexOf(path.sep);
  const extensionStart = file.indexOf('.', lastSep);
  return [
    file.substring(0, extensionStart),
    file.substring(extensionStart, file.length),
  ];
}

module.exports = resolveTypeInputFile;
