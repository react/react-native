# SwiftPM Autolinking Plugins (Preview)

> **Preview / unstable contract.** The discovery mechanism and the plugin
> function's context/return shape may change while the first consumers (Expo)
> validate it. Pin to a React Native version if you depend on it.

How a framework with its own module system — Expo is the first consumer —
contributes to the SwiftPM autolinking graph that `npx react-native spm`
generates. See [spm-scripts.md](./spm-scripts.md) for the base tool.

## Why a plugin (not a static list or a post-process)

The documented extension points don't cover a framework:

- `swiftpmConfig.modules` in package.json is a **static** list of simple source
  modules. A framework discovers its modules **dynamically** (scanning
  `node_modules`), generates a **module registry**, and ships mixed
  Swift/ObjC/C++ modules (e.g. `ExpoModulesCore`) that `spm scaffold` can't
  handle.
- A one-shot **post-process** of the generated `Package.swift` is **clobbered on
  the next sync**: the Xcode [auto-sync hooks](./spm-scripts.md#auto-sync)
  re-run autolinking on every dependency change. A framework's contribution must
  run _whenever autolinking runs_.

A plugin does exactly that. `generate-spm-autolinking.js`'s `main()` invokes it.
`add` / `update` **and** the build-time `sync` all call that one function. So
the contribution is regenerated on every build and never goes stale, and the
build-time path needs no separate hook.

This is the SwiftPM analog of the seams CocoaPods gave Expo: the Podfile,
`use_expo_modules!`, and `react_native_post_install` hooks.

## Discovery — transitive, zero app config

A dependency opts in from its **own** package.json, so installing the framework
is enough. This mirrors how CocoaPods pulls in `use_expo_modules!` transitively:

```json
// node_modules/expo/package.json
{
  "swiftpmConfig": {"autolinkingPlugin": "./spm/autolinking-plugin.js"}
}
```

The autolinker reads every dependency's SwiftPM settings. It `require`s and
invokes each one that declares `autolinkingPlugin`. No app-level registration or
allowlist is required. The deprecated `spm.autolinkingPlugin` in
`react-native.config.js` is still read — see
[Migrating from react-native.config.js](spm-scripts.md#where-swiftpm-settings-live).

A dependency that declares a plugin owns its native contribution. React Native
does not build it as an autolinked target, so it needs no `Package.swift` of its
own.

**Opt-out escape hatch.** An app can exclude a plugin from its own package.json:

```json
{
  "swiftpmConfig": {"denyPlugins": ["some-framework"]}
}
```

## The contract

A plugin is a function exported from the module named above
(`module.exports = fn`, or `default` / `plugin` named exports also work):

```js
module.exports = function plugin(context) {
  return {
    packageDependencies: [
      // Local package (e.g. a scanned module dir) …
      {
        name: 'ExpoModulesCore',
        path: '../../../node_modules/expo-modules-core/ios',
      },
      // … or a remote/published package:
      // {name: 'SomePkg', url: 'https://…/SomePkg.git', version: '1.2.3'},
    ],
    productDependencies: [
      // Linked by the app's AutolinkedAggregate target:
      {name: 'ExpoModulesCore', package: 'ExpoModulesCore'},
    ],
    generatedSources: [
      // e.g. the generated module registry, registered with codegen:
      {path: 'build/generated/expo/ExpoModulesProvider.swift'},
    ],
    flavoredFrameworks: [
      // Precompiled dynamic XCFrameworks that come in mandatory Debug/Release
      // pairs. RN validates and stages both outside the SwiftPM graph.
      {
        id: 'expo-modules-core',
        frameworkName: 'ExpoModulesCore',
        linkage: 'dynamic',
        flavors: {
          debug: '/…/output/debug/xcframeworks/ExpoModulesCore.xcframework',
          release: '/…/output/release/xcframeworks/ExpoModulesCore.xcframework',
        },
      },
    ],
    watchPaths: [
      // Inputs whose edits must re-trigger the auto-sync — the plugin's own
      // manifest and per-module config (absolute paths, dirs or files):
      '/…/node_modules/expo/Package.swift',
      '/…/node_modules/expo/expo-module.config.json',
    ],
    scriptPhases: [
      // Build-time shell phases on the app target — SwiftPM's missing
      // `script_phase`:
      {
        id: 'expo-constants.generate-app-config',
        name: 'Generate Expo App Config',
        script: '"$NODE_BINARY" .../createExpoConfig.js',
        position: 'beforeCompile', // default: 'end'
        inputPaths: ['$(SRCROOT)/../app.config.js'],
        outputPaths: ['$(DERIVED_FILE_DIR)/EXConstants.bundle/app.config'],
        alwaysOutOfDate: true,
      },
    ],
  };
};
```

### `generatedSources` — sources wired into the app target

The merge writes `.spm-plugin-generated-sources.json`. The `spm add`/`update`
xcodeproj injector (`generate-spm-xcodeproj.js`) reads it and wires each source
**into the app target**: a `PBXFileReference`, a `PBXBuildFile`, and a
Sources-build-phase entry, all under one "SPM Generated Sources" navigator
group.

This is what makes an `@objc` class (e.g. Expo's `ExpoModulesProvider`) reach
the ObjC classlist. A class inside the static Autolinked aggregate never does,
so `NSClassFromString` discovery would fail.

- Paths are stored SRCROOT-relative when they are under the app root (the usual
  `build/generated/…` case), else absolute (`sourceTree = "<absolute>"`).
- All UUIDs are namespaced on the normalized path, so injection is deterministic
  and idempotent. They are recorded in the `.spm-injected.json` marker's
  `generatedSources` map. `deinit` reverts them, and `update` reconciles entries
  that left the manifest.
- A target without a Sources phase logs loudly and skips the wiring. The rest of
  the injection succeeds.
- v1 targets only the injected app target and assumes `.swift` in practice.
  `.m`/`.mm` are mapped as future-proofing.

### `flavoredFrameworks` — per-configuration precompiled frameworks

Each entry is
`{id, frameworkName, linkage: 'dynamic', flavors: {debug, release}}`. Both
flavor paths must be absolute and present when `spm add` or `spm update` runs.
The framework and executable names, public headers, and platform slices must
agree across flavors. Static binaries, nested frameworks, duplicate IDs, and
duplicate embedded framework names are fatal.

The declarations are recorded to
`<outputDir>/.spm-plugin-flavored-frameworks.json`. They are normalized into the
same immutable app-local slots as React Native and added to Xcode's exact linker
and embed settings. They are not emitted as SwiftPM product dependencies. Adding
or removing one requires `spm update`: the build-time `spm sync` intentionally
does not mutate runtime framework settings.

### `watchPaths` — plugin staleness inputs

`watchPaths` is an array of **absolute** paths (dirs **or** files). The Xcode
auto-sync hooks watch them to decide whether they must re-sync. RN already
watches each module's source dir, plus every npm dep's checked-in
`Package.swift` and `.react-native/` dir. A plugin adds the inputs only it knows
about, e.g. `packages/expo/Package.swift`, `expo-module.config.json`, and
per-module manifests.

On the next build, the phase re-syncs when:

- a watched **file** is newer than the last sync,
- a watched **dir** has a newer child, or
- a watched path has **vanished**. A rename forces a re-sync, so the config
  error surfaces.

Unlike `flavoredFrameworks`, watch paths are best-effort. A non-array is ignored
with a warning (never fatal). Each non-string, empty, or **relative** entry is
dropped with a warning. Paths must be absolute because the generated phase tests
them with no cwd context. The kept paths are folded into
`<outputDir>/.spm-sync-watch-paths` alongside RN's own, then deduped and sorted.
Only paths that exist when the sync runs are written; a missing path is dropped
silently. So the **vanished** check applies only to paths that existed at the
last sync.

### `scriptPhases` — build-time shell phases on the app target

SwiftPM has no equivalent of CocoaPods' `script_phase`. A framework that must
run a script during the app's build declares it here. The first consumer is
`expo-constants`, which writes `EXConstants.bundle/app.config`.

The merge always rewrites `<outputDir>/.spm-plugin-script-phases.json` — `[]`
when no plugin declares any, so removing a plugin clears stale entries.
`spm add` / `spm update` read that sidecar and emit one
`PBXShellScriptBuildPhase` per entry on the injected app target:

| Key                          | Meaning                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                         | **Stable key** — the ledger entry and the deterministic UUID seed. Charset `/^[@A-Za-z0-9_./-]+$/`, so a scoped npm name like `@expo/log-box` is a valid id; a `:` is not, because the id is hashed into the UUID seed as `plugin:<id>` and the separator must stay unambiguous. Renaming it is a _remove + add_, not a rename. |
| `name`                       | The phase's display name in Xcode. Any non-empty single-line string — see **Hostile names** below.                                                                                                                                                                                                                              |
| `script`                     | The shell body.                                                                                                                                                                                                                                                                                                                 |
| `position`                   | `'beforeCompile'` or `'end'`. Optional, default `'end'` — see **Placement** below.                                                                                                                                                                                                                                              |
| `inputPaths` / `outputPaths` | Optional Xcode input/output file lists, which is what lets Xcode skip an up-to-date phase.                                                                                                                                                                                                                                      |
| `alwaysOutOfDate`            | Optional; when `true` the phase runs on every build regardless of its file lists.                                                                                                                                                                                                                                               |

**Placement.**

- `'end'` appends at the true end of the target's `buildPhases`, after the app's
  own JS-bundle phase.
- `'beforeCompile'` lands directly after the "Sync SPM Autolinking" phase, and
  always **before Sources**. The sync phase stays first because it regenerates
  the content everything else reads. React Native never re-seats its own sync
  phase. If you have dragged it below Sources, your `beforeCompile` phases sit
  ahead of Sources instead of following it.

Phases that share a position keep their declared order.

**Position is enforced on every sync.** `add`/`update` compares where the plugin
phases sit in `buildPhases` with the declared placement. **Only when the two
differ** does it lift their membership lines and re-seat them in declared order.
So a change to `position`, or a swap of two phases that share one, takes effect
on the next `spm add`/`update`, with no remove + re-add. When they agree nothing
is rewritten, so an unchanged declaration re-syncs to a byte-identical project.
The plugin's declaration is the source of truth: a phase you **drag somewhere
else in Xcode is moved back** to its declared position on the next sync.

Phases are injected by `spm add` / `spm update` **only**. The build-time `sync`
rewrites the sidecar but never touches the `.xcodeproj`. So a newly declared
phase appears on the next `add`/`update`, not on the next build. Each phase's
UUID is derived from its `id` and recorded in the `.spm-injected.json` marker's
`scriptPhases` map. So a re-run refreshes the phase's `name`, `script`, path
lists, `alwaysOutOfDate` and placement in place. `update` removes phases that
left the sidecar, and `deinit` reverts all of them.

Validation is **fatal**, like `flavoredFrameworks` and unlike `watchPaths`.
`invokePlugins` checks the `id` charset, a single-line `name`, a required
`script`, the `position` enum, and the optional path lists and
`alwaysOutOfDate`. A non-array `scriptPhases`, a malformed entry, or a duplicate
`id` (within one plugin or across plugins) aborts the run.

- A silently dropped phase would produce a green build whose generated content
  was never written — a runtime failure with no build-time signal.
- Two phases that share an `id` would collapse onto one ledger key.
- `__proto__`, `constructor`, and `prototype` are rejected as ids even though
  the charset admits them. As keys of that ledger they never become own
  properties. The phase would look recorded, disappear when the marker is
  serialized, and be unremovable by `deinit`.

**Hostile names.** A `name` reaches the project file twice:

- In the `name` field, which Xcode displays, it lands verbatim, escaped as an
  OpenStep string. Any single-line string is expressible there.
- Beside the phase's UUID, on the object's definition line and on its
  `buildPhases` member line, it becomes a `/* … */` comment. Xcode regenerates
  these comments from the `name` field, so they are cosmetic. But the injector
  scans the text around them by delimiter, so the name is **normalized** there.
  `{}(),;="*/`, tabs and whitespace runs collapse to single spaces
  (`spm-pbxproj.js`'s `commentSafe`). If nothing survives, the comment falls
  back to the phase `id`, normalized the same way, and then to no comment at
  all.

Without that normalization, a `{` in a comment would make the injector read the
next object's body as this one's. A `,` would make `deinit` delete the wrong
line. Both are corruption with no error. So only a line break is rejected
outright: a name is a display name, and no Xcode phase name spans lines.

The injector's read of the sidecar is deliberately lenient. The file does not
exist yet on a first `spm add`, and a stale or hand-edited copy must not break
injection.

- An absent file yields no phases, silently.
- An unparseable file warns.
- An entry that fails the same checks (bad or reserved `id`, empty or multi-line
  `name`, missing `script`, unknown `position`, duplicate `id`) is **skipped,
  never coerced**. The sidecar is the only gate on a hand edit, so it enforces
  exactly the rules the plugin contract does.

**Gating is the script's job.** The phase runs for every configuration and
platform the target builds. If it should be a no-op for some of them (Release
only, simulator only, …), the script must check `$CONFIGURATION` /
`$PLATFORM_NAME` and exit early.

### Context (input)

| Field             | Meaning                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `appRoot`         | The Xcode project directory (`<app>/ios`) being injected — **not** the app package root. Deriving package-root-relative paths from it (e.g. `path.join(appRoot, 'node_modules')`) silently breaks; use `projectRoot` for that. |
| `projectRoot`     | The JS root (nearest `package.json`) — where the framework scans `node_modules`.                                                                                                                                               |
| `reactNativeRoot` | Resolved `react-native` package root.                                                                                                                                                                                          |
| `autolinking`     | Parsed `autolinking.json` — RN's already-discovered deps, so the plugin can react to them.                                                                                                                                     |
| `outputDir`       | `build/generated/autolinking` — where generated artifacts land.                                                                                                                                                                |
| `react`           | How to depend on React (see below). `null` when there is no resolvable React dependency.                                                                                                                                       |

#### `context.react` — depending on React

A plugin that emits its own `Package.swift` must declare React as a dependency.
React Native's package path, identity, and product names differ between local
and remote mode, and they **move as RN repackages**. So take them from
`context.react` rather than re-deriving them:

```js
react: {
  packageRef:
    {name: 'ReactNative', path: '<absolute>', relPath: '<relative-to-outputDir>'} // local
    | {name: '<identity>', url: '<url>', version: '<version>'},                   // remote (SPM-resolved)
  products: [
    {name: 'ReactHeaders', package: 'ReactNative'},
    {name: 'ReactNativeHeaders', package: 'ReactNative'},
    {name: 'ReactNativeDependenciesHeaders', package: 'ReactNative'},
    {name: 'ReactAppHeaders', package: 'React-GeneratedCode'}, // ← separate, per-app package
  ],
}
```

- The `packageRef` keys signal local or remote mode: `path` xor `url`+`version`.
- `packageRef.path` is **absolute**, so it is correct in any subdirectory of
  `outputDir` the plugin writes its manifest into. The generated manifests are
  gitignored and regenerated every sync, so this has no portability cost.
  `relPath` (relative to `outputDir`) is a convenience.
- `products` is the set React Native wires into **its own** autolinked targets,
  so a plugin's target compiles against exactly RN's React surface. It is
  filtered to the products resolvable this run, so every listed product is safe
  to reference without a guard.
- The fourth entry, `ReactAppHeaders`, lives in the separate
  `React-GeneratedCode` package (per-app codegen). A hand-rolled plugin would
  miss it. It is omitted when that package is absent.

RN derives this list from one source of truth alongside its own product wiring,
so it stays correct across repackaging.

### Return (contributions, all optional)

| Field                 | Merged into                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packageDependencies` | The aggregator's `.package(…)` list (`path`, or `url` + `version`).                                                                                    |
| `productDependencies` | The `AutolinkedAggregate` target's `dependencies:` (`.product(name:package:)`).                                                                        |
| `generatedSources`    | Recorded for the codegen step to register (e.g. a module-registry `.swift`).                                                                           |
| `flavoredFrameworks`  | Mandatory Debug/Release dynamic XCFramework pairs normalized outside SwiftPM. Malformed or incomplete entries are fatal.                               |
| `scriptPhases`        | Recorded for `spm add` / `update` to emit one `PBXShellScriptBuildPhase` per entry on the app target. Malformed entries and duplicate `id`s are fatal. |

The plugin returns **data**. It never writes into React Native's generated tree.
RN owns the merge, so a re-sync reproduces the same `Package.swift`
byte-for-byte (idempotent). Across plugins, package contributions are **deduped
by name** and product contributions by **package and name**. The first
contribution wins.

## Lifecycle

```text
react-native spm add / update ─┐
                               ├─► generate-spm-autolinking main()
Xcode "Sync SPM Autolinking" ──┘        │
(build phase, every build)              ├─ 1. discover plugins (dep configs)
                                        ├─ 2. RN builds its own dep graph
                                        ├─ 3. invoke plugins (context in)
                                        └─ 4. merge results → aggregator Package.swift
```

## Failure behavior

Failures are fail-closed and **named**. A plugin that fails to load, doesn't
export a function, throws, or returns a malformed contribution aborts the run.
The message identifies the framework. A framework that silently drops its
modules (a green build missing native code) is worse than a loud stop.

A plugin's host dependency is also a hard error when another library lists it in
`swiftpmConfig.dependencies` and that library has no `Package.swift` of its own
(shipped or scaffolded). React Native builds no target for the host, so there is
nothing to depend on. Remove the entry: the plugin already links its products
into the app.

## Status & open items (Preview)

- **Implemented & tested:** discovery (transitive + deny-list), invocation,
  package + product merge, and fail-closed validation.
- **Implemented & tested:** dual-flavor framework normalization/link/embed
  outside SwiftPM
  ([`flavoredFrameworks`](#flavoredframeworks--per-configuration-precompiled-frameworks)).
- **Implemented & tested:**
  [`generatedSources`](#generatedsources--sources-wired-into-the-app-target)
  **app-target wiring**.
- **Implemented & tested:**
  [`scriptPhases`](#scriptphases--build-time-shell-phases-on-the-app-target),
  from the contract through injection.
- **Co-design with Expo (not final):** codegen **provider ordering** — codegen
  must consume the same discovered module set the plugin contributes — is
  intentionally left for the first real plugin to drive to a stable shape.
- Contract to be ratified via RFC once Expo's plugin proves it (framed as a
  generic hook, not Expo-specific code in RN).
