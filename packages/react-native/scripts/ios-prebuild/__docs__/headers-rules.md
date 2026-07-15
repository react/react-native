# How the prebuilt header layout is created — rules and rationale

This documents the header-generation system introduced by the VFS-overlay
removal PR (#57285): how every header that ships in the prebuilt artifacts is
discovered, classified, placed, and made modular. The system lives in three
scripts under `scripts/ios-prebuild/`:

| Script                 | Role                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headers-inventory.js` | **Discover + classify** every shipped header (the facts)                                                                                                      |
| `headers-spec.js`      | **The rules** (R1–R11) — turns the inventory into a layout plan + module maps                                                                                 |
| `headers-compose.js`   | **Emit** — projects the plan into `React.xcframework` and `ReactNativeHeaders.xcframework`                                                                    |
| `headers-verify.js`    | **Gate** — generator-time verification: include-health ratchet, structural byte-compare, consumer-shaped compile smokes (runs in the prebuild CI compose job) |

One principle drives the whole design: **content authority = the source files,
layout authority = the spec.** No header is ever edited; only _where it goes_
and _which module owns it_ is computed.

## Why this exists (what replaced the VFS overlay)

Previously a clang VFS overlay synthesized a virtual header tree at build time
so includes like `<React/RCTBridge.h>`, `<react/renderer/...>`, `<folly/...>`
would resolve against the prebuilt artifact. That approach broke down under
clang **explicit modules** (the overlay shadowed the framework's own module),
made code-signature stability awkward, and required consumer-side machinery.

The replacement is purely physical: two artifacts whose on-disk layout makes
every include form resolve through standard mechanisms —
`FRAMEWORK_SEARCH_PATHS` for `<React/...>` and a plain header search path for
everything else. No overlay, no include rewriting, no consumer flags.

## The pipeline

```text
podspecs ──► headers-inventory.js ──► inventory (facts per header)
                                          │
                                          ▼
                              headers-spec.js  (rules R1–R10)
                                          │  plan: what goes where + module maps
                                          ▼
                              headers-compose.js (emission)
                                   │                    │
                                   ▼                    ▼
                        React.xcframework      ReactNativeHeaders.xcframework
                        (binary + React/ ns)   (headers-only, all other ns)
```

## Stage 1 — Inventory: discover and classify (headers-inventory.js)

### Discovery

Headers are enumerated through the **same podspec-driven discovery the prebuild
itself uses** (`headers.js`), so the inventory cannot drift from the shipped
set. Each header gets:

- a **natural path** — the include path consumers actually write
  (`React/RCTBridge.h`, `react/renderer/core/ShadowNode.h`, `yoga/Yoga.h`). This
  is the canonical identity; the podspec `header_dir` supplies the namespace,
  and header_dir-less pods get their pod name as prefix.
- one or more **identities** — the physical source file plus the pod-namespaced
  path. `React_RCTAppDelegate` headers get a **second, synthetic bare-root
  identity** (`RCTAppDelegate.h` with no prefix) because app templates
  historically wrote `#import <RCTAppDelegate.h>`.

### Language classification

`scanHeader()` does a guard-aware scan of each header's text:

- Tracks a `#if/#ifdef __cplusplus` **stack**, so C++ constructs and includes
  that only exist under a C++ guard don't taint the ObjC surface
  (`cxxGuarded: true` edges).
- ObjC markers: `@interface/@protocol/@implementation/@class/@end`,
  `NS_ASSUME_NONNULL_BEGIN`.
- C++ markers: `namespace`, `template <`, `extern "C++"`, `enum class`,
  `constexpr`, `using namespace/alias` — plus one non-obvious heuristic: a **C++
  default member initializer inside a struct/class aggregate**
  (`struct X { CGFloat size = NAN; };`), which is illegal in C/ObjC but has no
  keyword the line scan would catch.

Result: `lang ∈ {objc, objcxx, cxx, c}`.

### Include classification

Every `#include/#import` is resolved and classified: `internal` (another shipped
header — quoted includes are resolved against the source dir and mapped back to
a natural path), `thirdParty` (folly/glog/boost/fmt/
double-conversion/fast_float), `hermes`, `system` (Apple SDK), `std`,
`metaInternal` (FB-internal, never resolvable in OSS), `otherPlatform`
(android/jni), `notShipped` (our namespace but not in the shipped set — a
flattening mismatch), `unresolved`.

### The bucket — "can this header live in a clang module?"

The key output. A **fixpoint over unguarded include edges** propagates two facts
through the internal include graph: _does this header transitively reach C++?_
and _which third-party libs does it reach?_ — considering only edges an ObjC
consumer would actually follow (cxx-guarded edges are skipped).

| Bucket                   | Meaning                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `objc-modular-candidate` | Pure ObjC surface; reaches no C++ and no third-party lib unguarded → **can** be a module member                                                |
| `objc-blocked`           | ObjC header, but transitively reaches C++/third-party (e.g. Fabric headers importing `<react/renderer/...>`) → cannot be a clean module member |
| `objcxx`                 | Mixed ObjC++ in the header itself                                                                                                              |
| `cxx`                    | Pure C++ (also anything `.hpp`)                                                                                                                |

Only `objc-modular-candidate` headers can enter module maps; everything else
stays **textual** (resolved by search path at the consumer's use site — exactly
the semantics the old VFS overlay provided).

## Stage 2 — The rules (headers-spec.js)

The spec's docblock is the contract; each rule exists because of a concrete
failure mode:

**R1 — `React.framework/Headers` root = the `React/` namespace, hoisted.** The
framework _name_ supplies the `React/` prefix, so `#import <React/RCTBridge.h>`
resolves verbatim through `FRAMEWORK_SEARCH_PATHS`. Bare root aliases (R6) also
live here. The lowercase `react/` namespace is deliberately **not** here:
resolving `<react/...>` through `React.framework` requires case-folding
`react.framework` → `React.framework`, which only works on case-insensitive
filesystems. The header-search-path route (R2) is exact everywhere.

**R2 — every other namespace ships in ONE headers-only xcframework,
`ReactNativeHeaders`.** Namespace dirs at its `Headers/` root: `react/`,
`yoga/`, `jsi/`, `cxxreact/`, `React_RCTAppDelegate/`, … **including the
third-party deps namespaces** (folly/glog/boost/fmt/double-conversion/
fast_float, copied out of the ReactNativeDependencies artifact — which thereby
becomes binary-only). SPM/Xcode auto-serve a binaryTarget's `Headers/` on the
consumer's search path, so everything resolves with zero flags.

**R3 — NO include rewriting, anywhere.** Shipped headers are byte-identical to
the repo. If a header's includes don't work in the packaged layout, the fix is
in the _source header_ or the _rules_ — never a packaging-time patch. This is
what keeps source builds and prebuilt builds semantically identical.

**R4 — the React framework module map is an umbrella over the _safe_ ObjC
surface.** A header enters the umbrella iff `isUmbrellaSafe`:

```text
bucket == objc-modular-candidate
∧ React/-namespace
∧ no '+' in the filename            (category headers, e.g. +Private — see R9)
∧ no C extern-inline definition
```

The extern-inline exclusion is empirical: a C99 `extern inline` definition emits
a **strong symbol in every importing translation unit** → duplicate symbols at
link (found via `RCTTextInputNativeCommands.h`). In practice this yields ~225
umbrella headers out of ~317 in the framework.

**R5 — every ReactNativeHeaders namespace with modular candidates gets a plain
(non-framework) module** declaring exactly those candidates. Why: a framework
module (React) may not _textually_ include non-modular headers under
`-Wnon-modular-include-in-framework-module` — so when a React.framework header
imports `<yoga/Yoga.h>`, yoga's header must itself belong to a module (found
empirically via yoga + RCTDeprecation). Details:

- Module _names_ are internal to clang's module graph — consumers never
  `@import yoga`; they `#import <yoga/Yoga.h>` and clang maps the header to its
  owning module.
- The `react` namespace's module is renamed `ReactNativeHeaders_react` so it can
  never alias the `React` framework module on a case-insensitive filesystem.
  (Header paths are unchanged; only the module name differs.)
- Namespaces whose name isn't a valid module identifier (`jsinspector-modern`,
  `double-conversion`) are exempt — they currently have no modular candidates;
  the verifier asserts that stays true.

**R6 — bare includes migrate to `<React/X>`.** Bare root aliases
(`RCTAppDelegate.h` etc.) are physically placed at the framework Headers root,
so `<React/RCTAppDelegate.h>` works; the bare angle form
(`#import <RCTAppDelegate.h>`) has no framework spelling and is the one
accepted, measured ecosystem migration (~4 lines total).

**R7 — sign AFTER composing.** The code signature pins the header manifest;
composing after signing would invalidate it.

**R8 — collisions are hard errors.** Two different source files may never
project to the same destination path. `computeSpecPlan` throws; the artifact is
not produced.

**R9 — private React headers, exposed in the default `React` module via a
curated allowlist.** Privileged framework consumers (Expo) import headers the
public umbrella excludes. Rather than a `React.Private` submodule (which would
force a Swift `import React.Private` in consumers) they are appended to the
module map, split by bucket:

```text
framework module React {
  umbrella header "React-umbrella.h"
  header "RCTBridge+Private.h"                 // objc-modular-candidate → real member
  textual header "RCTComponentViewFactory.h"   // objc-blocked → textual only
  textual header "RCTMountingManager.h"        // (…6 Fabric headers total)
  ...
  export *
  module * { export * }
}
```

An `objc-blocked` header **must** be `textual` — a real member would re-trip the
non-modular-include error that got it excluded from the umbrella in the first
place. Textual works because its C++ includes resolve at the consumer's use
site. "Private" is by convention (naming), not enforcement: a single binary
artifact cannot hard-gate an app from headers a framework legitimately needs.
Validation **fails closed**: an allowlisted header missing from the inventory,
or a `modular` entry whose bucket drifted, aborts the build with a targeted
message.

**R10 — per-namespace umbrella headers, derived, for namespaces consumers
probe.** Expo's `RCTAppDelegateUmbrella.h` does
`__has_include(<React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h>)` — a
CocoaPods-era artifact filename. The flattened layout ships the individual
headers but no umbrella, so the probe silently failed. The fix emits
`<ns>/<ns>-umbrella.h` for each namespace in `UMBRELLA_NAMESPACES` (currently
just `React_RCTAppDelegate`), with content **derived from the namespace's
modular header set** — never hand-listed, so it can't drift (it correctly omits
e.g. the since-removed `RCTArchConfiguratorProtocol.h`). The umbrella is also
added to that namespace's R5 module so importing it stays modular. Fails closed
if the namespace loses all modular headers.

**R11 — one source file, one content location (redirect shims).** Some sources
ship under several spellings: `React/X.h` plus a legacy pod-namespace form
(`CoreModules/X.h`, `RCTAnimation/X.h`, `RCTImage/X.h`, …), or a bare root alias
plus `React_RCTAppDelegate/X.h` — 116 sources at the time of writing. Under the
VFS overlay every spelling mapped to _one physical file_, so `#import`-once and
module ownership were coherent. A flattened layout that _copies_ the content
breaks both: any `-fmodules` consumer touching two spellings — even
transitively, e.g. importing legacy `<RCTImage/X.h>` whose header pulls a
modular `<React/...>` — hits **redefinition errors** (found by the headers gate
on its first run). The rule: the **module-owned spelling keeps the content**
(the `React/` form when it exists — umbrella/module-React owner or canonical
textual home; else the R5-module namespaced form), and every other spelling is
emitted as a one-line redirect shim (`#import <owner>`). Shims that are
namespace-module members are fine: they import the owning module, so
declarations stay single-owned.

## Stage 3 — Emission (headers-compose.js)

`computeSpecPlan(rnRoot)` = inventory → plan, throwing on R8 collisions. Then:

### `emitReactFrameworkHeaders` (per slice of React.xcframework)

1. Stage all R1 entries (byte-copies of the source files) + the generated
   `React-umbrella.h`.
2. For each slice (`ios-arm64`, `ios-arm64_x86_64-simulator`, …): replace
   `React.framework/Headers` with the stage, replace `Modules/` with the
   generated module map (R4 + R9).
3. (Stacked PR #57305 adds resource embedding here — `PrivacyInfo.xcprivacy` and
   `RCTI18nStrings.bundle` per slice — orthogonal to headers.)

### `buildReactNativeHeadersXcframework`

1. Stage all R2 entries, then copy the six deps namespaces from
   `third-party/ReactNativeDependencies.xcframework/Headers`. A declared deps
   namespace that is missing is a **hard error** — previously a warn-and-ship,
   which once produced a silently deps-less artifact (1.6 MB instead of 11 MB).
2. Optionally fold in the `hermes/` public headers (consumer-side compose path).
3. Write the R10 umbrella files, then the R5 module map.
4. Compile a stub static archive per slice (headers-only artifacts still need a
   library for `xcodebuild -create-xcframework`) and compose the xcframework.

### `ensureHeadersLayout` (consumer-side)

Applies the same emission to an already-downloaded cache slot (so any consumer
with a cached `React.xcframework` gets composed artifacts without a published
`ReactNativeHeaders`). Idempotent via a freshness marker (source realpath +
mtime + hermes presence).

## How consumers resolve headers (why the rules are shaped this way)

| Include form                                                             | Resolved by                                                                                                                         | Rule   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `#import <React/RCTBridge.h>`                                            | `React.framework/Headers` via FRAMEWORK_SEARCH_PATHS; modular via the umbrella                                                      | R1, R4 |
| `#import <React/RCTBridge+Private.h>`                                    | same, modular via the R9 `header` entry                                                                                             | R9     |
| `#import <React/RCTMountingManager.h>`                                   | same, **textual** via the R9 entry                                                                                                  | R9     |
| `#import <react/renderer/...>` (C++)                                     | `ReactNativeHeaders/Headers` search path, textual                                                                                   | R2     |
| `#import <yoga/Yoga.h>`                                                  | same, **modular** via the yoga R5 module                                                                                            | R2, R5 |
| `#import <folly/dynamic.h>`                                              | same (deps namespaces relocated here)                                                                                               | R2     |
| `<React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h>`                 | same, modular                                                                                                                       | R10    |
| `#import "RCTFabricComponentsPlugins.h"` (quoted, community Fabric pods) | CocoaPods only: re-vended by the `React-RCTFabric` facade into the pod header map (`rncore_facades.rb`, `FACADE_REEXPOSED_HEADERS`) | —      |

- **SwiftPM**: both xcframeworks are plain `.binaryTarget`s; Xcode auto-serves
  `React.framework`'s `Headers/`+`Modules/` and `ReactNativeHeaders`' `Headers/`
  (incl. its `module.modulemap`) to dependents. Zero flags.
- **CocoaPods**: `React-Core-prebuilt`'s `prepare_command` flattens
  `ReactNativeHeaders`' Headers (incl. the module map) into the pod, and the
  React-core pods are installed as dependency-only **facades**
  (`rncore_facades.rb`) so no source headers shadow the artifact.

## Fail-closed invariants (the "can't silently regress" list)

| Guard                             | Trips when                                                                                                                                             | Where                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| R8 collision check                | two sources project to one destination                                                                                                                 | `computeSpecPlan`                              |
| R9 allowlist validation           | private header removed/renamed, or bucket drifted                                                                                                      | `validatePrivateReactHeaders`                  |
| R10 umbrella check                | a probed namespace loses all modular headers                                                                                                           | `planFromInventory`                            |
| R5 exemption assert               | an invalid-module-identifier namespace gains a modular-candidate header                                                                                | `planFromInventory`                            |
| Deps namespace guard (missing)    | folly/glog/… not staged at compose time                                                                                                                | `buildReactNativeHeadersXcframework`           |
| Deps namespace guard (undeclared) | the deps artifact ships a namespace not in `DEPS_NAMESPACES` (new third-party dep)                                                                     | `buildReactNativeHeadersXcframework`           |
| Include-health ratchet            | a shipped header gains a `notShipped`/`unresolved`/quoted-unresolvable include not in the committed baseline                                           | `headers-verify.js`                            |
| Structural gate                   | composed module maps/umbrellas differ from the spec render; R9 headers or deps dirs absent                                                             | `headers-verify.js`                            |
| Compile gates                     | the React module, any R5 namespace module, the R10 umbrella, the R9 textual (Expo-shape) surface, or Swift `RCTBridge.moduleRegistry` fails to compile | `headers-verify.js` (CI: prebuild compose job) |
| Facade re-vend glob               | `RCTFabricComponentsPlugins.h` glob matches nothing                                                                                                    | `rncore_facades.rb`                            |

`DEPS_NAMESPACES` (headers-spec.js) is the single source of truth for
third-party namespaces — the inventory's include classifier derives from it, and
compose enforces set-equality with the deps artifact in both directions.

The unit tests (`__tests__/headers-spec-test.js`) exercise R9/R10/R11, the R5
exemption assert, the ratchet diff, and the gate fixtures red/green.

## Resilience against new headers (drift analysis)

The system is **derived-by-construction for the common case** — a new ordinary
header requires zero maintenance — but its consumer-facing contracts are
**allowlist-maintained** and only fail downstream. Grouped by _when_ a change
surfaces (daily CI = prebuild compose + rn-tester prebuilt consumer lanes):

### A. Auto-adapts — nothing to do

- **New header in an existing pod**: podspec-glob discovery → inventory → placed
  by R1/R2; joins the umbrella (R4) or its namespace module (R5) automatically
  iff `isUmbrellaSafe`.
- **New pod/namespace** (valid module identifier): gets an R5 module
  automatically.
- **New header in `React_RCTAppDelegate`**: joins the derived R10 umbrella.
- **New `+Category` / extern-inline / objc-blocked header**: auto-excluded from
  the modular surface — the _safe_ default for app consumers.

### B. Fails loudly at compose time (the fail-closed guards)

R8 collisions, R9 allowlist drift (rename/removal, modular→blocked), R10
total-loss, missing deps namespaces, facade re-vend glob. These protect the
spec's _own_ invariants and cannot silently regress.

### C. Fails loudly at the GENERATOR — the headers gate (`headers-verify.js`)

These classes previously failed late (consumer CI lane) or not at all; the gate
— run in the prebuild compose job — moved them to compose time:

- **A new umbrella member that doesn't compile standalone** (its include chain
  hits a `notShipped` header, or the language scanner misbucketed a C++-only
  header as C): the gate's ObjC TU precompiles the `React` module — compiling
  _every_ umbrella header — at generator time.
- **A broken R5 namespace module**: the gate imports one header from every
  namespace module, precompiling each (previously lazy — a module rn-tester
  never imported was latent).
- **A public header gaining a quoted `#import "Private.h"` of a non-shipped
  header**: recorded by the inventory (`quotedNotShipped`) and caught by the
  include-health ratchet against `headers-include-baseline.json` — no compile
  coverage needed.
- **The privileged-consumer (Expo) contract**: the gate compiles an Expo-shaped
  ObjC++ TU (every R9 textual Fabric header) and a Swift TU (`import React` +
  `RCTBridge.moduleRegistry`), plus `__has_include` asserts for the R9/R10
  surfaces — a tested invariant instead of a downstream discovery.

Proof the gate earns its keep — its FIRST run found two real shipping defects:
the dual-identity redefinitions that became R11, and an undeclared
`SocketRocket` namespace in the deps artifact (caught by the set-equality guard
the moment it was added). SocketRocket now lives in `DEPS_NAMESPACES` alongside
the other third-party deps namespaces, with a single physical home in the
ReactNativeDependenciesHeaders sidecar: relocating a second textual copy into
ReactNativeHeaders collided with the real pod's own headers under
`use_frameworks` (the duplicate-`@interface` / poisoned-module-graph Expo
regression, 2026-07-03), so the set-equality gate asserts the declared namespace
set — `DEPS_NAMESPACES` — matches the deps artifact's namespaces exactly, in
both directions.

### D. Remaining silent gaps — allowlist maintenance (by design)

The contracts describing what _external_ consumers need are still curated lists;
a new consumer need shows up downstream first, then becomes a one-line allowlist
addition (now protected by the gate once added):

1. **New privileged-consumer headers**: a new `+Private.h` or Fabric-class
   objc-blocked header an Expo-class consumer starts importing —
   `PRIVATE_REACT_HEADERS` is manual by design.
2. **New umbrella-probe namespaces**: a consumer probing `<ns/ns-umbrella.h>`
   for a namespace not in `UMBRELLA_NAMESPACES`.
3. **Partial R10 shrink**: a `React_RCTAppDelegate` header flipping
   modular→blocked drops out of the derived umbrella (fail-closed triggers only
   on _total_ loss). Mitigated: the Expo probe surface is compile-tested, so a
   shrink that breaks the umbrella itself is caught.

### Remaining recommendation (not yet implemented)

- **Artifact snapshot metrics** (per-namespace header counts, size bounds) as a
  coarse tripwire for large silent drops beyond what the structural gate
  byte-compares.
