# SwiftPM Autolinking Plugins (Preview)

> **Preview / unstable contract.** The discovery mechanism and the plugin
> function's context/return shape may change while the first consumers (Expo)
> validate it. Pin to a React Native version if you depend on it.

How a framework with its own module system — Expo is the first consumer —
contributes to the SwiftPM autolinking graph that `npx react-native spm`
generates. See [spm-scripts.md](./spm-scripts.md) for the base tool.

## Why a plugin (not a static list or a post-process)

The documented extension points don't cover a framework:

- `spm.modules` in `react-native.config.js` is a **static** list of simple
  source modules. A framework discovers its modules **dynamically** (scanning
  `node_modules`), generates a **module registry**, and ships mixed
  Swift/ObjC/C++ modules (e.g. `ExpoModulesCore`) that `spm scaffold` can't
  handle.
- A one-shot **post-process** of the generated `Package.swift` is **clobbered
  on the next sync**: the Xcode [auto-sync build phase](./spm-scripts.md#auto-sync-build-phase)
  re-runs autolinking on every dependency change. A framework's contribution
  must run *whenever autolinking runs*.

A plugin is exactly that. It is invoked from `generate-spm-autolinking.js`'s
`main()` — the single function that both `add` / `update` **and** the
build-time `sync` call — so the contribution is regenerated on every build and
never goes stale.

(This is the SwiftPM analog of the seams CocoaPods gave Expo: the Podfile,
`use_expo_modules!`, and `react_native_post_install` hooks.)

## Discovery — transitive, zero app config

A dependency opts in from its **own** `react-native.config.js`, so installing
the framework is enough (mirrors how CocoaPods pulls in `use_expo_modules!`
transitively):

```js
// node_modules/expo/react-native.config.js
module.exports = {
  spm: {autolinkingPlugin: './spm/autolinking-plugin.js'},
};
```

The autolinker already walks every dependency's `react-native.config.js`; any
that declares `spm.autolinkingPlugin` is `require`d and invoked. No app-level
registration or allowlist is required.

**Opt-out escape hatch.** An app can exclude a plugin from its own
`react-native.config.js`:

```js
module.exports = {
  spm: {denyPlugins: ['some-framework']}, // npm names to skip
};
```

## The contract

A plugin is a function exported from the module named above
(`module.exports = fn`, or `default` / `plugin` named exports also work):

```js
module.exports = function plugin(context) {
  return {
    packageDependencies: [
      // Local package (e.g. a scanned module dir) …
      {name: 'ExpoModulesCore', path: '../../../node_modules/expo-modules-core/ios'},
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
  };
};
```

#### `flavoredFrameworks` — per-configuration precompiled frameworks

Each entry is
`{id, frameworkName, linkage: 'dynamic', flavors: {debug, release}}`.
Both flavor paths must be absolute and present when `spm add` or `spm update`
runs. The framework and executable names, public headers, and platform slices
must agree across flavors. Static binaries, nested frameworks, duplicate IDs,
and duplicate embedded framework names are fatal.

The declarations are recorded to
`<outputDir>/.spm-plugin-flavored-frameworks.json`, normalized into the same
immutable app-local slots as React Native, and added to Xcode's exact linker and
embed settings. They are not emitted as SwiftPM product dependencies. Adding or
removing one requires `spm update`; the build-time `spm sync` intentionally does
not mutate runtime framework settings.

#### `watchPaths` — plugin staleness inputs

`watchPaths` is an array of **absolute** paths (dirs **or** files) the Xcode
auto-sync build phase watches to decide whether it must re-sync. RN already
watches each module's source dir plus every npm dep's checked-in `Package.swift`
and `.react-native/` dir; a plugin adds the inputs only it knows about — e.g.
`packages/expo/Package.swift`, `expo-module.config.json`, and per-module
manifests. On the next build the phase re-syncs when a watched **file** is newer
than the last sync, a watched **dir** has a newer child, or a watched path has
**vanished** (a rename forces a re-sync so the config error surfaces).

Unlike `flavoredFrameworks`, watch paths are best-effort: a non-array is ignored with a warning
(never fatal), and each non-string / empty / **relative** entry is dropped with a
warning. Absolute-only, because the generated phase tests these paths with no cwd
context. The kept paths are folded into `<outputDir>/.spm-sync-watch-paths`
alongside RN's own, then deduped and sorted.

### Context (input)

| Field | Meaning |
|---|---|
| `appRoot` | The Xcode project directory (`<app>/ios`) being injected — **not** the app package root. Deriving package-root-relative paths from it (e.g. `path.join(appRoot, 'node_modules')`) silently breaks; use `projectRoot` for that. |
| `projectRoot` | The JS root (nearest `package.json`) — where the framework scans `node_modules`. |
| `reactNativeRoot` | Resolved `react-native` package root. |
| `autolinking` | Parsed `autolinking.json` — RN's already-discovered deps, so the plugin can react to them. |
| `outputDir` | `build/generated/autolinking` — where generated artifacts land. |
| `react` | How to depend on React (see below). `null` when there is no resolvable React dependency. |

#### `context.react` — depending on React

A plugin that emits its own `Package.swift` must declare React as a dependency.
Rather than re-deriving React Native's package path, identity, and product
names — which differ between local and remote mode and **move as RN
repackages** — take them from `context.react`:

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

Local vs remote is signalled by which `packageRef` keys are present (`path` xor
`url`+`version`). `packageRef.path` is **absolute** — always correct no matter
which subdirectory of `outputDir` the plugin writes its own manifest into (the
generated manifests are gitignored and regenerated every sync, so there's no
portability cost); `relPath` (relative to `outputDir`) is provided as a
convenience. `products` is the set React Native wires into **its own** autolinked
targets (so a plugin's target compiles against exactly RN's React surface),
filtered to those resolvable this run — every listed product is safe to
reference without guarding. Note the fourth entry: `ReactAppHeaders` lives in
the separate `React-GeneratedCode` package (per-app codegen), which a
hand-rolled plugin would miss, and which is omitted when that package is absent.
Because RN derives this list from one source of truth alongside its own product
wiring, it stays correct across repackaging.

### Return (contributions, all optional)

| Field | Merged into |
|---|---|
| `packageDependencies` | The aggregator's `.package(…)` list (`path`, or `url` + `version`). |
| `productDependencies` | The `AutolinkedAggregate` target's `dependencies:` (`.product(name:package:)`). |
| `generatedSources` | Recorded for the codegen step to register (e.g. a module-registry `.swift`). |
| `flavoredFrameworks` | Mandatory Debug/Release dynamic XCFramework pairs normalized outside SwiftPM. Malformed or incomplete entries are fatal. |

The plugin returns **data** — it never writes into React Native's generated
tree. RN owns the merge, so a re-sync reproduces the same `Package.swift`
byte-for-byte (idempotent). Package and product contributions are **deduped by
name** across plugins.

## Lifecycle

```
react-native spm add / update ─┐
                               ├─► generate-spm-autolinking main()
Xcode "Sync SPM Autolinking" ──┘        │
(build phase, every build)              ├─ 1. discover plugins (dep configs)
                                        ├─ 2. RN builds its own dep graph
                                        ├─ 3. invoke plugins (context in)
                                        └─ 4. merge results → aggregator Package.swift
```

Because steps 1–4 run in the one `main()`, everything above shares the same
seam — there is no separate hook to wire for the build-time path.

## Failure behavior

Fail-closed and **named**: a plugin that fails to load, doesn't export a
function, throws, or returns a malformed contribution aborts the run with a
message identifying the framework. A framework silently dropping its modules
(a green build missing native code) is worse than a loud stop.

## Status & open items (Preview)

- **Implemented & tested:** discovery (transitive + deny-list), invocation,
  package + product merge, fail-closed validation, and dual-flavor framework
  normalization/link/embed outside SwiftPM.
- **Implemented & tested:** `generatedSources` **app-target wiring**. The
  merge writes `.spm-plugin-generated-sources.json`; the `spm add`/`update`
  xcodeproj injector (generate-spm-xcodeproj.js) reads it and wires each source
  **into the app target** — a `PBXFileReference` + `PBXBuildFile` + a
  Sources-build-phase entry, parented under one "SPM Generated Sources"
  navigator group. This is what makes an `@objc` class (e.g. Expo's
  `ExpoModulesProvider`) reach the ObjC classlist: a class inside the static
  Autolinked aggregate never does, so `NSClassFromString` discovery would fail.
  Paths are stored SRCROOT-relative when under the app root (the usual
  `build/generated/…` case), else absolute (`sourceTree = "<absolute>"`). All
  UUIDs are namespaced on the normalized path (deterministic/idempotent) and
  recorded in the `.spm-injected.json` marker's `generatedSources` map, so
  `deinit` reverts them and `update` reconciles entries that left the manifest.
  A target without a Sources phase logs loudly and skips the wiring (injection
  otherwise succeeds). v1 targets only the injected app target and assumes
  `.swift` in practice (`.m`/`.mm` are mapped as future-proofing).
- **Co-design with Expo (not final):** codegen **provider ordering** — codegen
  must consume the same discovered module set the plugin contributes — is
  intentionally left for the first real plugin to drive to a stable shape.
- Contract to be ratified via RFC once Expo's plugin proves it (framed as a
  generic hook, not Expo-specific code in RN).
