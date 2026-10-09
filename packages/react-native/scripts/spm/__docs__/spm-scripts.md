# SwiftPM Scripts – React Native iOS via Swift Package Manager (Preview)

> **Preview.** SwiftPM support is an early preview. The commands, flags,
> generated layout, and distribution model may change in future releases. It is
> not yet recommended for production. Feedback is welcome. CocoaPods remains the
> supported default.

Build React Native iOS apps using **Swift Package Manager** with prebuilt
XCFrameworks, as an alternative to CocoaPods. It is **opt-in and additive**:
`spm` injects into your existing `.xcodeproj` in place and is fully reversible.

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

After the initial run, the project carries **auto-sync hooks**. They detect
dependency changes and re-run autolinking before compilation (see
[Auto-Sync](#auto-sync)), so you don't re-run `react-native spm` for day-to-day
dependency changes. **On a fresh clone or CI checkout, run
`npx react-native spm` once before building** (see
[Fresh clones & CI](#fresh-clones--ci)).

> **Note:** `react-native spm` is a thin wrapper over
> `node node_modules/react-native/scripts/setup-apple-spm.js`. If the CLI alias
> is unavailable in your environment, invoke the script directly with the same
> actions and the kebab-case flag equivalents (e.g. `--skip-codegen`).

## CocoaPods → SwiftPM migration

`spm add` injects into a project that is **not** CocoaPods-integrated. On a
CocoaPods app it fails loud and points you at `--deintegrate`, which:

1. runs `pod deintegrate`. This removes CocoaPods integration from the
   `.xcodeproj` (Pods references, `[CP]` build phases, xcconfig links). Your
   `Podfile` is left on disk.
2. strips **only** the React Native directives (`use_react_native!`,
   `use_native_modules!`, `prepare_react_native_project!`) from the Podfile.
   Every other line, **including your own `pod '…'` entries, is preserved**. The
   strip is line-based: it deletes each line that contains one of those names,
   and nothing else. The argument lines of a multi-line `use_react_native!(`
   call and any `react_native_post_install(...)` call remain, so remove them by
   hand before you run `pod install`.
3. injects SwiftPM into the `.xcodeproj`.

React Native now comes from SwiftPM. No pods are linked yet, because deintegrate
removed the integration.

### Keeping non-RN pods

Non-RN pods can stay side-by-side. Your Podfile still lists them. Remove the
leftover React Native lines (see step 2 above), then re-integrate the pods with
a normal install:

```bash
pod install     # re-integrates the remaining (non-RN) pods; (re)creates the .xcworkspace
```

Then **open the `.xcworkspace`** (not the `.xcodeproj`). The workspace includes
the SwiftPM-injected project, so React Native resolves through SwiftPM and your
other pods through CocoaPods.

> **Do not re-add `use_react_native!`.** React Native must come from _either_
> SwiftPM _or_ CocoaPods, never both. They share `build/generated/`, so a
> dual-managed RN does not build. If only the Podfile still declares
> `use_react_native!`, `spm add` prints a warning and continues.

The migration is fully reversible — see
[Removing / resetting](#removing--resetting).

## Brownfield apps

`spm add` injects into your existing `.xcodeproj` in place, so an app that
embeds React Native works the same way. Point it at the right project and
target:

```bash
npx react-native spm add --xcodeproj MyApp.xcodeproj --productName MyApp
```

**Requirement:** the `.xcodeproj` must live **inside the React Native JS tree**.
The app's `package.json` must be in a parent directory of the project. Setup and
the build-time sync both find React Native by walking up from the project to the
nearest `package.json`. The common "native project at the repo root with the RN
JS in a sibling/child subfolder" layout is **not supported yet**. You cannot
point at a JS root outside the project's ancestors.

Brownfield apps that keep CocoaPods for other native dependencies follow the
[coexistence rules above](#keeping-non-rn-pods).

## CLI Actions

```bash
react-native spm [action] [options]
```

With no action, the command **auto-resolves**: if SwiftPM has been injected
(`.spm-injected.json` marker present) it routes to `update`; otherwise `add`. On
a freshly-scaffolded CocoaPods project (clean git tree, stock Podfile), the
zero-arg path also implies `--deintegrate` (the safe-gate). So
`npx react-native spm` converts a brand-new app to SwiftPM in one command.

From the JS root of a standard RN app (sibling `ios/` subdir), the command
redirects into `ios/` and prints a banner.

| Action                | Description                                                                                                                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add`                 | Inject SwiftPM packages (package refs, build settings, the Sync build phase) into the existing `.xcodeproj`, in place. Idempotent. Default on first run. `--deintegrate` first runs `pod deintegrate` + strips React Native from the Podfile. |
| `update`              | Re-run the pipeline and refresh the existing injection. Default once a project is injected.                                                                                                                                                   |
| `deinit`              | The inverse of `add`: surgically remove only what `add` injected (recorded in `.spm-injected.json`) and drop the marker. Git-recoverable; no prompt. Some edits it does not undo — see [Files the tool touches](#files-the-tool-touches).     |
| `scaffold`            | Generate `Package.swift` into `node_modules/<dep>/` for community RN libraries that ship only a podspec.                                                                                                                                      |
| `sync` (advanced)     | Lightweight resync invoked by the Xcode auto-sync hooks. Regenerates invariant codegen and autolinking output only. Not for humans.                                                                                                           |
| `codegen` (advanced)  | Run codegen and install the SwiftPM codegen template only.                                                                                                                                                                                    |
| `download` (advanced) | Download/check xcframework artifacts only.                                                                                                                                                                                                    |

## CLI Options

Flags below use the `react-native spm` (camelCase) form.

| Option                           | Description                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--version <ver>`                | RN version. Resolved in this order: this flag, then the version a previous `--version` pinned into `.spm-injected.json`, then `node_modules/react-native/package.json`. Pass it once — later runs reuse the pin (see [Pinning the React Native version](#pinning-the-react-native-version))                                                                                                                                          |
| `--yes`                          | Skip the dirty-pbxproj confirmation prompt                                                                                                                                                                                                                                                                                                                                                                                           |
| `--xcodeproj <path>`             | [add, update, scaffold, deinit] Which `.xcodeproj` to inject into or remove from (when several exist)                                                                                                                                                                                                                                                                                                                                |
| `--productName <name>`           | [add, update, scaffold] Which app target to inject into (when several exist)                                                                                                                                                                                                                                                                                                                                                         |
| `--deintegrate`                  | [add] Run `pod deintegrate` + strip React Native from the Podfile before injecting                                                                                                                                                                                                                                                                                                                                                   |
| `--artifacts <path>`             | [advanced] Local artifact root containing complete `debug/` and `release/` cache slots                                                                                                                                                                                                                                                                                                                                               |
| `--download <auto\|skip\|force>` | [advanced] Artifact download policy (default: auto)                                                                                                                                                                                                                                                                                                                                                                                  |
| `--skipCodegen`                  | [advanced] Skip the codegen step                                                                                                                                                                                                                                                                                                                                                                                                     |
| `--config-command <json>`        | [advanced] **Raw script only** — `npx react-native spm` does not forward it; use the `RCT_SPM_AUTOLINKING_CONFIG_COMMAND` env var there. JSON array of the argv used to generate `autolinking.json`, overriding the default `@react-native-community/cli config` command. Either way the value is remembered, so you pass it once. Example: `'["npx","expo-modules-autolinking","react-native-config","--json","--platform","ios"]'` |

### The autolinking config command is remembered

An app that replaces `@react-native-community/cli` autolinking (an Expo app, for
example) must tell `spm` how to produce `autolinking.json`. Pass the command
once, on `add` or `update`. `npx react-native spm` does not forward a
`--configCommand` flag, so set the environment variable:

```bash
RCT_SPM_AUTOLINKING_CONFIG_COMMAND='["npx","expo-modules-autolinking","react-native-config","--json","--platform","ios"]' \
  npx react-native spm add
```

or run the script directly with `--config-command`:

```bash
node node_modules/react-native/scripts/setup-apple-spm.js add \
  --config-command '["npx","expo-modules-autolinking","react-native-config","--json","--platform","ios"]'
```

Every action that needs `autolinking.json` — `add`, `update`, `scaffold`, and
the build-time `sync` — resolves the command in this order:

1. `--config-command` (raw script only)
2. `RCT_SPM_AUTOLINKING_CONFIG_COMMAND`
3. the `configCommand` pinned in `MyApp.xcodeproj/.spm-injected.json` by an
   earlier `add`/`update`/`scaffold`
4. the default `@react-native-community/cli config`

`add`/`update`/`scaffold` pin the command from whichever of the first two routes
supplied it, validated as an argv array. A later run that passes neither keeps
the existing pin. A new command passed by either route replaces it.

The pin exists because the **Sync SPM Autolinking** build phase inherits neither
your flag nor the shell that exported the env var. Without the pin, the phase
re-derives `autolinking.json` with the default command, and builds fail after a
successful `add`. A pin never shadows the env var, so an override in your shell
still takes effect. A pin that no longer parses is ignored in favor of the
default.

`deinit` deletes `.spm-injected.json`, and the pin with it. A later `add` then
falls back to the default command unless you export the env var (or pass
`--config-command` to the raw script) again.

### Pinning the React Native version

The resolved version selects **which artifact slots the project is wired to**,
so it must stay the same from one run to the next. So `--version` is recorded in
the `.spm-injected.json` marker (as `artifactsVersionOverride`) and read back by
later runs, which resolve the version in this order:

1. an explicit `--version <ver>`,
2. the version a previous `--version` pinned into the marker,
3. `node_modules/react-native/package.json`.

You pass the flag once, and a later flagless `add`/`update` stays on the slots
it selected. Without the pin, that flagless run would fall back to
`package.json`. It would re-point the project at different artifact slots while
the marker still advertises the pinned version.

`deinit` deletes the marker, and with it the pin. A later `add` resolves
`node_modules/react-native/package.json` again unless you pass `--version`.

### Debug/Release flavor is automatic

React Native ships **flavored** prebuilt binaries. The _debug_ `React.framework`
(and `hermes-engine` / `ReactNativeDependencies`) carry the dev experience: dev
menu, assertions, `RN_DEBUG_STRING_CONVERTIBLE`. The _release_ binaries strip
them for production. A Debug build must embed the debug binaries, and a
Release/archive build the release ones.

SwiftPM `binaryTarget`s can't branch on the build configuration, so runtime
frameworks are deliberately kept out of the package graph. Instead:

- `spm add` downloads and validates **both** flavors into immutable app-local
  slots.
- It injects SDK/architecture-qualified Xcode settings that link the exact
  selected binaries.
- It adds one phase that copies and signs the selected frameworks into the app.

Configurations containing `debug` or `development` select Debug; every other
configuration selects Release. Selection uses only generated build settings and
standard macOS tools. Builds do not run Node, mutate symlinks, regenerate the
package graph, or require a second build.

Those debug-flavored configurations also get `DEBUG` in
`SWIFT_ACTIVE_COMPILATION_CONDITIONS`, injected as `("$(inherited)", DEBUG)`
when the setting is absent. Only this makes Swift's `#if DEBUG` true
(`GCC_PREPROCESSOR_DEFINITIONS` reaches C/ObjC/C++ only). `AppDelegate.swift`'s
`bundleURL()` branches on it to load from Metro instead of a bundled
`main.jsbundle`. CocoaPods injects it at `pod install` time, so this keeps
SwiftPM apps at parity. An existing value is left alone only if it already
contains `DEBUG`. Otherwise `DEBUG` is appended, and a scalar value is promoted
to an array (see [Files the tool touches](#files-the-tool-touches)).

### iOS deployment target

The `Autolinked` aggregate, the synth package per local module, and each
scaffolded community package declare the same platform floor: your app's
`IPHONEOS_DEPLOYMENT_TARGET`, never below React Native's own minimum (15.1). The
codegen package (`build/generated/ios/Package.swift`) always declares iOS 15.
`build/xcframeworks/Package.swift` declares no platforms.

SwiftPM refuses to link a product whose minimum is higher than that of the
target depending on it. So a dependency that needs more (Expo's packages need
iOS 16.4) resolves only once the app asks for at least as much. Raise the
deployment target in Xcode and re-run `react-native spm update`.

- A floor set in an `.xcconfig` your configuration is based on is honored,
  `#include` chains included.
- A floor set through a build-setting variable (`$(MY_FLOOR)`) is not honored;
  it falls back to React Native's minimum.
- `spm add` and `spm update` also refresh the platform-floor line of existing
  scaffolded manifests. They never create new ones. If you persisted a scaffold
  with `patch-package`, re-run `npx patch-package <dep>` afterwards.

## Files the tool touches

Paths are relative to the Xcode project directory (`ios/`) unless noted.

### In your repo — committed

| Path                                                | Written by                  | What happens                                                                                                                                                                                                                                                                                                                                                        | Undone by `deinit`?                                                                                                                                                                                        |
| --------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MyApp.xcodeproj/project.pbxproj`                   | `add`, `update`, `scaffold` | SwiftPM package refs, the React build settings, the Sync build phase, and the flavored-framework embed phase are added; a re-run is a no-op. A `${PODS_ROOT}`-anchored `REACT_NATIVE_PATH` is replaced with the SwiftPM path. `add` also removes the template's unused `JavaScriptCore.framework` reference, and `add --deintegrate` removes an empty `Pods` group. | Yes — exactly what was injected, per the marker, including the original `REACT_NATIVE_PATH` (one exception below). The removed `JavaScriptCore.framework` reference and `Pods` group are **not** restored. |
| `MyApp.xcodeproj/.spm-injected.json`                | `add`, `update`, `scaffold` | Created. Two roles: it records every edit made — including the pre-injection value of any build setting rewritten — so removal is surgical and re-runs stay idempotent; and it **pins configuration** later runs and Xcode builds must reuse (see the two pins below).                                                                                              | Yes — deleted, and the pins go with it                                                                                                                                                                     |
| `MyApp.xcodeproj/xcshareddata/xcschemes/*.xcscheme` | `add`, `update`, `scaffold` | The sync pre-action is added to the scheme that builds your target; a shared scheme is created if there is none. Commit this or teammates lose the pre-action.                                                                                                                                                                                                      | Yes — a scheme `add` created is deleted only if it is still byte-identical to the generated one; otherwise only the pre-action is stripped                                                                 |
| `.gitignore`                                        | `add` only                  | Created if absent, else appended: a `# SPM – auto-generated at build time` block adding `Package.resolved`, `build/generated/`, `build/xcframeworks/`, `.build/`.                                                                                                                                                                                                   | **No** — the block is left behind                                                                                                                                                                          |
| `Podfile`                                           | `add --deintegrate`         | Only the lines containing the React Native directives (`use_react_native!`, `use_native_modules!`, `prepare_react_native_project!`) are stripped. Your own `pod '…'` lines are preserved. The argument lines of a multi-line `use_react_native!(` call and `react_native_post_install(...)` remain — remove them by hand before `pod install`.                      | **No** — re-add the directives yourself to go back to CocoaPods                                                                                                                                            |
| `Pods/`, `Pods-*.xcconfig`, `[CP]` phases           | `add --deintegrate`         | Removed by `pod deintegrate`. The `.xcworkspace` referencing them is left on disk.                                                                                                                                                                                                                                                                                  | **No** — run `pod install` to restore                                                                                                                                                                      |

The two pins are the `--version` pin (`artifactsVersionOverride`, see
[Pinning the React Native version](#pinning-the-react-native-version)) and the
[autolinking config command](#the-autolinking-config-command-is-remembered).

### In your repo — generated, gitignored

| Path                           | Written by                                     | Contents                                                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build/generated/ios/`         | `add`, `update`, `scaffold`, `sync`, `codegen` | Codegen output plus the SwiftPM codegen manifest (the `React-GeneratedCode` package).                                                                                                     |
| `build/generated/autolinking/` | `add`, `update`, `scaffold`, `sync`            | `Package.swift`, `autolinking.json`, `packages/`, `libs/`, `headers/`, the `.spm-sync-stamp`, `.spm-sync-watch-paths`, and any `.spm-plugin-*.json` plugin manifests.                     |
| `build/xcframeworks/`          | `add`, `update`, `scaffold`                    | The `debug/` and `release/` flavor slots (symlinks into the cache), `ReactHeadersTarget/`, the headers-only xcframeworks, `Package.swift`, `flavored-frameworks.json`, `.artifact-stamp`. |
| `.build/`, `Package.resolved`  | Xcode / SwiftPM                                | SwiftPM's own build directory and resolution file. Machine-specific.                                                                                                                      |

`deinit` leaves all of the above in place. It is regenerable, and removing it is
`rm -rf build/ .build/` (see [Removing / resetting](#removing--resetting)).

### Outside your repo

| Path                                                             | Written by                              | Notes                                                                                                                                                                                        |
| ---------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node_modules/<dep>/Package.swift`                               | `scaffold`                              | A generated manifest for a dep that ships none. Not committed — persist with `patch-package` (see [Community packages without a Package.swift](#community-packages-without-a-packageswift)). |
| `~/Library/Caches/ReactNative/spm-artifacts/<version>/<flavor>/` | `add`, `update`, `scaffold`, `download` | The immutable artifact slots the `build/xcframeworks/` symlinks point at. Shared across apps on the machine.                                                                                 |
| `~/Library/Caches/ReactNative/`                                  | `download`, `add`, `update`, `scaffold` | Downloaded tarballs, shared with CocoaPods. `RCT_SKIP_CACHES=1` bypasses the cache.                                                                                                          |

Apart from the `project.pbxproj` edits listed above, injection is **additive**:
every other byte of your project — signing, capabilities, your own Build Phases
— stays untouched. The injected refs point at three stable sub-package paths
under `build/`. So adding or removing community deps changes only the
sub-package contents (gitignored) and never re-injects. `deinit` leaves the
project byte-identical to its pre-`add` state, with the exceptions above and one
more, described next.

**Build settings that already exist** are edited in place. `add` merges into
five array settings: `HEADER_SEARCH_PATHS`, `OTHER_LDFLAGS`,
`FRAMEWORK_SEARCH_PATHS`, `LD_RUNPATH_SEARCH_PATHS`, and (on debug
configurations) `SWIFT_ACTIVE_COMPILATION_CONDITIONS`. Each keeps the shape it
was written in: Xcode's multi-line form, or the compact one-line form that hand
edits and other generators (XcodeGen, Tuist) emit.

A setting that exists as a plain _scalar_ is promoted to a `( … )` array. An
Xcode-authored target can carry that shape, e.g.
`LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";` written
as a scalar rather than a list. `add` records the pre-injection value in the
marker. `deinit` restores it by rewriting the whole field, because once folded
together, the injected members and your own are indistinguishable. So **members
you add to a promoted array by hand afterwards are lost**. That applies to
`update` too, which reverts to the recorded baseline before re-injecting.

## Environment variables

| Variable                                     | Effect                                                                                                                                                                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RCT_SPM_AUTOLINKING_CONFIG_COMMAND`         | JSON argv array that replaces the default `@react-native-community/cli config` command. `add`/`update`/`scaffold` pin it — see [The autolinking config command is remembered](#the-autolinking-config-command-is-remembered). |
| `RCT_SKIP_CACHES`                            | `1` bypasses the shared tarball cache in `~/Library/Caches/ReactNative/`.                                                                                                                                                     |
| `RN_CORE_TARBALL_PATH`                       | Local React core tarball, used instead of a download. Skips the shared cache.                                                                                                                                                 |
| `RN_HEADERS_TARBALL_PATH`                    | Local `ReactNativeHeaders` tarball, used instead of the copy inside the React core tarball.                                                                                                                                   |
| `RN_DEPS_TARBALL_PATH`                       | Local `ReactNativeDependencies` tarball, used instead of a download. Skips the shared cache.                                                                                                                                  |
| `RN_DEPS_HEADERS_TARBALL_PATH`               | Local `ReactNativeDependenciesHeaders` tarball, used instead of the copy inside the dependencies tarball.                                                                                                                     |
| `RCT_REACT_NATIVE_MAVEN_MIRROR_ENABLED`      | `false` or `0` turns off the React Native Maven mirror. The mirror is on by default and is tried before Maven Central.                                                                                                        |
| `ENTERPRISE_REPOSITORY`                      | Maven repository URL. When set, it is the only repository consulted for releases; the snapshot fallback still uses Maven Central snapshots.                                                                                   |
| `RN_SPM_REMOTE_URL`, `RN_SPM_REMOTE_VERSION` | Turn on remote-package mode — see [Remote-package mode](./spm-header-paths-contract.md#remote-package-mode).                                                                                                                  |
| `RN_DEP_VERSION`                             | Version of the `ReactNativeDependencies` artifact, or `nightly`. Defaults to the React Native version.                                                                                                                        |
| `HERMES_VERSION`                             | Version of the Hermes artifact, `nightly`, or `latest-v1`. Defaults to the locally pinned `hermes-compiler` version, else `latest-v1`.                                                                                        |

A tarball path that does not exist fails the download. Each tarball override
applies to both flavors, so the Debug and Release slots get the same file.

## Fresh clones & CI

Everything under `build/` is gitignored. So a clean checkout has no resolvable
Swift packages until they are regenerated. Xcode resolves the package graph
before build phases **and** before scheme pre-actions, so neither
[auto-sync hook](#auto-sync) can fix this. With `build/generated/autolinking`
missing, the build stops at _"Resolve Package Graph … doesn't exist"_ and runs
neither hook.

Verified on Xcode 26.6, against a freshly-injected app with `build/` deleted:
`xcodebuild -scheme … build` fails in nine lines of log, with
`Resolve Package Graph` as the first step and no trace of the pre-action.
`xcodebuild -resolvePackageDependencies` fails the same way. Opening the project
in Xcode also resolves the graph on load, before you press Build.

So run the setup command once after cloning, before building. It is the SwiftPM
analog of `pod install`:

```bash
npx react-native spm      # downloads artifacts (if missing) + regenerates build/
```

On an already-injected project this routes to `update`. It fetches the
xcframework artifacts into the shared cache if they aren't present, and
regenerates `build/xcframeworks` + `build/generated`.

**Automate it** with a `postinstall` hook. It runs as part of the `npm install`
/ `yarn install` your CI already does before `xcodebuild`:

```json
{
  "scripts": {
    "postinstall": "react-native spm"
  }
}
```

The hook works from the app root, because `npx react-native spm` redirects from
the JS root into `ios/`. In CI (non-interactive) it proceeds without prompting.
It re-runs the full pipeline: codegen, plus an idempotent re-inject that is a
no-op when nothing changed. So it is slightly heavier than the internal `sync`
the build phase calls.

> A future remote-package distribution (a tagged `Package.swift` repo +
> `binaryTarget(url:checksum:)`) removes this step: SwiftPM will resolve and
> fetch the artifacts itself during normal package resolution. Until then, clean
> machines need the one-time setup run.

## Local Native Modules

Declare modules that autolinking does not discover in the app's package.json.
Each `path` is relative to the file that declares it: the project root for a
package.json there, or the Xcode project directory for a config kept there:

```json
{
  "swiftpmConfig": {
    "modules": [
      {
        "name": "MyNativeModule",
        "path": "ios/MyNativeModule",
        "exclude": ["*.podspec"],
        "sources": ["**/*.{h,m,mm}"]
      }
    ]
  }
}
```

Each entry becomes its own package at
`build/generated/autolinking/packages/<name>/Package.swift`, with a `root`
directory symlink to the module directory. Its headers are mirrored with
file-level symlinks into `build/generated/autolinking/headers/<name>/`. The
aggregator `build/generated/autolinking/Package.swift` references each one as
`.package(path: "packages/<name>")`. A module directory that ships its own
`Package.swift` is used as is.

A module that mixes Swift and C-family (`.m`/`.mm`/`.c`/`.cpp`) sources is
rejected, because SwiftPM cannot compile both in one target. Split it into
single-language modules, or ship a hand-written `Package.swift`. Module names
get the same checks as [library names](#library-names): a name React Native
reserves, or one that collides with another module or an autolinked library, is
a hard error.

`sources` is optional. It is a glob allowlist relative to `path`, like a
podspec's `source_files`. Without it, or when it matches no file, the target
gets every `.h`, `.hpp`, `.m`, `.mm`, `.c`, `.cpp` and `.swift` file under
`path`, minus `exclude`. Directories named `android`, `test`, `tests`,
`__tests__`, `__mocks__`, `jest` or `node_modules` are skipped at any depth,
also when `sources` is set.

Modules reach one app target only: the one `spm add` links the `Autolinked`
aggregate to. Other targets in the project do not see them. Choose the target
with `--productName`.

Add third-party Swift packages to the app target in Xcode (File > Add Package
Dependencies). Local modules cannot import them.

## Where SwiftPM settings live

A package's SwiftPM settings live under `swiftpmConfig` in its **package.json**,
alongside `codegenConfig`.

| Field               | Set by  | What it does                                                |
| ------------------- | ------- | ----------------------------------------------------------- |
| `name`              | library | Its SwiftPM target name, and so its header import prefix    |
| `dependencies`      | library | npm names of native libraries it builds against             |
| `autolinkingPlugin` | library | Path to an [autolinking plugin](spm-autolinking-plugins.md) |
| `scaffold`          | library | `false` opts the library out of `spm scaffold`              |
| `modules`           | app     | [Local native modules](#local-native-modules) to build      |
| `denyPlugins`       | app     | npm names whose autolinking plugin to skip                  |

```json
{
  "swiftpmConfig": {
    "name": "RNSVG",
    "dependencies": ["react-native-worklets"]
  }
}
```

A library's settings come from its own package.json. An **app's** settings are
resolved field by field. Each field comes from the directory that holds its
package.json (the JS root, where codegen reads `codegenConfig`), falling back to
the Xcode project directory. An unrecognised field is ignored with a warning
naming it, so a typo does not pass silently.

The `spm` block in `react-native.config.js` is **deprecated** but still read,
with the same field names, so nothing breaks. Move the keys across as they are;
package.json wins field by field. `npx react-native spm scaffold` writes the
`name` for you — see
[Community packages without a Package.swift](#community-packages-without-a-packageswift).

## Library names

An autolinked library's SwiftPM target name is also the prefix its headers are
imported under (`#import <RNSVG/…>`). So it is not cosmetic: it must be the
prefix the library's own sources and its dependents already use.

It is resolved in this order:

1. `swiftpmConfig.name` in the library's package.json
2. `spm.name` in `react-native.config.js` (deprecated)
3. podspec `header_dir` — `React-Core` → `React`
4. podspec `module_name` — a distinct declared module (`react-native-foo-bar` →
   `RNFooBar`)
5. podspec name — `react-native-svg` → `RNSVG`
6. npm package name — `react-native-svg` → `ReactNativeSvg`

Steps 3–5 are a **migration path, not the destination**. They let libraries work
unchanged today, because a podspec is what they already ship.
`npx react-native spm scaffold` closes them out: it records the derived name as
`swiftpmConfig.name` in the library's package.json, and the podspec is then
never consulted for naming again. A library that declares its own name needs no
podspec for SwiftPM at all.

Within those three steps:

- `header_dir` comes first, because a library sets it when its import prefix
  differs from its pod name.
- `module_name` comes next. It is what CocoaPods compiles the module as, and so
  what Swift and `@import` consumers write.
- A `header_dir` that only a **subspec** declares names that subspec's headers,
  not the library, so the pod name stands. react-native-svg is `RNSVG`, not
  `rnsvg`; its subspec prefix resolves through the header search paths instead.
  The exception is a subspec that reuses the parent's block variable (`do |s|`).
  That hides which scope declared what, so the podspec is read by CocoaPods or
  not at all.
- An unreadable podspec falls through rather than failing the build. It logs a
  warning, because a machine that can read it (one with CocoaPods installed) may
  resolve a different name.
- A prefix Swift cannot spell is normalized, e.g. `Some.Pod` becomes `Some_Pod`,
  which is what SwiftPM would compile it as anyway. A warning names
  `swiftpmConfig.name`.

Two names are refused outright:

- a name React Native reserves (`ReactNative`, `ReactHeaders`,
  `ReactNativeHeaders`, `ReactNativeDependenciesHeaders`, `ReactAppHeaders`,
  `React-GeneratedCode`, `ReactCodegen`, `ReactAppDependencyProvider`,
  `Autolinked`), and
- a name another library already took.

Both are **hard errors** that name `swiftpmConfig.name`. Nothing is renamed
automatically, because no `#import` in your sources can predict a name the build
invented. Two names must differ by more than case or punctuation to be two
targets. `worklets` and `Worklets` share a headers directory, and `foo-bar` and
`foo_bar` are one module, since SwiftPM replaces every character C99 rejects
with `_`.

## Dependencies between libraries

SwiftPM has no equivalent of a podspec's `s.dependency`. So a library that needs
another native library declares it explicitly in its **own** package.json, as a
list of npm names:

```json
// react-native-reanimated/package.json
{
  "swiftpmConfig": {"dependencies": ["react-native-worklets"]}
}
```

The autolinker follows these **recursively** from the directly-autolinked deps
and dedupes. So a transitive dependency joins the package graph even when the
app never depends on it directly.

### Config module format

`react-native.config.js` may be CommonJS or ESM, and both named and default
exports are read. A key defined twice, as a named export and on the default
export, resolves to the named one. Avoid that shape anyway. The Community CLI
has two loaders that disagree about it: a sync one that sees named exports, and
an async one that takes only the default export. For maximum compatibility,
prefer the one-line CommonJS form:

```js
module.exports = {dependency: {platforms: {ios: {}}}};
```

If the config fails to load, a warning names the file and the reason. Any
deprecated `spm` settings in it are then ignored rather than silently applied.

## Self-managed community packages

The autolinker references a community library that ships its own `Package.swift`
directly, instead of wrapping it. SwiftPM derives package identity from the path
basename, and several libs may put their manifest inside an `ios/` subdir. To
keep identity unique, each self-managed dep is exposed through a uniquely-named
symlink at `build/generated/autolinking/libs/<SwiftName>/`. The aggregator
`Package.swift` references that path, so two libs that both ship
`<dep>/ios/Package.swift` never collide on identity `"ios"`.

The `libs/` directory is not recreated on each autolinker run. An alias that
does not change keeps its inode, because Xcode holds each one as a loaded
package root. Aliases for deps that are no longer self-managed are pruned. So
after `npm uninstall` removes a dep, the next build cleans up its alias.

## Community packages without a Package.swift

If an autolinked library ships **no `Package.swift`**, `spm add`/`update` stops
with a per-dep error (`Package.swift is missing for library "<name>"`) and exits
with code **2**. This code is distinct from a generic failure, so CI and the
Xcode sync hooks can treat it as a hard error (see [Auto-Sync](#auto-sync)).

`add` and `update` deliberately **never** scaffold for you, because
auto-scaffolding would hide a real gap in the dependency's SPM support. Generate
the manifest from the library's podspec explicitly, then re-run setup:

```bash
npx react-native spm scaffold      # writes Package.swift into node_modules/<dep>/
npx react-native spm               # then inject/update as usual
```

After it writes the manifests, `scaffold` runs the rest of the pipeline:
codegen, autolinking, artifact download, the `build/xcframeworks` package, and
injection into the `.xcodeproj`. On a CocoaPods-integrated project that last
step fails with exit code 1, because `scaffold` does not deintegrate. Run
`npx react-native spm add --deintegrate` afterwards to convert it.

`scaffold` also records the name it derived from the podspec as
`swiftpmConfig.name` in the library's package.json. That step lets the library
be named without reading a podspec at all. It never overwrites a name the
library already declares, and it reports which packages it edited. For every
library it scaffolds, it prints the SwiftPM name it chose and where that name
came from. It adds a note when a podspec's `header_dir` and `module_name`
disagree and only one can win.

`node_modules/` isn't committed, so persist both changes to survive the next
install:

```bash
npx patch-package <dep>            # then commit the generated patch
```

**Better: contribute the manifest upstream.** The generated `Package.swift` is a
normal, committable manifest. The ideal fix is for the library to ship it, so
every consumer gets SwiftPM support without a local patch. Please **file an
issue or open a PR on the library** with the scaffolded `Package.swift`, and
mention that `react-native spm scaffold` generated it for React Native SwiftPM
support. Until it lands upstream, the `patch-package` workaround keeps your app
building.

> A library can't be scaffolded automatically if its sources mix Swift **and**
> Objective-C/C++ in one target, or if it ships neither a `Package.swift` nor a
> podspec. The error says so. Opt it out via `react-native.config.js`
> (`platforms.ios = null`), or ask the maintainer for a prebuilt xcframework. A
> library can also opt out of scaffolding alone with
> `"swiftpmConfig": {"scaffold": false}`.

## Framework plugins (Preview)

Frameworks with their own module system (e.g. Expo) contribute to the
autolinking graph through a **plugin**. See
**[spm-autolinking-plugins.md](./spm-autolinking-plugins.md)** for discovery,
the context/return contract, lifecycle, and failure behavior.

## Removing / resetting

To remove SwiftPM entirely, use `deinit` (the inverse of `add`):

```bash
react-native spm deinit   # surgically removes everything `add` injected
pod install               # then, to restore CocoaPods
```

To reset the regenerable build state without un-injecting, delete the gitignored
dirs and re-run:

```bash
rm -rf build/xcframeworks build/generated .build
react-native spm update
```

Xcode's "Clean Build Folder" (Cmd+Shift+K) only removes DerivedData. It does not
touch SwiftPM-generated directories. The cached xcframework slot is shared
across apps; refresh it with `react-native spm update --download force`.

## Troubleshooting

| Problem                                                                                                                | Fix                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xcodebuild` fails: "Could not resolve package dependencies … `build/generated/autolinking` doesn't exist"             | Fresh clone — run `npx react-native spm` once before building (see [Fresh clones & CI](#fresh-clones--ci))                                                                                                                                                                                                                                                                  |
| `spm add` fails: "CocoaPods-integrated project"                                                                        | Re-run `spm add --deintegrate` (runs `pod deintegrate` + strips RN from the Podfile), or `pod deintegrate` yourself first.                                                                                                                                                                                                                                                  |
| `spm add` fails: "no .xcodeproj found"                                                                                 | Create an app first (`npx @react-native-community/cli init`) or make a project in Xcode, then `spm add`.                                                                                                                                                                                                                                                                    |
| `spm add` fails: "multiple .xcodeproj found"                                                                           | Pass `--xcodeproj <path>` (and `--productName <target>` if multiple app targets).                                                                                                                                                                                                                                                                                           |
| `Package.swift is missing for library "<name>"` (exit 2)                                                               | The dep ships no SwiftPM support. `npx react-native spm scaffold`, then re-run setup; persist with `patch-package`. See [Community packages without a Package.swift](#community-packages-without-a-packageswift)                                                                                                                                                            |
| `SPM Swift name collision`                                                                                             | Two libraries resolved to one Swift name, or one took a name React Native reserves. Set `swiftpmConfig.name` in the library's package.json — see [Library names](#library-names)                                                                                                                                                                                            |
| Missing headers                                                                                                        | Re-run `react-native spm`                                                                                                                                                                                                                                                                                                                                                   |
| "not contained in target"                                                                                              | Re-run setup (regenerates file-level symlinks)                                                                                                                                                                                                                                                                                                                              |
| Codegen fails                                                                                                          | Use `--skipCodegen` to iterate on other parts                                                                                                                                                                                                                                                                                                                               |
| "SPM sync failed" warning                                                                                              | Check Xcode build log for details; node may not be in PATH — ensure `with-environment.sh` is present                                                                                                                                                                                                                                                                        |
| "Sync SPM Autolinking" build phase fails: `'npx --no-install @react-native-community/cli config' exited with status 1` | This app replaces `@react-native-community/cli` autolinking (e.g. an Expo app). Re-run `spm add`/`update` with `RCT_SPM_AUTOLINKING_CONFIG_COMMAND` exported (or the raw script with `--config-command`) so the working command is pinned for the build phase to reuse — see [The autolinking config command is remembered](#the-autolinking-config-command-is-remembered). |
| Autolinking not updating on build                                                                                      | Touch `package.json` to force a sync, or delete `build/generated/autolinking/.spm-sync-stamp`                                                                                                                                                                                                                                                                               |
| Stale SwiftPM state or corrupted build                                                                                 | `rm -rf build/ .build/`, then `react-native spm update`, then reopen Xcode                                                                                                                                                                                                                                                                                                  |
| Want to revert to CocoaPods                                                                                            | `react-native spm deinit`, then `pod install`                                                                                                                                                                                                                                                                                                                               |

---

## Reference / internals

### Pipeline

`react-native spm add` and `react-native spm update` orchestrate these steps:

| Step           | Script                                   | Output                                                                                            |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1. CLI config  | `spm/generate-spm-autolinking-config.js` | `build/generated/autolinking/autolinking.json`                                                    |
| 2. Codegen     | `generate-codegen-artifacts.js`          | `build/generated/ios/`                                                                            |
| 3. Autolinking | `spm/generate-spm-autolinking.js`        | `build/generated/autolinking/Package.swift`                                                       |
| 4. Download    | `spm/download-spm-artifacts.js`          | Complete Debug and Release cache slots                                                            |
| 5. Package     | `spm/generate-spm-package.js`            | Immutable flavor slots, central manifest, canonical `ReactHeaders`, and invariant `Package.swift` |
| 6. Inject      | `spm/generate-spm-xcodeproj.js`          | Invariant SwiftPM products plus configuration-qualified linker settings and the embed/sign phase  |
| Auto-sync      | `spm/sync-spm-autolinking.js`            | Re-runs invariant codegen/autolinking output only at Xcode build time                             |

### Directory Layout

```text
my-app/ios/
  MyApp.xcodeproj/                 <-- committed (your project; SwiftPM injected in place, carries .spm-injected.json)
  Podfile                          <-- kept; `--deintegrate` only strips the React Native lines (CocoaPods coexistence is best-effort)
  build/
    generated/
      autolinking/                 <-- gitignored (regenerated at build time)
        Package.swift
        autolinking.json
        packages/                  <-- synth wrappers for swiftpmConfig.modules (local modules)
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

### Header Resolution

React Native's headers resolve through SwiftPM package products, with no `-I`
search-path flags and no clang VFS overlay. See
[How headers resolve](./spm-header-paths-contract.md#how-headers-resolve-no-search-paths)
for the products, the namespaces each one serves, and why.

### Auto-Sync

`add`/`update` inject **two hooks that run the same sync script**. They keep
autolinking up to date without manual re-runs of `react-native spm`:

| Hook                               | Where                                                                                       | Role                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Scheme pre-action                  | The app's **shared** scheme (`xcshareddata/xcschemes/`), under `BuildAction` → `PreActions` | Fires earlier in the build than a build phase can, so it is the one that normally does the re-sync. |
| `Sync SPM Autolinking` build phase | `.xcodeproj`, prepended before `Sources`                                                    | **Safety net** for builds that bypass the scheme (and for a scheme whose pre-action was stripped).  |

The hooks keep an _existing_ set of generated packages current. They do not
create the first one: see [Fresh clones & CI](#fresh-clones--ci).

**How the sync script works:**

1. Compares timestamps of staleness inputs against
   `build/generated/autolinking/.spm-sync-stamp`:
   - `package.json` — dependency declarations
   - `react-native.config.js` — autolinking config
   - lockfiles found walking up from the project root — `package-lock.json`,
     `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lock`,
     `bun.lockb`, `.pnp.cjs`, `.pnp.loader.mjs`
   - `node_modules/` directory mtime — updated by any package manager (npm,
     yarn, pnpm, bun); also checks parent `node_modules` for monorepo setups
   - every path in `.spm-sync-watch-paths` — RN's own inputs plus any
     [plugin](./spm-autolinking-plugins.md#watchpaths--plugin-staleness-inputs)
     `watchPaths`; a watched file that is newer, a watched dir with a newer
     descendant (the scan skips `.swiftpm`), or a watched path that has
     **vanished** all mark stale
   - the commit time of the latest `git log` entry touching `*.js` / `*.ts`,
     compared with the stamp's mtime
2. If any input is newer (or the stamp is missing): runs
   `"$NODE_BINARY" "$RN_DIR/scripts/setup-apple-spm.js" sync`. It falls back to
   `npx react-native spm sync` only when that script or `NODE_BINARY` is
   missing. `sync` regenerates `autolinking.json` (CLI config), runs codegen,
   installs the codegen template, re-runs autolinking, rebuilds the header farm,
   and writes the stamp file. It does not download artifacts or regenerate
   `build/xcframeworks/`.
3. If all inputs are fresh: exits immediately (~1ms).

**Ordering.** As observed in an `xcodebuild -scheme … build` log on Xcode 26.6:

| Step                                            | Owner             |
| ----------------------------------------------- | ----------------- |
| Resolve Package Graph                           | Xcode             |
| **Sync SPM Autolinking**                        | scheme pre-action |
| Prepare packages / ComputeTargetDependencyGraph | Xcode             |
| CreateBuildDescription                          | Xcode             |
| **Sync SPM Autolinking** (safety net)           | build phase 1     |
| Sources (compile)                               | build phase 2     |
| Frameworks (link)                               | build phase 3     |
| Embed React Native Flavored Frameworks          | build phase 4     |
| Resources (copy)                                | build phase 5     |
| Build JS Bundle                                 | build phase 6     |

A sync failure is lenient by default, but **not unconditionally**. The generated
script branches on the exit code:

- **Exit 2** — **fails the build** (`exit 1`), whatever the cause. Three errors
  exit with 2:
  - an autolinked dependency ships no `Package.swift` — the autolinker has
    already printed an `error:` line per dep, and the fix needs a terminal (see
    [Community packages without a Package.swift](#community-packages-without-a-packageswift));
  - the autolinking config command fails (see
    [The autolinking config command is remembered](#the-autolinking-config-command-is-remembered));
  - remote mode is on but no usable React Native version resolves (see
    [Remote-package mode](./spm-header-paths-contract.md#remote-package-mode)).
- **Any other non-zero exit** — emits
  `warning: SPM sync failed — build may use stale codegen/autolinking` and lets
  the build continue, so an already-generated package graph can still produce a
  successful build.

These errors have their own exit code because a transient sync hiccup should not
break a build that could still succeed, while a missing manifest, a broken
config command, or an unresolvable remote version should not pass silently.
