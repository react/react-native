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

/**
 * Where the xcconfig file a project references lives on disk, and the files it
 * pulls in through `#include` — resolved the way Xcode resolves them.
 */

const {
  findField,
  forEachObjectInSection,
  uuidsInArray,
} = require('./spm-pbxproj');
const fs = require('node:fs');
const path = require('node:path');

function unquote(value /*: string */) /*: string */ {
  return value.replace(/^"|"$/g, '');
}

function readXcconfig(absPath /*: string */) /*: ?string */ {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Directory components of the PBXGroup chain holding `uuid`, outermost first —
 * how a `"<group>"` file reference's path is anchored to the project dir.
 */
function groupPathPrefix(
  text /*: string */,
  uuid /*: string */,
) /*: Array<string> */ {
  const groups /*: Array<{uuid: string, path: ?string, children: Set<string>}> */ =
    [];
  forEachObjectInSection(text, 'PBXGroup', ({uuid: groupUuid, ...body}) => {
    const children = findField(text, body, 'children');
    const groupPath = findField(text, body, 'path');
    groups.push({
      uuid: groupUuid,
      path: groupPath != null ? unquote(groupPath.value) : null,
      children: children != null ? uuidsInArray(children.value) : new Set(),
    });
  });

  const parts /*: Array<string> */ = [];
  let current = uuid;
  for (let i = 0; i < groups.length; i++) {
    const parent = groups.find(group => group.children.has(current));
    if (parent == null) {
      break;
    }
    if (parent.path != null) {
      parts.unshift(parent.path);
    }
    current = parent.uuid;
  }
  return parts;
}

/**
 * Absolute paths to try for the file a PBXFileReference names, in order: the
 * reference's own anchoring first, then plain `<srcRoot>/<path>`. `ref.path`
 * and `ref.sourceTree` are unquoted.
 */
function xcconfigReferencePaths(
  text /*: string */,
  ref /*: {uuid: string, path: string, sourceTree: string} */,
  srcRoot /*: string */,
) /*: Array<string> */ {
  if (path.isAbsolute(ref.path)) {
    return [ref.path];
  }
  const fallback = path.join(srcRoot, ref.path);
  if (ref.sourceTree !== '<group>') {
    return [fallback];
  }
  const anchored = path.join(
    srcRoot,
    ...groupPathPrefix(text, ref.uuid),
    ref.path,
  );
  return anchored === fallback ? [fallback] : [anchored, fallback];
}

/**
 * The absolute path an `#include "…"` or `#include? "…"` line of the xcconfig
 * at `absPath` names, or null for any other line. Xcode resolves it from the
 * folder of the file holding the line.
 */
function xcconfigIncludePath(
  absPath /*: string */,
  line /*: string */,
) /*: ?string */ {
  const include = line
    .replace(/\/\/.*$/, '')
    .trim()
    .match(/^#include\??\s+"([^"]+)"/);
  return include != null
    ? path.resolve(path.dirname(absPath), include[1])
    : null;
}

/**
 * Whether the xcconfig at `absPath` (holding `content`) pulls in `targetPath`
 * through its `#include` chain. An included file that cannot be read ends its
 * branch of the chain.
 */
function xcconfigIncludes(
  absPath /*: string */,
  content /*: string */,
  targetPath /*: string */,
  visited /*: Set<string> */ = new Set(),
) /*: boolean */ {
  visited.add(absPath);
  for (const line of content.split('\n')) {
    const included = xcconfigIncludePath(absPath, line);
    if (included == null || visited.has(included)) {
      continue;
    }
    if (included === path.resolve(targetPath)) {
      return true;
    }
    const next = readXcconfig(included);
    if (next != null && xcconfigIncludes(included, next, targetPath, visited)) {
      return true;
    }
  }
  return false;
}

module.exports = {
  readXcconfig,
  xcconfigIncludePath,
  xcconfigIncludes,
  xcconfigReferencePaths,
};
