/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.internal.PrivateReactExtension
import org.gradle.api.Project

object ReactPluginUtils {
  fun createReactExtension(project: Project): ReactExtension =
      project.extensions.findByType(ReactExtension::class.java)
          ?: project.extensions.create("react", ReactExtension::class.java, project)

  fun createPrivateReactExtension(project: Project): PrivateReactExtension =
      project.rootProject.extensions.findByType(PrivateReactExtension::class.java)
          ?: project.rootProject.extensions.create(
              "privateReact",
              PrivateReactExtension::class.java,
              project,
          )

  fun configurePrivateReactExtensionFromApp(
      privateExtension: PrivateReactExtension,
      reactExtension: ReactExtension,
  ) {
    privateExtension.root.set(reactExtension.root)
    privateExtension.reactNativeDir.set(reactExtension.reactNativeDir)
    privateExtension.codegenDir.set(reactExtension.codegenDir)
    privateExtension.nodeExecutableAndArgs.set(reactExtension.nodeExecutableAndArgs)
  }

  fun failIfBothReactPluginsApplied(
      project: Project,
      currentPluginId: String,
      conflictingPluginId: String,
  ) {
    fun fail(): Nothing =
        error(
            "A React Native Android project must not apply both " +
                "${ReactPluginIds.REACT_APP_PLUGIN} and ${ReactPluginIds.REACT_LIBRARY_PLUGIN}. " +
                "Use ${ReactPluginIds.REACT_LIBRARY_PLUGIN} for Android libraries and " +
                "${ReactPluginIds.REACT_APP_PLUGIN} for Android applications."
        )

    if (project.pluginManager.hasPlugin(conflictingPluginId)) {
      fail()
    }
    project.pluginManager.withPlugin(conflictingPluginId) {
      if (project.pluginManager.hasPlugin(currentPluginId)) {
        fail()
      }
    }
  }
}
