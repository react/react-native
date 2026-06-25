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
}

plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0") }

include(
    ":react-native-gradle-plugin",
    ":settings-plugin",
    ":shared",
    ":shared-testutil",
)

rootProject.name = "gradle-plugin-root"
