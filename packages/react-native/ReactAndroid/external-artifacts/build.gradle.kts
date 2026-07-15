/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.jetbrains.kotlin.gradle.plugin.extraProperties

plugins { id("maven-publish") }

group = "com.facebook.react"

version =
    parent?.extraProperties?.get("publishing_version")
        ?: error("publishing_version not set for external-artifacts")

configurations.maybeCreate("externalArtifacts")

// [iOS] React Native Dependencies
val reactNativeDependenciesDebugArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeDependenciesDebug.xcframework.tar.gz")
val reactNativeDependenciesDebugArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesDebugArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-debug"
    }

val reactNativeDependenciesReleaseArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeDependenciesRelease.xcframework.tar.gz")
val reactNativeDependenciesReleaseArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesReleaseArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-release"
    }
val reactNativeDependenciesDebugDSYMArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeDependenciesDebug.framework.dSYM.tar.gz")
val reactNativeDependenciesDebugDSYMArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesDebugDSYMArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-dSYM-debug"
    }

val reactNativeDependenciesReleaseDSYMArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeDependenciesRelease.framework.dSYM.tar.gz")
val reactNativeDependenciesReleaseDSYMArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesReleaseDSYMArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-dSYM-release"
    }

// [iOS] React Native Dependencies Headers — the headers-only LIBRARY-type
// sidecar (per-slice Headers/ + HeadersPath) that SwiftPM auto-serves; the
// binary xcframework above is framework-type and cannot expose headers to
// SwiftPM binaryTargets. Also shipped INSIDE the deps tarball for CocoaPods.
val reactNativeDependenciesHeadersDebugArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeDependenciesHeadersDebug.xcframework.tar.gz")
val reactNativeDependenciesHeadersDebugArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesHeadersDebugArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-headers-debug"
    }

val reactNativeDependenciesHeadersReleaseArtifactFile: RegularFile =
    layout.projectDirectory.file(
        "artifacts/ReactNativeDependenciesHeadersRelease.xcframework.tar.gz"
    )
val reactNativeDependenciesHeadersReleaseArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesHeadersReleaseArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-headers-release"
    }

// [iOS] React Native Core
val reactCoreDebugArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactCoreDebug.xcframework.tar.gz")
val reactCoreDebugArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactCoreDebugArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-core-debug"
    }

val reactCoreReleaseArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactCoreRelease.xcframework.tar.gz")
val reactCoreReleaseArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactCoreReleaseArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-core-release"
    }
val reactCoreDebugDSYMArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactCoreDebug.framework.dSYM.tar.gz")
val reactCoreDebugDSYMArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactCoreDebugDSYMArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-core-dSYM-debug"
    }

val reactCoreReleaseDSYMArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactCoreRelease.framework.dSYM.tar.gz")
val reactCoreReleaseDSYMArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactCoreReleaseDSYMArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-core-dSYM-release"
    }

// [iOS] React Native Headers — the pure-RN headers-only xcframework, published
// standalone (it also ships inside the ReactCore tarball for CocoaPods) so
// SwiftPM consumers can wire it as its own binaryTarget.
val reactNativeHeadersDebugArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeHeadersDebug.xcframework.tar.gz")
val reactNativeHeadersDebugArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeHeadersDebugArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-headers-debug"
    }

val reactNativeHeadersReleaseArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeHeadersRelease.xcframework.tar.gz")
val reactNativeHeadersReleaseArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeHeadersReleaseArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-headers-release"
    }

apply(from = "../publish.gradle")

publishing {
  publications {
    getByName("release", MavenPublication::class) {
      artifactId = "react-native-artifacts"
      artifact(reactNativeDependenciesDebugArtifact)
      artifact(reactNativeDependenciesReleaseArtifact)
      artifact(reactNativeDependenciesDebugDSYMArtifact)
      artifact(reactNativeDependenciesReleaseDSYMArtifact)
      artifact(reactNativeDependenciesHeadersDebugArtifact)
      artifact(reactNativeDependenciesHeadersReleaseArtifact)
      artifact(reactCoreDebugArtifact)
      artifact(reactCoreReleaseArtifact)
      artifact(reactCoreDebugDSYMArtifact)
      artifact(reactCoreReleaseDSYMArtifact)
      artifact(reactNativeHeadersDebugArtifact)
      artifact(reactNativeHeadersReleaseArtifact)
    }
  }
}
