/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/**
 * Non-header resources that the prebuild embeds into React.framework so the
 * prebuilt artifact is self-describing for both CocoaPods-prebuilt and SwiftPM.
 *
 * In source builds each pod ships these via its podspec `resource_bundles`. In
 * the prebuilt path the source pods aren't installed (CocoaPods facades) / not
 * present (SwiftPM), so we reproduce them from the source tree at compose time:
 *
 *  - Privacy manifest: the pods baked into React.framework each ship a
 *    PrivacyInfo.xcprivacy; we merge them into ONE manifest at the framework
 *    root, where Xcode's privacy-report aggregation picks it up (no runtime).
 *  - RCTI18nStrings: React-Core's localized strings (React/I18n/strings/*.lproj)
 *    rebuilt as RCTI18nStrings.bundle inside the framework, where the
 *    framework-aware RCTLocalizedString loader resolves them via bundleForClass:.
 */

const fs = require('node:fs');
const path = require('node:path');
const plist = require('plist');

// Source roots whose pods compile into React.framework. third-party-podspecs is
// intentionally excluded — those (boost/glog/RCT-Folly) live in
// ReactNativeDependencies.xcframework and are aggregated there.
const REACT_PRIVACY_ROOTS = ['React', 'ReactCommon', 'Libraries', 'ReactApple'];

// The privacy manifests of the pods that compile INTO React.framework —
// an EXPLICIT allowlist, not a glob: a PrivacyInfo.xcprivacy that appears
// under REACT_PRIVACY_ROOTS without being listed here fails the prebuild,
// forcing a conscious decision. A pod whose sources compile into
// React.framework belongs on this list; a pod that ships as its OWN framework
// must NOT have its manifest folded into React.framework's aggregate
// (over-declaration in the app's privacy report).
const REACT_PRIVACY_MANIFESTS = [
  path.join('React', 'Resources', 'PrivacyInfo.xcprivacy'),
  path.join('ReactCommon', 'cxxreact', 'PrivacyInfo.xcprivacy'),
  path.join('ReactCommon', 'react', 'timing', 'PrivacyInfo.xcprivacy'),
];

// Where React-Core's localized strings live, relative to the package root.
const STRINGS_REL = path.join('React', 'I18n', 'strings');

/*::
type AccessedAPIType = {
  NSPrivacyAccessedAPIType: string,
  NSPrivacyAccessedAPITypeReasons?: Array<string>,
  ...
};
type PrivacyManifest = {
  NSPrivacyAccessedAPITypes?: Array<AccessedAPIType>,
  NSPrivacyCollectedDataTypes?: Array<unknown>,
  NSPrivacyTracking?: boolean,
  NSPrivacyTrackingDomains?: Array<string>,
  ...
};
*/

// ---------------------------------------------------------------------------
// Privacy manifest
// ---------------------------------------------------------------------------

// Recursively sorts object keys so structurally-equal values serialize
// identically regardless of source key order (arrays keep their order).
function canonicalize(value /*: unknown */) /*: unknown */ {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value != null && typeof value === 'object') {
    const out /*: {[string]: unknown} */ = {};
    for (const k of Object.keys(value).sort()) {
      out[k] = canonicalize(value[k]);
    }
    return out;
  }
  return value;
}

/**
 * Merges Apple privacy manifests into one. Pure; operates on parsed plist
 * objects. Semantics:
 *  - NSPrivacyAccessedAPITypes: keyed by category; reasons unioned (deduped).
 *  - NSPrivacyCollectedDataTypes: unioned, deduped structurally.
 *  - NSPrivacyTrackingDomains: unioned (deduped); omitted when empty.
 *  - NSPrivacyTracking: logical OR.
 */
function mergePrivacyManifests(
  manifests /*: Array<?PrivacyManifest> */,
) /*: PrivacyManifest */ {
  const reasonsByType /*: Map<string, Array<string>> */ = new Map();
  // Categories where at least one source actually declared the reasons key, so
  // a source that omitted it doesn't get a fabricated empty-array key on the way
  // out (keeps "a single manifest passes through unchanged" honest).
  const typeHadReasonsKey /*: Set<string> */ = new Set();
  const typeOrder /*: Array<string> */ = [];
  const trackingDomains /*: Set<string> */ = new Set();
  const collected /*: Array<unknown> */ = [];
  const collectedSeen /*: Set<string> */ = new Set();
  let tracking = false;

  for (const manifest of manifests) {
    if (manifest == null) {
      continue;
    }
    for (const entry of manifest.NSPrivacyAccessedAPITypes ?? []) {
      const category = entry.NSPrivacyAccessedAPIType;
      if (!reasonsByType.has(category)) {
        reasonsByType.set(category, []);
        typeOrder.push(category);
      }
      const entryReasons = entry.NSPrivacyAccessedAPITypeReasons;
      if (entryReasons != null) {
        typeHadReasonsKey.add(category);
        const reasons = reasonsByType.get(category);
        if (reasons != null) {
          for (const reason of entryReasons) {
            if (!reasons.includes(reason)) {
              reasons.push(reason);
            }
          }
        }
      }
    }
    for (const domain of manifest.NSPrivacyTrackingDomains ?? []) {
      trackingDomains.add(domain);
    }
    for (const dataType of manifest.NSPrivacyCollectedDataTypes ?? []) {
      // Canonicalize (sort object keys recursively) before keying so two pods
      // declaring the same data-type dict in different key order still dedup.
      // The `?? ''` is unreachable at runtime (canonicalize of a plist dict
      // never yields undefined) — it exists purely because Flow types
      // JSON.stringify as `string | void`.
      const key = JSON.stringify(canonicalize(dataType)) ?? '';
      if (!collectedSeen.has(key)) {
        collectedSeen.add(key);
        collected.push(dataType);
      }
    }
    if (manifest.NSPrivacyTracking === true) {
      tracking = true;
    }
  }

  const merged /*: PrivacyManifest */ = {
    NSPrivacyAccessedAPITypes: typeOrder.map(category => {
      const entry /*: AccessedAPIType */ = {
        NSPrivacyAccessedAPIType: category,
      };
      if (typeHadReasonsKey.has(category)) {
        entry.NSPrivacyAccessedAPITypeReasons =
          reasonsByType.get(category) ?? [];
      }
      return entry;
    }),
    NSPrivacyCollectedDataTypes: collected,
    NSPrivacyTracking: tracking,
  };
  if (trackingDomains.size > 0) {
    merged.NSPrivacyTrackingDomains = Array.from(trackingDomains);
  }
  return merged;
}

/** Parses a single `PrivacyInfo.xcprivacy` (plist) file into an object. */
function readPrivacyManifest(filePath /*: string */) /*: PrivacyManifest */ {
  // $FlowFixMe[incompatible-return] plist.parse returns a loose PlistValue.
  return plist.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Finds every `PrivacyInfo.xcprivacy` under the React-core source roots of
 * `reactNativePath` (excluding third-party deps). Sorted for deterministic output.
 */
function collectReactPrivacyManifestPaths(
  reactNativePath /*: string */,
) /*: Array<string> */ {
  const found /*: Array<string> */ = [];
  for (const root of REACT_PRIVACY_ROOTS) {
    const dir = path.join(reactNativePath, root);
    if (!fs.existsSync(dir)) {
      continue;
    }
    for (const rel of fs.readdirSync(dir, {recursive: true})) {
      if (path.basename(String(rel)) === 'PrivacyInfo.xcprivacy') {
        found.push(path.join(root, String(rel)));
      }
    }
  }
  const unlisted = found.filter(rel => !REACT_PRIVACY_MANIFESTS.includes(rel));
  if (unlisted.length > 0) {
    throw new Error(
      'React.framework privacy-manifest drift: found PrivacyInfo.xcprivacy ' +
        'file(s) under the React privacy roots that are not allowlisted:\n' +
        unlisted.map(rel => `  ${rel}`).join('\n') +
        '\nIf the owning pod compiles into React.framework, add the path to ' +
        'REACT_PRIVACY_MANIFESTS in framework-resources.js. If it ships as ' +
        'its own framework, its manifest must NOT be folded into ' +
        "React.framework's aggregate — relocate it out of the privacy roots " +
        'or exclude it explicitly.',
    );
  }
  // A listed-but-absent manifest is legal (partial fixture trees; upstream
  // deletions surface as under-declaration exactly like source builds would).
  // A MOVED manifest cannot slip through: its new location is unlisted.
  return found.map(rel => path.join(reactNativePath, rel)).sort();
}

/**
 * Builds the aggregated React.framework privacy manifest from the source pods,
 * or null when there are none.
 */
function buildReactPrivacyManifest(
  reactNativePath /*: string */,
) /*: ?PrivacyManifest */ {
  const paths = collectReactPrivacyManifestPaths(reactNativePath);
  if (paths.length === 0) {
    return null;
  }
  return mergePrivacyManifests(paths.map(readPrivacyManifest));
}

/** Serializes a manifest object back to a plist XML string. */
function serializePrivacyManifest(
  manifest /*: PrivacyManifest */,
) /*: string */ {
  return plist.build(manifest);
}

// ---------------------------------------------------------------------------
// RCTI18nStrings bundle
// ---------------------------------------------------------------------------

/** The Info.plist contents that make the copied .lproj dirs load as an NSBundle. */
function i18nBundleInfoPlist() /*: {[string]: string} */ {
  return {
    CFBundleDevelopmentRegion: 'en',
    CFBundleIdentifier: 'org.reactnative.RCTI18nStrings',
    CFBundleInfoDictionaryVersion: '6.0',
    CFBundleName: 'RCTI18nStrings',
    CFBundlePackageType: 'BNDL',
    // Present so Apple validation tooling doesn't warn on a version-less bundle.
    CFBundleShortVersionString: '1.0',
    CFBundleVersion: '1',
  };
}

/** Absolute paths of the React i18n `.lproj` locale dirs, sorted. */
function collectLprojDirs(reactNativePath /*: string */) /*: Array<string> */ {
  const stringsDir = path.join(reactNativePath, STRINGS_REL);
  if (!fs.existsSync(stringsDir)) {
    return [];
  }
  return fs
    .readdirSync(stringsDir, {withFileTypes: true})
    .filter(e => e.isDirectory() && String(e.name).endsWith('.lproj'))
    .map(e => path.join(stringsDir, String(e.name)))
    .sort();
}

/**
 * Builds `RCTI18nStrings.bundle` at `outBundlePath` from the React i18n .lproj
 * dirs + an Info.plist. Returns the number of locales copied (0 when there are
 * none, in which case nothing is written).
 */
function buildI18nStringsBundle(
  reactNativePath /*: string */,
  outBundlePath /*: string */,
) /*: number */ {
  const lprojDirs = collectLprojDirs(reactNativePath);
  if (lprojDirs.length === 0) {
    return 0;
  }
  fs.rmSync(outBundlePath, {recursive: true, force: true});
  fs.mkdirSync(outBundlePath, {recursive: true});
  for (const lproj of lprojDirs) {
    fs.cpSync(lproj, path.join(outBundlePath, path.basename(lproj)), {
      recursive: true,
    });
  }
  fs.writeFileSync(
    path.join(outBundlePath, 'Info.plist'),
    plist.build(i18nBundleInfoPlist()),
  );
  return lprojDirs.length;
}

module.exports = {
  // privacy manifest
  mergePrivacyManifests,
  readPrivacyManifest,
  collectReactPrivacyManifestPaths,
  buildReactPrivacyManifest,
  serializePrivacyManifest,
  // RCTI18nStrings bundle
  i18nBundleInfoPlist,
  collectLprojDirs,
  buildI18nStringsBundle,
};
