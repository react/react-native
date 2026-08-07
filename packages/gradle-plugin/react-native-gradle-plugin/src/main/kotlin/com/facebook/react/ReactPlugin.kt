/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.api.variant.ApplicationAndroidComponentsExtension
import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.internal.PrivateReactExtension
import com.facebook.react.model.ModelAutolinkingDependenciesJson
import com.facebook.react.tasks.GenerateAutolinkingNewArchitecturesFileTask
import com.facebook.react.tasks.GenerateCodegenArtifactsTask
import com.facebook.react.tasks.GenerateEntryPointTask
import com.facebook.react.tasks.GeneratePackageListTask
import com.facebook.react.utils.AgpConfiguratorUtils.configureBuildConfigFieldsForApp
import com.facebook.react.utils.AgpConfiguratorUtils.configureBuildTypesForApp
import com.facebook.react.utils.AgpConfiguratorUtils.configureDevServerLocation
import com.facebook.react.utils.BackwardCompatUtils.configureBackwardCompatibilityReactMap
import com.facebook.react.utils.DependencyUtils.configureDependencies
import com.facebook.react.utils.DependencyUtils.configureRepositories
import com.facebook.react.utils.DependencyUtils.readVersionAndGroupStrings
import com.facebook.react.utils.JdkConfiguratorUtils.configureJavaToolChains
import com.facebook.react.utils.JsonUtils
import com.facebook.react.utils.NdkConfiguratorUtils.configureReactNativeNdk
import com.facebook.react.utils.ProjectUtils.needsCodegenFromPackageJson
import com.facebook.react.utils.PropertyUtils
import java.io.File
import kotlin.system.exitProcess
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.file.Directory
import org.gradle.api.provider.Provider
import org.gradle.api.tasks.TaskProvider
import org.gradle.internal.jvm.Jvm

class ReactPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    checkJvmVersion(project)
    ReactPluginUtils.failIfBothReactPluginsApplied(
        project,
        currentPluginId = ReactPluginIds.REACT_APP_PLUGIN,
        conflictingPluginId = ReactPluginIds.REACT_LIBRARY_PLUGIN,
    )
    val extension = ReactPluginUtils.createReactExtension(project)
    val rootExtension = ReactPluginUtils.createPrivateReactExtension(project)

    // Warn users if they still have the hermesV1Enabled property set.
    if (
        project.rootProject.hasProperty(PropertyUtils.HERMES_V1_ENABLED) ||
            project.rootProject.hasProperty(PropertyUtils.SCOPED_HERMES_V1_ENABLED)
    ) {
      val value =
          (project.rootProject.findProperty(PropertyUtils.HERMES_V1_ENABLED)
                  ?: project.rootProject.findProperty(PropertyUtils.SCOPED_HERMES_V1_ENABLED))
              .toString()
              .toBoolean()
      if (value) {
        project.logger.warn(
            "WARNING: The 'hermesV1Enabled' property is no longer needed. Hermes V1 is now always enabled. You can safely remove this property from your gradle.properties."
        )
      } else {
        project.logger.warn(
            "WARNING: Opting out of Hermes V1 is no longer supported. The 'hermesV1Enabled=false' property will be ignored. Hermes V1 is now always enabled. Please remove this property from your gradle.properties."
        )
      }
    }

    // App Only Configuration
    project.pluginManager.withPlugin("com.android.application") {
      // We wire the root extension with the values coming from the app (either user populated or
      // defaults).
      ReactPluginUtils.configurePrivateReactExtensionFromApp(rootExtension, extension)

      project.afterEvaluate {
        val reactNativeDir = extension.reactNativeDir.get().asFile
        val propertiesFile = File(reactNativeDir, "ReactAndroid/gradle.properties")
        val hermesVersionPropertiesFile =
            File(reactNativeDir, "sdks/hermes-engine/version.properties")
        val versionAndGroupStrings =
            readVersionAndGroupStrings(project, propertiesFile, hermesVersionPropertiesFile)
        configureDependencies(project, versionAndGroupStrings)
        configureRepositories(project, versionAndGroupStrings.isNightly)
      }

      configureReactNativeNdk(project, extension)
      configureBuildConfigFieldsForApp(project, extension)
      configureDevServerLocation(project)
      configureBackwardCompatibilityReactMap(project)
      configureJavaToolChains(project)

      project.extensions.getByType(ApplicationAndroidComponentsExtension::class.java).apply {
        onVariants(selector().all()) { variant ->
          project.configureReactTasks(variant = variant, config = extension)
        }
      }
      configureAutolinking(project, extension, rootExtension)
      ReactCodegenConfigurator.configureCodegen(
          project = project,
          localExtension = extension,
          rootExtension = rootExtension,
          isLibrary = false,
          needsCodegenFromPackageJson = { currentProject, privateExtension ->
            currentProject.needsCodegenFromPackageJson(privateExtension.root)
          },
      )
      configureResources(project, extension)
      configureBuildTypesForApp(project)
    }

    // Library Only Configuration
    project.pluginManager.withPlugin("com.android.library") {
      ReactLibraryConfigurator.configure(project, extension, rootExtension)
    }
  }

  private fun checkJvmVersion(project: Project) {
    val jvmVersion = Jvm.current().javaVersion?.majorVersion
    if ((jvmVersion?.toIntOrNull() ?: 0) <= 16) {
      project.logger.error(
          """

      ********************************************************************************

      ERROR: requires JDK17 or higher.
      Incompatible major version detected: '$jvmVersion'

      ********************************************************************************

      """
              .trimIndent()
      )
      exitProcess(1)
    }
  }

  /** This function configures Android resources - in this case just the bundle */
  private fun configureResources(project: Project, reactExtension: ReactExtension) {
    project.extensions.getByType(ApplicationAndroidComponentsExtension::class.java).finalizeDsl {
        ext ->
      val bundleFileExtension = reactExtension.bundleAssetName.get().substringAfterLast('.', "")
      if (!reactExtension.enableBundleCompression.get() && bundleFileExtension.isNotBlank()) {
        ext.androidResources.noCompress.add(bundleFileExtension)
      }
    }
  }

  /** This function sets up Autolinking for App users */
  private fun configureAutolinking(
      project: Project,
      extension: ReactExtension,
      rootExtension: PrivateReactExtension,
  ) {
    val generatedAutolinkingJavaDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/autolinking/src/main/java")
    val generatedAutolinkingJniDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/autolinking/src/main/jni")
    val generatedPureCxxSourceDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/source/codegen/pureCxx")

    // The autolinking.json file is available in the root build folder as it's generated
    // by ReactSettingsPlugin.kt
    val rootGeneratedAutolinkingFile =
        project.rootProject.layout.buildDirectory.file("generated/autolinking/autolinking.json")
    val pureCxxDependencies =
        getPureCxxCodegenDependencies(rootGeneratedAutolinkingFile.get().asFile)
    val pureCxxCodegenTasks =
        configurePureCxxDependenciesCodegen(
            project,
            extension,
            rootExtension,
            generatedPureCxxSourceDir,
            pureCxxDependencies,
        )

    // We add a task called generateAutolinkingPackageList to do not clash with the existing task
    // called generatePackageList. This can to be renamed once we unlink the rn <-> cli
    // dependency.
    val generatePackageListTask =
        project.tasks.register(
            "generateAutolinkingPackageList",
            GeneratePackageListTask::class.java,
        ) { task ->
          task.autolinkInputFile.set(rootGeneratedAutolinkingFile)
          task.generatedOutputDirectory.set(generatedAutolinkingJavaDir)
        }

    // We add a task called generateReactNativeEntryPoint to generate the React Native entry point.
    val generateEntryPointTask =
        project.tasks.register(
            "generateReactNativeEntryPoint",
            GenerateEntryPointTask::class.java,
        ) { task ->
          task.autolinkInputFile.set(rootGeneratedAutolinkingFile)
          task.generatedOutputDirectory.set(generatedAutolinkingJavaDir)
        }

    // We also need to generate code for C++ Autolinking
    val generateAutolinkingNewArchitectureFilesTask =
        project.tasks.register(
            "generateAutolinkingNewArchitectureFiles",
            GenerateAutolinkingNewArchitecturesFileTask::class.java,
        ) { task ->
          task.autolinkInputFile.set(rootGeneratedAutolinkingFile)
          task.generatedOutputDirectory.set(generatedAutolinkingJniDir)

          if (pureCxxDependencies.isNotEmpty()) {
            task.generatedPureCxxSourceDirectory.set(generatedPureCxxSourceDir)
          }

          task.dependsOn(pureCxxCodegenTasks)
        }
    project.tasks
        .named("preBuild", Task::class.java)
        .dependsOn(generateAutolinkingNewArchitectureFilesTask)

    // We make preBuild depend on generateAutolinkingPackageList and generateEntryPoint so they run
    // before everything else.
    project.tasks
        .named("preBuild", Task::class.java)
        .dependsOn(generatePackageListTask, generateEntryPointTask)

    // We tell Android Gradle Plugin that inside /build/generated/autolinking/src/main/java there
    // are sources to be compiled as well.
    project.extensions.getByType(ApplicationAndroidComponentsExtension::class.java).apply {
      onVariants(selector().all()) { variant ->
        variant.sources.java?.addStaticSourceDirectory(
            generatedAutolinkingJavaDir.get().asFile.absolutePath
        )
      }
    }
  }

  private fun configurePureCxxDependenciesCodegen(
      project: Project,
      extension: ReactExtension,
      rootExtension: PrivateReactExtension,
      generatedPureCxxSourceDir: Provider<Directory>,
      dependencies: List<ModelAutolinkingDependenciesJson>,
  ): List<TaskProvider<GenerateCodegenArtifactsTask>> {
    // Pure C++ dependencies are not included as Gradle subprojects, so configureCodegen won't run
    // for them. The app owns these generated codegen artifacts and links them from autolinking.
    return dependencies.mapNotNull { dependency ->
      val android = dependency.platforms?.android ?: return@mapNotNull null
      val libraryName = android.libraryName ?: return@mapNotNull null
      val dependencyRoot = File(dependency.root)
      val packageJson = File(dependencyRoot, "package.json")
      val parsedPackageJson = JsonUtils.fromPackageJson(packageJson)
      val jsSrcsDir = parsedPackageJson?.codegenConfig?.jsSrcsDir
      val generatedSrcDir = generatedPureCxxSourceDir.map { it.dir(libraryName) }
      val taskNameSuffix = taskNameSuffixForDependency(dependency)

      ReactCodegenConfigurator.registerCodegenTasks(
          project = project,
          rootExtension = rootExtension,
          generatedSrcDir = generatedSrcDir,
          packageJsonFile = { packageJson },
          schemaTaskName = "generate${taskNameSuffix}CodegenSchemaFromJavaScript",
          artifactsTaskName = "generate${taskNameSuffix}CodegenArtifactsFromSchema",
          configureJsRoot = { task, _ ->
            if (jsSrcsDir != null) {
              task.jsRootDir.set(File(packageJson.parentFile, jsSrcsDir))
            } else {
              task.jsRootDir.set(dependencyRoot)
            }
          },
          configureCodegenArtifacts = { task, _ ->
            val codegenJavaPackageName = parsedPackageJson?.codegenConfig?.android?.javaPackageName
            if (codegenJavaPackageName != null) {
              task.codegenJavaPackageName.set(codegenJavaPackageName)
            } else {
              task.codegenJavaPackageName.set(extension.codegenJavaPackageName)
            }
            task.libraryName.set(libraryName)
          },
      )
    }
  }

  internal fun getPureCxxCodegenDependencies(
      autolinkingFile: File
  ): List<ModelAutolinkingDependenciesJson> {
    val model = JsonUtils.fromAutolinkingConfigJson(autolinkingFile)
    return model?.dependencies?.values?.filter { dependency ->
      val android = dependency.platforms?.android

      if (android?.isPureCxxDependency != true || android.libraryName == null) {
        return@filter false
      }

      val packageJson = File(dependency.root, "package.json")
      val codegenConfig = JsonUtils.fromPackageJson(packageJson)?.codegenConfig
      codegenConfig != null && codegenConfig.includesGeneratedCode != true
    } ?: emptyList()
  }

  internal fun taskNameSuffixForDependency(dependency: ModelAutolinkingDependenciesJson): String =
      dependency.name
          .map { char -> if (char.isLetterOrDigit()) char.toString() else "_${char.code}_" }
          .joinToString("")
          .replaceFirstChar { char -> char.titlecase() }
}
