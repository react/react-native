# SPM headers & package references — how they resolve

React Native's SPM consumption is **zero-I**: no `-I` / `-F` header search
paths and no `unsafeFlags` in any generated manifest. Headers are served by
SPM products/binary targets, and every generated `Package.swift` references
the React Native + codegen packages with plain, fixed-relative paths computed
at generation time (no runtime discovery). This document is the single source
of truth for how that resolves.

> History: earlier iterations materialized two header trees and fed them to
> consumers as `-I` flags read from `spm-paths.json` / `.react-native/paths.json`
> via an inlined Swift loader. That whole mechanism (the loader
> `renderRNPathsLoader`, the `writeAppPathsJson` / `writeSharedPathsJson`
> writers, and both JSON files) has been **deleted** — manifests are now
> declarative. If you find a reference to those files, it is stale.

## How headers resolve (no search paths)

| Namespace | Served by | Mechanism |
|-----------|-----------|-----------|
| Objective-C `<React/...>` / Swift `import React` | `ReactHeaders` Clang source target | Canonical Debug/Release-identical React headers staged under `ReactHeadersTarget/include/React`, with a plain `module React` module map. |
| Lowercase C++ `<react/...>` and everything else: `<ReactCommon/...>`, `<jsi/...>`, `<react/renderer/...>`, `<yoga/...>`, folly/glog/boost/fmt/double-conversion | `ReactNativeHeaders.xcframework` plus `ReactNativeDependenciesHeaders.xcframework` | Header-only invariant binary targets keep lowercase `react` separate from Objective-C `React` and propagate their search paths through product dependencies. |
| `<ReactCodegen/...>`, `ReactAppDependencyProvider`, this app's generated specs | `ReactAppHeaders` SPM target in the codegen package | SPM `publicHeadersPath` propagation — a real target dependency, not a flag. |

The one remaining materialized header tree is the per-app farm at
`<appRoot>/build/generated/ios/ReactAppHeaders` (built by
`buildPerAppHeaderTree` in `spm-utils.js`, called from the orchestrators). It
is vended as the `ReactAppHeaders` SPM target — consumers reach it through a
product dependency, never through `-I`.

`autolinking.json` (the `@react-native-community/cli config` output) is an
INPUT used to generate the manifests; it is never read by a manifest.

## How each manifest references the React + codegen packages

Every generated manifest sits at a known depth inside the app and is
regenerated on every `react-native spm` run, so package references are plain
fixed-relative paths — no walk-up, no JSON, no `import Foundation`.

| Manifest | Location | How it references the React + codegen packages |
|----------|----------|-------------------------------------------------|
| Autolinked aggregator | `build/generated/autolinking/Package.swift` | `.package(path: "../../xcframeworks")` + `"../ios"` (only when it has inline `spmModule` targets) |
| Per-dep synth wrapper | `build/generated/autolinking/packages/<Name>/` | `.package(path: "../../../../xcframeworks")` + `"../../../ios"` |
| Codegen template | `build/generated/ios/Package.swift` | `.package(path: "../../xcframeworks")` (or the remote url) |
| App target (pbxproj) | `<App>.xcodeproj` | local `XCLocalSwiftPackageReference` (or `XCRemoteSwiftPackageReference` in remote mode) |
| Scaffolded community lib | `node_modules/<dep>/Package.swift` | scaffold-time relative paths to the app's xcframeworks + codegen packages (or `.package(url:exact:)` in remote mode) |

## Remote-package mode

Remote mode is gated by a **URL alone** — `RN_SPM_REMOTE_URL` (or the persisted
`url`). When set, the whole app graph flips to a single remote React Native
package identity: `.package(path: build/xcframeworks)` becomes
`.package(url:exact:)` everywhere (aggregator/synth/codegen template/pbxproj),
and the local artifact download + compose is skipped. SPM's
one-version-per-package rule then unifies app + every library on one resolved
React Native. The package identity is derived from the URL tail (swift-tools 6
dropped `.package(name:url:)`) — nothing hardcodes a repo name.

**Version is derived from npm, not pinned by hand.** The SPM-pinned RN version
is not a free parameter: the SPM graph must compile against the same React
Native the JS/native code uses, so the app (graph root) pins EXACT to the
*installed* RN version, read from `node_modules/react-native/package.json`.
`RN_SPM_REMOTE_VERSION` and the persisted `versionOverride` are **overrides**,
not the source of truth — they're only needed when the installed version isn't
publishable (e.g. the monorepo `1000.0.0` dev placeholder, which has no remote
tag). A *derived* version is never persisted, so an `npm install` that upgrades
RN auto-re-pins the SPM graph on the next `spm` run; an *override* is persisted
as `versionOverride` so it survives Xcode-phase re-syncs without the env.

Persisted schema is `{url, versionOverride?}`. Legacy `{url, version}` is still
read, with `version` honored as an override (back-compat). If remote mode is on
but no usable version can be resolved — react-native isn't installed, or it's a
non-publishable dev placeholder and no override is set — the tooling errors
(exit 2, a hard Xcode build error) directing you to set `RN_SPM_REMOTE_VERSION`
or install a released react-native, rather than silently pinning an unpublished
tag.

## Hand-authored community library contract

A library that ships its own `Package.swift` (no scaffolder/autolinker marker)
is left untouched by the tooling. It needs only two things, and **no discovery
code**:

1. Depend on the React Native SPM package and its products — in remote mode
   `.package(url: "<repo>", exact: "<version>")` + `.product(name: "ReactNative", …)`
   and `.product(name: "ReactNativeHeaders", …)`. (Libraries should declare a
   version RANGE in production; the consuming app pins EXACT.)
2. Ship its own generated code: set `codegenConfig.includesGeneratedCode: true`
   and generate with `generate-codegen-artifacts.js --path . --targetPlatform
   ios --source library`. Output lands at
   `<outputDir>/build/generated/ios/ReactCodegen/`, reachable from the manifest
   with one safe `.headerSearchPath(...)` into the library's own tree. The
   app-side codegen then skips the lib's spec (no duplicate symbols).

This makes the library self-contained — it carries no app-layout knowledge and
needs no per-app codegen headers from the consuming app. Proven with
`@chrfalch/react-native-calculator` (a hand-authored Fabric/TurboModule lib).
