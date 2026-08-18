# Prebuilt ReactNativeDependencies — self-serving headers + deps facades

How the third-party C/C++ deps (`RCT-Folly`, `glog`, `boost`,
`DoubleConversion`, `fmt`, `fast_float`, `SocketRocket`) are served when
`ReactNativeDependenciesUtils.build_react_native_deps_from_source()` is false
(prebuilt-deps mode). Source-deps mode is unaffected by everything below.

## Pod-served headers, CocoaPods only (`rndependencies.rb`)

In prebuilt-deps mode the `ReactNativeDependencies` POD (CocoaPods) is the
single authority for the third-party deps: compiled code lives in its
xcframework binary, and the artifact's own
`Headers/{folly,glog,boost,fmt,double-conversion,fast_float,SocketRocket}` are
flattened into the pod's `Headers/` by the podspec's `prepare_command`.
Consumers resolve bare `<folly/...>` / `<SocketRocket/...>` via CocoaPods
public-header linkage from `s.dependency "ReactNativeDependencies"`, plus
`HEADER_SEARCH_PATHS` entries pointing at
`$(PODS_ROOT)/ReactNativeDependencies/Headers`: per-podspec via
`add_rn_third_party_dependencies`, and globally (aggregate + every pod target)
via `ReactNativeDependenciesUtils.configure_aggregate_xcconfig` at post-install
— ReactNativeHeaders is pure-RN, so this is the only global home of the deps
namespaces. The real source pods are neither depended on nor searched.

For SPM, the deps XCFRAMEWORK itself cannot serve headers: it is framework-type
without `HeadersPath`, and its root `Headers/` is invisible to SPM binaryTargets
(verified 2026-07-04 — `HeadersPath` is rejected on framework entries). The deps
prebuild therefore emits a headers-only LIBRARY-type sidecar,
`ReactNativeDependenciesHeaders.xcframework` (same recipe as ReactNativeHeaders:
stub archives + per-slice `Headers/`), which SPM auto-serves with zero flags.
The sidecar ships inside the deps tarball and as a standalone artifact.

## Why SocketRocket is vended here

React-Core compiled from source (source-core + prebuilt-deps mix) imports
`<SocketRocket/SRWebSocket.h>` (`RCTReconnectingWebSocket.m`), and in
prebuilt-deps mode there is NO real SocketRocket pod in the graph — the artifact
is the sole supplier. This does not reintroduce the 2026-07-03 dual-copy
regression: that bug relocated SocketRocket copies onto every pod's search path
(via ReactNativeHeaders → React-Core-prebuilt) while a REAL SocketRocket pod
coexisted. Here there is exactly one physical copy and no coexisting pod.

## Deps facades (`rndeps_facades.rb`, declared in `react_native_pods.rb`)

The real source pods are only declared in the deps-from-source branch, so in
prebuilt-deps mode a community podspec's hardcoded `s.dependency "RCT-Folly"` /
`"RCT-Folly/Fabric"` / `"glog"` would resolve from the CocoaPods trunk and
compile from source next to the prebuilt binary. `RNDepsFacades` generates
dependency-only facade podspecs (`build/rndeps-facades/<Name>/`), installed as
LOCAL pods (`:path`, so Podfile-local resolution beats trunk, nothing fetched):
no sources, no headers, single dependency on `ReactNativeDependencies`.
Versions + subspecs are DERIVED from the real podspecs in
`third-party-podspecs/` (RCT-Folly keeps `/Default` + `/Fabric`,
`default_subspecs = ["Default"]`). SocketRocket has no local podspec — its
facade version is SYNTHESIZED from
`Helpers::Constants::socket_rocket_config[:version]`, fail-closed if absent.
`:modular_headers` is intentionally dropped on facade declarations: a
dependency-only placeholder builds no module; consumers get modules from
`ReactNativeDependencies`.

## Mode × supplier table

| core × deps         | real 3P pods in graph                           | SocketRocket headers supplier   |
| ------------------- | ----------------------------------------------- | ------------------------------- |
| source + source     | yes (`react_native_pods.rb` deps-source branch) | real pod                        |
| source + prebuilt   | no                                              | RNDeps artifact (sole supplier) |
| prebuilt + source   | yes                                             | real pod                        |
| prebuilt + prebuilt | no                                              | RNDeps artifact                 |

## SocketRocket privacy manifest

Upstream SocketRocket ships NO privacy manifest, and the deps artifact
historically carried bundles only for boost/folly/glog. Fixed alongside this
work: the deps prebuild (`scripts/releases/ios-prebuild/configuration.js`) now
embeds `ReactNativeDependencies_SocketRocket.bundle/PrivacyInfo.xcprivacy`,
sourced from an RN-authored manifest at
`scripts/releases/ios-prebuild/resources/SocketRocket/PrivacyInfo.xcprivacy`
(accurate-empty: SocketRocket uses no Required Reason APIs). Facades remain
resource-free by design.
