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
  exists,
  extractXCFramework,
  findFirst,
  formatBytes,
  formatSpeed,
  hermesReleaseUrl,
  resolveCacheSlotVersion,
  resolveHermesArtifact,
  resolveLatestV1Version,
  resolveNightlyVersion,
  resolveRNCoreArtifact,
  resolveRNDepsArtifact,
  resolveSnapshotUrl,
  rnCoreReleaseUrl,
  rnDepsReleaseUrl,
  validateArtifactsCache,
} = require('../download-spm-artifacts');
const {execSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Shared fetch router used by the URL-resolution tests below. Each key is a
// URL substring; the matched value describes the response. Anything unmatched
// returns 404 (the "release not found, fall back to snapshot" path).
function routerFetch(routes /*: {[string]: any} */) {
  return jest.fn(async (url, opts) => {
    for (const [key, resp] of Object.entries(routes)) {
      if (String(url).includes(key)) {
        return {
          ok: resp.ok ?? true,
          status: resp.status ?? 200,
          json: async () => resp.json,
          text: async () => resp.text ?? '',
        };
      }
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => '',
    };
  });
}

// ---------------------------------------------------------------------------
// resolveHermesArtifact — hermes uses its own version space, decoupled from
// React Native's nightly cadence. The default behavior mirrors RN's
// CocoaPods prebuild (HERMES_VERSION='latest-v1'): resolve via the
// hermes-compiler npm dist-tag instead of trying to download a hermes-ios
// artifact at the RN nightly version (which won't exist on Maven).
// ---------------------------------------------------------------------------

describe('resolveHermesArtifact', () => {
  let origFetch;
  let origHermesEnv;

  beforeEach(() => {
    origFetch = globalThis.fetch;
    origHermesEnv = process.env.HERMES_VERSION;
    delete process.env.HERMES_VERSION;
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
    if (origHermesEnv !== undefined) {
      process.env.HERMES_VERSION = origHermesEnv;
    } else {
      delete process.env.HERMES_VERSION;
    }
  });

  // Mock fetch with a router: each entry's key is a URL substring; the value
  // describes the response. Anything not matched returns 404 (mimicking the
  // "release not found, try snapshot" path).
  function mockFetch(routes /*: {[string]: any} */) {
    globalThis.fetch = routerFetch(routes);
  }

  describe('default behavior (no HERMES_VERSION set)', () => {
    it('resolves to the latest-v1 hermes-compiler dist-tag, NOT the RN version', async () => {
      mockFetch({
        'hermes-compiler/latest-v1': {json: {version: '0.13.0'}},
        // Pretend the release URL exists once we ask for 0.13.0.
        'hermes-ios/0.13.0/hermes-ios-0.13.0': {ok: true},
      });
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-20260519-58cd1bf58',
        'debug',
        null,
      );
      expect(result.version).toBe('0.13.0');
      expect(result.url).toContain('/0.13.0/');
      // The RN nightly hash MUST NOT leak into the hermes URL.
      expect(result.url).not.toContain('20260519');
    });

    it('ignores rawVersion (the RN --version arg) when HERMES_VERSION is unset', async () => {
      mockFetch({
        'hermes-compiler/latest-v1': {json: {version: '0.13.0'}},
        'hermes-ios/0.13.0/hermes-ios-0.13.0': {ok: true},
      });
      // Caller passes the original RN --version verbatim; hermes should
      // still default to latest-v1 instead of using this.
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-20260519-58cd1bf58',
        'debug',
        '0.87.0-nightly-20260519-58cd1bf58',
      );
      expect(result.version).toBe('0.13.0');
      expect(result.url).not.toContain('20260519');
    });
  });

  describe('HERMES_VERSION escape hatches', () => {
    it('HERMES_VERSION=<literal-version> uses it verbatim', async () => {
      process.env.HERMES_VERSION = '0.13.5';
      mockFetch({
        'hermes-ios/0.13.5/hermes-ios-0.13.5': {ok: true},
      });
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-anything',
        'debug',
        null,
      );
      expect(result.version).toBe('0.13.5');
      expect(result.url).toContain('/0.13.5/');
    });

    it('HERMES_VERSION=latest-v1 resolves via npm dist-tag', async () => {
      process.env.HERMES_VERSION = 'latest-v1';
      mockFetch({
        'hermes-compiler/latest-v1': {json: {version: '0.13.0'}},
        'hermes-ios/0.13.0/hermes-ios-0.13.0': {ok: true},
      });
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-anything',
        'debug',
        null,
      );
      expect(result.version).toBe('0.13.0');
    });

    it('HERMES_VERSION=nightly resolves hermes-compiler@nightly from npm', async () => {
      process.env.HERMES_VERSION = 'nightly';
      mockFetch({
        'hermes-compiler/nightly': {json: {version: '0.14.0-nightly-abc'}},
        'hermes-ios/0.14.0-nightly-abc/hermes-ios-0.14.0-nightly-abc': {
          ok: true,
        },
      });
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-anything',
        'debug',
        null,
      );
      expect(result.version).toBe('0.14.0-nightly-abc');
    });

    it('falls back to the hermes snapshot URL when the release is missing', async () => {
      process.env.HERMES_VERSION = '0.13.5';
      globalThis.fetch = jest.fn(async (url, opts) => {
        if (opts && opts.method === 'HEAD') {
          return {status: 404};
        }
        return {
          ok: true,
          status: 200,
          text: async () =>
            '<metadata><timestamp>20260303.000000</timestamp>' +
            '<buildNumber>2</buildNumber></metadata>',
        };
      });
      const result = await resolveHermesArtifact('0.87.0', 'debug', null);
      expect(result.url).toContain('maven-snapshots');
      expect(result.url).toContain('hermes-ios-debug.tar.gz');
    });
  });
});

// ---------------------------------------------------------------------------
// Maven URL builders — pure string composition.
// ---------------------------------------------------------------------------

describe('release URL builders', () => {
  it('rnCoreReleaseUrl points at the reactnative-core classifier on Maven Central', () => {
    const url = rnCoreReleaseUrl('0.85.0', 'debug');
    expect(url).toBe(
      'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.85.0/' +
        'react-native-artifacts-0.85.0-reactnative-core-debug.tar.gz',
    );
  });

  it('rnDepsReleaseUrl points at the reactnative-dependencies classifier', () => {
    const url = rnDepsReleaseUrl('0.85.0', 'release');
    expect(url).toContain('react-native-artifacts/0.85.0/');
    expect(url).toContain('reactnative-dependencies-release.tar.gz');
  });

  it('hermesReleaseUrl points at the hermes-ios coordinate', () => {
    const url = hermesReleaseUrl('0.13.0', 'debug');
    expect(url).toBe(
      'https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/0.13.0/' +
        'hermes-ios-0.13.0-hermes-ios-debug.tar.gz',
    );
  });

  it('honors ENTERPRISE_REPOSITORY for the release base URL', () => {
    jest.isolateModules(() => {
      const prev = process.env.ENTERPRISE_REPOSITORY;
      process.env.ENTERPRISE_REPOSITORY = 'https://maven.internal.example';
      try {
        const mod = require('../download-spm-artifacts');
        expect(mod.rnCoreReleaseUrl('0.85.0', 'debug')).toContain(
          'https://maven.internal.example/com/facebook/react/',
        );
      } finally {
        if (prev !== undefined) {
          process.env.ENTERPRISE_REPOSITORY = prev;
        } else {
          delete process.env.ENTERPRISE_REPOSITORY;
        }
      }
    });
  });
});

// ---------------------------------------------------------------------------
// formatBytes / formatSpeed — pure formatting with a 1 MB unit boundary.
// ---------------------------------------------------------------------------

describe('formatBytes', () => {
  it('renders sub-megabyte sizes in KB', () => {
    expect(formatBytes(512)).toBe('0.5 KB');
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  it('renders megabyte-and-larger sizes in MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('formatSpeed', () => {
  it('renders sub-megabyte rates in KB/s (no decimals)', () => {
    expect(formatSpeed(2048)).toBe('2 KB/s');
  });

  it('renders megabyte-and-larger rates in MB/s', () => {
    expect(formatSpeed(5 * 1024 * 1024)).toBe('5.0 MB/s');
  });
});

// ---------------------------------------------------------------------------
// exists — HEAD probe used to choose release vs. snapshot.
// ---------------------------------------------------------------------------

describe('exists', () => {
  let origFetch;
  beforeEach(() => {
    origFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  it('returns true on a 200 HEAD response', async () => {
    globalThis.fetch = jest.fn(async () => ({status: 200}));
    expect(await exists('https://example/x.tar.gz')).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith('https://example/x.tar.gz', {
      method: 'HEAD',
    });
  });

  it('returns false on a non-200 response', async () => {
    globalThis.fetch = jest.fn(async () => ({status: 404}));
    expect(await exists('https://example/missing.tar.gz')).toBe(false);
  });

  it('returns false when fetch rejects (offline)', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new Error('network down');
    });
    expect(await exists('https://example/x.tar.gz')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolveSnapshotUrl — parses maven-metadata.xml into a timestamped URL.
// ---------------------------------------------------------------------------

describe('resolveSnapshotUrl', () => {
  let origFetch;
  beforeEach(() => {
    origFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  const METADATA = `<?xml version="1.0"?>
    <metadata>
      <versioning><snapshot>
        <timestamp>20260101.123456</timestamp>
        <buildNumber>7</buildNumber>
      </snapshot></versioning>
    </metadata>`;

  it('builds a fully-versioned snapshot URL from timestamp + buildNumber', async () => {
    globalThis.fetch = routerFetch({'maven-metadata.xml': {text: METADATA}});
    const url = await resolveSnapshotUrl(
      '0.85.0',
      'react',
      'react-native-artifacts',
      'reactnative-core-debug.tar.gz',
    );
    expect(url).toContain('0.85.0-SNAPSHOT/');
    expect(url).toContain(
      'react-native-artifacts-0.85.0-20260101.123456-7-reactnative-core-debug.tar.gz',
    );
  });

  it('throws when the metadata request fails', async () => {
    globalThis.fetch = routerFetch({
      'maven-metadata.xml': {ok: false, status: 500},
    });
    await expect(
      resolveSnapshotUrl(
        '0.85.0',
        'react',
        'react-native-artifacts',
        'x.tar.gz',
      ),
    ).rejects.toThrow(/Failed to fetch snapshot metadata/);
  });

  it('throws when timestamp/buildNumber are absent', async () => {
    globalThis.fetch = routerFetch({
      'maven-metadata.xml': {text: '<metadata></metadata>'},
    });
    await expect(
      resolveSnapshotUrl(
        '0.85.0',
        'react',
        'react-native-artifacts',
        'x.tar.gz',
      ),
    ).rejects.toThrow(/Could not parse timestamp\/buildNumber/);
  });
});

// ---------------------------------------------------------------------------
// resolveNightlyVersion / resolveLatestV1Version — npm dist-tag lookups.
// ---------------------------------------------------------------------------

describe('npm dist-tag resolvers', () => {
  let origFetch;
  beforeEach(() => {
    origFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  it('resolveNightlyVersion returns the version from the npm registry', async () => {
    globalThis.fetch = routerFetch({
      'react-native/nightly': {json: {version: '0.86.0-nightly-xyz'}},
    });
    expect(await resolveNightlyVersion('react-native')).toBe(
      '0.86.0-nightly-xyz',
    );
  });

  it('resolveNightlyVersion throws on a failed npm lookup', async () => {
    globalThis.fetch = routerFetch({
      'react-native/nightly': {ok: false, status: 404},
    });
    await expect(resolveNightlyVersion('react-native')).rejects.toThrow(
      /npm lookup failed/,
    );
  });

  it('resolveLatestV1Version reads hermes-compiler/latest-v1', async () => {
    globalThis.fetch = routerFetch({
      'hermes-compiler/latest-v1': {json: {version: '0.13.0'}},
    });
    expect(await resolveLatestV1Version()).toBe('0.13.0');
  });

  it('resolveLatestV1Version throws on a failed lookup', async () => {
    globalThis.fetch = routerFetch({
      'hermes-compiler/latest-v1': {ok: false, status: 500},
    });
    await expect(resolveLatestV1Version()).rejects.toThrow(/npm lookup failed/);
  });
});

// ---------------------------------------------------------------------------
// resolveRNCoreArtifact / resolveRNDepsArtifact — release-then-snapshot.
// ---------------------------------------------------------------------------

describe('resolveRNCoreArtifact', () => {
  let origFetch;
  let tempDir;
  beforeEach(() => {
    origFetch = globalThis.fetch;
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-core-'));
  });
  afterEach(() => {
    globalThis.fetch = origFetch;
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('uses the stable release URL when it exists', async () => {
    globalThis.fetch = routerFetch({
      'reactnative-core-debug.tar.gz': {status: 200},
    });
    const result = await resolveRNCoreArtifact('0.85.0', 'debug', null);
    expect(result.version).toBe('0.85.0');
    expect(result.url).toContain('repo1.maven.org');
    expect(result.url).toContain('reactnative-core-debug.tar.gz');
  });

  it('falls back to the snapshot URL when the release is missing', async () => {
    globalThis.fetch = jest.fn(async (url, opts) => {
      // HEAD probe of the release URL → 404.
      if (opts && opts.method === 'HEAD') {
        return {status: 404};
      }
      // GET of maven-metadata.xml → snapshot coordinates.
      return {
        ok: true,
        status: 200,
        text: async () =>
          '<metadata><timestamp>20260101.000000</timestamp>' +
          '<buildNumber>1</buildNumber></metadata>',
      };
    });
    const result = await resolveRNCoreArtifact('0.85.0', 'debug', null);
    expect(result.url).toContain('maven-snapshots');
    expect(result.url).toContain('20260101.000000-1');
  });

  it('uses a local tarball override when the file exists', async () => {
    const tarball = path.join(tempDir, 'core.tar.gz');
    fs.writeFileSync(tarball, 'x');
    const result = await resolveRNCoreArtifact('0.85.0', 'debug', tarball);
    expect(result.url).toBe(tarball);
    expect(result.version).toBe('0.85.0-local');
  });

  it('throws when the local tarball override is missing', async () => {
    await expect(
      resolveRNCoreArtifact(
        '0.85.0',
        'debug',
        path.join(tempDir, 'nope.tar.gz'),
      ),
    ).rejects.toThrow(/does not exist/);
  });
});

describe('resolveRNDepsArtifact', () => {
  let origFetch;
  let origDepEnv;
  beforeEach(() => {
    origFetch = globalThis.fetch;
    origDepEnv = process.env.RN_DEP_VERSION;
    delete process.env.RN_DEP_VERSION;
  });
  afterEach(() => {
    globalThis.fetch = origFetch;
    if (origDepEnv !== undefined) {
      process.env.RN_DEP_VERSION = origDepEnv;
    } else {
      delete process.env.RN_DEP_VERSION;
    }
  });

  it('uses the RN version by default', async () => {
    globalThis.fetch = routerFetch({
      'reactnative-dependencies-debug.tar.gz': {status: 200},
    });
    const result = await resolveRNDepsArtifact('0.85.0', 'debug');
    expect(result.version).toBe('0.85.0');
    expect(result.url).toContain('react-native-artifacts/0.85.0/');
  });

  it('honors RN_DEP_VERSION override', async () => {
    process.env.RN_DEP_VERSION = '0.84.2';
    globalThis.fetch = routerFetch({
      'reactnative-dependencies-debug.tar.gz': {status: 200},
    });
    const result = await resolveRNDepsArtifact('0.85.0', 'debug');
    expect(result.version).toBe('0.84.2');
    expect(result.url).toContain('react-native-artifacts/0.84.2/');
  });

  it('uses a local deps tarball override when the file exists', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-deps-local-'));
    try {
      const tarball = path.join(dir, 'deps.tar.gz');
      fs.writeFileSync(tarball, 'x');
      const result = await resolveRNDepsArtifact('0.85.0', 'debug', tarball);
      expect(result.url).toBe(tarball);
      expect(result.version).toBe('0.85.0-local');
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('throws when the local deps tarball override is missing', async () => {
    await expect(
      resolveRNDepsArtifact(
        '0.85.0',
        'debug',
        path.join(os.tmpdir(), 'spm-deps-nope', 'nope.tar.gz'),
      ),
    ).rejects.toThrow(/does not exist/);
  });

  it('resolves RN_DEP_VERSION=nightly via the npm registry', async () => {
    process.env.RN_DEP_VERSION = 'nightly';
    globalThis.fetch = routerFetch({
      'react-native/nightly': {json: {version: '0.86.0-nightly-dep'}},
      'react-native-artifacts/0.86.0-nightly-dep/': {status: 200},
    });
    const result = await resolveRNDepsArtifact('0.85.0', 'debug');
    expect(result.version).toBe('0.86.0-nightly-dep');
  });

  it('falls back to the deps snapshot URL when the release is missing', async () => {
    globalThis.fetch = jest.fn(async (url, opts) => {
      if (opts && opts.method === 'HEAD') {
        return {status: 404};
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          '<metadata><timestamp>20260202.000000</timestamp>' +
          '<buildNumber>3</buildNumber></metadata>',
      };
    });
    const result = await resolveRNDepsArtifact('0.85.0', 'debug');
    expect(result.url).toContain('maven-snapshots');
    expect(result.url).toContain('reactnative-dependencies-debug.tar.gz');
  });
});

// ---------------------------------------------------------------------------
// resolveCacheSlotVersion — stable label passthrough vs. nightly resolution.
// ---------------------------------------------------------------------------

describe('resolveCacheSlotVersion', () => {
  let origFetch;
  beforeEach(() => {
    origFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  it('returns a stable version label unchanged (no npm lookup)', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new Error('should not be called');
    });
    expect(await resolveCacheSlotVersion('0.85.0')).toBe('0.85.0');
  });

  it('resolves the 1000.0.0 dev label to the current nightly slot', async () => {
    globalThis.fetch = routerFetch({
      'react-native/nightly': {json: {version: '0.86.0-nightly-zzz'}},
    });
    expect(await resolveCacheSlotVersion('1000.0.0')).toBe(
      '0.86.0-nightly-zzz',
    );
  });

  it('falls back to the raw label when the nightly lookup fails', async () => {
    globalThis.fetch = routerFetch({
      'react-native/nightly': {ok: false, status: 503},
    });
    expect(await resolveCacheSlotVersion('nightly')).toBe('nightly');
  });
});

// ---------------------------------------------------------------------------
// findFirst — bounded recursive search.
// ---------------------------------------------------------------------------

describe('findFirst', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-findfirst-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('finds a nested entry matching the predicate', () => {
    const nested = path.join(tempDir, 'a', 'b');
    fs.mkdirSync(nested, {recursive: true});
    fs.writeFileSync(path.join(nested, 'Target.xcframework'), '');
    const hit = findFirst(tempDir, n => n.endsWith('.xcframework'), 8);
    expect(hit).toBe(path.join(nested, 'Target.xcframework'));
  });

  it('returns null when depth is exhausted before the match', () => {
    const nested = path.join(tempDir, 'a', 'b', 'c');
    fs.mkdirSync(nested, {recursive: true});
    fs.writeFileSync(path.join(nested, 'Target.xcframework'), '');
    // depth 1 only inspects the immediate children of tempDir.
    expect(findFirst(tempDir, n => n.endsWith('.xcframework'), 1)).toBeNull();
  });

  it('returns null for a nonexistent directory', () => {
    expect(findFirst(path.join(tempDir, 'ghost'), () => true, 4)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// extractXCFramework — untar + locate the .xcframework dir.
// ---------------------------------------------------------------------------

describe('extractXCFramework', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-extract-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('extracts a tarball and returns the contained .xcframework path', () => {
    // Build a tarball whose payload contains a Foo.xcframework directory.
    const payload = path.join(tempDir, 'payload');
    const xcfw = path.join(payload, 'Foo.xcframework');
    fs.mkdirSync(xcfw, {recursive: true});
    fs.writeFileSync(path.join(xcfw, 'Info.plist'), '<plist/>');
    const tarPath = path.join(tempDir, 'foo.tar.gz');
    execSync(`tar -czf "${tarPath}" -C "${payload}" Foo.xcframework`);

    const extractDir = path.join(tempDir, 'out');
    const found = extractXCFramework(tarPath, extractDir);
    expect(found).toBe(path.join(extractDir, 'Foo.xcframework'));
    expect(fs.existsSync(path.join(found, 'Info.plist'))).toBe(true);
  });

  it('throws when the tarball contains no .xcframework', () => {
    const payload = path.join(tempDir, 'payload');
    fs.mkdirSync(payload, {recursive: true});
    fs.writeFileSync(path.join(payload, 'readme.txt'), 'hi');
    const tarPath = path.join(tempDir, 'plain.tar.gz');
    execSync(`tar -czf "${tarPath}" -C "${payload}" readme.txt`);

    expect(() =>
      extractXCFramework(tarPath, path.join(tempDir, 'out')),
    ).toThrow(/No .xcframework found/);
  });
});

// ---------------------------------------------------------------------------
// validateArtifactsCache — guards against stale / partial cache slots.
// ---------------------------------------------------------------------------

describe('validateArtifactsCache', () => {
  let tempDir;
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-validate-'));
  });
  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  // Writes artifacts.json plus the on-disk xcframework dir for each entry.
  function seedCache(entries /*: {[string]: boolean} */) {
    const json = {};
    for (const [name, onDisk] of Object.entries(entries)) {
      const xcfwPath = path.join(tempDir, `${name}.xcframework`);
      if (onDisk) {
        fs.mkdirSync(xcfwPath, {recursive: true});
      }
      json[name] = {xcframeworkPath: xcfwPath, url: 'https://example'};
    }
    fs.writeFileSync(
      path.join(tempDir, 'artifacts.json'),
      JSON.stringify(json),
      'utf8',
    );
  }

  // Stages the hermes public headers that validateArtifactsCache also requires.
  function seedHermesHeaders() {
    fs.mkdirSync(path.join(tempDir, 'hermes-headers', 'hermes'), {
      recursive: true,
    });
  }

  it('returns null when the cache is complete and on disk', () => {
    seedCache({
      React: true,
      ReactNativeHeaders: true,
      ReactNativeDependencies: true,
      ReactNativeDependenciesHeaders: true,
      'hermes-engine': true,
    });
    seedHermesHeaders();
    expect(validateArtifactsCache(tempDir)).toBeNull();
  });

  it('reports unstaged Hermes public headers', () => {
    seedCache({
      React: true,
      ReactNativeHeaders: true,
      ReactNativeDependencies: true,
      ReactNativeDependenciesHeaders: true,
      'hermes-engine': true,
    });
    // No hermes-headers/hermes dir.
    expect(validateArtifactsCache(tempDir)).toMatch(
      /Hermes public headers not staged/,
    );
  });

  it('reports a missing headers companion (pure-RN split)', () => {
    // ReactNativeDependenciesHeaders is the deps sidecar — without it no
    // <folly/...>-style include resolves (ReactNativeHeaders is pure-RN).
    seedCache({
      React: true,
      ReactNativeHeaders: true,
      ReactNativeDependencies: true,
      'hermes-engine': true,
    });
    seedHermesHeaders();
    expect(validateArtifactsCache(tempDir)).toMatch(
      /missing entry for "ReactNativeDependenciesHeaders"/,
    );
  });

  it('reports a missing artifacts.json', () => {
    expect(validateArtifactsCache(tempDir)).toMatch(/artifacts.json missing/);
  });

  it('reports unreadable JSON', () => {
    fs.writeFileSync(path.join(tempDir, 'artifacts.json'), '{not json', 'utf8');
    expect(validateArtifactsCache(tempDir)).toMatch(/unreadable/);
  });

  it('reports a missing required entry', () => {
    seedCache({
      React: true,
      ReactNativeHeaders: true,
      ReactNativeDependencies: true,
      ReactNativeDependenciesHeaders: true,
    });
    expect(validateArtifactsCache(tempDir)).toMatch(
      /missing entry for "hermes-engine"/,
    );
  });

  it('reports an entry whose xcframework dir is gone', () => {
    seedCache({
      React: true,
      ReactNativeHeaders: true,
      ReactNativeDependencies: true,
      ReactNativeDependenciesHeaders: true,
      'hermes-engine': false,
    });
    expect(validateArtifactsCache(tempDir)).toMatch(
      /xcframework for "hermes-engine" not found/,
    );
  });
});
