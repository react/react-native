# Kotlin Multiplatform foundation

This standalone build provides a place to assess sharing library code between
the JVM and iOS with Kotlin Multiplatform. It has no Compose or other UI dependency.
No React Native application, Android artifact, CocoaPods target, or npm package
consumes this module. Normal React Native builds and runtime behavior are unchanged.

The build has no production sources yet. Its small arithmetic fixture is enabled
only by `-PreactNativeSharedSmoke=true`, and its outputs go under `build/smoke`.
The fixture checks the compiler, common tests and Objective-C integer interop;
it is not a proposed React Native API.

## Validation

Use JDK 17. Apple validation also requires macOS, Xcode and an installed iOS
simulator. The separate Gradle wrapper isolates the Kotlin/Native plugin from the
main Android build. CI selects Xcode 26.4.1 and uses an Apple Silicon runner.

From this directory:

```sh
./gradlew -PreactNativeSharedSmoke=true jvmTest iosSimulatorArm64Test \
  linkDebugFrameworkIosArm64 linkReleaseFrameworkIosArm64 \
  linkDebugFrameworkIosSimulatorArm64 linkReleaseFrameworkIosSimulatorArm64 \
  linkDebugFrameworkIosX64 linkReleaseFrameworkIosX64 \
  --max-workers=2 --console=plain
./scripts/test-apple-smoke.sh
```

The native runner checks Debug and Release frameworks through Objective-C on the
host simulator. Set `RCT_KMP_SIMULATOR_UDID` to select an existing simulator.
Intel simulator frameworks are built; Intel execution and physical-device tests
require their respective hosts and are not part of this CI job.

## Adoption is separate

Each use case needs its own behavior, dependency, packaging and performance
review before any application consumes shared code. Earlier gradient experiments
measured additional adapter latency, allocation and Kotlin/Native runtime cost;
this foundation does not establish that those costs are acceptable. Android AAR
embedding, Apple runtime ownership, CocoaPods, SwiftPM and prebuilt distribution
belong to those follow-ups. No Apple consumer or framework is designated as the
runtime owner here.
