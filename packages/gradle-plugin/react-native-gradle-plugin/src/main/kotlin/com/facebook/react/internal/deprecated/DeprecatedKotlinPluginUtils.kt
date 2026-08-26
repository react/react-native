/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Duplicated from react-native-library-plugin for backward compat; remove when
// `com.facebook.react` library support is dropped.

package com.facebook.react.internal.deprecated

import com.android.build.api.variant.AndroidComponentsExtension
import org.gradle.api.Project

private const val AGP_BUILT_IN_KOTLIN_MAJOR = 9

object DeprecatedKotlinPluginUtils {
  fun applyKotlinAndroidPluginIfNeeded(project: Project) {
    if (!project.hasBuiltInKotlinSupport()) {
      // AGP 9 comes with built-in Kotlin support, so applying `kotlin-android` alongside it causes
      // both plugins to register the same `kotlin` extension.
      project.applyPluginIfNeeded("kotlin-android")
    }
  }

  /**
   * Returns whether the project uses AGP's built-in Kotlin support. It is enabled by default on AGP
   * 9 and later, and can be disabled with `android.builtInKotlin=false`.
   */
  private fun Project.hasBuiltInKotlinSupport(): Boolean {
    val androidComponents = extensions.findByType(AndroidComponentsExtension::class.java)
        ?: return false
    if (androidComponents.pluginVersion.major < AGP_BUILT_IN_KOTLIN_MAJOR) {
      return false
    }
    return findProperty("android.builtInKotlin")?.toString()?.toBoolean() ?: true
  }

  private fun Project.applyPluginIfNeeded(pluginId: String) {
    if (!pluginManager.hasPlugin(pluginId)) {
      pluginManager.apply(pluginId)
    }
  }
}
