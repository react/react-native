/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.dsl.KotlinVersion
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  alias(libs.plugins.kotlin.jvm)
  alias(libs.plugins.ktfmt)
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

gradlePlugin {
  plugins {
    create("reactlibrary") {
      id = "com.facebook.react.library"
      implementationClass = "com.facebook.react.ReactLibraryPlugin"
    }
  }
}

group = "com.facebook.react"

dependencies {
  implementation(project(":react-native-gradle-plugin-shared"))
  implementation(project(":shared"))

  implementation(gradleApi())
  implementation(libs.kotlin.gradle.plugin)
  implementation(libs.android.gradle.plugin)

  testImplementation(libs.junit)
  testImplementation(libs.assertj)
  testImplementation(project(":react-native-gradle-plugin"))
  testImplementation(project(":shared-testutil"))
}

java { targetCompatibility = JavaVersion.VERSION_11 }

kotlin { jvmToolchain(17) }

tasks.withType<KotlinCompile>().configureEach {
  compilerOptions {
    apiVersion.set(KotlinVersion.KOTLIN_2_0)
    jvmTarget.set(JvmTarget.JVM_11)
    allWarningsAsErrors.set(
        project.properties["enableWarningsAsErrors"]?.toString()?.toBoolean() ?: false
    )
  }
}

tasks.withType<Test>().configureEach {
  testLogging {
    exceptionFormat = TestExceptionFormat.FULL
    showExceptions = true
    showCauses = true
    showStackTraces = true
  }
}
