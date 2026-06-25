/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This is the settings.gradle.kts file used when the users
// is doing a build from source. It's triggered as the user
// will add an `includeBuild(../node_modules/react-native)` in
// their settings.gradle.kts file.
// More on this here: https://reactnative.dev/contributing/how-to-build-from-source

pluginManagement {
  repositories {
    mavenCentral()
    google()
    gradlePluginPortal()
  }
}

rootProject.name = "react-native-build-from-source"

include(":packages:react-native:ReactAndroid")

project(":packages:react-native:ReactAndroid").projectDir = file("ReactAndroid/")

include(":packages:react-native:ReactAndroid:hermes-engine")

project(":packages:react-native:ReactAndroid:hermes-engine").projectDir =
    file("ReactAndroid/hermes-engine/")

// Since Gradle 9.0, all the projects in the path must have an existing folder.
// As we build :packages:react-native:ReactAndroid, we need to declare the folders
// for :packages and :packages:react-native as well as otherwise the build from
// source will fail with a missing folder exception.

project(":packages").projectDir = file("/tmp")

project(":packages:react-native").projectDir = file("/tmp")
