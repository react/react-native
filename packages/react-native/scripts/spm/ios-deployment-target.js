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
} = require('./spm-pbxproj');
const fs = require('node:fs');
const path = require('node:path');

// Keep in sync with `min_ios_version_supported` in scripts/cocoapods/helpers.rb.
const MIN_IOS_VERSION_SUPPORTED /*: string */ = '15.1';

const IOS_VERSION_RE = /^\d+(\.\d+){0,2}$/;

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

function configName(
  text /*: string */,
  configObj /*: {bodyOpen: number, bodyClose: number, ...} */,
) /*: ?string */ {
  const field = findField(text, configObj, 'name');
  return field != null ? unquote(field.value) : null;
}

/** `IPHONEOS_DEPLOYMENT_TARGET`, when the configuration sets a plain version. */
function configDeploymentTarget(
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
    'IPHONEOS_DEPLOYMENT_TARGET',
  );
  if (field == null) {
    return null;
  }
  const raw = unquote(field.value);
  return IOS_VERSION_RE.test(raw) ? raw : null;
}

/**
 * The app's declared iOS deployment target, or null when nothing declares one.
 * Target selection: the marker's `targetUuid`, else the app target named
 * `targetName` (`--product-name`), else every app target. Each configuration
 * falls back to the project-level one of the same name, and the lowest wins —
 * a single manifest floor has to hold for every configuration.
 */
function readIosDeploymentTargetFromPbxproj(
  text /*: string */,
  opts /*:: ?: {targetUuid?: ?string, targetName?: ?string} */,
) /*: ?string */ {
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
        config != null ? configDeploymentTarget(text, config) : null;
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
        configDeploymentTarget(text, config) ??
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
      {targetUuid, targetName},
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
