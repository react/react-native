/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import java.util.Properties
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.dsl.KotlinVersion
import org.jetbrains.kotlin.gradle.plugin.mpp.KotlinNativeTarget

plugins { kotlin("multiplatform") version "2.4.20" }

group = "com.facebook.react"

val reactAndroidProperties = Properties()

file("../ReactAndroid/gradle.properties").inputStream().use(reactAndroidProperties::load)

version = reactAndroidProperties.getProperty("VERSION_NAME")

val smokeEnabled =
    providers.gradleProperty("reactNativeSharedSmoke").map { it.toBooleanStrict() }.getOrElse(false)

if (smokeEnabled) {
  // Keep test-only exports separate from any future production artifacts.
  layout.buildDirectory.set(layout.projectDirectory.dir("build/smoke"))
}

kotlin {
  explicitApi()
  jvmToolchain(17)
  compilerOptions {
    // ReactAndroid consumers still compile with the older Kotlin language level.
    languageVersion.set(KotlinVersion.KOTLIN_2_2)
    apiVersion.set(KotlinVersion.KOTLIN_2_2)
  }
  jvm { compilerOptions { jvmTarget.set(JvmTarget.JVM_17) } }
  iosArm64()
  iosSimulatorArm64()
  iosX64()

  targets.withType<KotlinNativeTarget>().configureEach {
    binaries.framework {
      baseName = "ReactNativeShared"
      isStatic = true
      binaryOption("bundleId", "com.facebook.react.shared")
    }
  }

  sourceSets {
    commonMain.dependencies {
      // Keep the JVM runtime dependency compatible with the existing Android library.
      implementation(kotlin("stdlib", "2.2.0"))
    }
    commonTest.dependencies { implementation(kotlin("test")) }
    if (smokeEnabled) {
      commonMain { kotlin.srcDir("tests/smoke/kotlin") }
      commonTest { kotlin.srcDir("tests/smoke/kotlinTest") }
    }
  }
}

// ReactAndroid embeds this JAR in its AAR, preserving the existing Maven coordinates.
// A stable output path also works when this build is included by a source-build consumer.
val jvmJar = tasks.named<Jar>("jvmJar")

tasks.register<Sync>("exportAndroidJar") {
  from(jvmJar.flatMap { it.archiveFile })
  into(layout.buildDirectory.dir("android"))
  rename { "react-native-shared.jar" }
}
