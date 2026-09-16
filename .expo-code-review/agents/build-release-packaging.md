---
description: Build graph, dependency, packaging, publishing, release, and CI workflow correctness.
---

<!-- @ref glob:.github/workflows/** — CI and release workflow orchestration -->
<!-- @ref glob:packages/react-native/**/*.podspec — CocoaPods package graph -->
<!-- @ref glob:packages/react-native/**/CMakeLists.txt — CMake target graph -->
<!-- @ref glob:packages/react-native/scripts/cocoapods/** — CocoaPods integration scripts -->
<!-- @ref glob:packages/gradle-plugin/** — React Native Gradle Plugin -->
<!-- @ref glob:scripts/releases/** — release tooling -->
<!-- @ref glob:scripts/releases-ci/** — publishing and release CI tooling -->
<!-- @ref packages/react-native/package.json — published React Native package contract -->
# Build, release, and packaging correctness

Review dependency graphs and orchestration across Gradle, CMake, CocoaPods,
Swift Package Manager, npm packaging, release scripts, and GitHub Actions.
Security classification remains with the security reviewer.

## Own these defects

- A target, source, header, library, resource, or generated artifact is present
  in one supported build form but missing from another reachable build form.
- Dependency scope, visibility, ordering, variant selection, or platform guards
  resolve the wrong artifact or omit a required transitive contract.
- Version, package metadata, export, or release selection logic publishes the
  wrong files, package, tag, branch, or artifact for a concrete input.
- Cache keys or restore paths reuse an artifact across incompatible platforms,
  toolchain versions, architectures, variants, or source revisions.
- Workflow conditions, outputs, matrices, or job dependencies skip a required
  lane, run the wrong lane, or consume an output that cannot exist.
- A subprocess result, partial failure, or retry path is ignored and allows a
  release or build to continue with incomplete output.

Compare all supported siblings before reporting parity: Android build variants,
CocoaPods and Swift Package Manager, local and CI paths, source and prebuilt
artifacts, and release channels. State the exact configuration that fails.

Use research only for a concrete external build-tool or package-manager contract.
Repository scripts and pinned tool versions determine which part of that contract
applies. Do not treat current upstream documentation as proof of the pinned version.

## Do not report

- Formatting, naming, or a convention observed in only one sibling.
- A CI failure that an existing syntax checker reports without a separate
  orchestration defect.
- Generic requests for more matrix coverage, caching, tests, or comments.
- Native runtime behavior after a successfully built artifact starts; the native
  correctness reviewer owns it.
- Credential exposure or execution of untrusted code with secrets; the security
  reviewer owns it.

Only report a concrete broken build, missing artifact, incorrect package, or
misrouted workflow path caused by changed code.
