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

/*:: import type {
  CliConfigJson,
  GitignoreRecord,
  SetupArgs,
} from './spm/spm-types'; */

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
 *                              runs `pod deintegrate` and keeps the Podfile
 *                              (CocoaPods → SPM migration).
 *   update                     Re-run the pipeline and refresh the existing
 *                              injection. Default once a project is injected.
 *   deinit                     The exact inverse of `add`: surgically remove
 *                              only what `add` injected (recorded in
 *                              .spm-injected.json) and drop the marker. Then
 *                              `pod install` goes back to CocoaPods.
 *   scaffold                   Generate Package.swift for community deps that
 *                              lack SPM support.
 *   sync                       Re-run the build-time autolinking sync and its
 *                              checks. The generated Xcode build phase runs
 *                              it; run it by hand after precompiling a module.
 *   codegen / download         Advanced/internal: run a single pipeline step.
 *
 * Zero-arg `npx react-native spm` auto-detects: an injected project → `update`;
 * otherwise → `add` (fails loud on a CocoaPods project, directing you to
 * `--deintegrate`).
 *
 * Options:
 *   --version <ver>             React Native version. Pinned into
 *                               .spm-injected.json and reused by later runs
 *                               until a new one is passed (default: the
 *                               resolved node_modules/react-native version).
 *   --yes                       Skip the dirty-pbxproj confirmation prompt.
 *   [add] --xcodeproj <path>    Which .xcodeproj to inject into (when several).
 *   [add] --product-name <name> Which app target to inject into (when several).
 *   [add] --deintegrate         Run `pod deintegrate` before injecting. The
 *                               Podfile is kept.
 *   [advanced] --artifacts <path>          Local two-flavor artifact root;
 *                               must contain debug/ and release/ cache slots.
 *   [advanced] --download <auto|skip|force> Artifact policy (default: auto).
 *   [advanced] --skip-codegen   Skip the react-native codegen step.
 *   [advanced] --config-command <json> Override the autolinking config command.
 *
 * Environment ([add/update]; recorded in .spm-injected.json so Xcode builds
 * reuse them, re-run `update` without one to turn it off):
 *   RN_STRICT_API=1             Enforce React Native's C++ stable API: defines
 *                               the RN_STRICT_API macro for the app target, its
 *                               spm.modules packages and app codegen.
 *   RN_ALLOW_FRAMEWORKS=1       Silence the stable API's "for frameworks"
 *                               warning there: defines RN_ALLOW_FRAMEWORKS.
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
  parseConfigCommandJson,
  readEnvConfigCommand,
  resolveEnvConfigCommand,
} = require('./spm/generate-spm-autolinking-config');
const {main: generatePackage} = require('./spm/generate-spm-package');
const {findSourcePath} = require('./spm/generate-spm-package');
const {
  PluginFrameworkMismatchError,
  SPM_INJECTED_MARKER,
  cleanupDanglingJavaScriptCoreRef,
  cleanupLeftoverPodsGroup,
  findInjectedXcodeproj,
  injectSpmIntoExistingXcodeproj,
  readArtifactsVersionOverride,
  readCxxApiDefines,
  readMarker,
  readPinnedConfigCommand,
  removeSpmInjection,
} = require('./spm/generate-spm-xcodeproj');
const {
  MIN_IOS_VERSION_SUPPORTED,
  resolveIosDeploymentTarget,
} = require('./spm/ios-deployment-target');
const {
  refreshScaffoldedPlatformFloors,
  scaffoldAll,
} = require('./spm/scaffold-package-swift');
const {
  CXX_API_DEFINES,
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
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
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
        'React Native version (e.g. 0.80.0). Sticks: later runs reuse it until you pass a new one. Defaults to the version in node_modules/react-native/package.json',
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
        '[add] Run `pod deintegrate` before injecting (CocoaPods → SPM migration). The Podfile is kept.',
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
    .option('config-command', {
      type: 'string',
      describe:
        '[advanced] JSON array of the argv used to generate autolinking.json, overriding the default @react-native-community/cli config command. Also settable via RCT_SPM_AUTOLINKING_CONFIG_COMMAND. Either way `add`/`update` remembers the value in .spm-injected.json, so later runs and Xcode builds reuse it. Example: \'["npx","expo-modules-autolinking","react-native-config","--json","--platform","ios"]\'',
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
    configCommand:
      parsed['config-command'] != null
        ? parseConfigCommandJson(parsed['config-command'], '--config-command')
        : null,
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
const SPM_GITIGNORE_HEADER =
  '# SPM – auto-generated at build time (do not commit)';

/**
 * The lines `add` appends to the project's .gitignore so SPM-generated
 * directories are not committed, and whether that creates the file; null when
 * every entry is already there. The injector records them in the marker for
 * `spm deinit` to undo.
 */
function missingGitignoreSpmEntries(
  appRoot /*: string */,
) /*: ?GitignoreRecord */ {
  const gitignorePath = path.join(appRoot, '.gitignore');
  const exists = fs.existsSync(gitignorePath);
  const content = exists ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const existingEntries = new Set(content.split('\n').map(l => l.trim()));
  const missing = SPM_GITIGNORE_ENTRIES.filter(e => !existingEntries.has(e));
  return missing.length === 0
    ? null
    : {created: !exists, lines: [SPM_GITIGNORE_HEADER, ...missing]};
}

function appendGitignoreSpmEntries(
  appRoot /*: string */,
  appended /*: GitignoreRecord */,
) /*: void */ {
  const gitignorePath = path.join(appRoot, '.gitignore');
  const content = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf8')
    : '';
  const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  // The blank line before the header is what removeGitignoreSpmEntries
  // removes with it.
  const block = ['', ...appended.lines].join('\n');
  fs.writeFileSync(gitignorePath, content + separator + block + '\n', 'utf8');
  const entries = appended.lines.filter(line => line !== SPM_GITIGNORE_HEADER);
  log(`Updated .gitignore with SPM entries: ${entries.join(', ')}`);
}

/**
 * The inverse of appendGitignoreSpmEntries: removes the lines `record` says
 * `add` appended (a header with the blank line written before it), and the
 * file when `add` created it and nothing else is left. Without a record, as
 * in a marker from before it existed, .gitignore is left untouched.
 */
function removeGitignoreSpmEntries(
  appRoot /*: string */,
  record /*: ?GitignoreRecord */,
) {
  const gitignorePath = path.join(appRoot, '.gitignore');
  if (
    record == null ||
    record.lines.length === 0 ||
    !fs.existsSync(gitignorePath)
  ) {
    return;
  }
  const lines = fs.readFileSync(gitignorePath, 'utf8').split('\n');
  let changedByUser = 0;
  // Last occurrence first: `add` only ever appends.
  for (const recorded of [...record.lines].reverse()) {
    const index = lines.lastIndexOf(recorded);
    if (index === -1) {
      changedByUser++;
    } else if (
      recorded === SPM_GITIGNORE_HEADER &&
      index > 0 &&
      lines[index - 1] === ''
    ) {
      lines.splice(index - 1, 2);
    } else {
      lines.splice(index, 1);
    }
  }
  const remaining = lines.join('\n');
  if (record.created && remaining.trim() === '') {
    fs.rmSync(gitignorePath);
    log('Removed .gitignore, which `spm add` created.');
    return;
  }
  fs.writeFileSync(gitignorePath, remaining, 'utf8');
  if (changedByUser > 0) {
    log(
      `.gitignore: ${changedByUser} SPM line(s) changed or removed after ` +
        '`spm add` were left as they are. Remove any SPM entries you no ' +
        'longer need.',
    );
  } else if (record.created) {
    log(
      'Removed the SPM entries from .gitignore. Kept the file, which ' +
        '`spm add` created, because it now has lines of your own.',
    );
  } else {
    log('Removed the SPM entries from .gitignore.');
  }
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
  // refresh). Otherwise it's a first run → `add`, which fails loud on a
  // CocoaPods project: converting one takes an explicit `add --deintegrate`.
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

// Explicit `--version` → the version an earlier `--version` pinned into the
// injection marker → node_modules/react-native/package.json. The pin makes
// `--version` stick for later flagless runs, which would otherwise re-point the
// project at a different artifact slot than the one it was wired to.
function determineVersion(
  args /*: SetupArgs */,
  reactNativeRoot /*: string */,
  appRoot /*: string */,
) /*: string */ {
  if (args.version != null) {
    return args.version;
  }
  const pinned = readArtifactsVersionOverride(appRoot);
  if (pinned != null) {
    log(
      `Using version ${pinned} pinned in ${SPM_INJECTED_MARKER} by an earlier ` +
        '--version. Pass --version to change it.',
    );
    return pinned;
  }
  // $FlowFixMe[incompatible-type] JSON.parse returns any
  const pkgJson /*: {version: string} */ = JSON.parse(
    fs.readFileSync(path.join(reactNativeRoot, 'package.json'), 'utf8'),
  );
  return pkgJson.version;
}

function runCodegenStep(
  projectRoot /*: string */,
  appRoot /*: string */,
  reactNativeRoot /*: string */,
  skipCodegen /*: boolean */,
  cxxApiDefines /*: ReadonlyArray<string> */,
) /*: void */ {
  if (skipCodegen) {
    // Output dir may already exist from a previous run; still refresh the
    // SPM template so cache-slot changes propagate.
    log('Skipping codegen (--skip-codegen)');
    installSpmCodegenTemplate(appRoot, reactNativeRoot, {log}, {cxxApiDefines});
    return;
  }
  log('Running react-native codegen...');
  try {
    runCodegenAndInstallTemplate(
      projectRoot,
      appRoot,
      reactNativeRoot,
      {log},
      {cxxApiDefines},
    );
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
  iosDeploymentTarget /*: string */,
) /*: Promise<void> */ {
  // Resolve the cache slot identifier so the scaffolded files carry it as
  // a comment — that's how SPM's manifest hash bumps on slot transitions.
  let cacheSlotLabel /*: ?string */ = null;
  try {
    const rawVersion = determineVersion(args, reactNativeRoot, appRoot);
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
      iosDeploymentTarget,
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
    // Silent for the outcomes that changed nothing ('already-set', 'skipped').
    const nameOutcome = (outcome /*: ?string */) /*: string */ => {
      if (outcome === 'created' || outcome === 'inserted') {
        return " — also recorded 'swiftpmConfig.name' in its package.json";
      }
      if (outcome === 'failed') {
        return " — could NOT record 'swiftpmConfig.name'; the manifest is written, the name is not";
      }
      return '';
    };
    for (const r of written) {
      log(`  • ${r.depName}${nameOutcome(r.swiftpmName)}`);
    }
    log('');
    log(
      'node_modules is NOT committed and is wiped by `npm install`. To keep\n' +
        'these manifests, create and commit a patch with a tool like patch-package:\n' +
        '  • `npx patch-package <dep>` for each scaffolded dep, then commit the patch.\n' +
        'The patch also captures any recorded `swiftpmConfig.name`, which is what\n' +
        'lets the library be named without reading its podspec. Better still, ask the\n' +
        'maintainer to ship both upstream.\n' +
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

function cocoaPodsIntegratedMessage(xcodeprojPath /*: string */) /*: string */ {
  return (
    `${path.basename(xcodeprojPath)} is CocoaPods-integrated. To move it to ` +
    'SwiftPM, run `npx react-native spm add --deintegrate`. It runs ' +
    '`pod deintegrate` and keeps the Podfile, so ' +
    '`npx react-native spm deinit` and then `pod install` go back to ' +
    'CocoaPods. Pods other than React Native are not installed while the app ' +
    'uses SwiftPM, unless SwiftPM provides them.'
  );
}

// A `:path` or `:podspec` value, in either Ruby hash syntax, that points into
// the react-native package itself.
const REACT_NATIVE_POD_SOURCE =
  /(?::(?:path|podspec)\s*=>|\b(?:path|podspec):)\s*(['"])(?:[^'"]*\/)?node_modules\/react-native(?:\/[^'"]*)?\1/;

// The names of the pods the Podfile declares explicitly (`pod '...'` or
// `pod('...')`), deduplicated, in order. A pod sourced from the react-native
// package is part of React Native and left out, as is everything
// use_react_native! brings in.
function podfilePodNames(appRoot /*: string */) /*: Array<string> */ {
  const podfilePath = path.join(appRoot, 'Podfile');
  if (!fs.existsSync(podfilePath)) {
    return [];
  }
  const statements /*: Array<string> */ = [];
  let continued = '';
  for (const line of fs.readFileSync(podfilePath, 'utf8').split('\n')) {
    // `#{` is Ruby string interpolation, not a comment. A line that ends in
    // `,` continues on the next one.
    const code = (continued + line.split(/#(?!\{)/)[0]).trimEnd();
    if (code.endsWith(',')) {
      continued = code + ' ';
    } else {
      continued = '';
      statements.push(...code.split(';'));
    }
  }
  statements.push(continued);
  const names /*: Set<string> */ = new Set();
  for (const statement of statements) {
    const match = /^\s*pod\s*\(?\s*(['"])(.+?)\1/.exec(statement);
    if (match != null && !REACT_NATIVE_POD_SOURCE.test(statement)) {
      names.add(match[2]);
    }
  }
  return [...names];
}

// Run `pod deintegrate` and leave the Podfile as it is, so `spm deinit` and
// then `pod install` go back to CocoaPods. Requires CocoaPods on PATH
// (fail-loud otherwise). Does NOT touch the .xcworkspace.
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

/** The app's own floor for every manifest this run generates, logged once. */
function resolveAppIosDeploymentTarget(
  args /*: SetupArgs */,
  appRoot /*: string */,
) /*: string */ {
  const target = resolveInjectionTarget(args, appRoot);
  const xcodeprojPath = target.path ?? null;
  const read = resolveIosDeploymentTarget({
    xcodeprojPath,
    targetUuid:
      xcodeprojPath != null ? readMarker(xcodeprojPath)?.targetUuid : null,
    targetName: args.productName,
  });
  const value = read ?? MIN_IOS_VERSION_SUPPORTED;
  const origin =
    read != null && xcodeprojPath != null
      ? `from ${path.basename(xcodeprojPath)}`
      : // `sync` and `scaffold` don't otherwise surface why no project was picked.
        `react-native default${target.error != null ? `; ${target.error}` : ''}`;
  log(`iOS deployment target: ${value} (${origin})`);
  return value;
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
  cxxApiDefines /*: ReadonlyArray<string> */,
  gitignoreAppended /*: ?GitignoreRecord */,
) /*: Promise<void> */ {
  const target = resolveInjectionTarget(args, appRoot);
  if (target.error != null) {
    logError(`Cannot set up SPM: ${target.error}`);
    process.exitCode = 1;
    throw new Error(target.error);
  }
  const xcodeprojPath = target.path;
  const pbxprojPath = path.join(xcodeprojPath, 'project.pbxproj');

  // No backup is made — git is the safety net. Refuse on a dirty/untracked
  // pbxproj unless --yes, so a bad inject is always `git checkout`-able. Asked
  // before `pod deintegrate` edits the pbxproj, so "no" changes nothing.
  const clean = gitTrackedAndClean(appRoot, pbxprojPath);
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
    logError(cocoaPodsIntegratedMessage(xcodeprojPath));
    process.exitCode = 1;
    throw new Error('CocoaPods-integrated project');
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
    configCommand: resolveConfigCommandToPin(args),
    cxxApiDefines,
    gitignoreAppended,
  });
  if (result.status !== 'injected') {
    logError(`SPM injection failed: ${result.reason}`);
    process.exitCode = 1;
    throw new Error(result.reason);
  }
  // Written at once: the marker now records these lines, whatever fails next.
  if (gitignoreAppended != null) {
    appendGitignoreSpmEntries(appRoot, gitignoreAppended);
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

// The React Native C++ stable API macros this run defines for the app target,
// its spm.modules packages and app codegen (CXX_API_DEFINES). `add`/`update`
// read each from the env var of the same name (=1; unset turns it off, as with
// `pod install`) and record the result in the injection marker; every other
// action, including the build-time `sync`, reuses the recorded macros because
// Xcode builds inherit neither the env vars nor the shell that set them.
function resolveCxxApiDefines(
  action /*: string */,
  appRoot /*: string */,
) /*: Array<string> */ {
  if (action === 'add' || action === 'update') {
    return CXX_API_DEFINES.filter(name => process.env[name] === '1');
  }
  return readCxxApiDefines(appRoot);
}

// The autolinking config command for this run: an explicit `--config-command`
// first, then the value a previous `add`/`update` pinned into the injection
// marker. undefined means "no explicit command", which is what makes
// generateAutolinkingConfig fall back to RCT_SPM_AUTOLINKING_CONFIG_COMMAND and
// then to the built-in default — so the pin has to be WITHHELD while the env
// var is set, or a stale pin would outrank a developer's env override.
function resolveExplicitConfigCommand(
  args /*: SetupArgs */,
  appRoot /*: string */,
) /*: Array<string> | void */ {
  if (args.configCommand != null) {
    return args.configCommand;
  }
  if (readEnvConfigCommand() != null) {
    return undefined;
  }
  const pinned = readPinnedConfigCommand(appRoot);
  if (pinned == null) {
    return undefined;
  }
  log(
    `Autolinking config command (pinned in ${SPM_INJECTED_MARKER}): ` +
      pinned.join(' '),
  );
  return pinned;
}

// The command to record in the injection marker. The env var is resolved here
// too, because the Xcode build phase inherits neither the flag nor the shell
// that set it — an env-only override that went unpinned would leave the build
// re-deriving autolinking.json with the default command. null pins nothing and
// preserves any earlier pin. An invalid env value throws, as the flag does,
// though `add` has already failed closed on it by this point.
function resolveConfigCommandToPin(
  args /*: SetupArgs */,
) /*: ?Array<string> */ {
  return args.configCommand ?? resolveEnvConfigCommand();
}

// Generate autolinking.json, failing closed on a config-command error.
//
// generateAutolinkingConfig throws ONLY when the config command itself fails —
// a non-zero exit, unparseable output, or a config missing
// project.ios.sourceDir. Swallowing that (the old behavior) let the run proceed
// and emit an empty Autolinked package, which only surfaced much later as an
// inscrutable `unable to resolve module dependency` at build time. Instead we
// set process.exitCode = 2 (a hard Xcode build-phase error, matching the
// RemoteVersionError path) and return null so the caller stops.
//
// A genuinely native-module-free app does NOT reach the error path: its command
// exits 0 with valid, empty-dependency JSON, so generateAutolinkingConfig
// returns normally and the empty-package path downstream stays valid.
function generateAutolinkingConfigOrFailClosed(
  opts /*: {
    projectRoot: string,
    configCommand?: Array<string>,
    generate?: typeof generateAutolinkingConfig,
  } */,
) /*: ?AutolinkingConfigResult */ {
  const generate = opts.generate ?? generateAutolinkingConfig;
  try {
    return generate({
      projectRoot: opts.projectRoot,
      configCommand: opts.configCommand,
    });
  } catch (e) {
    logError(
      `Failed to generate autolinking.json: ${e.message}\n` +
        'The autolinking config command failed. If this app replaces ' +
        '@react-native-community/cli autolinking (e.g. an Expo app), set ' +
        'RCT_SPM_AUTOLINKING_CONFIG_COMMAND (or pass --config-command) to a ' +
        'JSON argv array whose command prints the React Native CLI config, ' +
        'e.g. \'["npx","expo-modules-autolinking","react-native-config",' +
        '"--json","--platform","ios"]\'. An earlier `add`/`update` may also ' +
        `have pinned a command in ${SPM_INJECTED_MARKER}; re-run with ` +
        '--config-command to replace a stale one.',
    );
    process.exitCode = 2;
    return null;
  }
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

  log(`Running SPM ${action} in: ${displayPath(appRoot)}`);
  if (projectRoot !== appRoot) {
    log(`Project root (package.json): ${displayPath(projectRoot)}`);
  }

  if (action === 'deinit') {
    const xcodeprojPath =
      args.xcodeprojPath != null
        ? path.resolve(appRoot, args.xcodeprojPath)
        : findInjectedXcodeproj(appRoot);
    // removeSpmInjection drops the marker, and the record with it.
    const gitignoreRecord =
      xcodeprojPath != null ? readMarker(xcodeprojPath)?.gitignore : null;
    const removed =
      xcodeprojPath != null &&
      removeSpmInjection({appRoot, xcodeprojPath}).status === 'removed';
    if (removed && xcodeprojPath != null) {
      log(`Removed SPM packages from ${path.basename(xcodeprojPath)}.`);
    } else {
      log('No SPM injection found — nothing to remove.');
    }
    try {
      removeGitignoreSpmEntries(appRoot, gitignoreRecord);
    } catch (e) {
      logError(
        `Could not remove the SPM entries from .gitignore: ${e.message}. ` +
          'Remove them by hand.',
      );
    }
    if (removed && fs.existsSync(path.join(appRoot, 'Podfile'))) {
      const podInstall =
        appRoot === process.cwd()
          ? 'pod install'
          : `cd ${path.relative(process.cwd(), appRoot)} && pod install`;
      log(`To go back to CocoaPods, run \`${podInstall}\`.`);
    }
    return;
  }

  if (args.deintegrate) {
    const podNames = podfilePodNames(appRoot);
    if (podNames.length > 0) {
      log(
        '\x1b[33mYour Podfile declares pods that are not part of React ' +
          `Native: ${podNames.join(', ')}. They are not installed while the ` +
          'app uses SwiftPM, unless SwiftPM provides them. The Podfile is ' +
          'kept, so `npx react-native spm deinit` and then `pod install` ' +
          'bring them back.\x1b[0m',
      );
    }
  }

  // Fail fast on a CocoaPods-integrated target BEFORE the (expensive) pipeline,
  // so the user isn't made to wait through codegen + artifact download only to
  // be told to re-run with --deintegrate. Skipped when --deintegrate is set —
  // deintegration happens in setupXcodeproj.
  if ((action === 'add' || action === 'update') && !args.deintegrate) {
    const target = resolveInjectionTarget(args, appRoot);
    if (target.path != null && pbxprojUsesCocoaPods(target.path)) {
      logError(cocoaPodsIntegratedMessage(target.path));
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
    autolinkingConfigResult = generateAutolinkingConfigOrFailClosed({
      projectRoot,
      configCommand: resolveExplicitConfigCommand(args, appRoot),
    });
    if (autolinkingConfigResult == null) {
      // Fail closed: the config command errored and the helper already set
      // process.exitCode = 2. Stop rather than emit an empty Autolinked package.
      return;
    }
    log(`Wrote ${path.relative(appRoot, autolinkingConfigResult.outputPath)}`);
  }
  const iosDeploymentTarget /*: string */ = needsCliConfig
    ? resolveAppIosDeploymentTarget(args, appRoot)
    : MIN_IOS_VERSION_SUPPORTED;
  const reactNativeRoot = resolveReactNativeRoot(
    autolinkingConfigResult,
    projectRoot,
  );
  const version = determineVersion(args, reactNativeRoot, appRoot);
  log(`React Native version: ${version}`);

  const cxxApiDefines = resolveCxxApiDefines(action, appRoot);
  if (cxxApiDefines.length > 0) {
    log(
      `C++ stable API: defining ${cxxApiDefines.join(', ')} in the app ` +
        'target, its spm.modules packages and app codegen',
    );
  }
  const cxxApiDefineArgs = cxxApiDefines.flatMap(name => [
    '--cxx-api-define',
    name,
  ]);

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
    runCodegenStep(projectRoot, appRoot, reactNativeRoot, false, cxxApiDefines);
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
        '--ios-deployment-target',
        iosDeploymentTarget,
        ...cxxApiDefineArgs,
      ]);
    } catch (e) {
      if (
        e instanceof MissingManifestError ||
        e instanceof PluginFrameworkMismatchError
      ) {
        // The `error:` lines were already printed.
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
    await runScaffold(
      args,
      appRoot,
      projectRoot,
      reactNativeRoot,
      iosDeploymentTarget,
    );
  }

  runCodegenStep(
    projectRoot,
    appRoot,
    reactNativeRoot,
    args.skipCodegen,
    cxxApiDefines,
  );

  // A manifest scaffolded before the app's deployment target changed (or by a
  // pre-v20 scaffolder) would pin a floor SwiftPM then refuses to link against.
  if (
    (action === 'add' || action === 'update') &&
    autolinkingConfigResult != null
  ) {
    for (const refreshed of refreshScaffoldedPlatformFloors({
      appRoot,
      autolinkingJsonPath: autolinkingConfigResult.outputPath,
      iosDeploymentTarget,
    })) {
      log(
        `Refreshed platform floor in ${path.relative(appRoot, refreshed.path)}: ` +
          `${refreshed.from} → ${refreshed.to}`,
      );
    }
  }

  log('Generating build/generated/autolinking/Package.swift...');
  try {
    generateAutolinking([
      '--app-root',
      appRoot,
      '--react-native-root',
      reactNativeRoot,
      '--ios-deployment-target',
      iosDeploymentTarget,
      ...cxxApiDefineArgs,
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
  installSpmCodegenTemplate(appRoot, reactNativeRoot, {log}, {cxxApiDefines});

  // Build the per-app generated-headers farm (vended as the ReactAppHeaders
  // SPM target inside the codegen package). React core headers need no trees
  // — they are vended by invariant SwiftPM compile products. The
  // generated manifests are fully declarative (fixed-relative package paths),
  // so no path-locator JSON is written.
  buildPerAppHeaderTree(appRoot, {log});

  // Only `add` adds the .gitignore entries. setupXcodeproj writes them once the
  // injector has recorded them in the marker, so `spm deinit` removes them.
  const gitignoreAppended =
    action === 'add' ? missingGitignoreSpmEntries(appRoot) : null;

  // Xcodeproj setup: in-place injection into the existing project (the only
  // strategy — no rename, no from-scratch; git is the safety net).
  try {
    await setupXcodeproj(
      args,
      appRoot,
      reactNativeRoot,
      action,
      cxxApiDefines,
      gitignoreAppended,
    );
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
  appendGitignoreSpmEntries,
  detectStandardRnLayoutRedirect,
  determineVersion,
  findInjectedXcodeproj,
  generateAutolinkingConfigOrFailClosed,
  missingGitignoreSpmEntries,
  parseArgs,
  podfilePodNames,
  resolveAction,
  resolveAppIosDeploymentTarget,
  resolveConfigCommandToPin,
  resolveExplicitConfigCommand,
  resolveCxxApiDefines,
  runDeintegrate,
  ensureBothArtifactFlavors,
};
