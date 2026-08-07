/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import org.gradle.api.Plugin
import org.gradle.api.Project

class ReactLibraryPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    ReactPluginUtils.failIfBothReactPluginsApplied(
        project,
        currentPluginId = ReactPluginIds.REACT_LIBRARY_PLUGIN,
        conflictingPluginId = ReactPluginIds.REACT_APP_PLUGIN,
    )
    failIfAndroidApplicationPluginApplied(project)

    val extension = ReactPluginUtils.createReactExtension(project)
    val rootExtension = ReactPluginUtils.createPrivateReactExtension(project)

    project.pluginManager.withPlugin("com.android.library") {
      ReactLibraryConfigurator.configure(project, extension, rootExtension)
    }
  }

  private fun failIfAndroidApplicationPluginApplied(project: Project) {
    fun fail(): Nothing =
        error(
            "${ReactPluginIds.REACT_LIBRARY_PLUGIN} can only be used with Android library " +
                "projects. Use ${ReactPluginIds.REACT_APP_PLUGIN} for Android applications."
        )

    if (project.pluginManager.hasPlugin("com.android.application")) {
      fail()
    }
    project.pluginManager.withPlugin("com.android.application") { fail() }
  }
}
