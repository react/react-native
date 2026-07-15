# SwiftPM Scripts – React Native iOS via Swift Package Manager (Preview)

> **Preview.** SwiftPM support is an early preview: the commands, flags,
> generated layout, and distribution model may change in future releases, and
> it is not yet recommended for production. Feedback is welcome. CocoaPods
> remains the supported default.

Build React Native iOS apps using **Swift Package Manager** with prebuilt
XCFrameworks, as an alternative to CocoaPods. It is **opt-in and additive** —
CocoaPods remains the default; `spm` injects into your existing `.xcodeproj`
in place and is fully reversible.

## Quick Start

```bash
cd ios

# First-time setup: injects SwiftPM packages into your existing MyApp.xcodeproj,
# in place. `npx react-native spm` with no action auto-resolves to `add` (or
# `update` once injected); on a fresh CocoaPods app it converts in one command
# (implies --deintegrate). To do it explicitly:
npx react-native spm add --deintegrate

# Open in Xcode (or `npm run ios`). Incremental dep changes auto-sync on build.
open MyApp.xcodeproj
```

After the initial run, the `.xcodeproj` includes an **auto-sync build phase**
that detects dependency changes and re-runs autolinking before compilation
(see [Auto-Sync](#auto-sync-build-phase)) — you don't re-invoke
`react-native spm` manually for day-to-day dependency changes. **On a fresh
clone or CI checkout, run `npx react-native spm` once before building** (see
[Fresh clones & CI](#fresh-clones--ci)).

> **Note:** `react-native spm` is a thin wrapper over
> `node node_modules/react-native/scripts/setup-apple-spm.js`. If the CLI
> alias is unavailable in your environment, invoke the script directly with
> the same actions and the kebab-case flag equivalents (e.g.
> `--skip-codegen`).

## CocoaPods → SwiftPM migration

`spm add` injects into a project that is **not** CocoaPods-integrated. On a
CocoaPods app it fails loud and points you at `--deintegrate`, which:

1. runs `pod deintegrate` — removes CocoaPods integration from the
   `.xcodeproj` (Pods references, `[CP]` build phases, xcconfig links). Your
   `Podfile` is left on disk.
2. strips **only** the React Native directives (`use_react_native!`,
   `use_native_modules!`, `prepare_react_native_project!`) from the Podfile —
   every other line, **including your own `pod '…'` entries, is preserved**.
3. injects SwiftPM into the `.xcodeproj`.

React Native now comes from SwiftPM; no pods are linked yet (deintegrate
removed the integration).

### Keeping non-RN pods

Non-RN pods can stay side-by-side. After `spm add --deintegrate` your Podfile
still lists them (only the RN directives were removed) — re-integrate them
with a normal install:

```bash
pod install     # re-integrates the remaining (non-RN) pods; (re)creates the .xcworkspace
```

Then **open the `.xcworkspace`** (not the `.xcodeproj`): the workspace includes
the SwiftPM-injected project, so React Native resolves through SwiftPM and your
other pods through CocoaPods, together.

> **Do not re-add `use_react_native!`.** React Native must be provided by
> _either_ SwiftPM _or_ CocoaPods, never both — they share `build/generated/`,
> so a dual-managed RN does not build. `spm add` refuses to run while the
> Podfile still declares `use_react_native!`.

The migration is fully reversible — see
[Removing / resetting](#removing--resetting).

## Brownfield apps

`spm add` injects into your existing `.xcodeproj` in place, so an app that
embeds React Native works the same way — point it at the right project and
target:

```bash
npx react-native spm add --xcodeproj MyApp.xcodeproj --productName MyApp
```

**Requirement:** the `.xcodeproj` must live **inside the React Native JS tree**
— i.e. the app's `package.json` is a parent directory of the project. Both
setup and the build-time sync locate React Native by walking up from the
project to the nearest `package.json`. The common "native project at the repo
root with the RN JS in a sibling/child subfolder" layout is **not supported
yet** — there is no way to point at a JS root outside the project's ancestors.

Brownfield apps that keep CocoaPods for their other native dependencies follow
the [coexistence rules above](#keeping-non-rn-pods): React Native from SwiftPM,
everything else from CocoaPods, and no `use_react_native!` in the Podfile.

## CLI Actions

```bash
react-native spm [action] [options]
```

With no action, the command **auto-resolves**: if SwiftPM has been injected
(`.spm-injected.json` marker present) it routes to `update`; otherwise `add`.
On a freshly-scaffolded CocoaPods project (clean git tree, stock Podfile) the
zero-arg path additionally implies `--deintegrate` (the safe-gate), so
`npx react-native spm` converts a brand-new app to SwiftPM in one command.

When invoked from the JS root of a standard RN app (sibling `ios/` subdir),
the command auto-redirects into `ios/` with a banner.

| Action | Description |
|---|---|
| `add` | Inject SwiftPM packages (package refs, build settings, the Sync build phase) into the existing `.xcodeproj`, in place. Idempotent. Default on first run. `--deintegrate` first runs `pod deintegrate` + strips React Native from the Podfile. |
| `update` | Re-run the pipeline and refresh the existing injection. Default once a project is injected. |
| `deinit` | The exact inverse of `add`: surgically remove only what `add` injected (recorded in `.spm-injected.json`) and drop the marker. Git-recoverable; no prompt. |
| `scaffold` | Generate `Package.swift` into `node_modules/<dep>/` for community RN libraries that ship only a podspec. |
| `sync` (advanced) | Lightweight resync invoked by the Xcode auto-sync build phase. Regenerates invariant codegen and autolinking output only. Not for humans. |
| `codegen` (advanced) | Run codegen and install the SwiftPM codegen template only. |
| `download` (advanced) | Download/check xcframework artifacts only. |

## CLI Options

Flags below use the `react-native spm` (camelCase) form. The raw script
accepts kebab-case equivalents (e.g. `--skip-codegen`).

| Option | Description |
|---|---|
| `--version <ver>` | RN version (default: from package.json) |
| `--yes` | Skip the dirty-pbxproj confirmation prompt |
| `--xcodeproj <path>` | [add] Which `.xcodeproj` to inject into (when several exist) |
| `--productName <name>` | [add] Which app target to inject into (when several exist) |
| `--deintegrate` | [add] Run `pod deintegrate` + strip React Native from the Podfile before injecting |
| `--artifacts <path>` | [advanced] Local artifact root containing complete `debug/` and `release/` cache slots |
| `--download <auto\|skip\|force>` | [advanced] Artifact download policy (default: auto) |
| `--skipCodegen` | [advanced] Skip the codegen step |

### Debug/Release flavor is automatic

React Native ships **flavored** prebuilt binaries: the *debug* `React.framework`
(and `hermesvm` / `ReactNativeDependencies`) carry the dev experience — dev menu,
assertions, `RN_DEBUG_STRING_CONVERTIBLE` — while *release* strips them for
production. A Debug build must embed the debug binaries and a Release/archive the
release ones.

SwiftPM `binaryTarget`s can't branch on the build configuration, so runtime
frameworks are deliberately kept out of the package graph. `spm add` downloads
and validates **both** flavors into immutable app-local slots. It injects
SDK/architecture-qualified Xcode settings that link the exact selected binaries,
plus one phase that copies and signs the selected frameworks into the app.
Configurations containing `debug` or `development` select Debug; every other
configuration selects Release. Selection uses only generated build settings and
standard macOS tools: builds do not run Node, mutate symlinks, regenerate the
package graph, or require a second build.

## What to commit

| Path | Commit? | Why |
|------|---------|-----|
| `MyApp.xcodeproj/` | Yes | Your project, with SwiftPM injected in place. Holds your signing, capabilities, Build Phases — `add` only adds SwiftPM refs/settings, additively. |
| `MyApp.xcodeproj/.spm-injected.json` | Yes | Marker recording every edit `add` made, so `deinit` can surgically reverse it and re-runs stay idempotent. |
| `build/generated/` | No | Codegen/autolinking output; regenerated |
| `build/xcframeworks/` | No | Symlinks to the machine-local artifact cache |
| `Package.resolved` | No | SwiftPM resolution file; machine-specific |

Injection is **purely additive** and **idempotent**: `add`/`update` insert only
SwiftPM package refs, the React build settings, the Sync build phase, and a scheme
pre-action — every other byte (your signing / capabilities / Build Phases)
stays untouched, and a re-run is a no-op. The injected refs point at three
stable sub-package paths under `build/`; adding or removing community deps
changes the sub-package contents (gitignored) and never re-injects. `deinit`
removes exactly what was injected (using the marker), leaving the project
byte-identical to its pre-`add` state.

Because everything under `build/` is gitignored, a clean checkout has no
resolvable Swift packages until they are regenerated — see the next section.

## Fresh clones & CI

Xcode resolves the Swift package graph **before any build phase runs**, so on a
clean checkout (where the gitignored `build/` packages don't exist yet) the
auto-sync build phase can't regenerate them in time — a bare `xcodebuild`
fails at *"Resolve Package Graph … build/generated/autolinking doesn't exist"*.

Run the setup command once after cloning, before building — the SwiftPM analog
of `pod install`:

```bash
npx react-native spm      # downloads artifacts (if missing) + regenerates build/
```

On an already-injected project this routes to `update`: it fetches the
xcframework artifacts into the shared cache if they aren't present and
regenerates `build/xcframeworks` + `build/generated`. After this first run,
incremental dependency changes are picked up automatically by the auto-sync
build phase.

**Automate it** so nobody has to remember — add a `postinstall` hook, which
runs as part of the `npm install` / `yarn install` your CI already does before
`xcodebuild`:

```json
{
  "scripts": {
    "postinstall": "react-native spm"
  }
}
```

`npx react-native spm` auto-redirects from the JS root into `ios/`, so the hook
works from the app root; in CI (non-interactive) it proceeds without prompting.
It re-runs the full pipeline (codegen + an idempotent re-inject that is a no-op
when nothing changed), so it is slightly heavier than the internal `sync` the
build phase calls — a fine trade for not having to remember a command.

> A future remote-package distribution (a tagged `Package.swift` repo +
> `binaryTarget(url:checksum:)`) removes this step entirely: SwiftPM resolves and
> fetches the artifacts itself during normal package resolution. Until then,
> the one-time setup run is required on clean machines.

## Local Native Modules

Modules not discovered via autolinking can be declared in `react-native.config.js`:

```js
module.exports = {
  spm: {
    modules: [
      {
        name: 'MyNativeModule',
        path: 'ios/MyNativeModule',       // relative to app root
        exclude: ['*.podspec'],            // optional
        publicHeadersPath: '.',            // optional
      },
    ],
  },
};
```

Each entry becomes a target in `build/generated/autolinking/Package.swift`.
Sources outside `build/generated/autolinking/` are automatically mirrored with
file-level symlinks.

## Self-managed community packages

A community library that ships its own `Package.swift` is referenced
directly by the autolinker instead of being wrapped. To keep SwiftPM's
package identity (which it derives from the path basename) unique across
deps — even when several libs put their manifest inside an `ios/` subdir
— each self-managed dep is exposed through a uniquely-named symlink at
`build/generated/autolinking/libs/<SwiftName>/`. The aggregator
`Package.swift` references that path, so two libs both shipping
`<dep>/ios/Package.swift` never collide on identity `"ios"`.

The `libs/` directory is wiped and recreated on every autolinker run,
so deleting a dep via `npm uninstall` cleans up the alias automatically
on the next build.

## Community packages without a Package.swift

If an autolinked library ships **no `Package.swift`**, the build fails with a
clear per-dep error (`Package.swift is missing for library "<name>"`). Generate
one from the library's podspec:

```bash
npx react-native spm scaffold      # writes Package.swift into node_modules/<dep>/
```

Because `node_modules/` isn't committed, persist it so it survives the next
install:

```bash
npx patch-package <dep>            # then commit the generated patch
```

**Better: contribute the manifest upstream.** The generated `Package.swift` is
a normal, committable manifest — the ideal fix is for the library to ship it
itself, so every consumer gets SwiftPM support without a local patch. Please
**file an issue or open a PR on the library** with the scaffolded
`Package.swift` (mention it was generated by `react-native spm scaffold` for
React Native SwiftPM support). Until it lands upstream, the `patch-package`
workaround keeps your app building.

> A library whose sources mix Swift **and** Objective-C/C++ in one target, or
> that ships neither a `Package.swift` nor a podspec, can't be scaffolded
> automatically — the error says so. Opt it out via `react-native.config.js`
> (`platforms.ios = null`) or ask the maintainer for a prebuilt xcframework.

## Framework plugins (Preview)

Frameworks with their own module system (e.g. Expo) contribute to the
autolinking graph through a **plugin** — a function invoked on every
regeneration (including the build-time sync) that adds SwiftPM package refs,
product dependencies, and generated sources. Discovery is transitive
(installing the framework is enough), and the plugin returns data that RN
merges idempotently.

See **[spm-autolinking-plugins.md](./spm-autolinking-plugins.md)** for the
discovery mechanism, the full context/return contract, lifecycle, and failure
behavior.

## Removing / resetting

To remove SwiftPM entirely, use `deinit` (the inverse of `add`):

```bash
react-native spm deinit   # surgically removes everything `add` injected
pod install               # then, to restore CocoaPods
```

To reset the regenerable build state (without un-injecting), just delete the
gitignored dirs and re-run:

```bash
rm -rf build/xcframeworks build/generated .build
react-native spm update
```

Xcode's "Clean Build Folder" (Cmd+Shift+K) only removes DerivedData — it does
not touch SwiftPM-generated directories. The cached xcframework slot is shared
across apps; refresh it with `react-native spm update --download force`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `xcodebuild` fails: "Could not resolve package dependencies … `build/generated/autolinking` doesn't exist" | Fresh clone — run `npx react-native spm` once before building (see [Fresh clones & CI](#fresh-clones--ci)) |
| `spm add` fails: "CocoaPods-integrated project" | Re-run `spm add --deintegrate` (runs `pod deintegrate` + strips RN from the Podfile), or `pod deintegrate` yourself first. |
| `spm add` fails: "no .xcodeproj found" | Create an app first (`npx @react-native-community/cli init`) or make a project in Xcode, then `spm add`. |
| `spm add` fails: "multiple .xcodeproj found" | Pass `--xcodeproj <path>` (and `--product-name <target>` if multiple app targets). |
| Missing headers | Re-run `react-native spm` |
| "not contained in target" | Re-run setup (regenerates file-level symlinks) |
| Codegen fails | Use `--skipCodegen` to iterate on other parts |
| "SPM sync failed" warning | Check Xcode build log for details; node may not be in PATH — ensure `with-environment.sh` is present |
| Autolinking not updating on build | Touch `package.json` to force a sync, or delete `build/generated/autolinking/.spm-sync-stamp` |
| Stale SwiftPM state or corrupted build | `rm -rf build/ .build/`, then `react-native spm update`, then reopen Xcode |
| Want to revert to CocoaPods | `react-native spm deinit`, then `pod install` |

---

# Reference / internals

## Pipeline

`react-native spm add` and `react-native spm update` orchestrate these steps:

| Step | Script | Output |
|------|--------|--------|
| 1. CLI config | `spm/generate-spm-autolinking-config.js` | `build/generated/autolinking/autolinking.json` |
| 2. Codegen | `generate-codegen-artifacts.js` | `build/generated/ios/` |
| 3. Autolinking | `spm/generate-spm-autolinking.js` | `build/generated/autolinking/Package.swift` |
| 4. Download | `spm/download-spm-artifacts.js` | Complete Debug and Release cache slots |
| 5. Package | `spm/generate-spm-package.js` | Immutable flavor slots, central manifest, canonical `ReactHeaders`, and invariant `Package.swift` |
| 6. Inject | `spm/generate-spm-xcodeproj.js` | Invariant SwiftPM products plus configuration-qualified linker settings and the embed/sign phase |
| Auto-sync | `spm/sync-spm-autolinking.js` | Re-runs invariant codegen/autolinking output only at Xcode build time |

## Directory Layout

```
my-app/ios/
  MyApp.xcodeproj/                 <-- committed (your project; SwiftPM injected in place, carries .spm-injected.json)
  Podfile                          <-- present until `pod deintegrate` (CocoaPods coexistence is best-effort)
  build/
    generated/
      autolinking/                 <-- gitignored (regenerated at build time)
        Package.swift
        autolinking.json
        packages/                  <-- synth wrappers for autolinker-managed deps
        libs/                      <-- symlinks to self-managed deps' Package.swift
                                       dirs, named by Swift module so SwiftPM
                                       package identity stays unique
        headers/                   <-- generated header symlinks
      ios/                         <-- gitignored, codegen output
    xcframeworks/                  <-- gitignored, immutable runtime flavor slots + invariant package
      debug/
        React.xcframework -> ~/Library/Caches/.../debug/React.xcframework
        ReactNativeDependencies.xcframework -> ...
        hermes-engine.xcframework -> ...
      release/
        React.xcframework -> ~/Library/Caches/.../release/React.xcframework
        ReactNativeDependencies.xcframework -> ...
        hermes-engine.xcframework -> ...
      ReactHeadersTarget/          <-- canonical Objective-C React headers + module map
      ReactNativeHeaders.xcframework -> ...
      ReactNativeDependenciesHeaders.xcframework -> ...
      flavored-frameworks.json
      .artifact-stamp
```

## Header Resolution

React Native uses CocoaPods-style imports (`#import <React/RCTBridge.h>`) that
SwiftPM doesn't natively support. The prebuilt artifacts serve them through SwiftPM
package products — no `-I` search-path flags, and no clang VFS overlay:

1. **`<React/…>` and `import React`** resolve through the invariant
   **`ReactHeaders` Clang target**. It stages one canonical header copy after
   proving Debug and Release expose identical public headers, and uses a plain
   `module React` module map with `React/`-prefixed paths.
2. **Lowercase C++ `react/` and every other RN namespace** (`yoga/`, `jsi/`,
   `jsinspector-modern`, …) comes from **`ReactNativeHeaders.xcframework`**, a
   headers-only (LIBRARY-type) binaryTarget whose per-slice `Headers/` SwiftPM
   auto-serves to dependents.
3. **Third-party dependency namespaces** (`folly/`, `glog/`, `boost/`, `fmt/`,
   `double-conversion/`, `fast_float/`, `SocketRocket/`) come from
   **`ReactNativeDependenciesHeaders.xcframework`**, the deps headers-only
   sidecar (same mechanism — the binary `ReactNativeDependencies.xcframework`
   is framework-type and can't expose those headers to SwiftPM).

Targets that compile against React take these as product dependencies
(`ReactHeaders`, `ReactNativeHeaders`, `ReactNativeDependenciesHeaders`, plus the
app's `ReactAppHeaders`), so all of the above resolve with zero search-path
flags.

## Auto-Sync Build Phase

The generated `.xcodeproj` includes a **Sync SPM Autolinking** shell script
build phase. It keeps `build/generated/autolinking/Package.swift` up to date
without requiring manual re-runs of `react-native spm` for incremental
dependency changes. (It cannot bootstrap a fresh clone — Xcode resolves the
package graph before any phase runs; see [Fresh clones & CI](#fresh-clones--ci).)

**How it works:**

1. Compares timestamps of staleness inputs against `build/generated/autolinking/.spm-sync-stamp`:
   - `package.json` — dependency declarations
   - `react-native.config.js` — `spm.modules` config
   - `node_modules/` directory mtime — updated by any package manager (npm, yarn, pnpm, bun); also checks parent `node_modules` for monorepo setups
   - a missing `build/xcframeworks/` (e.g. after a manual clean) also marks stale
2. If any input is newer (or the stamp is missing): runs `npx react-native spm sync`,
   which re-executes autolinking + package generation (downloading artifacts if
   the cache slot is incomplete) and writes the stamp file.
3. If all inputs are fresh: exits immediately (~1ms).

**Build phase ordering:**

| # | Phase |
|---|-------|
| 0 | Resolve Package Graph (Xcode — runs before all build phases) |
| 1 | Sync SPM Autolinking |
| 2 | Sources (compile) |
| 3 | Frameworks (link) |
| 4 | Embed React Native Flavored Frameworks |
| 5 | Resources (copy) |
| 6 | Build JS Bundle |

Failures in the sync phase are non-fatal — it emits a `warning:` and exits 0,
so an already-generated package graph can still produce a successful build.
