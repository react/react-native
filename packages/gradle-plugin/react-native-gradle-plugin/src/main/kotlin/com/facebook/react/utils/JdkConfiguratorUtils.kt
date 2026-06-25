/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.android.build.api.variant.ApplicationAndroidComponentsExtension
import com.android.build.api.variant.LibraryAndroidComponentsExtension
import com.facebook.react.utils.PropertyUtils.INTERNAL_DISABLE_JAVA_VERSION_ALIGNMENT
import org.gradle.api.Action
import org.gradle.api.JavaVersion
import org.gradle.api.Project
import org.gradle.api.plugins.AppliedPlugin
import org.jetbrains.kotlin.gradle.dsl.kotlinExtension

internal object JdkConfiguratorUtils {
  /**
   * Function that takes care of configuring the JDK toolchain for all the projects. As we do decide
   * the JDK version based on the AGP version that RNGP brings over, here we can safely configure
   * the toolchain to 17.
   */
  fun configureJavaToolChains(input: Project) {
    // Check at the app level if react.internal.disableJavaVersionAlignment is set.
    if (input.hasProperty(INTERNAL_DISABLE_JAVA_VERSION_ALIGNMENT)) {
      return
    }
    input.rootProject.allprojects { project ->
      // Allows every single module to set react.internal.disableJavaVersionAlignment also.
      if (project.hasProperty(INTERNAL_DISABLE_JAVA_VERSION_ALIGNMENT)) {
        return@allprojects
      }

      val applicationAction =
          Action<AppliedPlugin> {
            project.extensions
                .getByType(ApplicationAndroidComponentsExtension::class.java)
                .finalizeDsl { ext ->
                  ext.compileOptions.sourceCompatibility = JavaVersion.VERSION_17
                  ext.compileOptions.targetCompatibility = JavaVersion.VERSION_17
                }
          }
      val libraryAction =
          Action<AppliedPlugin> {
            project.extensions
                .getByType(LibraryAndroidComponentsExtension::class.java)
                .finalizeDsl { ext ->
                  ext.compileOptions.sourceCompatibility = JavaVersion.VERSION_17
                  ext.compileOptions.targetCompatibility = JavaVersion.VERSION_17
                }
          }
      project.pluginManager.withPlugin("com.android.application", applicationAction)
      project.pluginManager.withPlugin("com.android.library", libraryAction)
      project.pluginManager.withPlugin("org.jetbrains.kotlin.android") {
        project.kotlinExtension.jvmToolchain(17)
      }
      project.pluginManager.withPlugin("org.jetbrains.kotlin.jvm") {
        project.kotlinExtension.jvmToolchain(17)
      }
    }
  }
}
