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

/*:: import type {CliConfigJson, SetupArgs} from './spm/spm-types'; */

/**
 * setup-apple-spm.js – Entry point for setting up Swift Package Manager support
 * in a React Native app using prebuilt XCFrameworks.
 *
 * Usage (from your app directory):
 *   node node_modules/react-native/scripts/setup-apple-spm.js [action] [options]
 *   (or `npx react-native spm [action]`)
 *
 * Actions:
 *   add                        Inject SPM packages (package refs, build
 *                              settings, the Sync build phase) into your
 *                              existing .xcodeproj, in place. Idempotent.
 *                              Default on first run. `--deintegrate` first
 *                              runs `pod deintegrate` + strips React Native
 *                              from the Podfile (CocoaPods → SPM migration).
 *   update                     Re-run the pipeline and refresh the existing
 *                              injection. Default once a project is injected.
 *   deinit                     The exact inverse of `add`: surgically remove
 *                              only what `add` injected (recorded in
 *                              .spm-injected.json) and drop the marker.
 *   scaffold                   Generate Package.swift for community deps that
 *                              lack SPM support.
 *   sync / codegen / download  Advanced/internal: `sync` is invoked by the
 *                              generated Xcode build phase; `codegen` and
 *                              `download` run a single pipeline step.
 *
 * Zero-arg `npx react-native spm` auto-detects: a freshly-scaffolded CocoaPods
 * project (clean tree, stock Podfile) → `add --deintegrate`; an injected
 * project → `update`; otherwise → `add` (fails loud on a CocoaPods project,
 * directing you to `--deintegrate`).
 *
 * Options:
 *   --version <ver>             React Native version (default: the resolved
 *                               node_modules/react-native version).
 *   --yes                       Skip the dirty-pbxproj confirmation prompt.
 *   [add] --xcodeproj <path>    Which .xcodeproj to inject into (when several).
 *   [add] --product-name <name> Which app target to inject into (when several).
 *   [add] --deintegrate         Run `pod deintegrate` + strip RN from the
 *                               Podfile before injecting.
 *   [advanced] --artifacts <path>          Local two-flavor artifact root;
 *                               must contain debug/ and release/ cache slots.
 *   [advanced] --download <auto|skip|force> Artifact policy (default: auto).
 *   [advanced] --skip-codegen   Skip the react-native codegen step.
 *
 * Steps performed (add/update):
 *   1. react-native codegen → build/generated/ios/ + install SPM codegen template
 *   2. generate-spm-autolinking-config.js → build/generated/autolinking/autolinking.json
 *   3. generate-spm-autolinking.js → build/generated/autolinking/Package.swift
 *   4. download-spm-artifacts.js → cache dir (per --download policy)
 *   5. generate-spm-package.js → build/xcframeworks/Package.swift + symlinks
 *   6. inject SPM packages into the existing .xcodeproj (in place)
 *
 * The injection is committed with your project; its XCLocalSwiftPackageReference
 * entries point at stable sub-package paths under build/ (xcframeworks,
 * generated/autolinking, generated/ios), so adding/removing community deps
 * changes those sub-packages (gitignored) and never re-injects. No app-level
 * Package.swift is generated or required.
 */

const {
  main: downloadArtifacts,
  resolveCacheSlotVersion,
  validateArtifactsCache,
} = require('./spm/download-spm-artifacts');
const {finalizeArtifactPublication} = require('./spm/flavored-frameworks');
const {
  MissingManifestError,
  main: generateAutolinking,
} = require('./spm/generate-spm-autolinking');
const {
  generateAutolinkingConfig,
} = require('./spm/generate-spm-autolinking-config');
const {main: generatePackage} = require('./spm/generate-spm-package');
const {findSourcePath} = require('./spm/generate-spm-package');
const {
  cleanupDanglingJavaScriptCoreRef,
  cleanupLeftoverPodsGroup,
  findInjectedXcodeproj,
  injectSpmIntoExistingXcodeproj,
  removeSpmInjection,
} = require('./spm/generate-spm-xcodeproj');
const {scaffoldAll} = require('./spm/scaffold-package-swift');
const {
  RemoteVersionError,
  buildPerAppHeaderTree,
  defaultCacheDir,
  deriveAppName,
  displayPath,
  findProjectRoot,
  installSpmCodegenTemplate,
  makeLogger,
  readPackageJson,
  remotePackageConfig,
  runCodegenAndInstallTemplate,
} = require('./spm/spm-utils');
const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const yargs = require('yargs');

const {log, warn: logError} = makeLogger('setup-apple-spm');

const VALID_ACTIONS = new Set([
  'add',
  'update',
  'deinit',
  'sync',
  'codegen',
  'download',
  'scaffold',
]);

/*::
type AutolinkingConfigResult = {
  config: CliConfigJson,
  outputPath: string,
  rawJson: string,
};
*/

function parseArgs(argv /*: Array<string> */) /*: SetupArgs */ {
  const parsed = yargs(argv)
    .version(false)
    .command('$0 [action]', 'Set up Apple SPM support')
    .positional('action', {
      type: 'string',
      choices: Array.from(VALID_ACTIONS),
      describe:
        'Action to run: add, update, deinit, or scaffold. ' +
        'Defaults to add (or update if SPM is already set up).',
    })
    .option('version', {
      type: 'string',
      describe:
        'React Native version (e.g. 0.80.0). Defaults to the version in node_modules/react-native/package.json',
    })
    .option('yes', {
      type: 'boolean',
      default: false,
      describe: 'Skip the dirty-pbxproj confirmation prompt',
    })
    .option('xcodeproj', {
      type: 'string',
      describe:
        '[add] Path to the .xcodeproj to inject SPM packages into (disambiguates when several exist).',
    })
    .option('product-name', {
      type: 'string',
      describe:
        '[add] App target to inject into (disambiguates when several exist).',
    })
    .option('deintegrate', {
      type: 'boolean',
      default: false,
      describe:
        '[add] Run `pod deintegrate` + strip React Native from the Podfile before injecting (CocoaPods → SPM migration).',
    })
    .option('artifacts', {
      type: 'string',
      describe:
        '[advanced] Local artifact root containing complete debug/ and release/ cache slots.',
    })
    .option('download', {
      type: 'string',
      choices: ['auto', 'skip', 'force'],
      default: 'auto',
      describe:
        '[advanced] Artifact download policy: auto (fetch if missing), skip (never fetch), force (clear cache + refetch).',
    })
    .option('skip-codegen', {
      type: 'boolean',
      default: false,
      describe: '[advanced] Skip the react-native codegen step',
    })
    .usage(
      'Usage: $0 [action] [options]\n\nSets up Swift Package Manager support in a React Native app.',
    )
    .strictOptions()
    .help()
    .parseSync();

  const positional = parsed._.map(String);
  const requestedAction = parsed.action ?? positional[0] ?? null;
  if (positional.length > 1) {
    throw new Error(
      `Expected at most one action, got: ${positional.join(', ')}`,
    );
  }
  if (requestedAction != null && !VALID_ACTIONS.has(requestedAction)) {
    throw new Error(
      `Unknown action "${requestedAction}". Expected one of: ${Array.from(
        VALID_ACTIONS,
      ).join(', ')}`,
    );
  }

  return {
    action: requestedAction,
    version: parsed.version ?? null,
    artifacts: parsed.artifacts ?? null,
    skipCodegen: parsed['skip-codegen'],
    downloadPolicy: parsed.download,
    productName: parsed['product-name'] ?? null,
    xcodeprojPath: parsed.xcodeproj ?? null,
    deintegrate: parsed.deintegrate,
    yes: parsed.yes,
  };
}

const SPM_GITIGNORE_ENTRIES = [
  'Package.resolved',
  'build/generated/',
  'build/xcframeworks/',
  '.build/',
];

/**
 * Ensure the project's .gitignore contains entries for SPM-generated
 * directories. Called during init so that generated artifacts are not
 * accidentally committed.
 */
function ensureGitignoreSpmEntries(appRoot /*: string */) {
  const gitignorePath = path.join(appRoot, '.gitignore');
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }

  const existingEntries = new Set(content.split('\n').map(l => l.trim()));
  const missing = SPM_GITIGNORE_ENTRIES.filter(e => !existingEntries.has(e));

  if (missing.length === 0) {
    return;
  }

  const block = [
    '',
    '# SPM – auto-generated at build time (do not commit)',
    ...missing,
  ].join('\n');

  // Append, ensuring we start on a fresh line
  const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  fs.writeFileSync(gitignorePath, content + separator + block + '\n', 'utf8');
  log(`Updated .gitignore with SPM entries: ${missing.join(', ')}`);
}

/**
 * Single TTY-gated Y/N prompt helper used by every interactive confirmation
 * in this file. Non-TTY (CI / piped stdin) auto-confirms — every callsite
 * either opted into the action explicitly or is downstream of an opt-in.
 */
function promptYesNo(
  question /*: string */,
  defaultYes /*: boolean */,
) /*: Promise<boolean> */ {
  // $FlowFixMe[prop-missing] process.stdin.isTTY not in Flow stubs
  if (process.stdin.isTTY !== true) {
    return Promise.resolve(true);
  }
  const suffix = defaultYes ? '[Y/n]' : '[y/N]';
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${question} ${suffix} `, answer => {
      rl.close();
      const a = answer.trim().toLowerCase();
      const yes = a === 'y' || a === 'yes';
      resolve(defaultYes ? a === '' || yes : yes);
    });
  });
}

function resolveAction(
  requestedAction /*: SetupArgs['action'] */,
  appRoot /*: string */,
) /*: 'add' | 'update' | 'deinit' | 'sync' | 'codegen' | 'download' | 'scaffold' */ {
  if (requestedAction != null) {
    return requestedAction;
  }
  // Zero-arg default. Once SPM has been injected, default to `update` (regen +
  // refresh). Otherwise it's a first run → `add`. Whether `add` should imply
  // `--deintegrate` (fresh CocoaPods project) is decided by the safe-gate in
  // main(), which only applies on this implicit path.
  return findInjectedXcodeproj(appRoot) != null ? 'update' : 'add';
}

/**
 * Detects the JS-root-vs-ios-dir mismatch that produces silently-broken
 * builds for standard RN apps. The community CLI writes
 * `autolinking.json` under `<project.ios.sourceDir>/build/generated/autolinking/`
 * (i.e. `<projectRoot>/ios/...`), while every SPM script anchors its
 * inputs/outputs on `process.cwd()`. Running from the JS root therefore
 * (a) writes outputs at `<projectRoot>/build/...` — away from the iOS
 * project, and (b) makes the autolinker miss `autolinking.json` and
 * silently skip every npm native dep. The build "succeeds" but anything
 * touching a native module crashes at runtime.
 *
 * Returns the absolute path to the redirected app root (`<projectRoot>/ios`)
 * when the redirect heuristic applies, else null. Pure: no side effects.
 * The caller decides whether to auto-redirect (non-destructive actions) or
 * refuse (destructive actions like `clean`).
 */
function detectStandardRnLayoutRedirect(
  appRoot /*: string */,
  projectRoot /*: string */,
) /*: string | null */ {
  // Only relevant when cwd === projectRoot (i.e. user is at the JS root
  // of their RN app). If they've already cd'd into a subdir, projectRoot
  // walks up to find package.json and the two paths differ — leave alone.
  if (path.resolve(appRoot) !== path.resolve(projectRoot)) {
    return null;
  }
  // Standard RN layout has an `ios/` subdir holding the native project.
  // Without it (e.g. rn-tester's flat layout), no mismatch to flag.
  const iosSubdir = path.join(projectRoot, 'ios');
  try {
    if (!fs.statSync(iosSubdir).isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }
  return iosSubdir;
}

function resolveReactNativeRoot(
  autolinkingConfigResult /*: ?AutolinkingConfigResult */,
  projectRoot /*: string */,
) /*: string */ {
  // Prefer the React Native path resolved by the CLI config we already run for
  // autolinking. Fall back to this script's package root for direct repo usage.
  let reactNativeRoot = path.resolve(__dirname, '..');
  const cliConfig = autolinkingConfigResult?.config;
  const cliReactNativePath = cliConfig?.reactNativePath;
  const cliConfigRoot = cliConfig?.root;
  if (typeof cliReactNativePath === 'string' && cliReactNativePath.length > 0) {
    reactNativeRoot = path.resolve(
      typeof cliConfigRoot === 'string' && cliConfigRoot.length > 0
        ? cliConfigRoot
        : projectRoot,
      cliReactNativePath,
    );
  }
  return reactNativeRoot;
}

function determineVersion(
  args /*: SetupArgs */,
  reactNativeRoot /*: string */,
) /*: string */ {
  let version = args.version;
  if (version == null) {
    // $FlowFixMe[incompatible-type] JSON.parse returns any
    const pkgJson /*: {version: string} */ = JSON.parse(
      fs.readFileSync(path.join(reactNativeRoot, 'package.json'), 'utf8'),
    );
    version = pkgJson.version;
  }
  return version;
}

function runCodegenStep(
  projectRoot /*: string */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  skipCodegen /*: boolean */,
) /*: void */ {
  if (skipCodegen) {
    // Output dir may already exist from a previous run; still refresh the
    // SPM template so cache-slot changes propagate.
    log('Skipping codegen (--skip-codegen)');
    installSpmCodegenTemplate(appRoot, reactNativeRoot, {log});
    return;
  }
  log('Running react-native codegen...');
  try {
    runCodegenAndInstallTemplate(projectRoot, appRoot, reactNativeRoot, {log});
  } catch {
    logError('Codegen failed. Continuing anyway...');
  }
}

/**
 * Walks autolinking.json and writes a Package.swift into each community RN
 * package that ships a podspec but no SPM manifest. Reuses the dep's
 * podspec (via `pod ipc spec` when available) so the scaffolded file
 * captures the dep's actual sources, header search paths, frameworks, and
 * dependencies. Files carrying the scaffolder's own marker are regenerated
 * when the cache slot changes (manifest-hash bump); files without the
 * marker are left alone (upstream-shipped or user-managed).
 *
 * Runs as part of `init` / `update` / `scaffold` actions. Each invocation
 * is a no-op for deps already in a clean state.
 */
// Scaffolding is an EXPLICIT, manual step (`npx react-native spm scaffold`) and
// is NEVER run automatically by init/update/sync. A missing Package.swift is a
// real gap that must surface as a hard build error (see reportMissingManifests)
// so the user fixes it deliberately: scaffold, then persist with patch-package
// (node_modules is not committed), and ideally get it fixed upstream. There is
// intentionally no prompt and no auto-restore — auto-scaffolding would hide the
// error, and a wiped scaffold SHOULD re-surface it.
async function runScaffold(
  args /*: SetupArgs */,
  appRoot /*: string */,
  projectRoot /*: string */,
  reactNativeRoot /*: string */,
) /*: Promise<void> */ {
  // Resolve the cache slot identifier so the scaffolded files carry it as
  // a comment — that's how SPM's manifest hash bumps on slot transitions.
  let cacheSlotLabel /*: ?string */ = null;
  try {
    const rawVersion = args.version ?? determineVersion(args, reactNativeRoot);
    const slotVersion = await resolveCacheSlotVersion(rawVersion);
    cacheSlotLabel = `${slotVersion}/dual-flavor`;
  } catch {
    // Without a slot label the scaffolder still works; the file just
    // doesn't get the slot-bump comment.
  }

  let results;
  try {
    results = scaffoldAll({
      appRoot,
      projectRoot,
      reactNativeRoot,
      cacheSlotLabel,
      // Always force a re-render so re-running after editing a podspec picks
      // up the new content.
      force: true,
    });
  } catch (e) {
    logError(`scaffold failed: ${e.message}.`);
    process.exitCode = 1;
    return;
  }

  const written = results.filter(r => r.status === 'written');
  const errored = results.filter(r => r.status === 'error');
  const warned = results.filter(
    r => r.status === 'written' && r.warnings && r.warnings.length > 0,
  );

  if (written.length > 0) {
    log(`Scaffolded Package.swift for ${written.length} dep(s):`);
    for (const r of written) {
      log(`  • ${r.depName}`);
    }
    log('');
    log(
      'node_modules is NOT committed and is wiped by `npm install`. To keep\n' +
        'these manifests, create and commit a patch with a tool like patch-package:\n' +
        '  • `npx patch-package <dep>` for each scaffolded dep, then commit the patch.\n' +
        'Also consider asking the maintainer to ship a Package.swift upstream.\n' +
        'Without a committed patch the build will hard-error again after a fresh install.',
    );
    log('');
  }

  for (const r of warned) {
    if (r.status !== 'written') continue;
    for (const w of r.warnings) {
      log(`  ! ${r.depName}: ${w}`);
    }
  }

  for (const r of errored) {
    if (r.status !== 'error') continue;
    logError(`  ! ${r.depName}: ${r.reason}`);
  }
}

async function ensureArtifactFlavor(
  args /*: SetupArgs */,
  rawVersion /*: string */,
  slotVersion /*: string */,
  flavor /*: 'debug' | 'release' */,
) /*: Promise<string> */ {
  if (args.artifacts != null && args.artifacts.endsWith('.xcframework')) {
    throw new Error(
      '--artifacts must be a directory containing debug/ and release/ slots; ' +
        'a single XCFramework cannot satisfy automatic switching',
    );
  }
  const resolvedArtifactsDir =
    args.artifacts != null
      ? path.resolve(args.artifacts, flavor)
      : defaultCacheDir(slotVersion, flavor);

  if (args.downloadPolicy === 'force' && resolvedArtifactsDir != null) {
    log('Clearing cached artifacts (--download force)...');
    fs.rmSync(resolvedArtifactsDir, {recursive: true, force: true});
  }

  if (args.downloadPolicy === 'skip') {
    const error = validateArtifactsCache(resolvedArtifactsDir);
    if (error != null) {
      throw new Error(
        `--download skip requires a complete ${flavor} slot: ${error}`,
      );
    }
    log(`Using ${flavor} artifacts (--download skip)`);
    return resolvedArtifactsDir;
  }

  // Validate the cache before trusting it. A bare existsSync(artifacts.json)
  // check would accept a partial write from a prior failed download (e.g.
  // hermes-engine 404 on a not-yet-published nightly) and silently propagate
  // the gap into the xcodeproj, surfacing only as "Missing package product"
  // in Xcode. validateArtifactsCache reads the JSON and confirms every
  // REQUIRED_ARTIFACT has a present xcframework on disk.
  const cacheError = validateArtifactsCache(resolvedArtifactsDir);
  if (cacheError == null) {
    log(
      `${flavor} artifacts already present in ${displayPath(resolvedArtifactsDir)}`,
    );
    return resolvedArtifactsDir;
  }
  log(`Cache incomplete (${cacheError}); re-downloading...`);
  log(`Downloading ${flavor} xcframework artifacts (slot: ${slotVersion})...`);
  await downloadArtifacts([
    '--version',
    rawVersion,
    '--flavor',
    flavor,
    '--output',
    resolvedArtifactsDir,
  ]);
  const downloadedError = validateArtifactsCache(resolvedArtifactsDir);
  if (downloadedError != null) {
    throw new Error(
      `downloaded ${flavor} slot is incomplete: ${downloadedError}`,
    );
  }
  return resolvedArtifactsDir;
}

async function ensureBothArtifactFlavors(
  args /*: SetupArgs */,
  version /*: string */,
) /*: Promise<{debug: string, release: string}> */ {
  // Resolve aliases/nightly labels exactly once so both flavors are guaranteed
  // to come from the same selected artifact version.
  const rawVersion = args.version ?? version;
  const slotVersion = await resolveCacheSlotVersion(rawVersion);
  const debug = await ensureArtifactFlavor(
    args,
    rawVersion,
    slotVersion,
    'debug',
  );
  const release = await ensureArtifactFlavor(
    args,
    rawVersion,
    slotVersion,
    'release',
  );
  return {debug, release};
}

function generateXcframeworksPackage(
  args /*: SetupArgs */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  version /*: string */,
  artifactDirs /*: {debug: string, release: string} */,
) {
  log('Generating xcframeworks sub-package...');
  const packageArgs = [
    '--app-root',
    appRoot,
    '--react-native-root',
    reactNativeRoot,
    '--version',
    version,
  ];
  packageArgs.push('--debug-artifacts-dir', artifactDirs.debug);
  packageArgs.push('--release-artifacts-dir', artifactDirs.release);
  generatePackage(packageArgs);
}

// True when the chosen pbxproj is still CocoaPods-integrated (its build configs
// layer a `Pods-*.xcconfig`) — the real blocker for SPM injection.
function pbxprojUsesCocoaPods(xcodeprojPath /*: string */) /*: boolean */ {
  try {
    const t = fs.readFileSync(
      path.join(xcodeprojPath, 'project.pbxproj'),
      'utf8',
    );
    return /\bPods[-/][^\n]*\.xcconfig\b/.test(t);
  } catch {
    return false;
  }
}

// True when the Podfile still declares React Native integration — a latent
// landmine even after `pod deintegrate` (a future `pod install` re-breaks the
// SPM graph). Warned about (not refused) once the pbxproj itself is clean.
function podfileHasRnIntegration(appRoot /*: string */) /*: boolean */ {
  const podfilePath = path.join(appRoot, 'Podfile');
  if (!fs.existsSync(podfilePath)) {
    return false;
  }
  return /use_react_native!|use_native_modules!|prepare_react_native_project!/.test(
    fs.readFileSync(podfilePath, 'utf8'),
  );
}

// True when the Podfile declares any explicit `pod '...'` (third-party pods).
function podfileHasThirdPartyPods(appRoot /*: string */) /*: boolean */ {
  const podfilePath = path.join(appRoot, 'Podfile');
  if (!fs.existsSync(podfilePath)) {
    return false;
  }
  return /^\s*pod\s+['"]/m.test(fs.readFileSync(podfilePath, 'utf8'));
}

// The zero-arg "fresh project" safe-gate: auto-`add --deintegrate` ONLY when it
// is provably safe — a first-run CocoaPods RN project with a stock Podfile (no
// third-party pods) whose pbxproj AND Podfile are git-tracked and clean, so the
// conversion is fully revertible. We check only the two files `deintegrate`
// mutates (not the whole tree) — a fresh app typically has a dirty
// node_modules/lockfile/patches after `npm install` + `spm scaffold`, none of
// which affect the revertibility of the CocoaPods → SwiftPM conversion.
// Otherwise false → strict `add` (which fails loud on a CocoaPods project).
function shouldAutoDeintegrate(
  appRoot /*: string */,
  xcodeprojPath /*: string | null */,
) /*: boolean */ {
  if (xcodeprojPath == null || !pbxprojUsesCocoaPods(xcodeprojPath)) {
    return false;
  }
  if (podfileHasThirdPartyPods(appRoot)) {
    return false;
  }
  const pbxprojPath = path.join(xcodeprojPath, 'project.pbxproj');
  if (gitTrackedAndClean(appRoot, pbxprojPath) !== true) {
    return false;
  }
  const podfilePath = path.join(appRoot, 'Podfile');
  if (
    fs.existsSync(podfilePath) &&
    gitTrackedAndClean(appRoot, podfilePath) !== true
  ) {
    return false;
  }
  return true;
}

// Run `pod deintegrate` then strip React Native from the Podfile (leaving any
// non-RN pods). Requires CocoaPods on PATH (fail-loud otherwise). Flag-gated ⇒
// no prompt ⇒ CI-safe. Does NOT touch the .xcworkspace.
function runDeintegrate(appRoot /*: string */) /*: void */ {
  try {
    execFileSync('pod', ['--version'], {stdio: 'ignore'});
  } catch {
    logError(
      '`--deintegrate` needs CocoaPods (`pod`) on PATH. Remove the React ' +
        'Native integration from your project manually, then run `spm add`.',
    );
    process.exitCode = 1;
    throw new Error('pod not found');
  }
  log('Running `pod deintegrate`...');
  execFileSync('pod', ['deintegrate'], {cwd: appRoot, stdio: 'inherit'});

  const podfilePath = path.join(appRoot, 'Podfile');
  if (fs.existsSync(podfilePath)) {
    const orig = fs.readFileSync(podfilePath, 'utf8');
    const stripped = orig
      .split('\n')
      .filter(
        l =>
          !/use_react_native!|use_native_modules!|prepare_react_native_project!/.test(
            l,
          ),
      )
      .join('\n');
    if (stripped !== orig) {
      fs.writeFileSync(podfilePath, stripped, 'utf8');
      log('Stripped React Native integration from Podfile.');
    }
  }
}

// Pick the .xcodeproj to inject into: --xcodeproj override > a prior in-place
// target (re-run) > the single .xcodeproj in appRoot. Returns an error string
// (ambiguous / none) so the caller fails loud.
function resolveInjectionTarget(
  args /*: SetupArgs */,
  appRoot /*: string */,
) /*: {path: string, error?: void} | {error: string, path?: void} */ {
  if (args.xcodeprojPath != null) {
    const p = path.resolve(appRoot, args.xcodeprojPath);
    return fs.existsSync(p)
      ? {path: p}
      : {error: `--xcodeproj not found: ${p}`};
  }
  const injected = findInjectedXcodeproj(appRoot);
  if (injected != null) {
    return {path: injected};
  }
  const names /*: Array<string> */ = [];
  let entries /*: Array<{name: string, isDirectory(): boolean}> */ = [];
  try {
    // $FlowFixMe[incompatible-type] Dirent typing
    entries = fs.readdirSync(appRoot, {withFileTypes: true});
  } catch {}
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // $FlowFixMe[incompatible-type] Dirent.name is string|Buffer in Flow stubs
    const name /*: string */ = entry.name;
    if (name.endsWith('.xcodeproj')) {
      names.push(name);
    }
  }
  if (names.length === 0) {
    return {
      error:
        'no .xcodeproj found. Create an app first (e.g. `npx ' +
        '@react-native-community/cli init`) or make one in Xcode, then `spm add`.',
    };
  }
  if (names.length > 1) {
    return {
      error: `multiple .xcodeproj found (${names.join(', ')}); pass --xcodeproj to pick one.`,
    };
  }
  return {path: path.join(appRoot, names[0])};
}

/**
 * Inject SPM packages into the user's existing .xcodeproj, in place — the only
 * xcodeproj strategy (`add` and `update` both run this; there is no
 * from-scratch generation). Fails loud rather than silently retargeting. With
 * `--deintegrate`, removes CocoaPods first.
 */
async function setupXcodeproj(
  args /*: SetupArgs */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  action /*: string */,
) /*: Promise<void> */ {
  const target = resolveInjectionTarget(args, appRoot);
  if (target.error != null) {
    logError(`Cannot set up SPM: ${target.error}`);
    process.exitCode = 1;
    throw new Error(target.error);
  }
  const xcodeprojPath = target.path;
  const pbxprojPath = path.join(xcodeprojPath, 'project.pbxproj');

  // Snapshot the pbxproj's git state BEFORE deintegrate — `pod deintegrate`
  // rewrites it (removing the Pods xcconfig layering), so checking afterward
  // would always look dirty and trigger a spurious confirmation prompt.
  const cleanBeforeEdits = gitTrackedAndClean(appRoot, pbxprojPath);

  if (args.deintegrate) {
    runDeintegrate(appRoot);
    // `pod deintegrate` strips the build integration but can leave an empty
    // `Pods` group in the navigator — remove it so the converted project is
    // visually clean.
    if (cleanupLeftoverPodsGroup(xcodeprojPath)) {
      log('Removed the leftover empty `Pods` group from the project.');
    }
  }

  // Preflight: a still-CocoaPods-integrated pbxproj is the real build-breaker.
  if (pbxprojUsesCocoaPods(xcodeprojPath)) {
    logError(
      `${path.basename(xcodeprojPath)} is CocoaPods-integrated. Re-run ` +
        '`spm add --deintegrate` to convert it (runs `pod deintegrate` + ' +
        'strips React Native from the Podfile), or run `pod deintegrate` ' +
        'yourself first. Side-by-side non-RN pods are fine.',
    );
    process.exitCode = 1;
    throw new Error('CocoaPods-integrated project');
  }
  if (podfileHasRnIntegration(appRoot)) {
    log(
      '\x1b[33mNote: your Podfile still declares React Native integration. ' +
        'Remove it and avoid `pod install`, or it will re-break the SPM ' +
        'package graph.\x1b[0m',
    );
  }

  // No backup is made — git is the safety net. Refuse on a dirty/untracked
  // pbxproj (as it was BEFORE any deintegrate edits) unless --yes, so a bad
  // inject is always `git checkout`-able.
  const clean = cleanBeforeEdits;
  if (clean === false && !args.yes) {
    const proceed = await promptYesNo(
      `${path.basename(xcodeprojPath)} has uncommitted changes and no ` +
        `backup is made (git is the only undo). Inject SPM packages anyway?`,
      false,
    );
    if (!proceed) {
      log('Aborted. Commit or stash the project, then re-run `spm add`.');
      process.exitCode = 1;
      throw new Error('In-place injection declined (dirty working tree)');
    }
  } else if (clean === null) {
    log(
      `\x1b[33mNote: ${path.basename(xcodeprojPath)} is not in a git ` +
        `repo — no backup is made before in-place injection.\x1b[0m`,
    );
  }

  const result = injectSpmIntoExistingXcodeproj({
    appRoot,
    reactNativeRoot,
    xcodeprojPath,
    appName: args.productName,
    // Only an EXPLICIT `--version` pins the artifacts-cache slot in the
    // marker; omitting it (null) leaves any previously-recorded pin alone
    // (injectSpmIntoExistingXcodeproj preserves it — see
    // generate-spm-xcodeproj.js).
    artifactsVersionOverride: args.version ?? null,
  });
  if (result.status !== 'injected') {
    logError(`SPM injection failed: ${result.reason}`);
    process.exitCode = 1;
    throw new Error(result.reason);
  }

  // The community template has carried a dangling `JavaScriptCore.framework`
  // reference since RN 0.60 (navigator-only, unlinked, meaningless under
  // Hermes) — one-time migration hygiene at conversion time, like the empty
  // Pods group above. `add` only; `update` stays a minimal re-sync.
  if (action === 'add' && cleanupDanglingJavaScriptCoreRef(xcodeprojPath)) {
    log(
      "Removed the template's dangling JavaScriptCore.framework reference " +
        '(unused; React Native uses Hermes).',
    );
  }
}

// True when `git status --porcelain` reports the path dirty/untracked. Returns
// null when git is unavailable or the path is outside a repo (no safety net).
function gitTrackedAndClean(
  appRoot /*: string */,
  targetPath /*: string */,
) /*: boolean | null */ {
  try {
    const out = execFileSync(
      'git',
      ['status', '--porcelain', '--', targetPath],
      {cwd: appRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']},
    );
    return out.trim() === '';
  } catch {
    return null; // not a git repo / git missing
  }
}

function logNextSteps(
  projectRoot /*: string */,
  appRoot /*: string */,
  productName /*: string | null */,
) {
  const appPkgJson = readPackageJson(projectRoot);
  const rawName =
    (appPkgJson != null ? appPkgJson.name : null) ?? path.basename(projectRoot);
  const sourcePath = findSourcePath(appRoot, rawName);
  const appDisplayName = productName ?? deriveAppName(rawName, sourcePath);

  log('');
  log('SPM setup complete!');
  log('');
  log('Next steps:');
  log(`  • Open ${appDisplayName}.xcodeproj in Xcode (or \`npm run ios\`)`);
  log('  • Set your Development Team in Signing & Capabilities');
  log('  • Build and run on Simulator or device');
  log('');
  log('To remove SPM later: `npx react-native spm deinit`');
}

async function main(argv /*:: ?: Array<string> */) /*: Promise<void> */ {
  let appRoot = process.cwd();
  const projectRoot = findProjectRoot(appRoot);
  const args = parseArgs(argv ?? process.argv.slice(2));

  // Standard-RN-layout redirect: if invoked from the JS root and there's an
  // `ios/` subdir, route the run there. Runs BEFORE resolveAction so the
  // first-run heuristic checks the correct directory.
  const redirectTo = detectStandardRnLayoutRedirect(appRoot, projectRoot);
  if (redirectTo != null) {
    const redirectAction = args.action ?? 'add';
    log(
      `\x1b[33mDetected standard RN layout — running ${redirectAction} in ${displayPath(redirectTo)} ` +
        `instead of ${displayPath(appRoot)}.\x1b[0m`,
    );
    appRoot = redirectTo;
  }

  const action = resolveAction(args.action, appRoot);

  // Zero-arg safe-gate: when `add` was resolved implicitly (no action typed)
  // on a freshly-scaffolded CocoaPods project, imply `--deintegrate` so the
  // common "new app → SPM" path is one command. Never on an explicit `spm add`
  // (that stays strict and fails loud on CocoaPods).
  if (
    action === 'add' &&
    args.action == null &&
    !args.deintegrate &&
    shouldAutoDeintegrate(
      appRoot,
      resolveInjectionTarget(args, appRoot).path ?? null,
    )
  ) {
    log(
      'Detected a freshly-scaffolded CocoaPods project — converting to SwiftPM ' +
        '(running `pod deintegrate`). Revert with `git` or `spm deinit`.',
    );
    args.deintegrate = true;
  }

  log(`Running SPM ${action} in: ${displayPath(appRoot)}`);
  if (projectRoot !== appRoot) {
    log(`Project root (package.json): ${displayPath(projectRoot)}`);
  }

  if (action === 'deinit') {
    const xcodeprojPath =
      args.xcodeprojPath != null
        ? path.resolve(appRoot, args.xcodeprojPath)
        : findInjectedXcodeproj(appRoot);
    if (xcodeprojPath == null) {
      log('No SPM injection found — nothing to remove.');
      return;
    }
    const result = removeSpmInjection({appRoot, xcodeprojPath});
    log(
      result.status === 'removed'
        ? `Removed SPM packages from ${path.basename(xcodeprojPath)}.`
        : 'No SPM injection found — nothing to remove.',
    );
    return;
  }

  // Fail fast on a CocoaPods-integrated target BEFORE the (expensive) pipeline,
  // so the user isn't made to wait through codegen + artifact download only to
  // be told to re-run with --deintegrate. Skipped when --deintegrate is set
  // (explicitly or via the safe-gate) — deintegration happens in setupXcodeproj.
  if ((action === 'add' || action === 'update') && !args.deintegrate) {
    const target = resolveInjectionTarget(args, appRoot);
    if (target.path != null && pbxprojUsesCocoaPods(target.path)) {
      logError(
        `${path.basename(target.path)} is CocoaPods-integrated. Re-run ` +
          '`spm add --deintegrate` to convert it (runs `pod deintegrate` + ' +
          'strips React Native from the Podfile), or run `pod deintegrate` ' +
          'yourself first. Side-by-side non-RN pods are fine.',
      );
      process.exitCode = 1;
      return;
    }
  }

  const needsCliConfig =
    action === 'add' ||
    action === 'update' ||
    action === 'sync' ||
    action === 'scaffold';
  let autolinkingConfigResult /*: ?AutolinkingConfigResult */ = null;
  if (needsCliConfig) {
    log('Generating autolinking.json (CLI config)...');
    try {
      autolinkingConfigResult = generateAutolinkingConfig({projectRoot});
      log(
        `Wrote ${path.relative(appRoot, autolinkingConfigResult.outputPath)}`,
      );
    } catch (e) {
      logError(
        `generate-spm-autolinking-config failed: ${e.message}. External native modules may not be discovered.`,
      );
    }
  }
  const reactNativeRoot = resolveReactNativeRoot(
    autolinkingConfigResult,
    projectRoot,
  );
  const version = determineVersion(args, reactNativeRoot);
  log(`React Native version: ${version}`);

  // Resolve remote SPM mode ONCE up front. remotePackageConfig throws
  // RemoteVersionError when remote mode is active but no usable RN version can
  // be derived (e.g. the monorepo '1000.0.0' placeholder with no override).
  // The downstream scaffold/autolinker/package steps all call it internally;
  // surfacing it here gives a single, predictable failure point before any of
  // them run. Exit 2 (same as a missing manifest) so the Xcode build phase
  // turns it into a hard build error while staying lenient on transient sync
  // failures. No-op in local mode (returns null).
  try {
    remotePackageConfig(appRoot);
  } catch (e) {
    if (e instanceof RemoteVersionError) {
      logError(e.message);
      process.exitCode = 2;
      return;
    }
    throw e;
  }
  // The artifact cache directory is resolved later in ensureArtifacts so the
  // nightly hash can be folded in for dev / nightly labels. That branch logs
  // either "Downloading xcframework artifacts (slot: ...)" or
  // "Artifacts already present in ...".

  if (action === 'codegen') {
    runCodegenStep(projectRoot, appRoot, reactNativeRoot, false);
    return;
  }

  if (action === 'sync') {
    const {main: runSync} = require('./spm/sync-spm-autolinking');
    try {
      await runSync([
        '--app-root',
        appRoot,
        '--react-native-root',
        reactNativeRoot,
      ]);
    } catch (e) {
      if (e instanceof MissingManifestError) {
        // The per-dep `error:` lines were already printed by the autolinker.
        // Exit 2 (distinct from generic failure) so the Xcode build phase can
        // turn this into a hard build error while staying lenient on transient
        // sync failures.
        process.exitCode = 2;
      } else {
        logError(`SPM sync failed: ${e.message}`);
        process.exitCode = 1;
      }
    }
    return;
  }

  if (action === 'download') {
    try {
      await ensureBothArtifactFlavors(args, version);
    } catch (e) {
      logError(`Artifact setup failed: ${e.message}`);
      process.exitCode = 1;
    }
    return;
  }

  // Scaffold Package.swift for community RN packages that don't ship SPM
  // support — ONLY for the explicit `scaffold` action. init/update never
  // auto-scaffold: a missing manifest must surface as a hard error (the
  // autolinker below throws MissingManifestError → exit 2) so the gap is
  // visible and fixed deliberately (scaffold + patch-package, or upstream).
  // Auto-scaffolding would silently hide that real error.
  if (action === 'scaffold') {
    await runScaffold(args, appRoot, projectRoot, reactNativeRoot);
  }

  runCodegenStep(projectRoot, appRoot, reactNativeRoot, args.skipCodegen);
  log('Generating build/generated/autolinking/Package.swift...');
  try {
    generateAutolinking([
      '--app-root',
      appRoot,
      '--react-native-root',
      reactNativeRoot,
    ]);
  } catch (e) {
    if (e instanceof MissingManifestError) {
      // Per-dep `error:` lines already printed by the autolinker. This happens
      // on init/update when the user declined the scaffold prompt — surface it
      // as a hard failure (exit 2) directing them to scaffold.
      process.exitCode = 2;
    } else {
      logError(`generate-spm-autolinking.js failed: ${e.message}`);
      process.exitCode = 1;
    }
    return;
  }

  const remote = remotePackageConfig(appRoot);
  if (remote != null) {
    log(`Remote ReactNative package: ${remote.url} @ ${remote.version}`);
  }
  let artifactDirs;
  try {
    artifactDirs = await ensureBothArtifactFlavors(args, version);
  } catch (e) {
    logError(`Artifact setup failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }
  try {
    generateXcframeworksPackage(
      args,
      appRoot,
      reactNativeRoot,
      version,
      artifactDirs,
    );
  } catch (e) {
    logError(`generate-spm-package.js failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  // (Re)install the static codegen Package.swift template once build/generated/ios exists.
  installSpmCodegenTemplate(appRoot, reactNativeRoot, {log});

  // Build the per-app generated-headers farm (vended as the ReactAppHeaders
  // SPM target inside the codegen package). React core headers need no trees
  // — they are vended by invariant SwiftPM compile products. The
  // generated manifests are fully declarative (fixed-relative package paths),
  // so no path-locator JSON is written.
  buildPerAppHeaderTree(appRoot, {log});

  // First-time setup only adds the gitignore entries on `add`.
  if (action === 'add') {
    ensureGitignoreSpmEntries(appRoot);
  }

  // Xcodeproj setup: in-place injection into the existing project (the only
  // strategy — no rename, no from-scratch; git is the safety net).
  try {
    await setupXcodeproj(args, appRoot, reactNativeRoot, action);
  } catch (e) {
    logError(`xcodeproj setup failed: ${e.message}`);
    if (process.exitCode == null) {
      process.exitCode = 1;
    }
    return;
  }

  finalizeArtifactPublication(appRoot);

  logNextSteps(projectRoot, appRoot, args.productName);
}

if (require.main === module) {
  void main();
}

module.exports = {
  main,
  detectStandardRnLayoutRedirect,
  findInjectedXcodeproj,
  resolveAction,
  shouldAutoDeintegrate,
  ensureBothArtifactFlavors,
};
