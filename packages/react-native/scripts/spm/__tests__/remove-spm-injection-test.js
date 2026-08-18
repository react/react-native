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
  readPinnedConfigCommand,
  removeSpmInjection,
} = require('../generate-spm-xcodeproj');
const {isBalanced} = require('./pbxproj-oracles');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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
// Pre-existing values for an injected array setting (HEADER_SEARCH_PATHS),
// seeded into both app-target configs. The plain fixture has none, so it only
// ever exercises the create-from-absent path; deinit must restore each of
// these forms — a plain scalar is ordinary, valid pbxproj.
const PRE_EXISTING_HEADER_SEARCH_PATHS = {
  'a bare $(inherited) scalar': '"$(inherited)"',
  'a scalar with real content': '"$(inherited) $(SRCROOT)/vendor/include"',
  'an array': '(\n\t\t\t\t"$(inherited)",\n\t\t\t)',
  // What hand edits and other generators (XcodeGen, Tuist) write.
  'a one-line array': '("$(inherited)", )',
};

// Seed a whole `KEY = value;` field (comments and stray whitespace included)
// into both app-target configs.
function withSetting(field /*: string */) {
  return PLAIN.replaceAll(
    'PRODUCT_BUNDLE_IDENTIFIER = com.example.MyApp;',
    `${field}\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.example.MyApp;`,
  );
}

function withHeaderSearchPaths(value /*: string */) {
  return withSetting(`HEADER_SEARCH_PATHS = ${value};`);
}

function scaffoldApp(pbxproj /*: string */ = PLAIN) {
  const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-deinit-'));
  scaffoldedAppRoots.push(appRoot);
  const xcodeprojPath = path.join(appRoot, 'MyApp.xcodeproj');
  fs.mkdirSync(xcodeprojPath, {recursive: true});
  fs.writeFileSync(
    path.join(xcodeprojPath, 'project.pbxproj'),
    pbxproj,
    'utf8',
  );
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

const SCRIPT_PHASES_MANIFEST = path.join(
  'build',
  'generated',
  'autolinking',
  '.spm-plugin-script-phases.json',
);

function writeScriptPhases(appRoot, phases) {
  const manifestPath = path.join(appRoot, SCRIPT_PHASES_MANIFEST);
  fs.mkdirSync(path.dirname(manifestPath), {recursive: true});
  fs.writeFileSync(manifestPath, JSON.stringify(phases, null, 2), 'utf8');
}

const APP_CONFIG_PHASE = {
  // Contract charset (/^[@A-Za-z0-9_./-]+$/) — the reader skips anything else.
  id: 'expo-constants.app-config',
  name: 'Bundle Expo app.config',
  script: 'echo v1',
  position: 'end',
};

function markerTextOf(xcodeprojPath) {
  return fs.readFileSync(path.join(xcodeprojPath, SPM_INJECTED_MARKER), 'utf8');
}

function readMarker(xcodeprojPath) {
  return JSON.parse(markerTextOf(xcodeprojPath));
}

function schemePathOf(xcodeprojPath) {
  return path.join(
    xcodeprojPath,
    'xcshareddata',
    'xcschemes',
    'MyApp.xcscheme',
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

  // Both records the second run relies on — `createdArrayFields` and
  // `scheme.created` — are carried forward for the reason spelled out on
  // mergeCreatedArrayFields. Without that, this second marker forgets them and
  // `deinit` leaves an empty `packageReferences` / `packageProductDependencies`
  // behind and the generated scheme on disk. Zero script phases here: the defect
  // is in the injector's reversal record, not in any one feature.
  it('round-trips add → update → deinit byte-for-byte, scheme included', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    const before = pbxprojOf(xcodeprojPath);
    const sync = () =>
      injectSpmIntoExistingXcodeproj({
        appRoot,
        reactNativeRoot: rnRoot,
        xcodeprojPath,
      });

    sync();
    const injected = pbxprojOf(xcodeprojPath);
    const marker = markerTextOf(xcodeprojPath);
    const schemePath = schemePathOf(xcodeprojPath);
    expect(fs.existsSync(schemePath)).toBe(true);

    sync();
    // The re-sync changed neither the project…
    expect(pbxprojOf(xcodeprojPath)).toBe(injected);
    // …nor the record of what has to be undone.
    expect(markerTextOf(xcodeprojPath)).toBe(marker);

    expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe('removed');
    const after = pbxprojOf(xcodeprojPath);
    expect(after).not.toMatch(/packageReferences/);
    expect(after).not.toMatch(/packageProductDependencies/);
    expect(after).toBe(before);
    expect(fs.existsSync(schemePath)).toBe(false);
  });

  // A Debug config that already carries DEBUG gets no edit at all, so there is
  // nothing for the marker to record — and nothing left behind. Injecting into
  // the scalar form regardless (addArrayStringValues dedupes by exact array
  // member, which the scalar never matches) would promote it to an array the
  // marker has no record of, and deinit would strand it.
  it('leaves a Debug config that already sets DEBUG alone, add through deinit', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    const head =
      'AA0000000000000000000901 /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {';
    fs.writeFileSync(
      path.join(xcodeprojPath, 'project.pbxproj'),
      PLAIN.replace(
        head,
        `${head}\n\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = "$(inherited) DEBUG";`,
      ),
      'utf8',
    );
    const before = pbxprojOf(xcodeprojPath);

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(pbxprojOf(xcodeprojPath)).toContain(
      'SWIFT_ACTIVE_COMPILATION_CONDITIONS = "$(inherited) DEBUG";',
    );

    expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe('removed');
    expect(pbxprojOf(xcodeprojPath)).toBe(before);
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

// ---------------------------------------------------------------------------
// Scheme ownership. `scheme.created` records that RN wrote the file, which is
// necessary but not sufficient to delete it on `deinit`: the user may have
// replaced its contents with a scheme of their own (same name, same target).
// Deleting that would destroy their work, so the file is only removed while its
// contents are still the ones RN generates.
// ---------------------------------------------------------------------------
describe('deinit — scheme ownership', () => {
  // A scheme the user authored for the same target: same file name, same
  // BlueprintIdentifier, no PreActions.
  function userAuthoredScheme(targetUuid) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1700"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "NO"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "NO"
            buildForArchiving = "NO"
            buildForAnalyzing = "NO">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "${targetUuid}"
               BuildableName = "MyApp.app"
               BlueprintName = "MyApp"
               ReferencedContainer = "container:MyApp.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <LaunchAction
      buildConfiguration = "Release"
      launchStyle = "0">
   </LaunchAction>
</Scheme>
`;
  }

  function setUp() {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    const sync = () =>
      injectSpmIntoExistingXcodeproj({
        appRoot,
        reactNativeRoot: rnRoot,
        xcodeprojPath,
      });
    const deinit = () => removeSpmInjection({appRoot, xcodeprojPath});
    const schemePath = schemePathOf(xcodeprojPath);
    const readScheme = () => fs.readFileSync(schemePath, 'utf8');
    return {xcodeprojPath, sync, deinit, schemePath, readScheme};
  }

  it('deletes the scheme it created while the file is still its own', () => {
    const {sync, deinit, schemePath} = setUp();
    sync();
    sync();
    expect(deinit().status).toBe('removed');
    expect(fs.existsSync(schemePath)).toBe(false);
  });

  it("keeps the user's own scheme when they replaced the generated one", () => {
    const {xcodeprojPath, sync, deinit, schemePath, readScheme} = setUp();
    sync();
    const mine = userAuthoredScheme(readMarker(xcodeprojPath).targetUuid);
    fs.writeFileSync(schemePath, mine, 'utf8');

    // The second sync re-adds the pre-action to the file the user now owns, and
    // still records that RN originally created it.
    sync();
    expect(readScheme()).toContain('Sync SPM Autolinking');
    expect(readMarker(xcodeprojPath).scheme.created).toBe(true);

    expect(deinit().status).toBe('removed');
    // Their file survives, with only RN's pre-action stripped back out.
    expect(fs.existsSync(schemePath)).toBe(true);
    expect(readScheme()).toBe(mine);
  });

  it('keeps its own scheme once the user has edited it', () => {
    const {sync, deinit, schemePath, readScheme} = setUp();
    sync();
    fs.writeFileSync(
      schemePath,
      readScheme().replace(
        'buildConfiguration = "Release"\n      revealArchiveInOrganizer',
        'buildConfiguration = "Debug"\n      revealArchiveInOrganizer',
      ),
      'utf8',
    );

    expect(deinit().status).toBe('removed');
    // Leaking a scheme beats deleting an edit: the file stays, minus the
    // pre-action.
    expect(fs.existsSync(schemePath)).toBe(true);
    expect(readScheme()).not.toContain('Sync SPM Autolinking');
    expect(readScheme()).toContain(
      '<ArchiveAction\n      buildConfiguration = "Debug"',
    );
  });

  // The pre-action's script is the one part of the scheme RN rewrites on every
  // sync (and it varies with the app's react-native path), so ownership cannot
  // depend on it: an RN scheme carrying an older version's script is still RN's.
  it('deletes its own scheme even when the pre-action script has changed', () => {
    const {sync, deinit, schemePath, readScheme} = setUp();
    sync();
    fs.writeFileSync(
      schemePath,
      readScheme().replace(
        'scriptText = "set -euo pipefail',
        'scriptText = "echo hi',
      ),
      'utf8',
    );

    expect(deinit().status).toBe('removed');
    expect(fs.existsSync(schemePath)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createdArrayFields — "this array field did not exist before RN touched it".
// It licenses removing the field at `deinit`, but only once RN's own members are
// gone AND nothing else is left in it: a package the user added to the same
// field is theirs, and dropping the field would orphan it.
// ---------------------------------------------------------------------------
describe('deinit — array fields RN created', () => {
  it('keeps a created field the user added their own package to', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(readMarker(xcodeprojPath).createdArrayFields).toEqual(
      expect.arrayContaining([
        {container: 'project', key: 'packageReferences'},
      ]),
    );

    // The user adds their own remote package in Xcode, after injection.
    const userRef = 'DEADBEEF0000000000000001';
    const userMember = `${userRef} /* XCRemoteSwiftPackageReference "swift-log" */,`;
    fs.writeFileSync(
      path.join(xcodeprojPath, 'project.pbxproj'),
      pbxprojOf(xcodeprojPath).replace(
        'packageReferences = (\n',
        `packageReferences = (\n\t\t\t\t${userMember}\n`,
      ),
      'utf8',
    );

    expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe('removed');
    const after = pbxprojOf(xcodeprojPath);
    // Their member — and the field holding it — survive…
    expect(after).toContain(userMember);
    expect(after).toMatch(/packageReferences = \(/);
    // …while RN's own members go, as does the field RN created and emptied.
    expect(after).not.toMatch(/relativePath = build\/xcframeworks/);
    expect(after).not.toMatch(/packageProductDependencies/);
  });

  it('restores a field that pre-existed but was empty byte-for-byte', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    // An empty `packageReferences` the user already had (Xcode leaves one behind
    // after removing the last package). RN never records it as created, so the
    // field itself must outlive `deinit`.
    fs.writeFileSync(
      path.join(xcodeprojPath, 'project.pbxproj'),
      PLAIN.replace(
        '\t\t\tprojectDirPath = "";',
        '\t\t\tpackageReferences = (\n\t\t\t);\n\t\t\tprojectDirPath = "";',
      ),
      'utf8',
    );
    const before = pbxprojOf(xcodeprojPath);

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(readMarker(xcodeprojPath).createdArrayFields).not.toEqual(
      expect.arrayContaining([
        {container: 'project', key: 'packageReferences'},
      ]),
    );

    expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe('removed');
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

  // A plugin-supplied filename reaches three `/* … */` comments. Whatever it
  // contains, `deinit` must find the file reference, the build file and their
  // memberships again and leave the file as it was — the comment-normalization
  // contract these lean on lives in inject-spm-xcodeproj-test.js.
  it.each([
    ['an opening brace', 'Weird{Name}.swift'],
    ['a comma', 'Weird,Name.swift'],
  ])(
    'deinits a generated source whose filename contains %s, leaving no residue',
    (_label, fileName) => {
      const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
      const before = pbxprojOf(xcodeprojPath);
      const rel = `build/generated/autolinking/expo/${fileName}`;
      writeManifest(appRoot, [rel]);

      injectSpmIntoExistingXcodeproj({
        appRoot,
        reactNativeRoot: rnRoot,
        xcodeprojPath,
      });
      const uuids = readMarker(xcodeprojPath).generatedSources[rel];
      expect(uuids).toHaveLength(2);

      expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe(
        'removed',
      );
      const after = pbxprojOf(xcodeprojPath);
      for (const uuid of uuids) {
        expect(after).not.toContain(uuid);
      }
      expect(after).not.toContain('SPM Generated Sources');
      expect(after).not.toContain(fileName);
      expect(after).toBe(before);
    },
  );

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

describe('script-phases reconciliation on update', () => {
  it('records an added phase in the marker keyed on its plugin id', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    writeScriptPhases(appRoot, [APP_CONFIG_PHASE]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });

    const {scriptPhases} = readMarker(xcodeprojPath);
    expect(Object.keys(scriptPhases)).toEqual([APP_CONFIG_PHASE.id]);
    const uuid = scriptPhases[APP_CONFIG_PHASE.id];
    expect(uuid).toMatch(/^[0-9A-F]{24}$/);
    expect(pbxprojOf(xcodeprojPath)).toContain(
      `${uuid} /* Bundle Expo app.config */ = {`,
    );
  });

  it('removes the phase object AND its buildPhases membership when the id leaves the manifest', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    writeScriptPhases(appRoot, [APP_CONFIG_PHASE]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const uuid = readMarker(xcodeprojPath).scriptPhases[APP_CONFIG_PHASE.id];

    writeScriptPhases(appRoot, []);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });

    const after = pbxprojOf(xcodeprojPath);
    expect(after).not.toContain(uuid);
    expect(after).not.toContain('Bundle Expo app.config');
    // The RN-owned phases are untouched.
    expect(after).toContain('Sync SPM Autolinking');
    expect(readMarker(xcodeprojPath).scriptPhases).toEqual({});
  });

  it('refreshes a changed script in place, leaving every other byte alone', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    writeScriptPhases(appRoot, [APP_CONFIG_PHASE]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const first = pbxprojOf(xcodeprojPath);
    expect(first).toContain('shellScript = "echo v1";');

    writeScriptPhases(appRoot, [{...APP_CONFIG_PHASE, script: 'echo v2'}]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });

    expect(pbxprojOf(xcodeprojPath)).toBe(
      first.replace('"echo v1"', '"echo v2"'),
    );
  });

  // The declared position is enforced on every sync, not only at first
  // injection — see inject-spm-xcodeproj-test.js for the ordering matrix. Here:
  // it survives the sidecar/marker path, and `deinit` still reverses it.
  it('re-seats a phase whose declared position changed, and still deinits cleanly', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    const before = pbxprojOf(xcodeprojPath);
    const sync = () =>
      injectSpmIntoExistingXcodeproj({
        appRoot,
        reactNativeRoot: rnRoot,
        xcodeprojPath,
      });

    writeScriptPhases(appRoot, [APP_CONFIG_PHASE]);
    sync();
    const uuid = readMarker(xcodeprojPath).scriptPhases[APP_CONFIG_PHASE.id];
    const memberLine = `${uuid} /* Bundle Expo app.config */,`;
    const atEnd = pbxprojOf(xcodeprojPath);
    const sourcesAt = atEnd.indexOf('Sources */,');
    expect(atEnd.indexOf(memberLine)).toBeGreaterThan(sourcesAt);

    writeScriptPhases(appRoot, [
      {...APP_CONFIG_PHASE, position: 'beforeCompile'},
    ]);
    sync();
    const moved = pbxprojOf(xcodeprojPath);
    expect(moved.indexOf(memberLine)).toBeLessThan(
      moved.indexOf('Sources */,'),
    );
    // Moved, not duplicated.
    expect(moved.split(memberLine)).toHaveLength(2);

    expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe('removed');
    expect(pbxprojOf(xcodeprojPath)).toBe(before);
  });

  it('round-trips add → update → deinit byte-for-byte with unchanged phases', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    const before = pbxprojOf(xcodeprojPath);
    writeScriptPhases(appRoot, [
      APP_CONFIG_PHASE,
      {
        ...APP_CONFIG_PHASE,
        id: 'other',
        name: 'Other',
        position: 'beforeCompile',
        alwaysOutOfDate: true,
        inputPaths: ['$(SRCROOT)/app.json'],
      },
    ]);
    const sync = () =>
      injectSpmIntoExistingXcodeproj({
        appRoot,
        reactNativeRoot: rnRoot,
        xcodeprojPath,
      });

    sync();
    const injected = pbxprojOf(xcodeprojPath);
    expect(injected).toContain('Bundle Expo app.config');
    const marker = markerTextOf(xcodeprojPath);

    sync();
    expect(pbxprojOf(xcodeprojPath)).toBe(injected);
    expect(markerTextOf(xcodeprojPath)).toBe(marker);

    expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe('removed');
    expect(pbxprojOf(xcodeprojPath)).toBe(before);
    expect(fs.existsSync(schemePathOf(xcodeprojPath))).toBe(false);
  });

  // A scoped npm name is a valid id, and it is also a JSON ledger key in the
  // marker — the only handle `deinit` has on the phase it injected.
  it('round-trips a scoped npm-name id through the marker and deinits byte-for-byte', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    const before = pbxprojOf(xcodeprojPath);
    writeScriptPhases(appRoot, [{...APP_CONFIG_PHASE, id: '@expo/log-box'}]);
    const sync = () =>
      injectSpmIntoExistingXcodeproj({
        appRoot,
        reactNativeRoot: rnRoot,
        xcodeprojPath,
      });

    sync();
    const injected = pbxprojOf(xcodeprojPath);
    const marker = markerTextOf(xcodeprojPath);
    expect(isBalanced(injected)).toBe(true);
    expect(Object.keys(readMarker(xcodeprojPath).scriptPhases)).toEqual([
      '@expo/log-box',
    ]);
    expect(marker).toContain('"@expo/log-box"');
    const uuid = readMarker(xcodeprojPath).scriptPhases['@expo/log-box'];
    expect(injected).toContain(`${uuid} /* Bundle Expo app.config */ = {`);

    sync();
    expect(pbxprojOf(xcodeprojPath)).toBe(injected);
    expect(markerTextOf(xcodeprojPath)).toBe(marker);

    expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe('removed');
    const after = pbxprojOf(xcodeprojPath);
    expect(after).not.toContain(uuid);
    expect(after).not.toContain('PBXShellScriptBuildPhase');
    expect(after).toBe(before);
  });

  it('removes alwaysOutOfDate when a plugin flips it back off', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    writeScriptPhases(appRoot, [{...APP_CONFIG_PHASE, alwaysOutOfDate: true}]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(pbxprojOf(xcodeprojPath)).toContain('alwaysOutOfDate = 1;');

    writeScriptPhases(appRoot, [{...APP_CONFIG_PHASE, alwaysOutOfDate: false}]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });

    const after = pbxprojOf(xcodeprojPath);
    expect(after).not.toContain('alwaysOutOfDate');
    expect(after).toContain('Bundle Expo app.config');

    // …and back on again, stably (the field is re-added to an existing object,
    // so it lands ahead of `isa` rather than after it — order is not semantic
    // in a pbxproj, and a further re-sync must be a no-op).
    writeScriptPhases(appRoot, [{...APP_CONFIG_PHASE, alwaysOutOfDate: true}]);
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const back = pbxprojOf(xcodeprojPath);
    expect(back).toContain('alwaysOutOfDate = 1;');
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(pbxprojOf(xcodeprojPath)).toBe(back);
  });

  // A shell body full of pbxproj-hostile characters: double quotes, a
  // backslash, a real newline and an Xcode `$(VAR)`.
  const AWKWARD_SCRIPT =
    'echo "a\\b" > "$(DERIVED_FILE_DIR)/x"\nprintf \'%s\\n\' done';
  const AWKWARD_ESCAPED =
    'shellScript = "echo \\"a\\\\b\\" > \\"$(DERIVED_FILE_DIR)/x\\"\\nprintf \'%s\\\\n\' done";';

  it('escapes an awkward script and refreshes it byte-identically on update', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    writeScriptPhases(appRoot, [{...APP_CONFIG_PHASE, script: AWKWARD_SCRIPT}]);

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    const injected = pbxprojOf(xcodeprojPath);
    expect(injected).toContain(AWKWARD_ESCAPED);

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(pbxprojOf(xcodeprojPath)).toBe(injected);
  });

  it('deinit restores the pbxproj byte-for-byte after an awkward script', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    const before = pbxprojOf(xcodeprojPath);
    writeScriptPhases(appRoot, [{...APP_CONFIG_PHASE, script: AWKWARD_SCRIPT}]);

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(pbxprojOf(xcodeprojPath)).toContain(AWKWARD_ESCAPED);

    expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe('removed');
    expect(pbxprojOf(xcodeprojPath)).toBe(before);
  });

  // The hostile-name matrix, from the other side: whatever a plugin calls its
  // phase, `deinit` must find the object and its membership again and leave the
  // file as it was. The comment-normalization contract these lean on (and the
  // per-name balance/idempotency assertions) lives in
  // inject-spm-xcodeproj-test.js.
  it.each([
    ['an opening brace', 'Bundle { app'],
    ['a closing brace', 'Bundle } app'],
    ['an opening paren', 'Bundle (app'],
    ['a closing paren', 'Bundle app)'],
    ['a comma', 'A , B'],
    ['a semicolon', 'A; B'],
    ['an equals sign', 'name = {'],
    ['a comment terminator', 'Bad */ = { x'],
    ['a comment opener', 'Bad /* x'],
    ['a bare asterisk', 'A * B'],
    ['a bare slash', 'Copy A/B'],
    ['an unbalanced double quote', 'He said "hi'],
    ['a balanced double-quote pair', 'Bundle "app.config"'],
    ['a tab', 'A\tB'],
    ['non-ASCII characters', 'Générer la config 📦'],
    ['300 characters', `Bundle ${'x'.repeat(300)}`],
    ['only structural characters', '*/*'],
  ])(
    'deinits a phase whose name contains %s, leaving no residue',
    (_label, name) => {
      const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
      const before = pbxprojOf(xcodeprojPath);
      writeScriptPhases(appRoot, [{...APP_CONFIG_PHASE, name}]);

      injectSpmIntoExistingXcodeproj({
        appRoot,
        reactNativeRoot: rnRoot,
        xcodeprojPath,
      });
      const uuid = readMarker(xcodeprojPath).scriptPhases[APP_CONFIG_PHASE.id];
      expect(pbxprojOf(xcodeprojPath)).toContain(uuid);

      expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe(
        'removed',
      );
      const after = pbxprojOf(xcodeprojPath);
      expect(after).not.toContain('PBXShellScriptBuildPhase');
      expect(after).not.toContain(uuid);
      expect(after).toBe(before);
    },
  );
});

// ---------------------------------------------------------------------------
// artifactsVersionOverride — the marker field persisting an explicit
// `spm add/update --version <ver>` pin (see setup-apple-spm.js's
// determineVersion). SETS on an explicit override; PRESERVES a
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
// readArtifactsVersionOverride — pure fs read, used by setup-apple-spm.js's
// determineVersion to prefer a pinned version over the one derived from
// node_modules/react-native/package.json.
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

// ---------------------------------------------------------------------------
// configCommand — the marker field persisting an explicit `spm add/update
// --config-command '<json argv>'`. Without the pin, the build-time `sync`
// re-derived autolinking.json with the default @react-native-community/cli
// command and failed the "Sync SPM Autolinking" build phase in apps (e.g. Expo
// apps) that replace it.
// ---------------------------------------------------------------------------
describe('configCommand marker field', () => {
  const EXPO_COMMAND = [
    'npx',
    'expo-modules-autolinking',
    'react-native-config',
    '--json',
    '--platform',
    'ios',
  ];

  it('records an explicit config command into the marker', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      configCommand: EXPO_COMMAND,
    });
    expect(readMarker(xcodeprojPath).configCommand).toEqual(EXPO_COMMAND);
    expect(readPinnedConfigCommand(appRoot)).toEqual(EXPO_COMMAND);
  });

  it('defaults to null when --config-command has never been given', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(readMarker(xcodeprojPath).configCommand).toBeNull();
    expect(readPinnedConfigCommand(appRoot)).toBeNull();
  });

  it('preserves the pin on a later run without --config-command', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      configCommand: EXPO_COMMAND,
    });
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(readMarker(xcodeprojPath).configCommand).toEqual(EXPO_COMMAND);
    expect(readPinnedConfigCommand(appRoot)).toEqual(EXPO_COMMAND);
  });

  it('a later explicit --config-command overwrites the previous pin', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      configCommand: EXPO_COMMAND,
    });
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      configCommand: ['my-cli', 'config'],
    });
    expect(readMarker(xcodeprojPath).configCommand).toEqual([
      'my-cli',
      'config',
    ]);
    expect(readPinnedConfigCommand(appRoot)).toEqual(['my-cli', 'config']);
  });

  it('deinit drops the pin along with the whole marker', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      configCommand: EXPO_COMMAND,
    });
    removeSpmInjection({appRoot, xcodeprojPath});
    expect(fs.existsSync(path.join(xcodeprojPath, SPM_INJECTED_MARKER))).toBe(
      false,
    );
    expect(readPinnedConfigCommand(appRoot)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// readPinnedConfigCommand — pure fs read, used by setup-apple-spm.js (including
// the build-time `sync`) to reuse the config command an earlier `add`/`update`
// pinned. A hand-edited or corrupt marker must degrade to the env/default path
// instead of injecting a bogus argv or throwing mid-build.
// ---------------------------------------------------------------------------
describe('readPinnedConfigCommand', () => {
  it('returns null when no xcodeproj has been injected yet', () => {
    const {appRoot} = scaffoldApp();
    expect(readPinnedConfigCommand(appRoot)).toBeNull();
  });

  it('returns null (never throws) on a malformed marker', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      configCommand: ['my-cli', 'config'],
    });
    fs.writeFileSync(
      path.join(xcodeprojPath, SPM_INJECTED_MARKER),
      '{ not valid json',
      'utf8',
    );
    expect(() => readPinnedConfigCommand(appRoot)).not.toThrow();
    expect(readPinnedConfigCommand(appRoot)).toBeNull();
  });

  it.each([
    ['a bare string', '"npx expo-modules-autolinking"'],
    ['an empty array', '[]'],
    ['a non-string member', '["npx", 7]'],
    ['an empty-string member', '["npx", ""]'],
    ['an object', '{"command": "npx"}'],
  ])('returns null for a pinned value that is %s', (_label, pinned) => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp();
    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
      configCommand: ['my-cli', 'config'],
    });
    const markerPath = path.join(xcodeprojPath, SPM_INJECTED_MARKER);
    const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
    marker.configCommand = JSON.parse(pinned);
    fs.writeFileSync(markerPath, JSON.stringify(marker), 'utf8');
    expect(readPinnedConfigCommand(appRoot)).toBeNull();
  });
});

describe.each(Object.entries(PRE_EXISTING_HEADER_SEARCH_PATHS))(
  'removeSpmInjection with HEADER_SEARCH_PATHS already set to %s',
  (_label, value) => {
    it('restores the pre-existing value byte-for-byte', () => {
      const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp(
        withHeaderSearchPaths(value),
      );
      const before = pbxprojOf(xcodeprojPath);

      injectSpmIntoExistingXcodeproj({
        appRoot,
        reactNativeRoot: rnRoot,
        xcodeprojPath,
      });
      expect(pbxprojOf(xcodeprojPath)).not.toBe(before);

      expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe(
        'removed',
      );
      expect(pbxprojOf(xcodeprojPath)).toBe(before);
    });

    it('re-syncing is byte-for-byte identical', () => {
      const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp(
        withHeaderSearchPaths(value),
      );
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
  },
);

// findField's token for a BARE scalar ends AT the `;`, so it includes any
// whitespace before it. Deinit must put those bytes back exactly, not a
// tidied-up version of them.
describe.each([
  'HEADER_SEARCH_PATHS = $(inherited)   ; /* note */',
  'HEADER_SEARCH_PATHS =   ;',
])('removeSpmInjection with the untrimmed scalar `%s`', field => {
  it('restores it byte-for-byte', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp(withSetting(field));
    const before = pbxprojOf(xcodeprojPath);

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });
    expect(pbxprojOf(xcodeprojPath)).not.toBe(before);

    expect(removeSpmInjection({appRoot, xcodeprojPath}).status).toBe('removed');
    expect(pbxprojOf(xcodeprojPath)).toBe(before);
  });
});

describe('a scalar array setting injection has nothing to add to', () => {
  const SCALAR = 'FRAMEWORK_SEARCH_PATHS = "$(inherited)";';
  const EDITED = 'FRAMEWORK_SEARCH_PATHS = "$(inherited) $(SRCROOT)/Vendor";';

  // The fixture's flavored-frameworks manifest is empty, so
  // FRAMEWORK_SEARCH_PATHS is injected with no values at all.
  it('is left untouched, unrecorded, and survives a later user edit', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp(withSetting(SCALAR));

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });

    const injected = pbxprojOf(xcodeprojPath);
    expect(injected).toContain(SCALAR);
    expect(injected).not.toMatch(/FRAMEWORK_SEARCH_PATHS = \(/);
    for (const change of readMarker(xcodeprojPath).buildSettingChanges) {
      expect(change.promotedArrayScalars ?? {}).not.toHaveProperty(
        'FRAMEWORK_SEARCH_PATHS',
      );
    }

    fs.writeFileSync(
      path.join(xcodeprojPath, 'project.pbxproj'),
      injected.replaceAll(SCALAR, EDITED),
      'utf8',
    );
    removeSpmInjection({appRoot, xcodeprojPath});

    const after = pbxprojOf(xcodeprojPath);
    expect(after).toContain(EDITED);
    expect(after).not.toContain(SCALAR);
  });
});

describe('a promoted array setting the user deleted after add', () => {
  const SCALAR = '"$(inherited) $(SRCROOT)/vendor/include"';

  it('is not resurrected by deinit', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp(
      withHeaderSearchPaths(SCALAR),
    );
    const before = pbxprojOf(xcodeprojPath);

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });

    const deleted = pbxprojOf(xcodeprojPath).replace(
      /\n\t+HEADER_SEARCH_PATHS = \(\n[\s\S]*?\n\t+\);/g,
      '',
    );
    expect(deleted).not.toContain('HEADER_SEARCH_PATHS');
    fs.writeFileSync(
      path.join(xcodeprojPath, 'project.pbxproj'),
      deleted,
      'utf8',
    );

    removeSpmInjection({appRoot, xcodeprojPath});

    // Everything else is back to its pre-injection bytes; only the setting the
    // user deleted stays gone.
    expect(pbxprojOf(xcodeprojPath)).toBe(
      before.replaceAll(`\n\t\t\t\tHEADER_SEARCH_PATHS = ${SCALAR};`, ''),
    );
  });
});

// `deinit` removes appendedArrayValues before it restores promotedArrayScalars,
// so recording a key under both happens to come out right today: the scalar
// restore rewrites the whole value last. That makes the exclusivity below
// invisible to a round-trip test, which is why it is asserted on the marker
// directly — reversing those two loops would otherwise silently start removing
// array members from an already-restored scalar.
describe('a promoted scalar is recorded once, not twice', () => {
  it('records promotedArrayScalars and not appendedArrayValues for the key', () => {
    const {appRoot, xcodeprojPath, rnRoot} = scaffoldApp(
      withHeaderSearchPaths('"$(inherited) $(SRCROOT)/vendor/include"'),
    );

    injectSpmIntoExistingXcodeproj({
      appRoot,
      reactNativeRoot: rnRoot,
      xcodeprojPath,
    });

    const changes = readMarker(xcodeprojPath).buildSettingChanges;
    expect(changes.length).toBeGreaterThan(0);
    for (const change of changes) {
      expect(Object.keys(change.promotedArrayScalars ?? {})).toContain(
        'HEADER_SEARCH_PATHS',
      );
      expect(Object.keys(change.appendedArrayValues ?? {})).not.toContain(
        'HEADER_SEARCH_PATHS',
      );
    }
  });
});
