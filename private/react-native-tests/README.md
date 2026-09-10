# @react-native/tests-cxx

A Linux + CMake harness that builds and runs a **representative subset** of
ReactCommon's C++ (gtest) unit tests on GitHub CI.

## Why this exists

ReactCommon's C++ test sources (`<subsystem>/tests/*.cpp`) are part of the
repository, but the build rules that compile and run them are Meta-internal and
are not part of the open-source tree. As a result these unit tests did not run
on GitHub CI at all — the renderer, layout, and runtime C++ core was only
covered by higher-level integration tests (Fantom) and by platform builds.

This harness closes that gap cheaply: C++ unit tests build and run on standard
(free) Linux runners, so GitHub CI can gate merges on them.

The goal is a **representative**, high-signal subset — not full coverage. Suites
are added deliberately, weighted by how often they catch regressions and by
build cost.

## How it works

The harness reuses the exact desktop C++ toolchain already proven by the Fantom
tester (`private/react-native-fantom`):

- **Gradle** (`build.gradle.kts`) stages the third-party dependencies (folly,
  boost, glog, double-conversion, fast_float, fmt, gflags) by depending on the
  Fantom tester's `prepareNative3pDependencies`, then invokes CMake.
- **CMake** (`cxx/CMakeLists.txt`) compiles each in-scope ReactCommon subsystem
  into its library and links its `tests/*.cpp` into a per-subsystem gtest binary,
  registered with CTest. GoogleTest itself is fetched via `FetchContent`.

## Coverage

31 suites (~900 gtest cases) run today, spanning the C++ core:

- **Primitives / parsing / serialization:** graphics, css, utils, mapbuffer,
  timing, featureflags
- **Fabric renderer:** renderer/core, mounting, components/{view, text,
  scrollview, image, root}, attributedstring, textlayoutmanager, element,
  componentregistry (via deps), imagemanager, renderer/debug
- **Scheduling / runtime:** runtimescheduler, scheduler, uimanager,
  uimanager/consistency, performance/timeline, animated, animations
- **Debugger / infra:** debug/redbox, reactperflogger/fusebox, jserrorhandler,
  telemetry, cxxreact

Suites for `renderer/core`, `runtimescheduler`, `scheduler` and `animated`
create a JS runtime and link the Hermes VM.

Not yet included: `jsinspector-modern` and `jsinspector-modern/tracing` (their
tests depend on a specific GoogleTest version / `std::source_location` support
that this harness's GoogleTest doesn't match), and `react/bridging` (its test
helper header uses a Buck header-namespace that doesn't map to CMake).

## Running locally (Meta-internal)

Requires the Android SDK's CMake and the same environment used to build the
Fantom tester.

```sh
yarn workspace @react-native/tests-cxx test   # build + run (ctest)
yarn workspace @react-native/tests-cxx build  # build only
```

## Adding a subsystem

1. Add the subsystem and any missing dependencies to the
   `add_react_common_subdir(...)` list in `cxx/CMakeLists.txt`.
2. Add a `react_native_add_cxx_test_suite(...)` call listing the subsystem's
   full library closure (subsystem lib + its ReactCommon deps + third-party).
   ReactCommon libraries are CMake `OBJECT` libraries, so the closure must be
   listed explicitly rather than relying on transitive linking.
3. Confirm the new suite builds and passes in the `test_cxx` CI job.

## Rollout

The `test_cxx` GitHub Actions job starts **advisory** (`continue-on-error`) so a
harness issue cannot block merges. Once it is consistently green it should be
made a **required** check via branch protection.
