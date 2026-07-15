/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {
  SPM_INJECTED_MARKER,
  injectSpmIntoExistingXcodeproj,
  readArtifactsVersionOverride,
  removeSpmInjection,
} = require('../generate-spm-xcodeproj');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PLAIN = fs.readFileSync(
  path.join(__dirname, '__fixtures__', 'plain-app.pbxproj'),
  'utf8',
);

let scaffoldedAppRoots = [];

afterEach(() => {
  for (const appRoot of scaffoldedAppRoots) {
    fs.rmSync(appRoot, {recursive: true, force: true});
  }
  scaffoldedAppRoots = [];
});

// Build a throwaway app dir: <tmp>/MyApp.xcodeproj/project.pbxproj seeded with
// the plain (SPM-only) fixture, and a node_modules/react-native sibling so the
// relative reactNativePath resolves.
function scaffoldApp() {
  const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-deinit-'));
  scaffoldedAppRoots.push(appRoot);
  const xcodeprojPath = path.join(appRoot, 'MyApp.xcodeproj');
  fs.mkdirSync(xcodeprojPath, {recursive: true});
  fs.writeFileSync(path.join(xcodeprojPath, 'project.pbxproj'), PLAIN, 'utf8');
  const rnRoot = path.join(appRoot, 'node_modules', 'react-native');
  fs.mkdirSync(rnRoot, {recursive: true});
  const artifactRoot = path.join(appRoot, 'build', 'xcframeworks');
  fs.mkdirSync(artifactRoot, {recursive: true});
  fs.writeFileSync(
    path.join(artifactRoot, 'flavored-frameworks.json'),
    JSON.stringify({version: 1, frameworks: []}),
  );
  fs.writeFileSync(path.join(artifactRoot, '.artifact-stamp'), 'test\n');
  return {appRoot, xcodeprojPath, rnRoot};
}

function pbxprojOf(xcodeprojPath) {
  return fs.readFileSync(path.join(xcodeprojPath, 'project.pbxproj'), 'utf8');
}

// Absolute source paths under the app root — mirrors what Expo emits
// (<outputDir>/expo/ExpoModulesProvider.swift). The injector normalizes these
// to SRCROOT-relative.
const PROVIDER_REL =
  'build/generated/autolinking/expo/ExpoModulesProvider.swift';
const OTHER_REL = 'build/generated/autolinking/other/OtherProvider.swift';

const GENERATED_SOURCES_MANIFEST = path.join(
  'build',
  'generated',
  'autolinking',
  '.spm-plugin-generated-sources.json',
);

function writeManifest(appRoot, relPaths) {
  const manifestPath = path.join(appRoot, GENERATED_SOURCES_MANIFEST);
  fs.mkdirSync(path.dirname(manifestPath), {recursive: true});
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      relPaths.map(rel => ({path: path.join(appRoot, rel)})),
      null,
      2,
    ),
    'utf8',
  );
}

function readMarker(xcodeprojPath) {
  return JSON.parse(
    fs.readFileSync(path.join(xcodeprojPath, SPM_INJECTED_MARKER), 'utf8'),
  );
}

describe('removeSpmInjection — the surgical inverse of add', () => {
  it('round-trips: add then deinit restores the pbxproj byte-for-byte', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    const before = pbxprojOf(xcodeprojPath);

    const injected = injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(injected.status).toBe('injected');
    // It actually changed something + wrote the marker.
    expect(pbxprojOf(xcodeprojPath)).not.toBe(before);
    expect(fs.existsSync(path.join(xcodeprojPath, SPM_INJECTED_MARKER))).toBe(
      true,
    );

    const removed = removeSpmInjection({appRoot, xcodeprojPath});
    expect(removed.status).toBe('removed');
    // Byte-identical to the pre-add pbxproj.
    expect(pbxprojOf(xcodeprojPath)).toBe(before);
    // Marker is gone.
    expect(fs.existsSync(path.join(xcodeprojPath, SPM_INJECTED_MARKER))).toBe(
      false,
    );
  });

  it('preserves an unrelated edit made to the pbxproj after add', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });

    // Simulate a user edit AFTER injection: flip the deployment target.
    const edited = pbxprojOf(xcodeprojPath).replace(
      /IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/g,
      'IPHONEOS_DEPLOYMENT_TARGET = 18.0;',
    );
    fs.writeFileSync(
      path.join(xcodeprojPath, 'project.pbxproj'),
      edited,
      'utf8',
    );

    removeSpmInjection({appRoot, xcodeprojPath});

    const after = pbxprojOf(xcodeprojPath);
    // The user's edit survives…
    expect(after).toContain('IPHONEOS_DEPLOYMENT_TARGET = 18.0;');
    // …and all SPM injection is gone.
    expect(after).not.toContain('Sync SPM Autolinking');
    expect(after).not.toContain('build/generated/autolinking/headers');
    expect(after).not.toContain('REACT_NATIVE_PATH');
    expect(after).not.toMatch(/relativePath = build\/xcframeworks/);
  });

  it('is a no-op (status: absent) when the project was never injected', () => {
    const {appRoot, xcodeprojPath} = scaffoldApp();
    const before = pbxprojOf(xcodeprojPath);
    const result = removeSpmInjection({appRoot, xcodeprojPath});
    expect(result.status).toBe('absent');
    expect(pbxprojOf(xcodeprojPath)).toBe(before);
  });

  it('round-trips WITH a generated-sources manifest (add then deinit is byte-identical)', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    writeManifest(appRoot, [PROVIDER_REL]);
    const before = pbxprojOf(xcodeprojPath);

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const after = pbxprojOf(xcodeprojPath);
    // The generated source was actually wired in.
    expect(after).toContain('ExpoModulesProvider.swift');
    expect(after).toContain('SPM Generated Sources');
    // Stored SRCROOT-relative (under the app root).
    expect(after).toContain(`path = ${PROVIDER_REL};`);
    expect(after).toContain('sourceTree = SOURCE_ROOT;');

    // Marker round-trip: the generatedSources section maps the normalized path.
    const marker = readMarker(xcodeprojPath);
    expect(Object.keys(marker.generatedSources)).toEqual([PROVIDER_REL]);
    expect(marker.generatedSources[PROVIDER_REL]).toHaveLength(2);

    const removed = removeSpmInjection({appRoot, xcodeprojPath});
    expect(removed.status).toBe('removed');
    expect(pbxprojOf(xcodeprojPath)).toBe(before);
  });
});

describe('generated-sources reconciliation on update', () => {
  it('removes exactly the UUIDs of an entry dropped from the manifest, keeping the rest', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    // First run: two generated sources.
    writeManifest(appRoot, [PROVIDER_REL, OTHER_REL]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const marker1 = readMarker(xcodeprojPath);
    const droppedUuids = marker1.generatedSources[OTHER_REL];
    const keptUuids = marker1.generatedSources[PROVIDER_REL];
    expect(droppedUuids).toHaveLength(2);

    // Second run (simulating `spm update`): OTHER dropped from the manifest.
    writeManifest(appRoot, [PROVIDER_REL]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const after = pbxprojOf(xcodeprojPath);

    // Exactly the dropped entry's objects are gone…
    for (const u of droppedUuids) {
      expect(after).not.toContain(u);
    }
    expect(after).not.toContain('OtherProvider.swift');
    // …the kept entry + the group survive.
    for (const u of keptUuids) {
      expect(after).toContain(u);
    }
    expect(after).toContain('ExpoModulesProvider.swift');
    expect(after).toContain('SPM Generated Sources');

    // Marker no longer lists the dropped entry.
    const marker2 = readMarker(xcodeprojPath);
    expect(Object.keys(marker2.generatedSources)).toEqual([PROVIDER_REL]);
  });

  it('re-injecting an unchanged manifest is byte-for-byte identical', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    writeManifest(appRoot, [PROVIDER_REL]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const first = pbxprojOf(xcodeprojPath);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(pbxprojOf(xcodeprojPath)).toBe(first);
  });

  it('retires the group when the last generated source leaves the manifest', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    writeManifest(appRoot, [PROVIDER_REL]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });

    // Manifest becomes empty on the next update.
    writeManifest(appRoot, []);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const after = pbxprojOf(xcodeprojPath);
    expect(after).not.toContain('ExpoModulesProvider.swift');
    expect(after).not.toContain('SPM Generated Sources');
    expect(readMarker(xcodeprojPath).generatedSources).toEqual({});
  });

  it('injects nothing generated-source-related when no manifest exists', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const after = pbxprojOf(xcodeprojPath);
    expect(after).not.toContain('SPM Generated Sources');
    expect(readMarker(xcodeprojPath).generatedSources).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// artifactsVersionOverride — the marker field persisting an explicit
// `spm add/update --version <ver>` pin (see setup-apple-spm.js /
// sync-spm-autolinking.js). SETS on an explicit override; PRESERVES a
// previously-recorded value when the caller omits one; deinit drops it along
// with the rest of the marker.
// ---------------------------------------------------------------------------
describe('artifactsVersionOverride marker field', () => {
  it('records an explicit override into the marker', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      artifactsVersionOverride: '0.80.0',
    });
    expect(readMarker(xcodeprojPath).artifactsVersionOverride).toBe('0.80.0');
    expect(readArtifactsVersionOverride(appRoot)).toBe('0.80.0');
  });

  it('defaults to null when no --version override has ever been given', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(readMarker(xcodeprojPath).artifactsVersionOverride).toBeNull();
    expect(readArtifactsVersionOverride(appRoot)).toBeNull();
  });

  it('preserves a previously-recorded override on a later run without --version', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      artifactsVersionOverride: '0.80.0',
    });
    // A later `update` (no --version) must not erase the pin.
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(readMarker(xcodeprojPath).artifactsVersionOverride).toBe('0.80.0');
    expect(readArtifactsVersionOverride(appRoot)).toBe('0.80.0');
  });

  it('a later explicit --version overwrites the previous pin', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      artifactsVersionOverride: '0.80.0',
    });
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      artifactsVersionOverride: '0.81.0',
    });
    expect(readMarker(xcodeprojPath).artifactsVersionOverride).toBe('0.81.0');
    expect(readArtifactsVersionOverride(appRoot)).toBe('0.81.0');
  });

  it('deinit drops the override along with the whole marker (no clear verb yet)', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      artifactsVersionOverride: '0.80.0',
    });
    removeSpmInjection({appRoot, xcodeprojPath});
    expect(fs.existsSync(path.join(xcodeprojPath, SPM_INJECTED_MARKER))).toBe(
      false,
    );
    expect(readArtifactsVersionOverride(appRoot)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// readArtifactsVersionOverride — pure fs read, used by the build-time sync
// (sync-spm-autolinking.js) to prefer a pinned version over the one derived
// from node_modules/react-native/package.json.
// ---------------------------------------------------------------------------
describe('readArtifactsVersionOverride', () => {
  it('returns null when no xcodeproj has been injected yet', () => {
    const {appRoot} = scaffoldApp();
    expect(readArtifactsVersionOverride(appRoot)).toBeNull();
  });

  it('returns null (never throws) on a malformed marker', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      artifactsVersionOverride: '0.80.0',
    });
    fs.writeFileSync(
      path.join(xcodeprojPath, SPM_INJECTED_MARKER),
      '{ not valid json',
      'utf8',
    );
    expect(() => readArtifactsVersionOverride(appRoot)).not.toThrow();
    expect(readArtifactsVersionOverride(appRoot)).toBeNull();
  });
});
