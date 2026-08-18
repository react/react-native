/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.utils.PropertyUtils
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.jetbrains.kotlin.gradle.plugin.extraProperties

/**
 * Gradle plugin applied to the `android/build.gradle` file.
 *
 * This plugin allows to specify project wide configurations that can be applied to both apps and
 * libraries before they're evaluated.
 */
class ReactRootProjectPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    checkLegacyArchProperty(project)
    project.subprojects { subproject ->
      // As the :app project (i.e. ReactPlugin) configures both namespaces and JVM toolchains
      // for libraries, its evaluation must happen before the libraries' evaluation.
      // Eventually the configuration of namespace/JVM toolchain can be moved inside this plugin.
      if (subproject.path != ":app") {
        subproject.evaluationDependsOn(":app")
      }
      // We set the New Architecture properties to true for all subprojects. So that
      // libraries don't need to be modified and can keep on using the isNewArchEnabled()
      // function to check if property is set.
      if (subproject.hasProperty(PropertyUtils.SCOPED_NEW_ARCH_ENABLED)) {
        subproject.setProperty(PropertyUtils.SCOPED_NEW_ARCH_ENABLED, "true")
      }
      if (subproject.hasProperty(PropertyUtils.NEW_ARCH_ENABLED)) {
        subproject.setProperty(PropertyUtils.NEW_ARCH_ENABLED, "true")
      }
      subproject.extraProperties.set(PropertyUtils.NEW_ARCH_ENABLED, "true")
      subproject.extraProperties.set(PropertyUtils.SCOPED_NEW_ARCH_ENABLED, "true")
    }
    // We need to make sure that `:app:preBuild` task depends on all other subprojects' preBuild
    // tasks. This is necessary in order to have all the codegen generated code before the CMake
    // configuration build kicks in.
    project.gradle.projectsEvaluated {
      val appProject = project.rootProject.subprojects.find { it.name == "app" }
      val appPreBuild = appProject?.tasks?.findByName("preBuild")
      if (appPreBuild != null) {
        // Find all other subprojects' preBuild tasks
        val otherPreBuildTasks =
            project.rootProject.subprojects
                .filter { it != appProject }
                .mapNotNull { it.tasks.findByName("preBuild") }
        // Make :app:preBuild depend on all others
        appPreBuild.dependsOn(otherPreBuildTasks)
      }
    }
  }

  private fun checkLegacyArchProperty(project: Project) {
    if (
        (project.hasProperty(PropertyUtils.NEW_ARCH_ENABLED) &&
            !project.property(PropertyUtils.NEW_ARCH_ENABLED).toString().toBoolean()) ||
            (project.hasProperty(PropertyUtils.SCOPED_NEW_ARCH_ENABLED) &&
                !project.property(PropertyUtils.SCOPED_NEW_ARCH_ENABLED).toString().toBoolean())
    ) {
      project.logger.error(
          """
          ********************************************************************************

          WARNING: Setting `newArchEnabled=false` in your `gradle.properties` file is not
          supported anymore since React Native 0.82.

          You can remove the line from your `gradle.properties` file.

          The application will run with the New Architecture enabled by default.

          ********************************************************************************

          """
              .trimIndent(),
      )
    }
  }
}
