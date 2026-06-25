# @react-native/core-cli-utils

A reference implementation of React Native CLI tooling. This package provides composable, ordered `Task` objects for common CLI operations including Android Gradle builds, iOS Xcode/CocoaPods workflows, Metro bundling with Hermes support, and cache cleaning.

This is not published to npm. Framework authors can use this code as a starting point for their own CLI tooling, but should not depend on it as a versioned API.

## Modules

- **`android`** — Gradle-based Android build tasks (assemble, build, install)
- **`apple`** — Xcode/CocoaPods-based iOS tasks (bootstrap, build, install)
- **`app`** — Metro bundler tasks (watch mode, bundle mode, Hermes bytecode compilation)
- **`clean`** — Cache-cleaning tasks (Android/Gradle, Metro, npm, Watchman, Yarn, CocoaPods)
- **`version`** — Semver version requirements for platform toolchains (Android NDK/SDK, Xcode, Node, etc.)

## Consumers

- [`private/helloworld/`](../helloworld/) — the primary consumer, using Android, iOS, and Metro modules
- [`packages/rn-tester/`](../../packages/rn-tester/) — uses iOS bootstrap for CocoaPods setup
