/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.util.*
import org.gradle.api.Project

internal object BackwardCompatUtils {
  private var hasShownJSCRemovalMessage = false

  fun configureBackwardCompatibilityReactMap(project: Project) {
    if (project.extensions.extraProperties.has("react")) {
      @Suppress("UNCHECKED_CAST")
      val reactMap =
          project.extensions.extraProperties.get("react") as? Map<String, Any?> ?: mapOf()
      if (reactMap.isNotEmpty()) {
        project.logger.error(
            """
            ********************************************************************************

            ERROR: Using old project.ext.react configuration.
            We identified that your project is using a old configuration block as:

            project.ext.react = [
                // ...
            ]

            You should migrate to the new configuration:

            react {
                // ...
            }
            You can find documentation inside `android/app/build.gradle` on how to use it.

            ********************************************************************************
            """
                .trimIndent(),
        )
      }
    }

    // We set an empty react[] map so if a library is reading it, they will find empty values.
    project.extensions.extraProperties.set("react", mapOf<String, String>())
  }

  fun showJSCRemovalMessage(project: Project) {
    if (hasShownJSCRemovalMessage) {
      return
    }

    val message =
        """

        =============== JavaScriptCore is being moved ===============
        JavaScriptCore has been extracted from react-native core
        and will be removed in a future release. It can now be
        installed from `@react-native-community/javascriptcore`
        See: https://github.com/react-native-community/javascriptcore
        =============================================================

        """
            .trimIndent()
    project.logger.warn(message)
    hasShownJSCRemovalMessage = true
  }
}
