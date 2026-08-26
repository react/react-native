/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

plugins {
  alias(libs.plugins.kotlin.jvm).apply(false)
  alias(libs.plugins.ktfmt).apply(true)
}

tasks.register("build") {
  dependsOn(
      ":react-native-library-plugin:build",
      ":react-native-gradle-plugin:build",
      ":settings-plugin:build",
      ":shared-testutil:build",
      ":shared:build",
  )
}

tasks.register("clean") {
  dependsOn(
      ":react-native-library-plugin:clean",
      ":react-native-gradle-plugin:clean",
      ":settings-plugin:clean",
      ":shared-testutil:clean",
      ":shared:clean",
  )
}

tasks.named("ktfmtCheck") {
  dependsOn(
      ":react-native-library-plugin:ktfmtCheck",
      ":react-native-gradle-plugin:ktfmtCheck",
      ":settings-plugin:ktfmtCheck",
      ":shared-testutil:ktfmtCheck",
      ":shared:ktfmtCheck",
  )
}

tasks.named("ktfmtFormat") {
  dependsOn(
      ":react-native-library-plugin:ktfmtFormat",
      ":react-native-gradle-plugin:ktfmtFormat",
      ":settings-plugin:ktfmtFormat",
      ":shared-testutil:ktfmtFormat",
      ":shared:ktfmtFormat",
  )
}

// We intentionally disable the `ktfmtCheck` tasks as the formatting is primarly handled inside
// fbsource
allprojects { tasks.withType<com.ncorti.ktfmt.gradle.tasks.KtfmtCheckTask>() { enabled = false } }
