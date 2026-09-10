# React Native shared Kotlin experiments

These use cases build on the standalone KMP foundation. The
foundation's unpublished compiler/interop fixture remains available with
`-PreactNativeSharedSmoke=true`; its classes and reports stay under
`build/smoke` and are excluded from normal shared outputs. Run
`./scripts/test-apple-smoke.sh` to check that fixture through Objective-C.
Each use case has a separate behavior and performance review.

This module shares CSS gradient stop position and transition-hint calculations
between Android and iOS using Kotlin Multiplatform. It has no Compose dependency.
Native views, gradient geometry, color interpolation, and drawing remain in their
existing platform implementations.

`commonMain` accepts positions and color-presence flags and returns positions,
source color indices, and interpolation weights. Platform adapters retain their
existing tolerance, logarithm precision, and color-space behavior. The module does
not depend on ReactAndroid, React-Core, UIKit, JNI, or the C++ renderer.

## Multipart framing

`MultipartFraming` shares delimiter overlap, preamble and completed-part state
between Android's sliding Okio buffer and Apple's retained NSData buffer.
`MultipartHeaders` splits raw header fields; each platform keeps its existing
whitespace and key-comparison rules. Native code retains buffer searches, stream
and body ownership, callbacks and progress timing. Body bytes never cross the
Kotlin/Objective-C boundary.

Run `./scripts/test-apple-multipart.sh` and
`python3 scripts/test-android-multipart.py` for the actual adapters' tests.
The Apple runner also compares exact callbacks/body bytes against the native
fallback and checks Catalyst. Set `RCT_KMP_BENCHMARK=1` for its optional 2–20 MiB
parser benchmark. The Android runner supports `--baseline-ref` with an explicit
native parser revision and `--benchmark`; see `--help`. Its timings and allocation
counters describe a host JVM, not Android ART or network download throughput.
Both probes exclude constructing their known input payloads.

This use case can amortize interop over buffer reads. A C++ implementation could
also share decisions and directly search native buffers, but would add an Android
JNI interface to this currently Kotlin/Objective-C utility. Neither approach
removes platform I/O or Catalyst fallback. Measure application memory and real
bundle-download behavior before broadening adoption.

## Build and test

The standalone build uses its own Gradle wrapper and Kotlin plugin so that it
does not change the Kotlin plugin used by the main Android build. It requires
JDK 17. Apple builds also require macOS and Xcode; the pilot CI selects Xcode
26.4.1 without changing the existing React Native CI toolchain.

From this directory:

```sh
./gradlew jvmTest
./gradlew iosSimulatorArm64Test
./gradlew linkDebugFrameworkIosArm64 linkReleaseFrameworkIosArm64 \
  linkDebugFrameworkIosSimulatorArm64 linkReleaseFrameworkIosSimulatorArm64 \
  linkDebugFrameworkIosX64 linkReleaseFrameworkIosX64
./scripts/test-apple-gradient.sh
RCT_KMP_BUILD_TYPE=Release ./scripts/test-apple-gradient.sh
```

The same common tests run on JVM and the Apple Silicon iOS simulator. The build
also defines an `iosX64` target for Intel simulators. Device and simulator
frameworks are static and named `ReactNativeShared.framework`. The Apple parity
script requires an installed iOS simulator runtime and compares the actual
Objective-C++ adapter with the existing native gradient implementation.

With CocoaPods installed, `bundle exec ruby scripts/test-cocoapods-linking.rb`
checks generated host and test configurations for static, dynamic, and mixed
per-target linkage. Local fixture pods cover inherited and full-pod sibling hosted
tests, with and without `TestTargetID`, including renamed and SDK-specific app products. Negative
controls cover standalone tests and non-KMP hosts with unrelated KMP app dependencies.
No native code is compiled; the check verifies framework search paths and expected
Kotlin archive links, then prints the generated configuration directory.
Host paths with unresolved architecture or SDK-version conditions are not treated
as proof that the app provides the Kotlin runtime; those configurations need explicit
validation before relying on hosted-test suppression.

## Android integration

The repository and npm source-build settings include this directory as a
separate Gradle build. ReactAndroid consumes its JVM output through
`exportAndroidJar`, which writes `build/android/react-native-shared.jar`.
ReactAndroid embeds that JAR in its existing AAR; consumers continue to use the
existing `com.facebook.react:react-android` dependency.

The JVM target uses Java 17 bytecode and Kotlin 2.2 language/API compatibility.
Android-specific build variants, resources, CMake, JNI, and publication remain
owned by ReactAndroid.

`python3 scripts/test-android-consumers.py` publishes to a temporary local Maven
repository, packs the npm sources, and builds a fresh Android application for
each dependency route. It checks dependency resolution, shared-class uniqueness,
Debug packaging and Release shrinking. See `--help` for emulator execution and
fixture preparation options. These small consumers exercise the real Android
gradient adapter; they do not replace RNTester coverage.

## Apple opt-in

The Apple adapter is a source-build pilot. Set the flag when installing Pods in
the application directory that contains its Podfile:

```sh
RCT_USE_KMP=1 bundle exec pod install
```

This enables the `React-KMP` support pod and selects React Native core source
builds. During the Xcode build, the support pod builds the shared static framework
for the current SDK, architecture, and configuration. The application still uses
its existing Objective-C++ and UIKit rendering code.

All Apple consumers use one shared Kotlin runtime. With dynamic CocoaPods
frameworks, `React-Core` owns the static Kotlin archive and exports its Objective-C
classes to dependent pods such as Fabric. The archive is explicitly loaded so the
owner does not depend on which shared algorithm it happens to call. With static
libraries or static frameworks, the application owns the archive instead. Hosted
tests inherit their host's runtime. Adding an algorithm must not add another
framework link to its consuming pod.

For a custom Xcode configuration name that does not contain `Debug` or `Release`,
set the `RCT_KMP_BUILD_TYPE` build setting to `Debug` or `Release`.

Mac Catalyst retains the existing gradient implementation because Kotlin/Native
does not provide a Catalyst target. SwiftPM does not support this pilot: setting
`RCT_USE_KMP=1` for that integration fails with a message directing developers to
the CocoaPods source-build route. Published React Native Apple prebuilts do not
contain the pilot framework.

`./scripts/test-apple-distribution.sh` tests a separate binary-distribution
fixture: a device ARM64 plus universal simulator XCFramework, the matching Kotlin
license bundle, and a SwiftPM consumer. It builds iOS and Catalyst and executes
the consumer's test on the host simulator. `--build-only` omits execution;
`--package-only` packages previously built frameworks and records that reuse in
`distribution.json`. This probe does not enable React Native core's SwiftPM or
prebuilt integration. Those routes still need complete React core build and app
validation before their guard can be removed.

To return to the default Apple implementation, remove the flag and run Pod
installation again. No change to the JavaScript gradient API is needed.

## Application, runtime and cost checks

From a repository checkout with RNTester dependencies installed:

```sh
./scripts/test-apple-app.sh simulator
USE_FRAMEWORKS=static ./scripts/test-apple-app.sh simulator
USE_FRAMEWORKS=dynamic ./scripts/test-apple-app.sh simulator
./scripts/test-apple-app.sh device
./scripts/test-apple-app.sh catalyst
python3 scripts/test-kotlin-coexistence.py
python3 scripts/benchmark-apple-gradient.py
python3 scripts/benchmark-kmp-build.py
```

The app script copies RNTester into an isolated sibling directory, enables KMP,
and verifies the actual compiled gradient adapter. Simulator runs execute the
RNTester test plan and launch the app; device and Catalyst runs are unsigned
build checks. Catalyst is enabled in the copied Podfile and application project.
Each run requires fresh build outputs. It preserves RNTester's existing hosted-test topology and removes
the temporary app and any test-owned servers and simulator when it finishes.

The coexistence fixture checks independently compiled Kotlin frameworks using
the same compiler as ReactShared, including all four combinations of static and dynamic runtime ownership,
object lifetimes, and concurrent calls. Values cross that boundary as native
primitives. It does not establish compatibility with arbitrary Kotlin compiler
versions or allow one framework's exported Kotlin objects to be cast to another's.

The Apple benchmark compares the actual native and KMP adapters in separate
optimized executables. It records first-call and repeated-call timings, process
memory snapshots and binary size. Memory snapshots are not allocation counts,
and simulator measurements are not application startup or physical-device
performance. The build benchmark measures clean outputs, unchanged builds and a
common-source edit in a copied module with warm dependency/compiler caches and
Gradle's build-output cache disabled. Reports have no timing pass/fail thresholds.
Measure full application size, startup, allocations and build costs on representative
devices before expanding adoption.

This is an experimental code-sharing pilot. Local optimized simulator probes
show additional latency, executable size and process memory cost from the shared
adapter and Kotlin runtime. Passing correctness and integration tests does not
establish an acceptable performance budget for broader adoption.

## Scope and validation

Common tests cover stop positioning and transition hints. They do not replace
platform rendering tests: color precision, gradient geometry, and framework
linking still need validation in the Android and Apple adapters. Adoption beyond
this pilot should also measure application size and startup cost and preserve
the existing Catalyst path.

The dedicated `test-kmp.yml` workflow runs common tests, builds Debug and Release
frameworks for all three Apple targets, and checks Apple adapter parity in both
configurations with static and dynamic linkage. It also checks CocoaPods linking
for application and test targets with static, dynamic, and mixed framework settings.
Additional jobs cover KMP-enabled RNTester builds/tests and Android package consumers;
the shared job runs the distribution, coexistence and cost probes. Intel iOS
simulator frameworks are built, but executing Intel or physical-device tests
requires suitable hardware and runtimes outside these hosted jobs.
Shared Kotlin changes also trigger the existing Android and iOS test paths. This source directory and its
wrapper are included in the npm package; generated build outputs and local Gradle
caches are not.
