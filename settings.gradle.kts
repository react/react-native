/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

pluginManagement {
  repositories {
    mavenCentral()
    google()
    gradlePluginPortal()
  }
  includeBuild("packages/gradle-plugin/")
}

include(
    ":packages:react-native:ReactAndroid",
    ":packages:react-native:ReactAndroid:hermes-engine",
    ":packages:react-native:ReactAndroid:external-artifacts",
    ":packages:rn-tester:android:app",
    ":packages:rn-tester:android:app:benchmark",
    ":private:react-native-fantom",
)

includeBuild("packages/gradle-plugin/")

dependencyResolutionManagement {
  versionCatalogs {
    create("libs") { from(files("packages/react-native/gradle/libs.versions.toml")) }
  }
}

rootProject.name = "react-native-github"

plugins {
  id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")
  id("com.facebook.react.settings")
}

configure<com.facebook.react.ReactSettingsExtension> {
  autolinkLibrariesFromCommand(
      workingDirectory = file("packages/rn-tester/"),
      lockFiles = files("yarn.lock"),
  )
}
