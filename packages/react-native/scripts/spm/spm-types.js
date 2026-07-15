/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/*::
export type SetupArgs = {
  action: 'add' | 'update' | 'deinit' | 'sync' | 'codegen' | 'download' | 'scaffold' | null,
  version: string | null,
  // Local two-flavor artifact source (advanced). The directory contains
  // `debug/` and `release/` cache slots, each with artifacts.json.
  artifacts: string | null,
  skipCodegen: boolean,
  // Artifact download policy: 'auto' fetches when missing, 'skip' never
  // fetches, 'force' clears the cache slot and re-downloads.
  downloadPolicy: 'auto' | 'skip' | 'force',
  // `add` target selection: which app target (when several) and which project.
  productName: string | null,
  xcodeprojPath: string | null,
  // `add`: run `pod deintegrate` + strip RN from the Podfile before injecting.
  // Also implied on the zero-arg path when resolveAction's safe-gate detects a
  // freshly-scaffolded CocoaPods project (see setup-apple-spm.js).
  deintegrate: boolean,
  // Skip the single remaining confirmation (the add/update dirty-pbxproj
  // warning). Non-TTY auto-proceeds regardless (git is the safety net).
  yes: boolean,
};

export type DownloadArgs = {
  version: string | null,
  flavor: string,
  output: string | null,
  coreTarball: string | null,
  headersTarball: string | null,
  depsTarball: string | null,
  depsHeadersTarball: string | null,
};

export type ResolvedArtifact = {
  url: string,
  version: string,
};

export type ProcessResult = {
  label: string,
  version: string,
  xcframeworkPath: string,
  url: string,
};

export type ArtifactResultEntry =
  | {name: string, error: void, label: string, version: string, xcframeworkPath: string, url: string}
  | {name: string, error: string};

export type AutolinkingArgs = {
  appRoot: string,
  reactNativeRoot: string | null,
  autolinkingJson: string | null,
  output: string | null,
  xcframeworksPath: string | null,
};

export type SpmTarget = {
  name: string,
  path: string,
  exclude: Array<string>,
  publicHeadersPath: string | null,
  resources?: Array<string>,
  // Swift target names this target depends on (already toSwiftName()'d).
  // Emitted into the target's SPM `dependencies:` array so the compiler sees
  // the dependent target's headers / module map.
  spmTargetDependencies?: Array<string>,
  // Explicit allowlist of source files (paths relative to target.path).
  // Mirrors CocoaPods' `s.source_files`. When non-empty, the SPM target
  // declares `sources: [...]` and only these files are compiled — test dirs,
  // .js/.podspec/.md siblings, etc. can never sneak in. Null/empty means
  // fall back to SPM's default scan of target.path.
  sources?: ?Array<string>,
  // Header search paths declared by the dep's podspec
  // (pod_target_xcconfig HEADER_SEARCH_PATHS), already substituted relative
  // to the dep's source dir. Path-style includes like
  // `<react/renderer/components/safeareacontext/X.h>` resolve through these.
  // Emitted as `.headerSearchPath(...)` directives in the target's
  // cSettings / cxxSettings.
  headerSearchPaths?: ?Array<string>,
};

// Routing metadata kept alongside an SpmTarget in main(). Lives in a wrapper
// (not on SpmTarget) so the target type stays describable from the outside.
export type TargetEntry = {
  target: SpmTarget,
  origin: 'npm' | 'spmModule',
  // The dep's npm package name (origin 'npm' only). Used in the
  // missing-manifest error so the message names the package the developer
  // installed, not its derived Swift target name.
  npmName?: string,
  // The dep's checked-in package root (origin 'npm' only) — the directory that
  // holds its root `Package.swift` and `.react-native/` metadata. Threaded from
  // the autolinking model (`dep.root`) so the watch file can flag manifest edits
  // without walking up from the (possibly nested) target source dir.
  root?: string,
  // Filled in for npm-origin entries during the mirror step; consumed by the
  // synth-package emission step further down.
  mirrorReady?: ?{
    synthPkgDir: string,
    mirroredResources: ?Array<string>,
  },
};

// ---------------------------------------------------------------------------
// autolinking.json shape (output of @react-native-community/cli config).
// All fields are optional because the JSON is user-influenced; the consumer
// checks at runtime.
// ---------------------------------------------------------------------------
export type AutolinkingIosPlatform = {
  sourceDir?: ?string,
  podspecPath?: ?string,
  ...
};
// As parsed from autolinking.json — all fields optional because the JSON is
// user-influenced. main() validates and narrows to AutolinkedDep before use.
export type AutolinkingDepJson = {
  root?: ?string,
  platforms?: ?{ios?: ?AutolinkingIosPlatform, ...},
  ...
};
export type RawAutolinkingJson = {
  dependencies?: ?{[string]: AutolinkingDepJson},
  ...
};
// Validated/normalized dep — name and ios platform are guaranteed present.
// Produced from AutolinkingDepJson in main() and passed through
// expandSpmDependencies to autolinkingDepToSpmTarget.
export type AutolinkedDep = {
  name: string,
  root: string,
  platforms: {ios: AutolinkingIosPlatform, ...},
  // Resolved Swift target / module / headers-subdir name. Defaults to
  // toSwiftName(name) and is overridden by the dep's react-native.config.js
  // `spm.name`. Populated by expandSpmDependencies — always present after
  // expansion; optional in the type so caller-side construction stays simple.
  swiftName?: string,
  // Populated by expandSpmDependencies from each dep's
  // react-native.config.js `spm.dependencies` array.
  spmDependencies?: Array<string>,
  ...
};

// CLI `config` output minimally typed for the bits we read in
// generate-spm-autolinking-config.js.
export type CliConfigJson = {
  root?: ?string,
  reactNativePath?: ?string,
  project?: ?{ios?: ?{sourceDir?: ?string, ...}, ...},
  ...
};

// Entry shape for an spmModule declared in react-native.config.js.
export type SpmModuleConfig = {
  name: string,
  path: string,
  exclude?: Array<string>,
  publicHeadersPath?: ?string,
  // Optional CocoaPods-style glob allowlist (analog of s.source_files).
  // When set, replaces auto source discovery for the module — only files
  // matching one of these patterns are passed to SPM via `sources:`.
  sources?: Array<string>,
};

// ---------------------------------------------------------------------------
// Inputs to the Swift emitters in generate-spm-autolinking.js.
// ---------------------------------------------------------------------------
export type NpmDepRef = {
  swiftName: string,
  // Path passed to .package(path:). Relative to autolinked/ (the aggregator's
  // dir). For in-place synth this is the dep's real source dir.
  packagePath?: string,
  // The npm package name (e.g. react-native-safe-area-context). Used by the
  // aggregator's eval-time missing-manifest guard to name the library a
  // developer installed (not its Swift target name).
  npmName?: string,
};

export type AggregatorInput = {
  npmDeps?: ReadonlyArray<NpmDepRef>,
  inlineTargets?: ReadonlyArray<SpmTarget>,
  hasReactDep?: boolean,
  // Relative path from the aggregator's dir (autolinking/) to
  // build/xcframeworks. Used for the inline-target ReactNative dep.
  xcframeworksRelPath?: ?string,
  // Autolinking-plugin contributions (Expo & other frameworks). Merged into
  // the aggregator's package deps + the AutolinkedAggregate target deps.
  pluginPackageDeps?: ReadonlyArray<PluginPackageDep>,
  pluginProductDeps?: ReadonlyArray<PluginProductDep>,
};

// --- Autolinking plugins (PREVIEW / unstable contract) ---

// A framework's plugin package dependency: local (path) or remote (url+version).
export type PluginPackageDep = {
  name: string,
  path?: string,
  url?: string,
  version?: string,
};

// A product the AutolinkedAggregate target should link.
export type PluginProductDep = {name: string, package: string};

// A generated source file (e.g. Expo's ExpoModulesProvider.swift) to register
// in the codegen package so it compiles.
export type PluginGeneratedSource = {path: string};

// A plugin-declared dynamic XCFramework pair. RN validates both paths, stages
// immutable app-local slots, and links/embeds the selected framework outside
// SwiftPM.
export type PluginFlavoredFramework = {
  id: string,
  frameworkName: string,
  linkage: 'dynamic',
  flavors: {debug: string, release: string},
};

export type XcframeworkSlice = {
  sdk: string,
  platform: string,
  variant: ?string,
  architectures: Array<string>,
  libraryIdentifier: string,
  libraryPath: string,
  binaryPath: string,
};

export type ParsedXcframework = {
  path: string,
  frameworkName: string,
  executableName: string,
  slices: Array<XcframeworkSlice>,
};

export type FlavoredFrameworkManifestEntry = {
  id: string,
  frameworkName: string,
  executableName: string,
  linkage: 'dynamic',
  artifactRelativePath: string,
  slices: Array<XcframeworkSlice>,
};

export type FlavoredFrameworksManifest = {
  version: 1,
  frameworks: Array<FlavoredFrameworkManifestEntry>,
};

// How a plugin depends on React — the single source of truth so a plugin's
// own Package.swift doesn't re-derive RN's package path/identity/products.
// Local vs remote is distinguished by which keys are present:
//   - local:  {name, path (absolute), relPath (relative to outputDir)}
//   - remote: {name, url, version}
// `path` is absolute so it's correct no matter which subdir of outputDir the
// plugin writes its manifest into (the manifests are gitignored + regenerated).
export type ReactPackageRef =
  | {name: string, path: string, relPath?: string}
  | {name: string, url: string, version: string};

export type ReactDescriptor = {
  packageRef: ReactPackageRef,
  // The products a React-consuming target may depend on — the same set RN wires
  // into its own autolinked targets (parity), filtered to those resolvable this
  // run. Every listed product is safe to reference without guarding. Note
  // ReactAppHeaders lives in the separate, per-app React-GeneratedCode package.
  products: Array<{name: string, package: string}>,
};

// Context handed to every plugin. Includes the JS root (projectRoot) and the
// parsed autolinking data so a framework can scan the discovered deps.
export type PluginContext = {
  appRoot: string,
  projectRoot: string,
  reactNativeRoot: string,
  autolinking: {readonly [string]: unknown},
  outputDir: string,
  // How to depend on React (package ref + product set); null only when there is
  // no resolvable React dependency at all.
  react: ?ReactDescriptor,
};

export type PluginResult = {
  packageDependencies: Array<PluginPackageDep>,
  productDependencies: Array<PluginProductDep>,
  generatedSources: Array<PluginGeneratedSource>,
  flavoredFrameworks: Array<PluginFlavoredFramework>,
  // Absolute paths (dirs or files) the Xcode auto-sync build phase should watch
  // for staleness, e.g. the plugin dep's own `Package.swift` and per-module
  // manifests. Folded into `.spm-sync-watch-paths` by main().
  watchPaths: Array<string>,
};

export type SpmAutolinkingPlugin = (context: PluginContext) => ?{
  packageDependencies?: Array<PluginPackageDep>,
  productDependencies?: Array<PluginProductDep>,
  generatedSources?: Array<PluginGeneratedSource>,
  flavoredFrameworks?: Array<PluginFlavoredFramework>,
  watchPaths?: Array<string>,
};

export type DiscoveredPlugin = {
  depName: string,
  pluginPath: string,
  plugin: SpmAutolinkingPlugin,
};

export type SynthPackageSpec = {
  swiftName: string,
  exclude?: Array<string>,
  publicHeadersPath?: ?string,
  // Explicit allowlist of source paths (relative to `targetPath`). When
  // present and non-empty, the synth Package.swift emits `sources: [...]`
  // — SPM will only compile these files.
  sources?: ?Array<string>,
  spmDependencies?: Array<{swiftName: string}>,
  hasReactDep?: boolean,
  // Relative path (posix, from the synth dir <outputDir>/packages/<Name>) to
  // the app's React xcframeworks package and codegen package. Computed by the
  // caller at generation time — the synth holds no runtime discovery.
  reactNativePackagePath?: string,
  codegenPackagePath?: string,
  resources?: ?Array<string>,
  isDynamic?: boolean,
  targetPath?: string,
  // Fallback relative base for sibling synth packages when the caller does not
  // supply absolute paths (tests). Production uses siblingSynthAbsolutePaths.
  siblingPackageBaseRelative?: string,
  siblingSynthAbsolutePaths?: {[swiftName: string]: string},
  // Header search paths from the dep's podspec `pod_target_xcconfig`
  // HEADER_SEARCH_PATHS, with `$(PODS_TARGET_SRCROOT)` substituted and the
  // synth wrapper's `root/` prefix applied. Emitted as `.headerSearchPath()`
  // directives on cSettings / cxxSettings so path-style includes like
  // `<react/renderer/components/safeareacontext/X.h>` resolve through the
  // dep's own `common/cpp/` subtree.
  headerSearchPaths?: ?Array<string>,
};


export type GeneratePackageArgs = {
  appRoot: string,
  reactNativeRoot: string | null,
  version: string | null,
  debugArtifactsDir: string | null,
  releaseArtifactsDir: string | null,
  appName: string | null,
  targetName: string | null,
  sourcePath: string | null,
  iosVersion: string,
};

// A preprocessor define lifted from a podspec's pod_target_xcconfig
// (OTHER_CFLAGS `-D...` tokens + GCC_PREPROCESSOR_DEFINITIONS entries). `value`
// is null for a bare `-DNAME` (define with no value); `config` scopes the
// define to a build configuration (from `[config=*Debug*]`/`[config=*Release*]`
// xcconfig keys), null = unconditional. Emitted as SPM `.define(...)`.
export type PreprocessorDefine = {
  name: string,
  value: ?string,
  config: ?('debug' | 'release'),
};

// ---------------------------------------------------------------------------
// Scaffold types — for the `npx react-native spm scaffold` command that
// generates a `Package.swift` into `node_modules/<dep>/` for community RN
// libraries that don't ship SPM support. Inputs come from the dep's podspec
// (read via `pod ipc spec --format=json` when CocoaPods is available, or a
// regex fallback). The output Package.swift is treated as "self-managed" by
// the autolinker — see isSelfManagedPackage in generate-spm-autolinking.js.
// ---------------------------------------------------------------------------

// Flattened, subspec-merged view of a podspec — what the translation layer
// consumes. HEADER_SEARCH_PATHS / source globs are kept as raw strings;
// substitution of `$(PODS_TARGET_SRCROOT)` etc. happens during translation
// so the raw model stays portable.
export type PodspecModel = {
  name: string,
  version: string,
  sourceFiles: Array<string>,
  publicHeaderFiles: Array<string>,
  privateHeaderFiles: Array<string>,
  excludeFiles: Array<string>,
  headerMappingsDir: ?string,
  // Every subspec's header_mappings_dir (union). dirname() of each is added as
  // a header search path so `<namespace/...>` includes resolve from the
  // physical source tree (SPM has no header_mappings_dir copy step).
  headerMappingsDirs: Array<string>,
  headerDir: ?string,
  frameworks: Array<string>,
  weakFrameworks: Array<string>,
  libraries: Array<string>,
  // Merged dependency name list. With pod-ipc, includes the deps materialized
  // by `install_modules_dependencies(s)` (React-Core, React-Fabric, ...).
  // Version constraints stripped — we only need the name to bucket.
  dependencies: Array<string>,
  compilerFlags: Array<string>,
  // Raw header-search-path entries from `pod_target_xcconfig['HEADER_SEARCH_PATHS']`.
  // May contain Xcode build setting placeholders like `$(PODS_TARGET_SRCROOT)`.
  headerSearchPaths: Array<string>,
  // Preprocessor defines lifted from pod_target_xcconfig OTHER_CFLAGS (`-D`
  // tokens) + GCC_PREPROCESSOR_DEFINITIONS (incl. per-config variants). Already
  // resolved by `pod ipc` (e.g. `-DWORKLETS_VERSION=#{package['version']}` →
  // `WORKLETS_VERSION=0.9.2`). Emitted as `.define(...)` on the SPM target.
  preprocessorDefines: Array<PreprocessorDefine>,
  // File paths or glob patterns the dep declares as bundled resources.
  resources: Array<string>,
  requiresArc: boolean,
  // Warnings collected during parsing — surfaced in the scaffold summary so
  // a user can spot fields that didn't translate cleanly (unknown env vars,
  // unrecognized $(...) tokens, etc.). Never throws on parse errors.
  warnings: Array<string>,
  // True when produced by the regex fallback rather than pod-ipc. Used to
  // emit a louder banner in the scaffold summary explaining that dependency
  // wiring may be incomplete.
  partial: boolean,
  // True when the podspec source calls `install_modules_dependencies(s)` —
  // RN's Podfile-side helper that injects the React-Core family. We strip that
  // helper before evaluating the spec (and the regex parser can't expand it),
  // so React-Core never surfaces in `dependencies`. The scaffolder treats this
  // flag as an implicit React-core dependency (a plain ObjC module using the
  // helper has no `codegenConfig` to key off).
  usesInstallModulesDependencies: boolean,
};

// Intermediate translation result — concrete data the Swift emitter consumes.
// Decouples podspec reading from SPM-specific shaping so each side can be
// tested in isolation.
export type SpmScaffoldSpec = {
  // Swift target / module name. Default: toSwiftName(podspec.name); overridden
  // by `header_dir` when present.
  swiftName: string,
  // Source file paths relative to the dep root, ready for `sources: [...]`
  // emission after the `root/` wrapper-dir prefix is applied at emit time.
  sources: Array<string>,
  // Header search paths resolved to dep-root-relative form. Each entry
  // becomes `.headerSearchPath("<path>")` in cSettings + cxxSettings.
  headerSearchPaths: Array<string>,
  // Preprocessor defines (resolved by pod ipc) — emitted as `.define(...)` in
  // cSettings + cxxSettings, honoring any per-config scope.
  preprocessorDefines: Array<PreprocessorDefine>,
  // True when the target has ObjC(++) sources (.m/.mm). Drives emitting +
  // `-include`ing a prefix header that ambient-imports Foundation/UIKit (which
  // CocoaPods provides via a generated prefix.pch and SPM does not).
  needsObjCPrefix: boolean,
  // Bucketed dependency references — pre-computed by the translation layer.
  // `coreReactNative` is true when ANY React-* / RCT* / RCT-Folly / glog
  // dep is present (so we add React's invariant header products).
  // `siblingNames` are npm names that match other autolinked deps — resolved
  // to Swift names by the scaffold orchestrator before emit.
  coreReactNative: boolean,
  siblingNames: Array<string>,
  // Extra frameworks beyond the autolinker's default UIKit/Foundation/CoreGraphics
  // set. Merged with the defaults at emit time.
  extraFrameworks: Array<string>,
  weakFrameworks: Array<string>,
  // Compiler flags lifted from `s.compiler_flags`. Tokenized, ready for
  // `cxxSettings: [.unsafeFlags([...])]`.
  compilerFlags: Array<string>,
  // Public-headers strategy. `mappingsDir` (when set) drives publicHeadersPath
  // so the autolinker's centralized headers tree exposes `#import <SwiftName/...>`.
  publicHeadersPath: ?string,
  // Root-level headers (podspecs like `s.source_files = "*.{h,m,mm}"`) that the
  // scaffold writer mirrors into a generated include/<SwiftName>/ shim dir so
  // the CocoaPods header-map spelling `#import <SwiftName/Header.h>` resolves
  // for dependents (publicHeadersPath is then "include").
  namespacedShimHeaders: Array<string>,
  // File paths (relative to dep root) the emitter should declare as `.copy(...)`
  // resources on the target.
  resources: Array<string>,
  // Carried through from the PodspecModel; surfaced in the scaffold summary.
  warnings: Array<string>,
};

// Per-dep outcome from one scaffold run. The orchestrator returns an array
// of these so the CLI summary can print a structured table.
export type ScaffoldResult =
  | {
      depName: string,
      status: 'written',
      packageSwiftPath: string,
      warnings: Array<string>,
      // True when the dep's Package.swift already existed (a regen — slot
      // changed, --force, etc.); false on first-time scaffolds. The CLI
      // orchestrator prompts only for first-time scaffolds.
      previouslyExisted: boolean,
    }
  | {
      depName: string,
      status:
        | 'skipped-self-managed'
        | 'skipped-autogen'
        | 'skipped-scaffolder-marker'
        | 'skipped-no-ios'
        | 'skipped-no-podspec'
        | 'skipped-opt-out'
        | 'skipped-mixed-language'
        | 'skipped-is-react-native',
      reason: string,
    }
  | {
      depName: string,
      status: 'error',
      reason: string,
    };
*/

module.exports = {};
