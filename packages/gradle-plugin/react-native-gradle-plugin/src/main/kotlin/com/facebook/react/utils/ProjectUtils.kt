/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.ReactExtension
import com.facebook.react.model.ModelPackageJson
import com.facebook.react.utils.PropertyUtils.EDGE_TO_EDGE_ENABLED
import com.facebook.react.utils.PropertyUtils.HERMES_ENABLED
import com.facebook.react.utils.PropertyUtils.REACT_NATIVE_ARCHITECTURES
import com.facebook.react.utils.PropertyUtils.SCOPED_EDGE_TO_EDGE_ENABLED
import com.facebook.react.utils.PropertyUtils.SCOPED_HERMES_ENABLED
import com.facebook.react.utils.PropertyUtils.SCOPED_REACT_NATIVE_ARCHITECTURES
import com.facebook.react.utils.PropertyUtils.SCOPED_USE_THIRD_PARTY_JSC
import com.facebook.react.utils.PropertyUtils.USE_THIRD_PARTY_JSC
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty
import org.jetbrains.kotlin.gradle.plugin.extraProperties

internal object ProjectUtils {

  const val HERMES_FALLBACK = true

  internal fun Project.isNewArchEnabled(): Boolean = true

  internal val Project.isHermesEnabled: Boolean
    get() =
        if (project.hasProperty(HERMES_ENABLED) || project.hasProperty(SCOPED_HERMES_ENABLED)) {
          val propertyString =
              if (project.hasProperty(HERMES_ENABLED)) {
                HERMES_ENABLED
              } else {
                SCOPED_HERMES_ENABLED
              }
          project.property(propertyString).toString().lowercase().toBooleanStrictOrNull() ?: true
        } else if (project.extensions.extraProperties.has("react")) {
          @Suppress("UNCHECKED_CAST")
          val reactMap = project.extensions.extraProperties.get("react") as? Map<String, Any?>
          when (val enableHermesKey = reactMap?.get("enableHermes")) {
            is Boolean -> enableHermesKey
            is String -> enableHermesKey.lowercase().toBooleanStrictOrNull() ?: true
            else -> HERMES_FALLBACK
          }
        } else {
          HERMES_FALLBACK
        }

  internal val Project.isEdgeToEdgeEnabled: Boolean
    get() =
        (project.hasProperty(EDGE_TO_EDGE_ENABLED) &&
            project.property(EDGE_TO_EDGE_ENABLED).toString().toBoolean()) ||
            (project.hasProperty(SCOPED_EDGE_TO_EDGE_ENABLED) &&
                project.property(SCOPED_EDGE_TO_EDGE_ENABLED).toString().toBoolean())

  internal val Project.useThirdPartyJSC: Boolean
    get() =
        (project.hasProperty(USE_THIRD_PARTY_JSC) &&
            project.property(USE_THIRD_PARTY_JSC).toString().toBoolean()) ||
            (project.hasProperty(SCOPED_USE_THIRD_PARTY_JSC) &&
                project.property(SCOPED_USE_THIRD_PARTY_JSC).toString().toBoolean())

  internal fun Project.needsCodegenFromPackageJson(rootProperty: DirectoryProperty): Boolean {
    val parsedPackageJson = readPackageJsonFile(this, rootProperty)
    return needsCodegenFromPackageJson(parsedPackageJson)
  }

  internal fun Project.needsCodegenFromPackageJson(model: ModelPackageJson?): Boolean {
    return model?.codegenConfig != null
  }

  internal fun Project.getReactNativeArchitectures(): List<String> {
    val architectures = mutableListOf<String>()
    if (project.hasProperty(REACT_NATIVE_ARCHITECTURES)) {
      val architecturesString = project.property(REACT_NATIVE_ARCHITECTURES).toString()
      architectures.addAll(architecturesString.split(",").filter { it.isNotBlank() })
    } else if (project.hasProperty(SCOPED_REACT_NATIVE_ARCHITECTURES)) {
      val architecturesString = project.property(SCOPED_REACT_NATIVE_ARCHITECTURES).toString()
      architectures.addAll(architecturesString.split(",").filter { it.isNotBlank() })
    }
    return architectures
  }

  internal fun Project.reactNativeDir(extension: ReactExtension): String =
      extension.reactNativeDir.get().asFile.absolutePath

  internal fun Project.hasPropertySetToFalse(property: String): Boolean =
      this.hasProperty(property) && this.property(property).toString().toBoolean() == false
}
