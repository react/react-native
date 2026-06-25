/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.api.variant.Variant
import com.facebook.react.tasks.BundleHermesCTask
import com.facebook.react.utils.BackwardCompatUtils.showJSCRemovalMessage
import com.facebook.react.utils.NdkConfiguratorUtils.configureJsEnginePackagingOptions
import com.facebook.react.utils.NdkConfiguratorUtils.configureNewArchPackagingOptions
import com.facebook.react.utils.ProjectUtils.isHermesEnabled
import com.facebook.react.utils.ProjectUtils.useThirdPartyJSC
import com.facebook.react.utils.detectedCliFile
import com.facebook.react.utils.detectedEntryFile
import java.io.File
import org.gradle.api.Project

@Suppress("SpreadOperator", "UnstableApiUsage")
internal fun Project.configureReactTasks(variant: Variant, config: ReactExtension) {
  val targetName = variant.name.replaceFirstChar { it.titlecase() }
  val targetPath = variant.name

  val buildDir = layout.buildDirectory.get().asFile
  // Resources: generated/assets/react/<variant>/index.android.bundle
  val resourcesDir = File(buildDir, "generated/res/react/$targetPath")
  // Bundle: generated/assets/react/<variant>/index.android.bundle
  val jsBundleDir = File(buildDir, "generated/assets/react/$targetPath")
  // Sourcemap: generated/sourcemaps/react/<variant>/index.android.bundle.map
  val jsSourceMapsDir = File(buildDir, "generated/sourcemaps/react/$targetPath")
  // Intermediate packager:
  // intermediates/sourcemaps/react/<variant>/index.android.bundle.packager.map
  // Intermediate compiler:
  // intermediates/sourcemaps/react/<variant>/index.android.bundle.compiler.map
  val jsIntermediateSourceMapsDir = File(buildDir, "intermediates/sourcemaps/react/$targetPath")

  // The location of the cli.js file for React Native
  val cliFile = detectedCliFile(config)

  val isHermesEnabledInProject = project.isHermesEnabled
  val isHermesEnabledInThisVariant =
      if (config.enableHermesOnlyInVariants.get().isNotEmpty()) {
        config.enableHermesOnlyInVariants.get().contains(variant.name) && isHermesEnabledInProject
      } else {
        isHermesEnabledInProject
      }
  val isDebuggableVariant =
      config.debuggableVariants.get().any { it.equals(variant.name, ignoreCase = true) }
  val useThirdPartyJSC = project.useThirdPartyJSC

  configureNewArchPackagingOptions(project, config, variant)
  configureJsEnginePackagingOptions(config, variant, isHermesEnabledInThisVariant, useThirdPartyJSC)
  if (
      !isHermesEnabledInThisVariant &&
          !useThirdPartyJSC &&
          rootProject.name != "react-native-github"
  ) {
    showJSCRemovalMessage(project)
  }

  if (!isDebuggableVariant) {
    val entryFileEnvVariable = System.getenv("ENTRY_FILE")
    val bundleTask =
        tasks.register("createBundle${targetName}JsAndAssets", BundleHermesCTask::class.java) { task
          ->
          task.root.set(config.root)
          task.nodeExecutableAndArgs.set(config.nodeExecutableAndArgs)
          task.cliFile.set(cliFile)
          task.bundleCommand.set(config.bundleCommand)
          task.entryFile.set(detectedEntryFile(config, entryFileEnvVariable))
          task.extraPackagerArgs.set(config.extraPackagerArgs)
          task.bundleConfig.set(config.bundleConfig)
          task.bundleAssetName.set(config.bundleAssetName)
          task.jsBundleDir.set(jsBundleDir)
          task.resourcesDir.set(resourcesDir)
          task.hermesEnabled.set(isHermesEnabledInThisVariant)
          task.minifyEnabled.set(!isHermesEnabledInThisVariant)
          task.devEnabled.set(false)
          task.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
          task.jsSourceMapsDir.set(jsSourceMapsDir)
          task.hermesCommand.set(config.hermesCommand)
          task.hermesFlags.set(config.hermesFlags)
          task.reactNativeDir.set(config.reactNativeDir)
        }
    variant.sources.res?.addGeneratedSourceDirectory(bundleTask, BundleHermesCTask::resourcesDir)
    variant.sources.assets?.addGeneratedSourceDirectory(bundleTask, BundleHermesCTask::jsBundleDir)
  }
}
