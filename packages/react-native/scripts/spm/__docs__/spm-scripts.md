# SwiftPM Scripts – React Native iOS via Swift Package Manager (Preview)

> **Preview.** SwiftPM support is an early preview: the commands, flags,
> generated layout, and distribution model may change in future releases, and it
> is not yet recommended for production. Feedback is welcome. CocoaPods remains
> the supported default.

Build React Native iOS apps using **Swift Package Manager** with prebuilt
XCFrameworks, as an alternative to CocoaPods. It is **opt-in and additive** —
CocoaPods remains the default; `spm` injects into your existing `.xcodeproj` in
place and is fully reversible.

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

After the initial run, the project carries **auto-sync hooks** that detect
dependency changes and re-run autolinking before compilation (see
[Auto-Sync](#auto-sync)) — you don't re-invoke `react-native spm` manually for
day-to-day dependency changes. **On a fresh clone or CI checkout, run
`npx react-native spm` once before building** (see
[Fresh clones & CI](#fresh-clones--ci)).

> **Note:** `react-native spm` is a thin wrapper over
> `node node_modules/react-native/scripts/setup-apple-spm.js`. If the CLI alias
> is unavailable in your environment, invoke the script directly with the same
> actions and the kebab-case flag equivalents (e.g. `--skip-codegen`).

## CocoaPods → SwiftPM migration

`spm add` injects into a project that is **not** CocoaPods-integrated. On a
CocoaPods app it fails loud and points you at `--deintegrate`, which:

1. runs `pod deintegrate` — removes CocoaPods integration from the
   `.xcodeproj` (Pods references, `[CP]` build phases, xcconfig links). Your
   `Podfile` is left on disk.
2. strips the React Native directives (`use_react_native!`,
   `use_native_modules!`, `prepare_react_native_project!`) from the Podfile,
   and — only when it's exactly the stock template's shape — the
   `post_install do |installer| react_native_post_install(...) end` block
   that calls them. Every other line, **including your own `pod '…'` entries
   and any customization you've made to `post_install`, is preserved**. A
   customized `post_install` block is left in place (its shape is too
   open-ended to strip safely beyond the exact stock call); if you keep
   non-RN pods and run `pod install`, remove it by hand first — `spm add`
   (and `pod install` failing) will remind you it's still there.
3. sets `project.ios.automaticPodsInstallation` to `false` in
   `react-native.config.js` (creating the file if it doesn't exist). Left
   `true` (the default), the next `react-native run-ios`/`build-ios` silently
   re-runs CocoaPods and re-breaks the SwiftPM package graph.
4. removes the dangling `Pods/Pods.xcodeproj` reference from the
   `.xcworkspace`, if `pod deintegrate` left one — otherwise Xcode shows a
   permanent red, missing row in the workspace navigator.
5. injects SwiftPM into the `.xcodeproj`.

React Native now comes from SwiftPM; no pods are linked yet (deintegrate removed
the integration).

### Keeping non-RN pods

Non-RN pods can stay side-by-side. After `spm add --deintegrate` your Podfile
still lists them (only the RN directives were removed) — re-integrate them with
a normal install:

```bash
pod install     # re-integrates the remaining (non-RN) pods; (re)creates the .xcworkspace
```

Then **open the `.xcworkspace`** (not the `.xcodeproj`): the workspace includes
the SwiftPM-injected project, so React Native resolves through SwiftPM and your
other pods through CocoaPods, together.

> **Automatic pod installs are deliberately off.** `--deintegrate` sets
> `automaticPodsInstallation: false` so `react-native run-ios`/`build-ios`
> won't silently `pod install` and re-break the SwiftPM package graph. Run
> `pod install` yourself whenever you change the non-RN pods above.

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
— i.e. the app's `package.json` is a parent directory of the project. Both setup
and the build-time sync locate React Native by walking up from the project to
the nearest `package.json`. The common "native project at the repo root with the
RN JS in a sibling/child subfolder" layout is **not supported yet** — there is
no way to point at a JS root outside the project's ancestors.

Brownfield apps that keep CocoaPods for their other native dependencies follow
the [coexistence rules above](#keeping-non-rn-pods): React Native from SwiftPM,
everything else from CocoaPods, and no `use_react_native!` in the Podfile.

## CLI Actions

```bash
react-native spm [action] [options]
```

With no action, the command **auto-resolves**: if SwiftPM has been injected
(`.spm-injected.json` marker present) it routes to `update`; otherwise `add`. On
a freshly-scaffolded CocoaPods project (clean git tree, stock Podfile) the
zero-arg path additionally implies `--deintegrate` (the safe-gate), so
`npx react-native spm` converts a brand-new app to SwiftPM in one command.

When invoked from the JS root of a standard RN app (sibling `ios/` subdir), the
command auto-redirects into `ios/` with a banner.

| Action                | Description                                                                                                                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add`                 | Inject SwiftPM packages (package refs, build settings, the Sync build phase) into the existing `.xcodeproj`, in place. Idempotent. Default on first run. `--deintegrate` first runs `pod deintegrate` + strips React Native from the Podfile. |
| `update`              | Re-run the pipeline and refresh the existing injection. Default once a project is injected.                                                                                                                                                   |
| `deinit`              | The inverse of `add`: surgically remove only what `add` injected (recorded in `.spm-injected.json`) and drop the marker. Git-recoverable; no prompt. Three things it does not undo — see [Files the tool touches](#files-the-tool-touches).   |
| `scaffold`            | Generate `Package.swift` into `node_modules/<dep>/` for community RN libraries that ship only a podspec.                                                                                                                                      |
| `sync` (advanced)     | Lightweight resync invoked by the Xcode auto-sync hooks. Regenerates invariant codegen and autolinking output only. Not for humans.                                                                                                           |
| `codegen` (advanced)  | Run codegen and install the SwiftPM codegen template only.                                                                                                                                                                                    |
| `download` (advanced) | Download/check xcframework artifacts only.                                                                                                                                                                                                    |

## CLI Options

Flags below use the `react-native spm` (camelCase) form. The raw script accepts
kebab-case equivalents (e.g. `--skip-codegen`).

| Option                           | Description                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--version <ver>`                | RN version. Resolved in this order: this flag, then the version a previous `--version` pinned into `.spm-injected.json`, then `node_modules/react-native/package.json`. Pass it once — later runs reuse the pin (see [Pinning the React Native version](#pinning-the-react-native-version))                                                                                |
| `--yes`                          | Skip the dirty-pbxproj confirmation prompt                                                                                                                                                                                                                                                                                                                                 |
| `--xcodeproj <path>`             | [add] Which `.xcodeproj` to inject into (when several exist)                                                                                                                                                                                                                                                                                                               |
| `--productName <name>`           | [add] Which app target to inject into (when several exist)                                                                                                                                                                                                                                                                                                                 |
| `--deintegrate`                  | [add] Run `pod deintegrate` + strip React Native from the Podfile before injecting                                                                                                                                                                                                                                                                                         |
| `--artifacts <path>`             | [advanced] Local artifact root containing complete `debug/` and `release/` cache slots                                                                                                                                                                                                                                                                                     |
| `--download <auto\|skip\|force>` | [advanced] Artifact download policy (default: auto)                                                                                                                                                                                                                                                                                                                        |
| `--skipCodegen`                  | [advanced] Skip the codegen step                                                                                                                                                                                                                                                                                                                                           |
| `--configCommand <json>`         | [advanced] JSON array of the argv used to generate `autolinking.json`, overriding the default `@react-native-community/cli config` command. Also settable via the `RCT_SPM_AUTOLINKING_CONFIG_COMMAND` env var. Either way the value is remembered, so you pass it once. Example: `'["npx","expo-modules-autolinking","react-native-config","--json","--platform","ios"]'` |

### The autolinking config command is remembered

An app that replaces `@react-native-community/cli` autolinking (an Expo app, for
example) has to tell `spm` how to produce `autolinking.json`. Pass the command
once, on `add` or `update`:

```bash
npx react-native spm add --configCommand '["npx","expo-modules-autolinking","react-native-config","--json","--platform","ios"]'
```

Every action that needs `autolinking.json` — `add`, `update`, `scaffold`, and
the build-time `sync` — resolves the command in this order:

1. `--configCommand`
2. `RCT_SPM_AUTOLINKING_CONFIG_COMMAND`
3. the `configCommand` pinned in `MyApp.xcodeproj/.spm-injected.json` by an
   earlier `add`/`update`
4. the default `@react-native-community/cli config`

`add`/`update` pin whichever of the first two routes supplied the command,
validated as an argv array; a later run that passes neither keeps the existing
pin, and passing `--configCommand` again replaces it. The pin exists because the
**Sync SPM Autolinking** build phase inherits neither your flag nor the shell
that exported the env var — without it, a successful `add` is followed by
failing builds, because the phase re-derives `autolinking.json` with the default
command. A pin never shadows the env var, so an override in your shell still
takes effect, and a pin that no longer parses is ignored in favor of the
default.

`deinit` deletes `.spm-injected.json`, and the pin with it. A later `add`
therefore falls back to the default command unless you pass `--configCommand`
(or export the env var) again.

### Pinning the React Native version

The resolved version selects **which artifact slots the project is wired to**,
so it has to stay the same from one run to the next. `--version` is therefore
recorded in the `.spm-injected.json` marker (as `artifactsVersionOverride`) and
read back by later runs, which resolve the version in this order:

1. an explicit `--version <ver>`,
2. the version a previous `--version` pinned into the marker,
3. `node_modules/react-native/package.json`.

So you pass the flag once, and a later flagless `add`/`update` stays on the
slots it selected. Without the pin, that flagless run falls back to
`package.json` and re-points the project at different artifact slots while the
marker still advertises the pinned version.

`deinit` deletes the marker, and with it the pin — a later `add` resolves
`node_modules/react-native/package.json` again unless you pass `--version`.

### Debug/Release flavor is automatic

React Native ships **flavored** prebuilt binaries: the _debug_ `React.framework`
(and `hermes-engine` / `ReactNativeDependencies`) carry the dev experience — dev
menu, assertions, `RN_DEBUG_STRING_CONVERTIBLE` — while _release_ strips them
for production. A Debug build must embed the debug binaries and a
Release/archive the release ones.

SwiftPM `binaryTarget`s can't branch on the build configuration, so runtime
frameworks are deliberately kept out of the package graph. `spm add` downloads
and validates **both** flavors into immutable app-local slots. It injects
SDK/architecture-qualified Xcode settings that link the exact selected binaries,
plus one phase that copies and signs the selected frameworks into the app.
Configurations containing `debug` or `development` select Debug; every other
configuration selects Release. Selection uses only generated build settings and
standard macOS tools: builds do not run Node, mutate symlinks, regenerate the
package graph, or require a second build.

Those same debug-flavored configurations also get
`SWIFT_ACTIVE_COMPILATION_CONDITIONS = "$(inherited) DEBUG"` — the only thing
that makes Swift's `#if DEBUG` true (`GCC_PREPROCESSOR_DEFINITIONS` reaches
C/ObjC/C++ only), and what `AppDelegate.swift`'s `bundleURL()` branches on to
load from Metro instead of a bundled `main.jsbundle`. CocoaPods injects it at
`pod install` time, so this keeps SwiftPM apps at parity. An existing value is
left alone.

## Files the tool touches

Paths are relative to the Xcode project directory (`ios/`) unless noted.

### In your repo — committed

| Path                                                | Written by          | What happens                                                                                                                                                                                                                                                           | Undone by `deinit`?                                                                        |
| --------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `MyApp.xcodeproj/project.pbxproj`                   | `add`, `update`     | SwiftPM package refs, the React build settings, the Sync build phase, and the flavored-framework embed phase are added. Purely additive; a re-run is a no-op.                                                                                                          | Yes — exactly what was injected, per the marker (one exception below)                      |
| `MyApp.xcodeproj/.spm-injected.json`                | `add`, `update`     | Created. Two roles: it records every edit made — including the pre-injection value of any build setting rewritten — so removal is surgical and re-runs stay idempotent; and it **pins configuration** later runs and Xcode builds must reuse (see the two pins below). | Yes — deleted, and the pins go with it                                                     |
| `MyApp.xcodeproj/xcshareddata/xcschemes/*.xcscheme` | `add`, `update`     | The sync pre-action is added to the scheme that builds your target; a shared scheme is created if there is none. Commit this or teammates lose the pre-action.                                                                                                         | Yes — the scheme is deleted if `add` created it, otherwise only the pre-action is stripped |
| `.gitignore`                                        | `add` only          | Created if absent, else appended: a `# SPM – auto-generated at build time` block adding `Package.resolved`, `build/generated/`, `build/xcframeworks/`, `.build/`.                                                                                                      | **No** — the block is left behind                                                          |
| `Podfile`                                           | `add --deintegrate` | Only the React Native directives (`use_react_native!`, `use_native_modules!`, `prepare_react_native_project!`) are stripped. Your own `pod '…'` lines are preserved.                                                                                                   | **No** — re-add the directives yourself to go back to CocoaPods                            |
| `Pods/`, `Pods-*.xcconfig`, `[CP]` phases           | `add --deintegrate` | Removed by `pod deintegrate`.                                                                                                                                                                                                                                          | **No** — run `pod install` to restore                                                      |
| `MyApp.xcworkspace/contents.xcworkspacedata`        | `add --deintegrate` | The dangling `Pods/Pods.xcodeproj` reference `pod deintegrate` leaves behind is removed (otherwise Xcode shows a permanent red, missing row).                                                                                                                          | Yes — restored byte-for-byte, if untouched since (see [Removing / resetting](#removing--resetting)) |
| `react-native.config.js`                            | `add --deintegrate` | `project.ios.automaticPodsInstallation` is set to `false` (creating the file if it doesn't exist), so a build never silently re-runs `pod install` and re-breaks the SwiftPM package graph.                                                                          | Yes — restored byte-for-byte, if untouched since (see [Removing / resetting](#removing--resetting)) |

The two pinned settings are the `--version` pin (`artifactsVersionOverride`, see
[Pinning the React Native version](#pinning-the-react-native-version)) and the
[autolinking config command](#the-autolinking-config-command-is-remembered).
Because `deinit` drops the marker, it drops both.

### In your repo — generated, gitignored

| Path                           | Written by                          | Contents                                                                                                                                                                                  |
| ------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build/generated/ios/`         | `add`, `update`, `sync`, `codegen`  | Codegen output plus the SwiftPM codegen manifest (the `React-GeneratedCode` package).                                                                                                     |
| `build/generated/autolinking/` | `add`, `update`, `sync`             | `Package.swift`, `autolinking.json`, `packages/`, `libs/`, `headers/`, the `.spm-sync-stamp`, `.spm-sync-watch-paths`, and any `.spm-plugin-*.json` plugin manifests.                     |
| `build/xcframeworks/`          | `add`, `update`, `sync`, `download` | The `debug/` and `release/` flavor slots (symlinks into the cache), `ReactHeadersTarget/`, the headers-only xcframeworks, `Package.swift`, `flavored-frameworks.json`, `.artifact-stamp`. |
| `.build/`, `Package.resolved`  | Xcode / SwiftPM                     | SwiftPM's own build directory and resolution file. Machine-specific.                                                                                                                      |

`deinit` leaves all of the above in place — it is regenerable, and removing it
is `rm -rf build/ .build/` (see [Removing / resetting](#removing--resetting)).

### Outside your repo

| Path                                                             | Written by                          | Notes                                                                                                                                                                                        |
| ---------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node_modules/<dep>/Package.swift`                               | `scaffold`                          | A generated manifest for a dep that ships none. Not committed — persist with `patch-package` (see [Community packages without a Package.swift](#community-packages-without-a-packageswift)). |
| `~/Library/Caches/ReactNative/spm-artifacts/<version>/<flavor>/` | `add`, `update`, `sync`, `download` | The immutable artifact slots the `build/xcframeworks/` symlinks point at. Shared across apps on the machine.                                                                                 |
| `~/Library/Caches/ReactNative/`                                  | `download`                          | Downloaded tarballs, shared with CocoaPods. `RCT_SKIP_CACHES=1` bypasses the cache.                                                                                                          |

Injection is **purely additive** and **idempotent**: every other byte of your
project — signing, capabilities, your own Build Phases — stays untouched, and a
re-run is a no-op. The injected refs point at three stable sub-package paths
under `build/`, so adding or removing community deps changes the sub-package
contents (gitignored) and never re-injects. `deinit` removes exactly what was
injected, leaving the project byte-identical to its pre-`add` state — with the
exceptions called out above, and one more described next.

**Build settings that already exist** are edited in place. The four array
settings `add` merges into — `HEADER_SEARCH_PATHS`, `OTHER_LDFLAGS`,
`FRAMEWORK_SEARCH_PATHS`, `LD_RUNPATH_SEARCH_PATHS` — keep the shape they were
written in: Xcode's multi-line form as well as the compact one-line form hand
edits and other generators (XcodeGen, Tuist) emit. One that exists as a plain
_scalar_ is promoted to a `( … )` array — the shape an Xcode-authored target can
carry, e.g. a
`LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";` written
as a scalar rather than a list. `add` records the pre-injection value in the
marker and `deinit` restores it by rewriting the whole field — once folded
together, the injected members and your own are indistinguishable — so **members
you add to a promoted array by hand afterwards are lost**. That applies to
`update` too, which reverts to the recorded baseline before re-injecting.

## Fresh clones & CI

Everything under `build/` is gitignored, so a clean checkout has no resolvable
Swift packages until they are regenerated. Xcode resolves the package graph
before build phases **and** before scheme pre-actions, so neither
[auto-sync hook](#auto-sync) can rescue this: with `build/generated/autolinking`
missing, the build stops at _"Resolve Package Graph … doesn't exist"_ having run
neither hook.

Verified on Xcode 26.6 against a freshly-injected app with `build/` deleted:
`xcodebuild -scheme … build` fails in nine lines of log, with
`Resolve Package Graph` as the first step and no trace of the pre-action;
`xcodebuild -resolvePackageDependencies` fails identically. Opening the project
in Xcode also resolves the graph on load, before you press Build.

So run the setup command once after cloning, before building — the SwiftPM
analog of `pod install`:

```bash
npx react-native spm      # downloads artifacts (if missing) + regenerates build/
```

On an already-injected project this routes to `update`: it fetches the
xcframework artifacts into the shared cache if they aren't present and
regenerates `build/xcframeworks` + `build/generated`. After this first run,
incremental dependency changes are picked up automatically by the auto-sync
hooks.

**Automate it** so nobody has to remember — add a `postinstall` hook, which runs
as part of the `npm install` / `yarn install` your CI already does before
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
> `binaryTarget(url:checksum:)`) removes this step entirely: SwiftPM resolves
> and fetches the artifacts itself during normal package resolution. Until then,
> the one-time setup run is required on clean machines.

## Local Native Modules

Modules not discovered via autolinking can be declared in
`react-native.config.js`:

```js
module.exports = {
  spm: {
    modules: [
      {
        name: 'MyNativeModule',
        path: 'ios/MyNativeModule', // relative to app root
        exclude: ['*.podspec'], // optional
        publicHeadersPath: '.', // optional
      },
    ],
  },
};
```

Each entry becomes a target in `build/generated/autolinking/Package.swift`.
Sources outside `build/generated/autolinking/` are automatically mirrored with
file-level symlinks.

## Dependencies between libraries

SwiftPM has no equivalent of a podspec's `s.dependency`, so a library that needs
another native library declares it explicitly with `spm.dependencies` in its
**own** `react-native.config.js` — a list of npm names:

```js
// react-native-reanimated/react-native.config.js
module.exports = {
  dependency: {platforms: {ios: {}}},
  spm: {dependencies: ['react-native-worklets']},
};
```

The autolinker starts from the directly-autolinked deps, follows each one's
`spm.dependencies` **recursively**, and dedupes the result, so a transitive
dependency is pulled into the package graph even when the app never depends on
it directly. Declared names are mapped to Swift target names, so the dependent
library's target can import it.

This is a **library-author** surface, like the podspec dependency it replaces —
apps don't normally set it.

## Self-managed community packages

A community library that ships its own `Package.swift` is referenced directly by
the autolinker instead of being wrapped. To keep SwiftPM's package identity
(which it derives from the path basename) unique across deps — even when several
libs put their manifest inside an `ios/` subdir — each self-managed dep is
exposed through a uniquely-named symlink at
`build/generated/autolinking/libs/<SwiftName>/`. The aggregator `Package.swift`
references that path, so two libs both shipping `<dep>/ios/Package.swift` never
collide on identity `"ios"`.

The `libs/` directory is wiped and recreated on every autolinker run, so
deleting a dep via `npm uninstall` cleans up the alias automatically on the next
build.

## Community packages without a Package.swift

If an autolinked library ships **no `Package.swift`**, `spm add`/`update` stops
with a per-dep error (`Package.swift is missing for library "<name>"`) and exits
**2** — a distinct code from a generic failure, so CI and the Xcode sync hooks
can treat it as a hard error while staying lenient about transient sync
failures.

`add` and `update` deliberately **never** scaffold on your behalf:
auto-scaffolding would hide a real gap in the dependency's SPM support. Generate
the manifest from the library's podspec explicitly, then re-run setup:

```bash
npx react-native spm scaffold      # writes Package.swift into node_modules/<dep>/
npx react-native spm               # then inject/update as usual
```

(`scaffold` also runs codegen and regenerates the autolinking package, but it
does not inject into the `.xcodeproj` — so on a first-time setup you still
follow it with `npx react-native spm`.)

Because `node_modules/` isn't committed, persist it so it survives the next
install:

```bash
npx patch-package <dep>            # then commit the generated patch
```

**Better: contribute the manifest upstream.** The generated `Package.swift` is a
normal, committable manifest — the ideal fix is for the library to ship it
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
product dependencies, and generated sources. Discovery is transitive (installing
the framework is enough), and the plugin returns data that RN merges
idempotently.

See **[spm-autolinking-plugins.md](./spm-autolinking-plugins.md)** for the
discovery mechanism, the full context/return contract, lifecycle, and failure
behavior.

## Removing / resetting

To remove SwiftPM entirely, use `deinit` (the inverse of `add`):

```bash
react-native spm deinit   # surgically removes everything `add` injected
pod install               # then, to restore CocoaPods
```

If `--deintegrate` set `automaticPodsInstallation: false` (see above),
`deinit` restores `react-native.config.js` to its exact state from before
`--deintegrate` touched it — deleting the file if `--deintegrate` created it,
or reverting the edit byte-for-byte otherwise. Same for the dangling
`Pods/Pods.xcodeproj` workspace reference `--deintegrate` removed: `deinit`
puts it back byte-for-byte (React Native needs a real reference there again
once `pod install`, above, reintegrates CocoaPods). Either restoration is
skipped — leaving your changes alone, with a warning — if the file has been
touched since `--deintegrate` edited it, so `deinit` never clobbers something
you did afterward.

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

| Problem                                                                                                                | Fix                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xcodebuild` fails: "Could not resolve package dependencies … `build/generated/autolinking` doesn't exist"             | Fresh clone — run `npx react-native spm` once before building (see [Fresh clones & CI](#fresh-clones--ci))                                                                                                                                                                                                                                                  |
| `spm add` fails: "CocoaPods-integrated project"                                                                        | Re-run `spm add --deintegrate` (runs `pod deintegrate` + strips RN from the Podfile), or `pod deintegrate` yourself first.                                                                                                                                                                                                                                  |
| `spm add` fails: "no .xcodeproj found"                                                                                 | Create an app first (`npx @react-native-community/cli init`) or make a project in Xcode, then `spm add`.                                                                                                                                                                                                                                                    |
| `spm add` fails: "multiple .xcodeproj found"                                                                           | Pass `--xcodeproj <path>` (and `--product-name <target>` if multiple app targets).                                                                                                                                                                                                                                                                          |
| `Package.swift is missing for library "<name>"` (exit 2)                                                               | The dep ships no SwiftPM support. `npx react-native spm scaffold`, then re-run setup; persist with `patch-package`. See [Community packages without a Package.swift](#community-packages-without-a-packageswift)                                                                                                                                            |
| Missing headers                                                                                                        | Re-run `react-native spm`                                                                                                                                                                                                                                                                                                                                   |
| "not contained in target"                                                                                              | Re-run setup (regenerates file-level symlinks)                                                                                                                                                                                                                                                                                                              |
| Codegen fails                                                                                                          | Use `--skipCodegen` to iterate on other parts                                                                                                                                                                                                                                                                                                               |
| "SPM sync failed" warning                                                                                              | Check Xcode build log for details; node may not be in PATH — ensure `with-environment.sh` is present                                                                                                                                                                                                                                                        |
| "Sync SPM Autolinking" build phase fails: `'npx --no-install @react-native-community/cli config' exited with status 1` | This app replaces `@react-native-community/cli` autolinking (e.g. an Expo app). Re-run `spm add`/`update` with `--configCommand` (or with `RCT_SPM_AUTOLINKING_CONFIG_COMMAND` exported) so the working command is pinned for the build phase to reuse — see [The autolinking config command is remembered](#the-autolinking-config-command-is-remembered). |
| Autolinking not updating on build                                                                                      | Touch `package.json` to force a sync, or delete `build/generated/autolinking/.spm-sync-stamp`                                                                                                                                                                                                                                                               |
| Stale SwiftPM state or corrupted build                                                                                 | `rm -rf build/ .build/`, then `react-native spm update`, then reopen Xcode                                                                                                                                                                                                                                                                                  |
| Want to revert to CocoaPods                                                                                            | `react-native spm deinit`, then `pod install`                                                                                                                                                                                                                                                                                                               |

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

### Header Resolution

React Native uses CocoaPods-style imports (`#import <React/RCTBridge.h>`) that
SwiftPM doesn't natively support. The prebuilt artifacts serve them through
SwiftPM package products — no `-I` search-path flags, and no clang VFS overlay:

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
   sidecar (same mechanism — the binary `ReactNativeDependencies.xcframework` is
   framework-type and can't expose those headers to SwiftPM).

Targets that compile against React take these as product dependencies
(`ReactHeaders`, `ReactNativeHeaders`, `ReactNativeDependenciesHeaders`, plus
the app's `ReactAppHeaders`), so all of the above resolve with zero search-path
flags.

### Auto-Sync

Autolinking is kept up to date without manual re-runs of `react-native spm` by
**two hooks running the same sync script**, injected by `add`/`update`:

| Hook                               | Where                                                                                       | Role                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Scheme pre-action                  | The app's **shared** scheme (`xcshareddata/xcschemes/`), under `BuildAction` → `PreActions` | Fires earlier in the build than a build phase can, so it is the one that normally does the re-sync. |
| `Sync SPM Autolinking` build phase | `.xcodeproj`, prepended before `Sources`                                                    | **Safety net** for builds that bypass the scheme (and for a scheme whose pre-action was stripped).  |

Neither hook can bootstrap a clean checkout. Xcode resolves the Swift package
graph before build phases **and** before scheme pre-actions, so if the generated
packages are missing entirely, resolution fails and the build stops before
either hook runs — see [Fresh clones & CI](#fresh-clones--ci). The hooks keep an
_existing_ set of generated packages current; they do not create the first one.

**How the sync script works:**

1. Compares timestamps of staleness inputs against
   `build/generated/autolinking/.spm-sync-stamp`:
   - `package.json` — dependency declarations
   - `react-native.config.js` — `spm.modules` config
   - `node_modules/` directory mtime — updated by any package manager (npm,
     yarn, pnpm, bun); also checks parent `node_modules` for monorepo setups
   - a missing `build/xcframeworks/` (e.g. after a manual clean) also marks
     stale
   - every path in `.spm-sync-watch-paths` — RN's own inputs plus any
     [plugin](./spm-autolinking-plugins.md#watchpaths--plugin-staleness-inputs)
     `watchPaths`; a watched file that is newer, a watched dir with a newer
     child, or a watched path that has **vanished** all mark stale
2. If any input is newer (or the stamp is missing): runs
   `npx react-native spm sync`, which re-executes autolinking + package
   generation (downloading artifacts if the cache slot is incomplete) and writes
   the stamp file.
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

Resolution coming first is what makes the one-time setup run necessary on a
clean checkout; it is not something either hook can work around.

A sync failure is lenient by default but **not unconditionally**. The generated
script branches on the exit code:

- **Exit 2** — an autolinked dependency ships no `Package.swift`. This **fails
  the build** (`exit 1`), deliberately: the autolinker has already printed an
  `error:` line per dep, and the fix needs a terminal (see
  [Community packages without a Package.swift](#community-packages-without-a-packageswift)).
- **Any other non-zero exit** — emits
  `warning: SPM sync failed — build may use stale codegen/autolinking` and lets
  the build continue, so an already-generated package graph can still produce a
  successful build.

That split is the whole reason the missing-manifest case has its own exit code:
a transient sync hiccup should not break a build that could still succeed, while
a genuinely missing manifest should not pass silently.
