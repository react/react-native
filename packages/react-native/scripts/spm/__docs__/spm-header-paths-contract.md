# SPM headers & package references — how they resolve

React Native's SPM consumption is **zero-I**: no generated manifest carries a
`-I` / `-F` header search path into React Native's own headers. SPM products and
binary targets serve those headers, with no clang VFS overlay. Every generated
`Package.swift` references the React Native and codegen packages by plain,
fixed-relative paths. This document is the single source of truth for how that
resolves.

Generated manifests may still reach into their own tree:

- Scaffolded manifests, local-module wrappers, and the codegen package use
  `.headerSearchPath` into their own tree.
- Scaffolded manifests may use `.unsafeFlags` for podspec compiler flags and a
  prefix header.

Manifests are declarative. The files `spm-paths.json` and
`.react-native/paths.json`, their writers (`writeAppPathsJson`,
`writeSharedPathsJson`), and the Swift loader `renderRNPathsLoader` no longer
exist. A reference to any of them is stale.

## How headers resolve (no search paths)

React Native uses CocoaPods-style imports (`#import <React/RCTBridge.h>`) that
SwiftPM does not natively support. These products serve them:

| Namespace                                                                                                                                                       | Served by                                                                          | Mechanism                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Objective-C `<React/...>` / Swift `import React`                                                                                                                | `ReactHeaders` Clang source target                                                 | Canonical Debug/Release-identical React headers staged under `ReactHeadersTarget/include/React`, with a plain `module React` module map.                     |
| Lowercase C++ `<react/...>` and everything else: `<ReactCommon/...>`, `<jsi/...>`, `<react/renderer/...>`, `<yoga/...>`, folly/glog/boost/fmt/double-conversion | `ReactNativeHeaders.xcframework` plus `ReactNativeDependenciesHeaders.xcframework` | Header-only invariant binary targets keep lowercase `react` separate from Objective-C `React` and propagate their search paths through product dependencies. |
| `<ReactCodegen/...>`, `ReactAppDependencyProvider`, this app's generated specs                                                                                  | `ReactAppHeaders` SPM target in the codegen package                                | SPM `publicHeadersPath` propagation — a real target dependency, not a flag.                                                                                  |

`ReactHeaders` stages its copy only after it proves that Debug and Release
expose identical public headers; its module map uses `React/`-prefixed paths.
`ReactNativeHeaders` is a headers-only (LIBRARY-type) binaryTarget, and the deps
sidecar uses the same mechanism: SwiftPM serves each slice's `Headers/` to
dependents. The deps sidecar also carries `fast_float/` and `SocketRocket/`. It
exists because the binary `ReactNativeDependencies.xcframework` is
framework-type and cannot expose those headers to SwiftPM. Targets that compile
against React take all four products in the table as product dependencies.

The one remaining materialized header tree is the per-app farm at
`<appRoot>/build/generated/ios/ReactAppHeaders`. `buildPerAppHeaderTree` in
`spm-utils.js` builds it, called from the orchestrators. It is vended as the
`ReactAppHeaders` SPM target, so consumers reach it through a product
dependency, never through `-I`.

`autolinking.json` (the `@react-native-community/cli config` output) is an INPUT
used to generate the manifests. No manifest reads it.

## How each manifest references the React + codegen packages

Every generated manifest sits at a known depth inside the app and is regenerated
on every `react-native spm` run. So package references are computed at
generation time as plain fixed-relative paths — no runtime discovery, no
walk-up, no JSON, no `import Foundation`.

| Manifest                 | Location                                       | How it references the React + codegen packages                                                                                        |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Autolinked aggregator    | `build/generated/autolinking/Package.swift`    | Neither: it has no inline targets, and references only its dependencies' packages (`packages/<Name>`, `libs/<Name>`, plugin packages) |
| Local-module wrapper     | `build/generated/autolinking/packages/<Name>/` | `.package(path: "../../../../xcframeworks")` + `"../../../ios"` (only for `swiftpmConfig.modules` entries)                            |
| Codegen template         | `build/generated/ios/Package.swift`            | `.package(path: "../../xcframeworks")` (or the remote url)                                                                            |
| App target (pbxproj)     | `<App>.xcodeproj`                              | local `XCLocalSwiftPackageReference` (or `XCRemoteSwiftPackageReference` in remote mode)                                              |
| Scaffolded community lib | `node_modules/<dep>/Package.swift`             | scaffold-time relative paths to the app's xcframeworks + codegen packages (or `.package(url:exact:)` in remote mode)                  |

## Remote-package mode

A **URL alone** turns remote mode on: `RN_SPM_REMOTE_URL`, or the persisted
`url`. The whole app graph then uses a single remote React Native package
identity. `.package(path: build/xcframeworks)` becomes `.package(url:exact:)`
everywhere it appears (synth, codegen template, pbxproj). The local artifact
download and the compose of `build/xcframeworks` still run. SPM's
one-version-per-package rule then unifies the app and every library on one
resolved React Native.

The package identity comes from the URL tail, because swift-tools 6 dropped
`.package(name:url:)`. Nothing hardcodes a repo name.

**Version is derived from npm, not pinned by hand.** The SPM graph must compile
against the same React Native that the JS and native code use. So the app (the
graph root) pins EXACT to the _installed_ React Native version, read from
`node_modules/react-native/package.json`.

`RN_SPM_REMOTE_VERSION` and the persisted `versionOverride` are **overrides**,
not the source of truth. You need them only when the installed version is not
publishable, e.g. the monorepo `1000.0.0` dev placeholder, which has no remote
tag.

- A _derived_ version is never persisted. An `npm install` that upgrades React
  Native re-pins the SPM graph on the next `spm` run.
- An _override_ is persisted as `versionOverride`, so it survives Xcode-phase
  re-syncs without the environment variable.

The settings persist in `build/generated/autolinking/spm-remote.json`. The file
is written only when the settings come from the environment variables. It lives
under `build/`, so deleting `build/` turns remote mode off until you set the
variables again. The persisted schema is `{url, versionOverride?}`. The legacy
`{url, version}` is still read, with `version` honored as an override.

If remote mode is on but no usable version resolves, the tooling stops with exit
2, a hard Xcode build error. This happens when react-native is not installed, or
when it is a non-publishable dev placeholder and no override is set. The error
tells you to set `RN_SPM_REMOTE_VERSION` or install a released react-native. The
tooling never silently pins an unpublished tag.

## Hand-authored community library contract

The tooling leaves untouched a library that ships its own `Package.swift` (no
scaffolder or autolinker marker). That library needs only two things, and **no
discovery code**:

1. Depend on the React Native SPM package and its products — in remote mode
   `.package(url: "<repo>", exact: "<version>")` +
   `.product(name: "ReactHeaders", package: "<identity>")`,
   `.product(name: "ReactNativeHeaders", package: "<identity>")`, and
   `.product(name: "ReactNativeDependenciesHeaders", package: "<identity>")`,
   where `<identity>` is the URL tail, lowercased, without `.git`. A scaffolded
   manifest depends on the same React Native products. Libraries should declare
   a version RANGE in production; the consuming app pins EXACT.
2. Ship its own generated code: set `codegenConfig.includesGeneratedCode: true`
   and generate with
   `generate-codegen-artifacts.js --path . --targetPlatform ios --source library`.
   The output lands at `<outputDir>/build/generated/ios/ReactCodegen/`. The
   manifest reaches it with one safe `.headerSearchPath(...)` into the library's
   own tree. The app-side codegen then skips the library's spec, so there are no
   duplicate symbols.

The library is then self-contained. It carries no app-layout knowledge and needs
no per-app codegen headers from the consuming app.
`@chrfalch/react-native-calculator` (a hand-authored Fabric/TurboModule library)
proves this.
