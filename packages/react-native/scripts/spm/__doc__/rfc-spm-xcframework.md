---
title: Swift Package Manager Support for React Native iOS
author:
- Christian Falch
date: 2026-03-17
---

# RFC: Swift Package Manager Support for React Native iOS

## Summary

Add Swift Package Manager (SPM) as an officially supported build system for
React Native iOS apps, alongside CocoaPods. The approach uses **prebuilt
XCFrameworks** published to Maven, eliminating the need for source compilation
of React Native internals and enabling fast, reproducible builds.

## Basic example

### New project

```bash
npx react-native init MyApp
cd MyApp
npx react-native spm   # auto-detects first-run → init; prompts to rename legacy CocoaPods xcodeproj
npm run ios
```

A future CLI integration (e.g., an `--ios-build-system spm` flag on
`react-native init`) could run `react-native spm init` automatically as part
of project creation, eliminating the manual step.

### Existing project

```bash
cd MyApp
npx react-native spm
# Prompted: rename CocoaPods MyApp.xcodeproj → MyApp.xcodeproj.legacy?
# Accept (Y) — the SPM xcodeproj writes to the now-free MyApp.xcodeproj slot,
# `npm run ios` resolves to it unambiguously. The legacy stays on disk
# (git mv tracks the rename cleanly) for rollback via `spm clean --project`.
```

After initial setup, day-to-day development requires no extra commands. Adding
or removing JS dependencies that include native code is handled automatically
by a build-phase sync step (see [Auto-sync build phase](#auto-sync-build-phase)).

## Motivation

### Apple is moving away from CocoaPods

SPM is Apple's endorsed dependency manager. Xcode's SPM integration improves
with every release — package resolution, build caching, and IDE features all
assume SPM as the primary workflow. CocoaPods is community-maintained and has
been officially sunsetted — the CocoaPods trunk will become permanently
read-only on **December 2, 2026**, after which no new pods or updates can be
published ([announcement](https://blog.cocoapods.org/CocoaPods-Specs-Repo/)).
Existing builds will continue to work, but the ecosystem is moving on.

### Build speed

Prebuilt XCFrameworks skip compilation of ~2000 C++/Objective-C files. A clean
SPM build of rn-tester compiles only app sources and codegen output. This is a
significant improvement for CI pipelines and developer iteration speed.

### Reduced onboarding friction

CocoaPods requires Ruby, Bundler, and a working gem environment — a frequent
source of setup issues, especially on new machines or in CI. SPM requires only
Xcode. Removing the Ruby toolchain dependency simplifies onboarding and reduces
the surface area for environment-related build failures.

### Adoption barrier

Many organizations mandate SPM for iOS dependencies. Teams in these
environments are currently blocked from adopting React Native, or must maintain
custom workarounds. First-class SPM support might help overcoming this barrier.

### Compatibility

The SPM workflow generates an `AppName.xcodeproj` that takes the same
filename slot as the legacy CocoaPods xcodeproj. On `init`, the script
prompts to rename the existing CocoaPods project to `AppName.xcodeproj.legacy`
— preserving it for rollback while letting the community CLI's
`findXcodeProject` resolve `npm run ios` to the SPM project unambiguously.
Teams can migrate at their own pace before CocoaPods trunk goes read-only
in December 2026, and `spm clean --project` reverses the migration when
needed.

## Detailed design

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Maven (artifacts)                              │
│  ├── React.xcframework      (~200 MB, debug)    │
│  ├── ReactNativeDependencies.xcframework        │
│  └── hermes-engine.xcframework                  │
└──────────────────┬──────────────────────────────┘
                   │ download + cache
                   ▼
┌─────────────────────────────────────────────────┐
│  ~/Library/Caches/com.facebook.ReactNative/     │
│  └── spm-artifacts/{version}/{flavor}/          │
└──────────────────┬──────────────────────────────┘
                   │ symlink
                   ▼
┌──────────────────────────────────────────────────┐
│  App ios/                                        │
│  ├── AppName.xcodeproj/         (committed)      │
│  │   └── .spm-managed           (marker file)    │
│  ├── AppName.xcodeproj.legacy/  (committed if    │
│  │                               rename was      │
│  │                               accepted)       │
│  └── build/                                      │
│      ├── generated/                              │
│      │   ├── autolinking/       (generated)      │
│      │   │   ├── Package.swift                   │
│      │   │   ├── autolinking.json                │
│      │   │   ├── packages/      (synth wrappers) │
│      │   │   └── libs/          (alias symlinks  │
│      │   │                       for self-managed│
│      │   │                       deps; basename  │
│      │   │                       = SwiftName)    │
│      │   └── ios/               (codegen)        │
│      └── xcframeworks/          (symlinks)       │
│          ├── Package.swift                       │
│          ├── React.xcframework -> cache          │
│          ├── ReactNativeDependencies.xcframework │
│          └── hermes-engine.xcframework           │
└──────────────────────────────────────────────────┘
```

### Pipeline

`react-native spm` orchestrates six steps (the underlying script is
`scripts/setup-apple-spm.js`):

| # | Step | Script | Output |
|---|------|--------|--------|
| 1 | CLI config | `spm/generate-spm-autolinking-config.js` | `build/generated/autolinking/autolinking.json` |
| 2 | Codegen | `generate-codegen-artifacts.js` | `build/generated/ios/` |
| 3 | Autolinking | `spm/generate-spm-autolinking.js` | `build/generated/autolinking/Package.swift` + source symlinks |
| 4 | Download | `spm/download-spm-artifacts.js` | Cached xcframeworks |
| 5 | Package | `spm/generate-spm-package.js` | `build/xcframeworks/Package.swift` + symlinks |
| 6 | Xcodeproj | `spm/generate-spm-xcodeproj.js` | `AppName.xcodeproj` + `.spm-managed` marker (`init` only; create-if-missing on subsequent runs) |
| — | Sync (build-time) | `spm/sync-spm-autolinking.js` | Re-runs steps 1–5 when inputs change (downloads artifacts if missing) |

The `init` action additionally (a) prompts to rename any existing
CocoaPods `<App>.xcodeproj` to `<App>.xcodeproj.legacy` before step 6, and
(b) appends SPM-specific entries to `.gitignore`
(`build/generated/`, `build/xcframeworks/`, `.build/`, `Package.resolved`).
Existing entries are not duplicated.

### Auto-sync build phase

After initial setup, developers shouldn't need to re-run `react-native spm`
manually when dependencies change. The generated `.xcodeproj` includes a
**Sync SPM Autolinking** pre-build phase (ordered first, before VFS overlay)
that:

1. Checks whether xcframework artifacts are missing (`artifacts.json` or
   `React.xcframework` absent). This covers fresh clones where no setup
   script has been run yet.
2. Compares timestamps of `package.json`, `react-native.config.js`, and the
   `node_modules` directory against `autolinked/.spm-sync-stamp`. In
   monorepos where `node_modules` is hoisted, the parent directory is also
   checked.
3. If any check triggers (or the stamp is missing): sources `with-environment.sh`
   for node PATH, then runs `spm/sync-spm-autolinking.js` which re-executes
   codegen, artifact download (if needed), autolinking, and package generation.
4. If all inputs are fresh: exits immediately (~1ms shell check).

Failures emit `warning:` and exit 0 — the existing autolinking may still be
valid. The stamp file is written on successful sync.

The sync step handles React Native version changes automatically: after
`npm install` pulls a new version, the `node_modules` mtime changes, the sync
step regenerates autolinking and recreates xcframework symlinks pointing to the
new version's cache directory.

The sync step is **self-healing**: if xcframework artifacts are missing (e.g.,
the local cache at `~/Library/Caches/com.facebook.ReactNative/` was deleted,
or the project was freshly cloned), it automatically downloads them before
proceeding with autolinking and package generation. This means `react-native spm`
is only strictly required for initial project scaffolding (`init`); subsequent
builds recover automatically.

### Cleaning generated SPM state

Xcode's "Clean Build Folder" (Cmd+Shift+K) only removes DerivedData — it does
not touch the project's `build/` or `.build/` directories. Xcode provides no
hook to run custom scripts during GUI clean actions.

`react-native spm clean` is scoped by opt-in flags. The default removes only
generated dirs under `appRoot`:

```bash
react-native spm clean             # build/xcframeworks/, build/generated/, .build/
react-native spm clean --project   # also: delete SPM xcodeproj, restore .legacy backup
react-native spm clean --derived-data  # also: this app's Xcode DerivedData entries
react-native spm clean --cache         # also: cached xcframework slot for current version
react-native spm clean --all           # = --project --derived-data --cache
```

Destructive scopes (`--project`, `--derived-data`, `--cache`, `--all`) prompt
for confirmation (bypass with `--yes`). `--project` is the reverse of the
init-time rename migration — deleting the SPM xcodeproj and restoring
`<App>.xcodeproj.legacy` to its original filename if a backup exists.

After a plain `clean`, run `react-native spm update` (or open the checked-in
`.xcodeproj` and build) to regenerate state. SPM package resolution is locked
for the duration of a build — if only stubs were left in place, Xcode would
resolve stubs and never pick up the real packages generated by the sync build
phase.

### Stub packages for fresh clones

Xcode resolves SPM packages **before** any build phase runs. On a fresh clone,
the referenced package directories (`build/xcframeworks`, `autolinked`,
`build/generated/ios`) may not exist yet, causing package resolution to fail.

To solve this, `generate-spm-xcodeproj.js` writes **stub `Package.swift`
files** into each referenced sub-package directory that doesn't already have
one. Each stub defines the expected library products backed by a minimal
placeholder target (`.stub/Stub.swift`). This lets Xcode resolve packages
successfully even before the first build. On the first build, the auto-sync
build phase overwrites the stubs with real Package.swift files generated from
downloaded artifacts and autolinking output.

### Caching and CI

Xcframeworks are cached at
`~/Library/Caches/com.facebook.ReactNative/spm-artifacts/{version}/{flavor}/`
by default. The download step accepts a `--output` flag to write xcframeworks
to an explicit directory.

For CI pipelines (GitHub Actions, CircleCI, etc.), cache the default path
keyed by the React Native version and flavor to avoid re-downloading
xcframeworks on every build.

The Maven base URL can be overridden via the `ENTERPRISE_REPOSITORY`
environment variable for teams that mirror artifacts to an internal registry.

**Planned:** A `RN_SPM_CACHE_DIR` environment variable to override the default
cache directory. This is not yet implemented in the current POC but is needed
for CI environments where a specific path must be persisted across builds.

### Package graph

The generated `<App>.xcodeproj` references three local packages directly
via `XCLocalSwiftPackageReference` — no app-level `Package.swift` is required:

```
AppName.xcodeproj
  ├── XCLocalSwiftPackageReference → build/xcframeworks/Package.swift
  │     ├── ReactNative (product, wraps React binaryTarget)
  │     ├── ReactNativeDependencies (binaryTarget)
  │     └── hermes-engine (binaryTarget)
  ├── XCLocalSwiftPackageReference → build/generated/ios/Package.swift
  │     ├── ReactCodegen (target — codegen output)
  │     └── ReactAppDependencyProvider (target)
  └── XCLocalSwiftPackageReference → build/generated/autolinking/Package.swift
        └── <AutolinkedModule>... (targets — symlinked sources)
```

These three sub-package paths are **stable**: adding or removing community
deps changes the contents of `build/generated/autolinking/Package.swift`
(gitignored) but never the xcodeproj's references. That's why the
`.xcodeproj` is committed once and not regenerated on subsequent runs.

The xcodeproj generation is **create-if-missing** on `update` (use
`--force-xcodeproj` for an explicit overwrite). This protects user-side
Xcode edits — signing, capabilities, Build Phases, scheme settings — from
being clobbered. Teammates can clone the repo and open Xcode immediately:
stub `Package.swift` files in each sub-package directory let SPM resolution
succeed before the first build, and the auto-sync build phase downloads
artifacts and writes the real sub-packages on first compile.

### Header resolution

React Native uses CocoaPods-style imports (`#import <React/RCTBridge.h>`) that
SPM does not natively support. Two mechanisms solve this:

1. **XCFramework `Headers/` layout.** The prebuild step organizes headers by
   `header_dir` (e.g., `Headers/React/`, `Headers/react/renderer/core/`).
   Adding `-I Headers` to search paths resolves most imports directly.

2. **VFS overlay.** A Clang virtual filesystem overlay (`React-VFS.yaml`)
   remaps remaining edge cases — headers that appear in multiple pods or have
   platform variants. The overlay is generated as a template at prebuild time
   and resolved with local paths at setup time.

### Local native modules

Modules not discovered via autolinking (e.g., app-specific native modules) are
declared in `react-native.config.js`:

```js
// react-native.config.js
module.exports = {
  spmModules: [
    {
      name: 'MyNativeModule',       // SPM target name
      path: 'ios/MyNativeModule',   // path to source files
      exclude: ['*.podspec'],       // files to exclude from the target
      publicHeadersPath: '.',       // header search path for consumers
    },
  ],
};
```

Each entry becomes a target in `autolinked/Package.swift`. Sources outside the
autolinked directory are mirrored with **file-level symlinks** (SPM rejects
directory symlinks that resolve outside the package root).

### Self-managed deps and package identity

A community library that ships its own `Package.swift` (instead of being
wrapped by the autolinker) is referenced directly. SPM derives the package
identity for a `.package(path:)` dependency from the path's basename — and
a common convention is to ship the manifest inside an `ios/` subdir
(`<dep>/ios/Package.swift`). Two libs following that convention would both
have identity `"ios"`, and SPM rejects with `Conflicting identity for ios`.

To make every reference globally unique by construction, the autolinker
materializes each self-managed dep as a symlink at
`build/generated/autolinking/libs/<SwiftName>/` pointing at the dep's real
manifest dir. The aggregator `Package.swift` then references the symlink
(`path: "libs/<SwiftName>"`), and SPM uses the symlink basename — the
library's Swift module name — as the package identity. Swift module names
are already unique per dep (deriving from the npm package name), so this
sidesteps the collision in all cases, including against the codegen
package at `build/generated/ios/`.

The `libs/` directory is wiped and recreated on every autolinker run, so
stale aliases for uninstalled deps disappear automatically.

### Third-party library support

The current implementation handles React Native's own frameworks and app-local
native modules. The primary goal for third-party libraries is to **build using
SPM**. Shipping prebuilt xcframeworks is the recommended approach for faster
builds, but it is not a requirement — libraries can also be compiled from
source via SPM targets. This ensures that library authors with limited
resources can support SPM without needing to set up a prebuild CI pipeline.

#### Library metadata in `react-native.config.js`

`react-native.config.js` is the canonical place for library SPM metadata. The
autolinking pipeline already scans `node_modules` for this file to discover
iOS and Android native modules. Adding SPM config alongside the existing
`dependency.platforms.ios` keeps a single source of truth, requires no new
discovery mechanism, and can express things `Package.swift` cannot — such as
Maven URL templates with version and flavor placeholders for downloading
prebuilt xcframeworks. Libraries may still ship a `Package.swift` for direct
SPM consumers outside the React Native ecosystem, but React Native autolinking
reads `react-native.config.js`.

#### Prebuilt xcframeworks (primary path)

React Native already prebuilds its core into xcframeworks and publishes them to
Maven. This is the model we want every library to follow. Libraries declare SPM
metadata in `react-native.config.js`:

```js
// react-native-maps/react-native.config.js
module.exports = {
  dependency: {
    platforms: {
      ios: { /* existing autolinking config */ },
    },
  },
  spm: {
    // Primary: prebuilt xcframework (downloaded at setup time)
    xcframework: {
      name: 'ReactNativeMaps',
      // URL template — {version}, {rn-version}, {flavor} resolved at download time
      url: 'https://maven.example.com/.../react-native-maps-{version}-xcframework-{flavor}.tar.gz',
    },
    // Fallback: source compilation (used during local development or when
    // xcframework is unavailable)
    source: {
      name: 'ReactNativeMaps',
      path: 'ios',
      publicHeadersPath: '.',
      exclude: ['*.podspec', 'Tests/**'],
      dependencies: ['MapKit'],
      resources: ['ios/Resources/**'],
    },
  },
};
```

**Planned (Phase 2):** When `react-native spm` gains third-party library
support, it will:
1. If `spm.xcframework` is declared, download the prebuilt binary (fast path).
2. If the download fails or the `--source` flag is passed, fall back to
   `spm.source` and compile from symlinked sources.
3. If neither is declared, the library requires a manual `spmModules` entry.

Currently, only `spmModules` entries (see [Local native modules](#local-native-modules))
are supported. The `spm.xcframework` and `spm.source` config fields — including
the `dependencies` field shown above — are not yet implemented.

#### Source compilation (fallback)

Source-level autolinking (`spmModules` / `spm.source`) remains available for:
- **Local development** — library authors iterating on native code
- **Libraries without prebuilt xcframeworks** — transitional state
- **App-specific native modules** — code that lives in the app repo

This reuses the existing `spmModules` mechanism: sources are mirrored with
file-level symlinks into `autolinked/`, compiled as SPM targets with
appropriate header search paths.

#### `react-native-prebuild` CLI

React Native already has a mature prebuild pipeline (`scripts/ios-prebuild/`)
that produces signed, packaged xcframeworks published to Maven. Rather than
asking library authors to reinvent this, we can expose the same tooling as a
reusable CLI:

```bash
npx react-native-prebuild \
  --podspec ios/MyLibrary.podspec \
  --react-native-version 0.80.0 \
  --platforms ios,ios-simulator \
  --flavor release \
  --output dist/

# Output:
# dist/MyLibrary.xcframework.tar.gz
# dist/MyLibrary.framework.dSYM.tar.gz
```

The tool would:

1. **Download React Native xcframeworks** for the specified version.
2. **Parse the library's podspec** to discover source files, headers,
   `header_dir`, dependencies, and compiler flags.
3. **Generate a temporary Package.swift** declaring the library as a target
   with dependencies on the RN xcframeworks.
4. **Build** using `xcodebuild` for each platform slice.
5. **Compose** the xcframework with organized headers, module map, and
   optional VFS overlay.
6. **Sign** the xcframework with the developer's code signing identity.
7. **Package** as `.tar.gz` with dSYM symbols.

The tool includes code signing as a built-in step. Library authors provide
their own signing identity (Apple Developer certificate); the tool handles
the `codesign` invocation. Unsigned xcframeworks trigger macOS Gatekeeper
warnings, so signing is strongly recommended for distributed artifacts.
Documentation will cover how to create and manage a signing identity for
this purpose.

Library authors can integrate this into CI to publish prebuilt artifacts on
every release, targeting a matrix of React Native versions and build flavors.

#### Version compatibility

A library's xcframework must be built against a compatible React Native
version. The prebuild tool embeds metadata (React Native version, library
version, build flavor, minimum iOS version) inside the xcframework. The
download step verifies compatibility at setup time, warning if a library was
built against a different React Native version than the app is using.

## Drawbacks

### Transition period: supporting both CocoaPods and SPM

With CocoaPods trunk going read-only in December 2026, the migration to SPM is
necessary rather than optional. During the transition period, both build
systems must be supported in parallel. Bug fixes, new features, and build-phase
changes need to be tested against both CocoaPods and SPM until CocoaPods
support is eventually removed.

### Download size

Prebuilt xcframeworks for React Native core are compressed as tar.gz archives.
Individual library xcframeworks are typically 1–15 MB in debug mode including
dSYM bundles. Both debug and release flavors are needed, which doubles the
total. While artifacts are cached locally after the first download, CI
environments without persistent caches will re-download on every build.

### Ecosystem adoption takes time

Third-party libraries must opt in to the prebuild workflow. During the
transition period, many libraries will only support CocoaPods. Apps that depend
on these libraries cannot fully migrate to SPM until the libraries catch up.
This creates a chicken-and-egg problem that may slow adoption.

### SPM limitations require `.xcodeproj` generation

SPM does not support build script phases, `post_install` hooks, or the kind of
build-time customization that CocoaPods provides via its Podfile DSL. The
current design works around this by generating an `.xcodeproj` with explicit
build phases for JS bundling, Hermes engine copying, VFS overlay setup, and
autolinking sync. This is a known limitation of the current approach. If Apple
expands SPM's plugin API to support arbitrary script execution with file I/O
and network access, the `.xcodeproj` could be eliminated in favor of a purely
SPM-native workflow — but this is a future direction that depends on Apple's
roadmap, not something this proposal can resolve.

### Committed xcodeproj edits

The generated `<App>.xcodeproj` is committed and may carry user edits —
signing, capabilities, Build Phases, custom schemes. The `update` action is
**create-if-missing** to protect those edits, which means the script does
not propagate generator improvements into existing projects automatically.
Bug fixes that change the emitted pbxproj need an explicit
`--force-xcodeproj` run to take effect. A future improvement could
preserve user-side edits through a merge step rather than full overwrite —
see "Hardening `update --force-xcodeproj`" in unresolved questions.

## Alternatives

### Compile React Native from source as SPM targets

Compiling React Native's C++/Objective-C sources from source as SPM targets is
not the default path due to the ~2000 source files and complex header layout,
which makes clean build times significantly longer. However, source
compilation support is a goal for specific use cases:

- **Debugging React Native internals** — developers investigating bugs or
  contributing fixes to React Native itself need to build from source with
  debug symbols.
- **Apps requiring source patches** — projects like Expo Go that need to modify
  React Native source code to build successfully, or apps that apply patches
  via tools like `patch-package`.

The source compilation path would reuse the same SPM package structure but
replace binary xcframework targets with source targets. This is planned as a
`--source` flag to `react-native spm`.

### SPM build tool plugins

SPM plugins were evaluated as a way to eliminate the `.xcodeproj` (see
[SPM Plugins Assessment](spm-plugins-assessment.md) for details). The key
findings:

- **Post-build phases are impossible.** JS bundling and Hermes engine copying
  run after linking to place artifacts in the `.app` bundle. SPM has no
  post-build plugin capability — this is a deliberate design choice for build
  reproducibility.
- **Sandbox restrictions.** Build tool plugins cannot write to the source tree,
  run `node`, or access `node_modules`. Pre-build phases like autolinking sync
  require all of these.
- **No Xcode build settings.** SPM plugins do not receive `CONFIGURATION`,
  `BUILT_PRODUCTS_DIR`, or other settings that the JS bundling script relies on.

A hybrid approach (some SPM plugins + some Xcode build phases) would be harder
to reason about than the current uniform approach of all Xcode build phases.
SPM plugins are not a viable alternative today.

## Adoption strategy

This proposal introduces SPM as an **additional** build system. It is not a
breaking change. CocoaPods continues to work exactly as before. The two
workflows coexist — an app can have both `Podfile` and `Package.swift` in the
same directory.

### Phase 1: React Native core (current)

SPM works for React Native core frameworks and app-local native modules
declared as `spmModules` in `react-native.config.js`. No third-party library
support. This phase validates the architecture and developer experience with
rn-tester and the helloworld template.

### Phase 2: Library ecosystem tooling

Ship the `react-native-prebuild` CLI. Library authors can prebuild and publish
xcframeworks for their libraries. The autolinking step reads `spm.xcframework`
from installed libraries and downloads artifacts automatically. Libraries
without xcframeworks fall back to `spm.source` (source compilation) or manual
`spmModules` entries.

### Phase 3: Ecosystem-wide adoption

Popular libraries ship prebuilt xcframeworks from CI. App developers get
near-zero-compilation iOS builds — only app code and codegen output are
compiled. React Native provides clear documentation and tooling
(`react-native-prebuild`) to help library authors build and publish
xcframeworks — for example, CI workflow templates and guidance on publishing to
Maven or GitHub Releases. Prebuilt xcframeworks are recommended but not
required; libraries that don't provide them fall back to source compilation.

### Migration path for existing apps

1. Run `npx react-native spm` from the project root (auto-redirects into
   `ios/`).
2. Accept the rename prompt — your existing `AppName.xcodeproj` becomes
   `AppName.xcodeproj.legacy` (preserved for rollback).
3. Commit the new `AppName.xcodeproj/` (SPM-managed) and the renamed
   `AppName.xcodeproj.legacy/`. `git mv` tracks the rename cleanly.
4. Run `npm run ios` and verify the SPM build.
5. Once validated, optionally delete the `.legacy` backup, `Podfile`,
   `Pods/`, and `.xcworkspace`.

To roll back: `npx react-native spm clean --project` deletes the SPM
xcodeproj and renames `.legacy` back to the canonical filename.

No changes to JavaScript code, Metro configuration, or Android setup are
required.

### Upgrading React Native

After upgrading `react-native` in `package.json` and running `npm install`,
the auto-sync build phase detects the `node_modules` mtime change on the next
Xcode build and re-runs the sync step automatically. This downloads the new
version's xcframeworks, regenerates the sub-packages, and updates autolinking.
No manual edits are needed — the xcodeproj's sub-package references are
stable, and those sub-packages are fully regenerated each run. Developers
can also run `react-native spm` manually to trigger the update before
building.

## How we teach this

### Documentation

- Add a **"Building with SPM"** guide to the React Native docs, parallel to the
  existing CocoaPods setup guide.
- Update the **"Getting Started"** guide to present SPM as an option alongside
  CocoaPods, with SPM as the recommended path for new projects once Phase 2 is
  stable.
- Add a **library author guide** explaining how to use `react-native-prebuild`
  and publish xcframeworks.

### CLI discoverability

- `react-native spm --help` should provide clear usage instructions and
  explain each step.
- Error messages should include actionable suggestions (e.g., "Run
  `react-native spm init` for first-time setup").
- The auto-sync build phase should surface warnings in Xcode's issue navigator
  when autolinking state is stale.

### Community template

- The `react-native init` template should include SPM as an option (e.g.,
  `--pm spm` flag or interactive prompt).
- The template should generate the initial `Package.swift` and `.xcodeproj` so
  that new projects work with SPM out of the box.

### Naming and terminology

- **"SPM build"** or **"Swift Package Manager build"** to distinguish from the
  CocoaPods-based workflow.
- **"xcframeworks"** when referring to the prebuilt binary artifacts.
- Avoid the term "pods" when discussing the SPM workflow to prevent confusion.

## Unresolved questions

1. **How should version compatibility be enforced?** A library's xcframework
   must be built against a compatible React Native version. Should the download
   step enforce strict version matching, accept semver-compatible ranges, or
   simply warn on mismatch?

2. **Where should library xcframeworks be hosted?** Maven Central (consistent
   with React Native core), GitHub Releases (simpler for library authors), or a
   dedicated registry (better discovery and compatibility metadata). Each has
   different trade-offs for discoverability, reliability, and maintenance
   burden.

3. **Debug symbol (dSYM) distribution.** The prebuild pipeline produces dSYM
   bundles alongside xcframeworks, but the best way to distribute and consume
   them is not yet defined. Open questions include: should dSYMs be downloaded
   alongside xcframeworks automatically or on demand? How should they integrate
   with crash reporting services (Sentry, Crashlytics) that need dSYM UUIDs
   for symbolication? Should the download step place dSYMs in a location that
   Xcode's archive workflow picks up automatically?

4. **How should library authors validate SPM compatibility?** A validation
   command (`react-native-prebuild --validate`) could verify that a library's
   sources compile as an SPM target without producing a full release artifact.
   This would be useful for CI checks on pull requests.

5. **Hardening `update --force-xcodeproj`.** The default `update` is
   create-if-missing, which preserves user edits but means generator
   improvements don't propagate to existing projects automatically. Passing
   `--force-xcodeproj` clobbers everything. A future improvement could read
   the existing pbxproj, merge changes (signing, capabilities, custom Build
   Phases), and write back — likely via a proper Xcode project
   parser/generator (e.g., `@bacons/xcode`) rather than the current
   template-based approach. Planned work for production readiness.

6. **Auto-sync failure visibility.** The sync build phase currently emits
   `warning:` and exits 0 on failure, which means a broken autolinking state
   can persist silently across builds. Planned improvements include a strict
   mode (e.g., `RN_SPM_STRICT_SYNC=1` that exits non-zero on failure) and
   generating a `#warning` directive in a source file when sync fails, so
   Xcode surfaces the issue in the issue navigator even when build log
   warnings are missed.

7. **Monorepo and package manager compatibility.** The auto-sync build phase
   uses `node_modules` mtime to detect dependency changes. This has been
   tested with npm in the React Native monorepo but not yet with Yarn
   workspaces (hoisted or PnP), pnpm (symlinked `node_modules`), or Bun.
   These package managers structure `node_modules` differently and may require
   adjustments to the mtime detection logic. Validating and fixing
   compatibility across package managers is planned work.

## References

- [RFC0508: Out-of-NPM Artifacts](https://github.com/react-native-community/discussions-and-proposals/blob/main/proposals/0508-out-of-npm-artifacts.md) — established the Maven-based artifact distribution pattern this proposal builds on
- [Apple: Creating Swift Packages](https://developer.apple.com/documentation/xcode/creating-a-standalone-swift-package-with-xcode)
- [SE-0272: Package Manager Binary Dependencies](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0272-swiftpm-binary-dependencies.md)
