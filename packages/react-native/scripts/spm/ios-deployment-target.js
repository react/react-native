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
 * The iOS platform floor of the SwiftPM manifests React Native generates.
 * SwiftPM refuses to link a product whose minimum is above the depending
 * target's, so the floor tracks the app's own deployment target rather than a
 * hardcoded value a dependency (every Expo package: iOS 16.4) can exceed.
 */

const {targetBuildConfigUuids} = require('./generate-spm-xcodeproj');
const {
  findApplicationTargets,
  findField,
  findObjectByUuid,
  findProjectObject,
  forEachObjectInSection,
  uuidsInArray,
} = require('./spm-pbxproj');
const fs = require('node:fs');
const path = require('node:path');

// Keep in sync with `min_ios_version_supported` in scripts/cocoapods/helpers.rb.
const MIN_IOS_VERSION_SUPPORTED /*: string */ = '15.1';

const IOS_VERSION_RE = /^\d+(\.\d+){0,2}$/;

const DEPLOYMENT_TARGET_KEY = 'IPHONEOS_DEPLOYMENT_TARGET';

// An xcconfig may `#include` another; cap the chain instead of trusting it.
const MAX_XCCONFIG_DEPTH = 16;

/*::
// Everything the reader needs to follow a configuration's xcconfig. Without a
// srcRoot the xcconfig step is skipped (a caller with only pbxproj text).
type XcconfigContext = {srcRoot: ?string, readFile: (absPath: string) => ?string};
*/

function normalizeIosVersion(version /*: string */) /*: string */ {
  return version.includes('.') ? version : `${version}.0`;
}

function segment(
  parts /*: Array<string> */,
  index /*: number */,
) /*: number */ {
  return index < parts.length ? Number(parts[index]) : 0;
}

/** Numeric, not lexicographic: `9.0` < `10.0` and `16.4` < `16.10`. */
function compareIosVersions(a /*: string */, b /*: string */) /*: number */ {
  const left = a.split('.');
  const right = b.split('.');
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const delta = segment(left, i) - segment(right, i);
    if (delta !== 0) {
      return delta < 0 ? -1 : 1;
    }
  }
  return 0;
}

function unquote(value /*: string */) /*: string */ {
  return value.replace(/^"|"$/g, '');
}

/**
 * A version reduced to something safe to interpolate into a manifest:
 * normalized, and never below React Native's own minimum.
 */
function sanitizeIosDeploymentTarget(raw /*: ?string */) /*: string */ {
  if (raw == null || !IOS_VERSION_RE.test(raw)) {
    return MIN_IOS_VERSION_SUPPORTED;
  }
  const version = normalizeIosVersion(raw);
  return compareIosVersions(version, MIN_IOS_VERSION_SUPPORTED) > 0
    ? version
    : MIN_IOS_VERSION_SUPPORTED;
}

function defaultReadFile(absPath /*: string */) /*: ?string */ {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * `IPHONEOS_DEPLOYMENT_TARGET` as an xcconfig defines it, following `#include`
 * lines in place so a later assignment in the includer wins. Null when the file
 * is unreadable, sets no unconditional value, or sets one that is not a plain
 * version (`$(inherited)`).
 */
function parseXcconfigSetting(
  absPath /*: string */,
  content /*: string */,
  readFile /*: (absPath: string) => ?string */,
  visited /*: Set<string> */ = new Set(),
  depth /*: number */ = 0,
) /*: ?string */ {
  if (visited.has(absPath)) {
    return null;
  }
  visited.add(absPath);
  const assignment = new RegExp(`^${DEPLOYMENT_TARGET_KEY}\\s*=\\s*([^;]*);?$`);
  let value /*: ?string */ = null;
  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/\/\/.*$/, '').trim();
    const include = line.match(/^#include\??\s+"([^"]+)"/);
    if (include != null) {
      const included = readXcconfigSetting(
        path.resolve(path.dirname(absPath), include[1]),
        readFile,
        visited,
        depth + 1,
      );
      if (included != null) {
        value = included;
      }
      continue;
    }
    const match = line.match(assignment);
    if (match != null) {
      const raw = unquote(match[1].trim());
      value = IOS_VERSION_RE.test(raw) ? raw : null;
    }
  }
  return value;
}

/** parseXcconfigSetting for a path not read yet — the `#include` entry point. */
function readXcconfigSetting(
  absPath /*: string */,
  readFile /*: (absPath: string) => ?string */,
  visited /*: Set<string> */,
  depth /*: number */,
) /*: ?string */ {
  if (depth > MAX_XCCONFIG_DEPTH) {
    return null;
  }
  const content = readFile(absPath);
  return content != null
    ? parseXcconfigSetting(absPath, content, readFile, visited, depth)
    : null;
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
 * Absolute paths to try for the xcconfig a configuration is based on, in order:
 * the reference's own anchoring first, then plain `<srcRoot>/<path>`.
 */
function xcconfigCandidates(
  text /*: string */,
  configObj /*: {bodyOpen: number, bodyClose: number, ...} */,
  srcRoot /*: string */,
) /*: Array<string> */ {
  const base = findField(text, configObj, 'baseConfigurationReference');
  const refUuid = base?.value.match(/[0-9A-Fa-f]{24}/)?.[0];
  if (refUuid == null) {
    return [];
  }
  const ref = findObjectByUuid(text, refUuid);
  if (ref == null) {
    return [];
  }
  const pathField = findField(text, ref, 'path');
  if (pathField == null) {
    return [];
  }
  const refPath = unquote(pathField.value);
  if (path.isAbsolute(refPath)) {
    return [refPath];
  }
  const sourceTreeField = findField(text, ref, 'sourceTree');
  const sourceTree =
    sourceTreeField != null ? unquote(sourceTreeField.value) : '';
  const fallback = path.join(srcRoot, refPath);
  if (sourceTree !== '<group>') {
    return [fallback];
  }
  const anchored = path.join(
    srcRoot,
    ...groupPathPrefix(text, refUuid),
    refPath,
  );
  return anchored === fallback ? [fallback] : [anchored, fallback];
}

function configName(
  text /*: string */,
  configObj /*: {bodyOpen: number, bodyClose: number, ...} */,
) /*: ?string */ {
  const field = findField(text, configObj, 'name');
  return field != null ? unquote(field.value) : null;
}

/** A plain-version `IPHONEOS_DEPLOYMENT_TARGET` literal in a configuration. */
function configLiteral(
  text /*: string */,
  configObj /*: {bodyOpen: number, bodyClose: number, ...} */,
) /*: ?string */ {
  const settings = findField(text, configObj, 'buildSettings');
  if (settings == null) {
    return null;
  }
  const field = findField(
    text,
    {bodyOpen: settings.valueStart, bodyClose: settings.tokenEnd - 1},
    DEPLOYMENT_TARGET_KEY,
  );
  if (field == null) {
    return null;
  }
  const raw = unquote(field.value);
  return IOS_VERSION_RE.test(raw) ? raw : null;
}

/**
 * What one configuration declares: its own literal, else the xcconfig it is
 * based on (Xcode's own precedence).
 */
function configDeploymentTarget(
  text /*: string */,
  configObj /*: {bodyOpen: number, bodyClose: number, ...} */,
  ctx /*: XcconfigContext */,
) /*: ?string */ {
  const literal = configLiteral(text, configObj);
  if (literal != null || ctx.srcRoot == null) {
    return literal;
  }
  for (const candidate of xcconfigCandidates(text, configObj, ctx.srcRoot)) {
    const content = ctx.readFile(candidate);
    if (content != null) {
      return parseXcconfigSetting(candidate, content, ctx.readFile);
    }
  }
  return null;
}

/**
 * The app's declared iOS deployment target, or null when nothing declares one.
 * Target selection: the marker's `targetUuid`, else the app target named
 * `targetName` (`--product-name`), else every app target. Each configuration
 * falls back to the project-level one of the same name (each level accepting a
 * literal or the xcconfig it is based on), and the lowest wins — a single
 * manifest floor has to hold for every configuration.
 */
function readIosDeploymentTargetFromPbxproj(
  text /*: string */,
  opts /*:: ?: {
    targetUuid?: ?string,
    targetName?: ?string,
    srcRoot?: ?string,
    readFile?: (absPath: string) => ?string,
  } */,
) /*: ?string */ {
  const ctx /*: XcconfigContext */ = {
    srcRoot: opts?.srcRoot,
    readFile: opts?.readFile ?? defaultReadFile,
  };
  const targetUuid = opts?.targetUuid;
  const marked = targetUuid != null ? findObjectByUuid(text, targetUuid) : null;
  const apps = findApplicationTargets(text);
  const named =
    opts?.targetName != null
      ? apps.find(app => app.name === opts.targetName)
      : null;
  const targets = marked != null ? [marked] : named != null ? [named] : apps;

  const projectDefaults /*: Map<string, string> */ = new Map();
  const project = findProjectObject(text);
  if (project != null) {
    for (const uuid of targetBuildConfigUuids(text, project)) {
      const config = findObjectByUuid(text, uuid);
      const name = config != null ? configName(text, config) : null;
      const value =
        config != null ? configDeploymentTarget(text, config, ctx) : null;
      if (name != null && value != null) {
        projectDefaults.set(name, value);
      }
    }
  }

  let floor /*: ?string */ = null;
  for (const target of targets) {
    for (const uuid of targetBuildConfigUuids(text, target)) {
      const config = findObjectByUuid(text, uuid);
      if (config == null) {
        continue;
      }
      const name = configName(text, config);
      const value =
        configDeploymentTarget(text, config, ctx) ??
        (name != null ? projectDefaults.get(name) : null) ??
        null;
      if (
        value != null &&
        (floor == null || compareIosVersions(value, floor) < 0)
      ) {
        floor = value;
      }
    }
  }
  return floor;
}

/**
 * The sanitized floor read from `<xcodeprojPath>/project.pbxproj`, or null when
 * there is no project, it cannot be read, or it declares nothing usable.
 */
function resolveIosDeploymentTarget(
  opts /*: {xcodeprojPath: ?string, targetUuid?: ?string, targetName?: ?string} */,
) /*: ?string */ {
  const {xcodeprojPath, targetUuid, targetName} = opts;
  if (xcodeprojPath == null) {
    return null;
  }
  try {
    const found = readIosDeploymentTargetFromPbxproj(
      fs.readFileSync(path.join(xcodeprojPath, 'project.pbxproj'), 'utf8'),
      {targetUuid, targetName, srcRoot: path.dirname(xcodeprojPath)},
    );
    return found != null ? sanitizeIosDeploymentTarget(found) : null;
  } catch {
    return null;
  }
}

module.exports = {
  MIN_IOS_VERSION_SUPPORTED,
  readIosDeploymentTargetFromPbxproj,
  resolveIosDeploymentTarget,
  sanitizeIosDeploymentTarget,
};
