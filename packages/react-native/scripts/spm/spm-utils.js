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

const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Creates a logger trio {log, warn, die} that prefixes messages with [name].
 *   log  – green prefix, writes to stdout
 *   warn – yellow prefix, writes to stderr
 *   die  – red prefix, writes to stderr, sets exitCode=1, throws
 */
function makeLogger(name /*: string */) /*: {
  log: (msg: string) => void,
  warn: (msg: string) => void,
  die: (msg: string) => empty,
} */ {
  // Prefix every newline-separated line of the message so multi-line output
  // wraps cleanly when terminal log scrapers look for the `[name]` tag.
  function format(color /*: string */, msg /*: string */) /*: string */ {
    const prefix = `\x1b[${color}m[${name}]\x1b[0m`;
    return msg
      .split('\n')
      .map(line => `${prefix} ${line}`)
      .join('\n');
  }
  return {
    log(msg /*: string */) /*: void */ {
      console.log(format('32', msg));
    },
    warn(msg /*: string */) /*: void */ {
      console.warn(format('33', msg));
    },
    die(msg /*: string */) /*: empty */ {
      console.error(format('31', msg));
      process.exitCode = 1;
      throw new Error(msg);
    },
  };
}

/**
 * Returns a short, human-readable representation of an absolute path:
 *   - Paths under $HOME are shown as ~/...
 *   - Paths under cwd are shown as relative (if ≤2 levels up)
 *   - Otherwise the absolute path is returned unchanged
 */
function displayPath(p /*: string */) /*: string */ {
  const home = os.homedir();
  if (p === home) return '~';
  if (p.startsWith(home + path.sep)) {
    return '~' + p.slice(home.length);
  }
  const rel = path.relative(process.cwd(), p);
  if (rel && !rel.startsWith('../../..')) {
    return rel;
  }
  return p;
}

/**
 * Canonical React Native binary cache root. Mirrors CocoaPods'
 * `ReactNativePodsUtils.shared_cache_dir()` (~/Library/Caches/ReactNative, added
 * in #56847) so SPM and CocoaPods share one cache root — and so SPM stops using
 * a `com.facebook.ReactNative` (bundle-id) dir that other tools may also touch.
 * Honor `RCT_SKIP_CACHES=1` (same env var as CocoaPods) to bypass the shared
 * tarball cache.
 */
function sharedCacheDir() /*: string */ {
  return path.join(os.homedir(), 'Library', 'Caches', 'ReactNative');
}

/**
 * Returns the default versioned cache directory for SPM's EXTRACTED xcframeworks,
 * nested under the canonical cache root. Downloaded tarballs themselves go in the
 * flat shared cache (sharedCacheDir()) so they are reused across SPM/CocoaPods.
 *
 * @param {string} versionKey  Version string used as directory name.
 *                             Pass the raw --version arg (e.g. 'nightly') so the
 *                             cache slot is stable regardless of the resolved hash.
 * @param {string} flavor      'debug' or 'release'
 */
function defaultCacheDir(
  versionKey /*: string */,
  flavor /*: string */,
) /*: string */ {
  return path.join(sharedCacheDir(), 'spm-artifacts', versionKey, flavor);
}

/**
 * Sanitize a package/app name to a valid Swift identifier.
 * e.g. "@react-native/tester" -> "RNTester", "my-app" -> "MyApp"
 */
function toSwiftName(name /*: string */) /*: string */ {
  const base = name.replace(/^@[^/]+\//, '');
  return base
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/**
 * Derive a default app name from the raw package name and source path.
 * Prefers the source directory name when it's meaningful (e.g. "RNTester"),
 * falls back to the package name for generic dirs like "ios" or "src".
 */
function deriveAppName(
  rawName /*: string */,
  sourcePath /*: string */,
) /*: string */ {
  const genericSourceDirs = new Set(['ios', 'app', 'sources', 'src']);
  const cleanName = rawName.replace(/^@[^/]+\//, '');
  return toSwiftName(
    sourcePath !== toSwiftName(cleanName) &&
      !genericSourceDirs.has(sourcePath.toLowerCase())
      ? sourcePath
      : cleanName,
  );
}

// $FlowFixMe[unclear-type] JSON data has dynamic shape
function readPackageJson(dir /*: string */) /*: Object | null */ {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  // $FlowFixMe[incompatible-return] JSON.parse returns any
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

/**
 * Walk up from startDir until we find a directory containing package.json.
 * Returns startDir itself if it contains package.json, or startDir as fallback
 * if no package.json is found anywhere up the tree.
 */
function findProjectRoot(startDir /*: string */) /*: string */ {
  const start = path.resolve(startDir);
  let dir = start;
  // Bounded by filesystem depth — path.dirname converges to '/' or 'C:\\'.
  // The `dir = ...` updates would otherwise drop the start-fallback narrowing.
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  // At filesystem root — last check before falling back.
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }
  return start;
}

/**
 * Resolve the react-native package root from an app directory.
 * Checks appRoot/projectRoot and their ancestors for node_modules/react-native,
 * then falls back to __dirname-relative resolution (monorepo layout).
 *
 * Returns null if react-native cannot be found.
 */
function resolveReactNativeRoot(
  appRoot /*: string */,
  projectRoot /*: string */,
) /*: string | null */ {
  const candidates /*: Array<string> */ = [];
  const seen /*: Set<string> */ = new Set();

  function addAncestorCandidates(startDir /*: string */) /*: void */ {
    let dir = path.resolve(startDir);
    while (true) {
      const candidate = path.join(dir, 'node_modules', 'react-native');
      if (!seen.has(candidate)) {
        seen.add(candidate);
        candidates.push(candidate);
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }

  addAncestorCandidates(appRoot);
  addAncestorCandidates(projectRoot);
  candidates.push(path.resolve(__dirname, '../..'));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return path.resolve(candidate);
    }
  }
  return null;
}

// The per-app farm lives INSIDE the codegen package (build/generated/ios) so
// it can be vended as a normal SPM headers target ("ReactAppHeaders") — the
// farm reaches consumers via SPM product dependencies, not -I.
const PER_APP_HEADERS_REL = 'build/generated/ios/ReactAppHeaders';

// Marker at the top of a scaffolder-generated Package.swift. Lives here (not in
// scaffold-package-swift.js) so the autolinker can recognize scaffolded files
// without a circular import (scaffold-package-swift requires the autolinker).
const SCAFFOLDER_MARKER =
  '// AUTO-SCAFFOLDED by react-native spm scaffold — safe to edit & commit via patch-package.';

// Remote SPM package mode (prototype of the GitHub-distribution endgame):
// when active, app + libraries all depend on ONE remote package identity
// (`.package(url:exact:)`) instead of the local path-based artifacts package
// — SPM unifies the version across the graph and the local compose/symlink
// machinery is skipped. Activated via RN_SPM_REMOTE_URL +
// RN_SPM_REMOTE_VERSION (persisted per-app so Xcode-phase re-syncs without
// the env keep the mode).
const REMOTE_CONFIG_REL = 'build/generated/autolinking/spm-remote.json';
function remotePackageIdentity(url /*: string */) /*: string */ {
  const tail = url.replace(/\/+$/, '').split('/').pop() ?? '';
  return tail.replace(/\.git$/, '').toLowerCase();
}

/**
 * Thrown by remotePackageConfig when remote SPM mode is active (a URL is set)
 * but no usable RN version can be determined: react-native isn't installed, or
 * the installed version is a non-publishable dev placeholder (e.g. the monorepo
 * '1000.0.0', which has no remote tag) and no override was supplied. Carries a
 * developer-facing message; the CLI turns it into a hard build error (exit 2).
 */
class RemoteVersionError extends Error {
  constructor(message /*: string */) {
    super(message);
    this.name = 'RemoteVersionError';
  }
}

/**
 * Resolve the version of the installed react-native by walking up from appRoot
 * looking for node_modules/react-native/package.json. Mirrors the autolinker's
 * appRoot-first, up-to-5-ancestors walk-up. Returns null when not found or the
 * package.json has no string version.
 */
function resolveInstalledRnVersion(appRoot /*: string */) /*: ?string */ {
  let dir = path.resolve(appRoot);
  for (let i = 0; i <= 5; i++) {
    const pkgPath = path.join(
      dir,
      'node_modules',
      'react-native',
      'package.json',
    );
    if (fs.existsSync(pkgPath)) {
      try {
        const j = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (typeof j.version === 'string') {
          return j.version;
        }
      } catch {}
      return null;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

/**
 * True when a version string can be resolved to a published remote tag. False
 * for the monorepo dev placeholder ('1000.0.0') and 0.0.0-* dev builds, neither
 * of which is published — in remote mode these require an explicit override.
 */
function isPublishableVersion(v /*: ?string */) /*: boolean */ {
  if (v == null || v === '') {
    return false;
  }
  if (v === '1000.0.0') {
    return false;
  }
  if (/^0\.0\.0(-|$)/.test(v)) {
    return false;
  }
  return true;
}

/**
 * Resolve the remote SPM package config for `appRoot`, or null for local mode.
 *
 * Remote mode is gated by a URL alone (env RN_SPM_REMOTE_URL or persisted
 * `url`). The version is an OVERRIDE chain — env RN_SPM_REMOTE_VERSION →
 * persisted `versionOverride` → legacy persisted `version` (back-compat) — and
 * when no override is set it is DERIVED from the installed react-native. The
 * derived value is never persisted, so an npm RN upgrade auto-re-pins the SPM
 * graph on the next sync. A derived version that isn't publishable (or a
 * missing RN install) throws RemoteVersionError so the dev placeholder doesn't
 * silently pin an unpublished tag.
 */
function remotePackageConfig(
  appRoot /*: string */,
) /*: ?{url: string, version: string, identity: string} */ {
  const envUrl = process.env.RN_SPM_REMOTE_URL;
  const envVersion = process.env.RN_SPM_REMOTE_VERSION;
  const cfgPath = path.join(appRoot, REMOTE_CONFIG_REL);

  // Read any persisted config first. Legacy {url, version} (where `version`
  // was a hard pin) is read with `version` honored as an override.
  let persisted /*: {url?: string, versionOverride?: string, version?: string} */ =
    {};
  if (fs.existsSync(cfgPath)) {
    try {
      const j = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (j != null && typeof j === 'object') {
        persisted = j;
      }
    } catch {}
  }

  // URL alone activates remote mode (env wins over persisted).
  const url = envUrl != null && envUrl !== '' ? envUrl : persisted.url;
  if (url == null || url === '') {
    return null; // local mode
  }

  // Version override chain. When none is set, derive from the installed RN —
  // the SPM graph must compile against the same RN the JS/native code uses.
  const override =
    envVersion != null && envVersion !== ''
      ? envVersion
      : (persisted.versionOverride ?? persisted.version);
  const version = override ?? resolveInstalledRnVersion(appRoot);

  if (version == null) {
    throw new RemoteVersionError(
      `Remote SPM mode is on (URL=${url}) but no React Native version could ` +
        'be resolved (react-native was not found in node_modules). Set ' +
        'RN_SPM_REMOTE_VERSION to a published tag, or install react-native.',
    );
  }
  if (override == null && !isPublishableVersion(version)) {
    throw new RemoteVersionError(
      `Remote SPM mode is on (URL=${url}) but React Native resolves to ` +
        `non-publishable version '${version}'. Set RN_SPM_REMOTE_VERSION to a ` +
        'published tag, or install a released react-native.',
    );
  }

  // Persist {url, versionOverride?} only when env-driven (matching the prior
  // behavior of capturing env so Xcode-phase re-syncs keep the mode). A derived
  // version is never frozen: omit versionOverride so the next run re-derives.
  const envDriven =
    (envUrl != null && envUrl !== '') ||
    (envVersion != null && envVersion !== '');
  if (envDriven) {
    const toPersist /*: {url: string, versionOverride?: string} */ = {url};
    if (override != null) {
      toPersist.versionOverride = override;
    }
    fs.mkdirSync(path.dirname(cfgPath), {recursive: true});
    fs.writeFileSync(cfgPath, JSON.stringify(toPersist, null, 2) + '\n');
  }

  return {
    url,
    version,
    identity: remotePackageIdentity(url),
  };
}
function perAppHeadersDir(appRoot /*: string */) /*: string */ {
  return path.join(appRoot, PER_APP_HEADERS_REL);
}

/**
 * Creates a first-wins symlink linker rooted at `outDir`. `linkInto` maps a
 * virtual import path to a physical file; `foldDir` recursively links every
 * .h/.hpp under a source root. `seen` records virtual->realpath so identical
 * duplicates collapse to one inode and non-identical collisions are surfaced.
 * Each header tree gets its OWN linker (own `seen` map) so first-wins does not
 * span the shared/per-app boundary.
 */
function createHeaderLinker(
  outDir /*: string */,
  logger /*: {log: (msg: string) => void} */,
) /*: {
  seen: Map<string, string>,
  stats: {collisions: number},
  linkInto: (virtualPath: string, physical: string) => void,
  foldDir: (srcRoot: string) => void,
} */ {
  const seen /*: Map<string, string> */ = new Map();
  const stats = {collisions: 0};

  function linkInto(
    virtualPath /*: string */,
    physical /*: string */,
  ) /*: void */ {
    let real;
    try {
      real = fs.realpathSync(physical);
    } catch {
      return; // physical file missing — skip
    }
    const prev = seen.get(virtualPath);
    if (prev != null) {
      if (prev !== real) {
        stats.collisions++;
        logger.log(
          `WARNING: merged headers: non-identical collision for ${virtualPath} (kept first)`,
        );
      }
      return;
    }
    seen.set(virtualPath, real);
    const dest = path.join(outDir, virtualPath);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.symlinkSync(real, dest);
  }

  function foldDir(srcRoot /*: string */) /*: void */ {
    let real;
    try {
      real = fs.realpathSync(srcRoot);
    } catch {
      return;
    }
    if (!fs.statSync(real).isDirectory()) {
      return;
    }
    const dirs /*: Array<string> */ = [real];
    while (dirs.length > 0) {
      const dir = dirs.pop();
      if (dir == null) {
        break;
      }
      for (const ent of fs.readdirSync(dir, {withFileTypes: true})) {
        const name = String(ent.name);
        const child = path.join(dir, name);
        // statSync (not the Dirent flags) so symlinks are followed — the
        // autolinking header farm is itself a symlink farm, so its leaf
        // headers are symlinks, not regular files.
        let st;
        try {
          st = fs.statSync(child);
        } catch {
          continue; // broken symlink — skip
        }
        if (st.isDirectory()) {
          dirs.push(child);
        } else if (
          st.isFile() &&
          (name.endsWith('.h') || name.endsWith('.hpp'))
        ) {
          linkInto(path.relative(real, child), child);
        }
      }
    }
  }

  return {seen, stats, linkInto, foldDir};
}

/*::
type HeaderTreeResult = {path: ?string, virtualPaths: Set<string>};
*/

/**
 * Materializes the PER-APP header tree at
 * <appRoot>/build/xcframeworks/ReactAppHeaders: autolinking dep headers + codegen
 * output. Per-app because it depends on which libraries the app links and the
 * app's generated specs. Returns {path, virtualPaths}.
 */
function buildPerAppHeaderTree(
  appRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: HeaderTreeResult */ {
  const outDir = perAppHeadersDir(appRoot);
  // Build into a temp dir OUTSIDE every folded root, then swap into place. The
  // farm's final home (outDir) is INSIDE build/generated/ios — a tree foldDir
  // walks — so `outDir + '.tmp'` would ALSO sit there and foldDir would fold
  // the half-built farm back into itself (a spurious `ReactAppHeaders.tmp/`
  // namespace duplicating every codegen header). build/.react-app-headers.tmp
  // is under build/ but not under any folded subdir.
  const tmpDir = path.join(appRoot, 'build', '.react-app-headers.tmp');
  fs.rmSync(tmpDir, {recursive: true, force: true});
  fs.rmSync(outDir, {recursive: true, force: true});
  fs.mkdirSync(tmpDir, {recursive: true});

  const linker = createHeaderLinker(tmpDir, logger);
  linker.foldDir(
    path.join(appRoot, 'build', 'generated', 'autolinking', 'headers'),
  );
  linker.foldDir(path.join(appRoot, 'build', 'generated', 'ios'));
  linker.foldDir(
    path.join(appRoot, 'build', 'generated', 'ios', 'ReactCodegen'),
  );

  // Stub source so the farm is a valid SPM target (vended headers-only —
  // see the ReactAppHeaders target in the codegen Package.swift template).
  fs.writeFileSync(
    path.join(tmpDir, 'ReactAppHeadersStub.c'),
    '// ReactAppHeaders vends the per-app generated headers; this stub\n' +
      '// satisfies SPM, which requires at least one source file per target.\n' +
      'static int ReactAppHeadersStub __attribute__((unused)) = 0;\n',
  );
  fs.mkdirSync(path.dirname(outDir), {recursive: true});
  fs.renameSync(tmpDir, outDir);

  logger.log(
    `Built per-app header tree (${linker.seen.size} headers` +
      (linker.stats.collisions > 0
        ? `, ${linker.stats.collisions} non-identical collisions`
        : '') +
      ')',
  );
  return {path: outDir, virtualPaths: new Set(linker.seen.keys())};
}

/**
 * Runs React Native codegen and installs the SPM Package.swift template
 * into build/generated/ios/. Used by both setup-apple-spm.js and
 * sync-spm-autolinking.js.
 */

/**
 * Installs the SPM codegen template into build/generated/ios/Package.swift.
 * No-op when the template or the generated/ios dir is missing — codegen
 * may not have produced output yet, or the project may be SPM-only.
 *
 * The template is copied verbatim in local mode: it holds only fixed-relative
 * `.package(path:)` references (it lives at a known depth inside the app), and
 * headers come from the ReactHeaders/ReactNativeHeaders targets + the
 * ReactAppHeaders product — no loader, no absolute paths. In remote mode the
 * ReactNative path-dep is rewritten to the `.package(url:exact:)` identity.
 */
function installSpmCodegenTemplate(
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
) /*: void */ {
  const spmTemplate = path.join(
    reactNativeRoot,
    'scripts',
    'codegen',
    'templates',
    'Package.swift.spm-template',
  );
  const codegenPkgSwift = path.join(
    appRoot,
    'build',
    'generated',
    'ios',
    'Package.swift',
  );
  if (!fs.existsSync(path.dirname(codegenPkgSwift))) {
    // Codegen hasn't produced build/generated/ios yet — normal, nothing to do.
    return;
  }
  if (!fs.existsSync(spmTemplate)) {
    // Abnormal: the react-native package is missing its SPM codegen template.
    // Without it, codegen's default mis-rooted Package.swift stays in place
    // and every subsequent Resolve Package Graph fails — say so loudly.
    logger.log(
      `warning: SPM codegen template missing at ${spmTemplate} — ` +
        'build/generated/ios/Package.swift was NOT corrected and package ' +
        'resolution will likely fail. Is the react-native package complete?',
    );
    return;
  }
  let content = fs.readFileSync(spmTemplate, 'utf8');
  // Remote mode: the codegen package depends on the remote ReactNative
  // package identity instead of the local path-based artifacts package.
  const remote = remotePackageConfig(appRoot);
  if (remote != null) {
    content = content
      .replace(
        '.package(name: "ReactNative", path: "../../xcframeworks"),',
        `.package(url: "${remote.url}", exact: "${remote.version}"),`,
      )
      .split('package: "ReactNative")')
      .join(`package: "${remote.identity}")`);
  }
  fs.writeFileSync(codegenPkgSwift, content, 'utf8');
  logger.log(
    'Installed SPM codegen template' + (remote != null ? ' (remote mode)' : ''),
  );
}

function runCodegenAndInstallTemplate(
  projectRoot /*: string */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  logger /*: {log: (msg: string) => void} */ = {log() {}},
  opts /*: {installTemplate?: boolean} */ = {},
) /*: void */ {
  const codegenScript = path.join(
    reactNativeRoot,
    'scripts',
    'generate-codegen-artifacts.js',
  );
  if (!fs.existsSync(codegenScript)) {
    return;
  }
  logger.log('Running codegen...');
  const {execSync} = require('child_process');
  const codegenArgs =
    `node "${codegenScript}" -p "${projectRoot}" -t ios` +
    (projectRoot !== appRoot ? ` -o "${appRoot}"` : '');
  execSync(codegenArgs, {stdio: 'inherit', cwd: projectRoot});
  // Callers that re-point the xcframework symlinks after codegen (e.g. the SPM
  // sync, which runs generate-spm-package afterwards) install the template
  // themselves once the symlinks are final; they pass installTemplate: false to
  // avoid a wasted write that the later install would immediately supersede.
  if (opts.installTemplate !== false) {
    installSpmCodegenTemplate(appRoot, reactNativeRoot, logger);
  }
}

module.exports = {
  makeLogger,
  displayPath,
  sharedCacheDir,
  defaultCacheDir,
  toSwiftName,
  deriveAppName,
  readPackageJson,
  findProjectRoot,
  resolveReactNativeRoot,
  buildPerAppHeaderTree,
  remotePackageConfig,
  resolveInstalledRnVersion,
  isPublishableVersion,
  RemoteVersionError,
  installSpmCodegenTemplate,
  runCodegenAndInstallTemplate,
  SCAFFOLDER_MARKER,
};
