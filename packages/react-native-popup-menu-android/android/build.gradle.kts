/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

plugins {
  id("com.facebook.react")
  id("com.android.library")
}

android {
  compileSdk = libs.versions.compileSdk.get().toInt()
  buildToolsVersion = libs.versions.buildTools.get()
  namespace = "com.facebook.react.popupmenu"

  defaultConfig { minSdk = libs.versions.minSdk.get().toInt() }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
}

kotlin {
  jvmToolchain(17)
  explicitApi()
}

tasks.withType<JavaCompile>().configureEach {
  options.compilerArgs.add("-Xlint:deprecation,unchecked")
  options.compilerArgs.add("-Werror")
}

dependencies {
  // Build React Native from source
  implementation(project(":packages:react-native:ReactAndroid"))
}
