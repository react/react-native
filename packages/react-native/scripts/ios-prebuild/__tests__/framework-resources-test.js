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
  buildI18nStringsBundle,
  buildReactPrivacyManifest,
  collectLprojDirs,
  collectReactPrivacyManifestPaths,
  i18nBundleInfoPlist,
  mergePrivacyManifests,
  readPrivacyManifest,
  serializePrivacyManifest,
} = require('../framework-resources');
const {emitReactFrameworkHeaders} = require('../headers-compose');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// react-native package root (…/scripts/ios-prebuild/__tests__ -> …)
const RN_PATH = path.resolve(__dirname, '..', '..', '..');

// Apple privacy manifest fixtures mirroring the real ones shipped by the pods
// baked into React.framework.
const reactCore = {
  NSPrivacyAccessedAPITypes: [
    {
      NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
      NSPrivacyAccessedAPITypeReasons: ['C617.1'],
    },
    {
      NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
      NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
    },
  ],
  NSPrivacyCollectedDataTypes: [],
  NSPrivacyTracking: false,
};

const cxxreact = {
  NSPrivacyAccessedAPITypes: [
    {
      NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
      NSPrivacyAccessedAPITypeReasons: ['C617.1'],
    },
  ],
  NSPrivacyCollectedDataTypes: [],
  NSPrivacyTracking: false,
};

describe('mergePrivacyManifests', () => {
  it('returns a valid empty manifest for no inputs', () => {
    expect(mergePrivacyManifests([])).toEqual({
      NSPrivacyAccessedAPITypes: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyTracking: false,
    });
  });

  it('passes a single manifest through unchanged (by value)', () => {
    expect(mergePrivacyManifests([reactCore])).toEqual(reactCore);
  });

  it('unions accessed-API categories, deduping reasons per category', () => {
    const merged = mergePrivacyManifests([reactCore, cxxreact]);
    const byType = Object.fromEntries(
      merged.NSPrivacyAccessedAPITypes.map(e => [
        e.NSPrivacyAccessedAPIType,
        e.NSPrivacyAccessedAPITypeReasons,
      ]),
    );
    // FileTimestamp appears in both -> single entry, reason deduped.
    expect(merged.NSPrivacyAccessedAPITypes).toHaveLength(2);
    expect(byType.NSPrivacyAccessedAPICategoryFileTimestamp).toEqual([
      'C617.1',
    ]);
    expect(byType.NSPrivacyAccessedAPICategoryUserDefaults).toEqual(['CA92.1']);
  });

  it('unions reasons across manifests for the same category', () => {
    const a = {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    };
    const b = {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['1C8F.1'],
        },
      ],
    };
    const merged = mergePrivacyManifests([a, b]);
    expect(merged.NSPrivacyAccessedAPITypes).toHaveLength(1);
    expect(
      merged.NSPrivacyAccessedAPITypes[0].NSPrivacyAccessedAPITypeReasons.sort(),
    ).toEqual(['1C8F.1', 'CA92.1']);
  });

  it('ORs NSPrivacyTracking and unions tracking domains', () => {
    const a = {NSPrivacyTracking: false, NSPrivacyTrackingDomains: ['a.com']};
    const b = {
      NSPrivacyTracking: true,
      NSPrivacyTrackingDomains: ['a.com', 'b.com'],
    };
    const merged = mergePrivacyManifests([a, b]);
    expect(merged.NSPrivacyTracking).toBe(true);
    expect(merged.NSPrivacyTrackingDomains.sort()).toEqual(['a.com', 'b.com']);
  });

  it('unions collected data types, deduping structurally-equal entries', () => {
    const entry = {
      NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
      NSPrivacyCollectedDataTypeLinked: false,
    };
    const merged = mergePrivacyManifests([
      {NSPrivacyCollectedDataTypes: [entry]},
      {NSPrivacyCollectedDataTypes: [{...entry}]},
    ]);
    expect(merged.NSPrivacyCollectedDataTypes).toHaveLength(1);
  });

  it('dedups collected data types regardless of source key order', () => {
    // Same dict, different key order (order comes from each plist) must dedup.
    const merged = mergePrivacyManifests([
      {
        NSPrivacyCollectedDataTypes: [
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
            NSPrivacyCollectedDataTypeLinked: false,
          },
        ],
      },
      {
        NSPrivacyCollectedDataTypes: [
          {
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
          },
        ],
      },
    ]);
    expect(merged.NSPrivacyCollectedDataTypes).toHaveLength(1);
  });

  it('does not fabricate a reasons key when the source omitted it', () => {
    const merged = mergePrivacyManifests([
      {
        NSPrivacyAccessedAPITypes: [
          {NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryOther'},
        ],
      },
    ]);
    const entry = merged.NSPrivacyAccessedAPITypes[0];
    expect(entry.NSPrivacyAccessedAPIType).toBe(
      'NSPrivacyAccessedAPICategoryOther',
    );
    expect('NSPrivacyAccessedAPITypeReasons' in entry).toBe(false);
  });
});

describe('serialize/read privacy-manifest round-trip', () => {
  it('serialize -> readPrivacyManifest yields the same object (guards the plist.build byte shape)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'privacy-rt-'));
    const file = path.join(tmp, 'PrivacyInfo.xcprivacy');
    try {
      fs.writeFileSync(file, serializePrivacyManifest(reactCore));
      expect(readPrivacyManifest(file)).toEqual(reactCore);
    } finally {
      fs.rmSync(tmp, {recursive: true, force: true});
    }
  });
});

describe('collectReactPrivacyManifestPaths drift gate', () => {
  let tmp;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'privacy-gate-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  function writeManifest(rel) {
    const file = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, serializePrivacyManifest(reactCore));
    return file;
  }

  it('throws when a manifest under the privacy roots is not allowlisted (a new pod must be a conscious decision)', () => {
    writeManifest('React/Resources/PrivacyInfo.xcprivacy');
    writeManifest('Libraries/SomeNewPod/PrivacyInfo.xcprivacy');
    expect(() => collectReactPrivacyManifestPaths(tmp)).toThrow(/SomeNewPod/);
    expect(() => collectReactPrivacyManifestPaths(tmp)).toThrow(
      /REACT_PRIVACY_MANIFESTS/,
    );
  });

  it('returns the found subset of allowlisted manifests (partial trees stay valid)', () => {
    const file = writeManifest('React/Resources/PrivacyInfo.xcprivacy');
    expect(collectReactPrivacyManifestPaths(tmp)).toEqual([file]);
  });

  it('returns [] for a tree with no manifests', () => {
    expect(collectReactPrivacyManifestPaths(tmp)).toEqual([]);
  });
});

describe('buildReactPrivacyManifest (against the real source tree)', () => {
  it('discovers React-core PrivacyInfo.xcprivacy files (not third-party deps)', () => {
    const paths = collectReactPrivacyManifestPaths(RN_PATH);
    expect(paths.length).toBeGreaterThan(0);
    // third-party-podspecs manifests belong to ReactNativeDependencies, not React.framework
    expect(paths.some(p => p.includes('third-party-podspecs'))).toBe(false);
    // React-Core's manifest is the canonical one that must be present
    expect(
      paths.some(p => p.endsWith('React/Resources/PrivacyInfo.xcprivacy')),
    ).toBe(true);
  });

  it('merges them into one manifest covering the known React-core API usages', () => {
    const merged = buildReactPrivacyManifest(RN_PATH);
    expect(merged).not.toBeNull();
    const categories = (merged?.NSPrivacyAccessedAPITypes ?? []).map(
      e => e.NSPrivacyAccessedAPIType,
    );
    // FileTimestamp + UserDefaults are declared by React-Core; both must survive the merge.
    expect(categories).toContain('NSPrivacyAccessedAPICategoryFileTimestamp');
    expect(categories).toContain('NSPrivacyAccessedAPICategoryUserDefaults');
    // No category should be duplicated after merging.
    expect(new Set(categories).size).toBe(categories.length);
  });
});

describe('i18nBundleInfoPlist', () => {
  it('is a valid resource-bundle Info.plist dict', () => {
    const info = i18nBundleInfoPlist();
    expect(info.CFBundlePackageType).toBe('BNDL');
    expect(info.CFBundleName).toBe('RCTI18nStrings');
    expect(typeof info.CFBundleIdentifier).toBe('string');
    expect(info.CFBundleIdentifier.length).toBeGreaterThan(0);
    expect(typeof info.CFBundleDevelopmentRegion).toBe('string');
    // Versioned so Apple validation tooling doesn't warn on a version-less bundle.
    expect(info.CFBundleShortVersionString).toBeDefined();
    expect(info.CFBundleVersion).toBeDefined();
  });
});

describe('collectLprojDirs (against the real source tree)', () => {
  it('finds the React i18n .lproj locale dirs', () => {
    const dirs = collectLprojDirs(RN_PATH);
    expect(dirs.length).toBeGreaterThan(0);
    expect(dirs.every(d => d.endsWith('.lproj'))).toBe(true);
    // English is the canonical base locale and must be present.
    expect(dirs.some(d => path.basename(d) === 'en.lproj')).toBe(true);
  });
});

describe('buildI18nStringsBundle', () => {
  let tmp;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-bundle-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  it('builds RCTI18nStrings.bundle with the .lproj dirs and an Info.plist', () => {
    const out = path.join(tmp, 'RCTI18nStrings.bundle');
    const count = buildI18nStringsBundle(RN_PATH, out);

    expect(count).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(out, 'Info.plist'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'en.lproj'))).toBe(true);
    // the copied locale carries its actual strings file(s)
    expect(fs.readdirSync(path.join(out, 'en.lproj')).length).toBeGreaterThan(
      0,
    );
    // count matches the number of .lproj dirs copied
    const copied = fs.readdirSync(out).filter(e => e.endsWith('.lproj'));
    expect(copied.length).toBe(count);
  });

  it('returns 0 and writes nothing when there are no .lproj dirs', () => {
    const emptyRn = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-rn-'));
    const out = path.join(tmp, 'RCTI18nStrings.bundle');
    const count = buildI18nStringsBundle(emptyRn, out);
    expect(count).toBe(0);
    expect(fs.existsSync(out)).toBe(false);
    fs.rmSync(emptyRn, {recursive: true, force: true});
  });
});

describe('emitReactFrameworkHeaders resource landing (integration)', () => {
  let tmp;
  let rnRoot;
  let xcfw;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emit-res-'));

    // Minimal fake source tree: one privacy manifest + one locale.
    rnRoot = path.join(tmp, 'rn');
    const privacyDir = path.join(rnRoot, 'React', 'Resources');
    fs.mkdirSync(privacyDir, {recursive: true});
    fs.writeFileSync(
      path.join(privacyDir, 'PrivacyInfo.xcprivacy'),
      serializePrivacyManifest(reactCore),
    );
    const lproj = path.join(rnRoot, 'React', 'I18n', 'strings', 'en.lproj');
    fs.mkdirSync(lproj, {recursive: true});
    fs.writeFileSync(
      path.join(lproj, 'Localizable.strings'),
      '"key" = "value";\n',
    );

    // Two-slice xcframework, each carrying an empty React.framework.
    xcfw = path.join(tmp, 'React.xcframework');
    for (const slice of ['ios-arm64', 'ios-arm64_x86_64-simulator']) {
      fs.mkdirSync(path.join(xcfw, slice, 'React.framework'), {
        recursive: true,
      });
    }
  });

  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  it('lands PrivacyInfo.xcprivacy and RCTI18nStrings.bundle into EVERY slice', () => {
    // Empty header plan — this test targets the non-header resources only.
    emitReactFrameworkHeaders(
      xcfw,
      {
        react: [],
        umbrella: [],
        privateReactHeaders: {modular: [], textual: []},
      },
      rnRoot,
    );

    for (const slice of ['ios-arm64', 'ios-arm64_x86_64-simulator']) {
      const fwk = path.join(xcfw, slice, 'React.framework');
      expect(fs.existsSync(path.join(fwk, 'PrivacyInfo.xcprivacy'))).toBe(true);
      const bundle = path.join(fwk, 'RCTI18nStrings.bundle');
      expect(fs.existsSync(path.join(bundle, 'Info.plist'))).toBe(true);
      expect(fs.existsSync(path.join(bundle, 'en.lproj'))).toBe(true);
      // The composed module map is present too (proves the slice was rewritten).
      expect(fs.existsSync(path.join(fwk, 'Modules', 'module.modulemap'))).toBe(
        true,
      );
    }
  });
});
