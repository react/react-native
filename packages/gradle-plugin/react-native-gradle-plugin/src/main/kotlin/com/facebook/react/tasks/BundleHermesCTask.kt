/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.Os.cliPath
import com.facebook.react.utils.detectOSAwareHermesCommand
import com.facebook.react.utils.moveTo
import com.facebook.react.utils.windowsAwareCommandLine
import java.io.File
import javax.inject.Inject
import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileTree
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*
import org.gradle.process.ExecOperations

abstract class BundleHermesCTask : DefaultTask() {

  init {
    group = "react"
  }

  @get:Inject abstract val execOperations: ExecOperations

  @get:Internal abstract val root: DirectoryProperty

  @get:InputFiles
  val sources: ConfigurableFileTree =
      project.fileTree(root) { fileTree ->
        fileTree.include("**/*.js")
        fileTree.include("**/*.jsx")
        fileTree.include("**/*.ts")
        fileTree.include("**/*.tsx")
        fileTree.exclude("**/android/**/*")
        fileTree.exclude("**/ios/**/*")
        fileTree.exclude("**/build/**/*")
        fileTree.exclude("**/node_modules/**/*")
      }

  @get:Input abstract val nodeExecutableAndArgs: ListProperty<String>

  @get:InputFile abstract val cliFile: RegularFileProperty

  @get:Internal abstract val reactNativeDir: DirectoryProperty

  @get:Input abstract val bundleCommand: Property<String>

  @get:InputFile abstract val entryFile: RegularFileProperty

  @get:InputFile @get:Optional abstract val bundleConfig: RegularFileProperty

  @get:Input abstract val bundleAssetName: Property<String>

  @get:Input abstract val minifyEnabled: Property<Boolean>

  @get:Input abstract val hermesEnabled: Property<Boolean>

  @get:Input abstract val devEnabled: Property<Boolean>

  @get:Input abstract val extraPackagerArgs: ListProperty<String>

  @get:Input abstract val hermesCommand: Property<String>

  @get:Input abstract val hermesFlags: ListProperty<String>

  @get:OutputDirectory abstract val jsBundleDir: DirectoryProperty

  @get:OutputDirectory abstract val resourcesDir: DirectoryProperty

  @get:OutputDirectory abstract val jsIntermediateSourceMapsDir: RegularFileProperty

  @get:OutputDirectory abstract val jsSourceMapsDir: DirectoryProperty

  @TaskAction
  fun run() {
    jsBundleDir.get().asFile.mkdirs()
    resourcesDir.get().asFile.mkdirs()
    jsIntermediateSourceMapsDir.get().asFile.mkdirs()
    jsSourceMapsDir.get().asFile.mkdirs()
    val bundleAssetFilename = bundleAssetName.get()

    val bundleFile = File(jsBundleDir.get().asFile, bundleAssetFilename)
    val packagerSourceMap = resolvePackagerSourceMapFile(bundleAssetFilename)

    val bundleCommand = getBundleCommand(bundleFile, packagerSourceMap)
    runCommand(bundleCommand)

    if (hermesEnabled.get()) {
      val detectedHermesCommand = detectOSAwareHermesCommand(root.get().asFile, hermesCommand.get())
      val bytecodeFile = File("${bundleFile}.hbc")
      val outputSourceMap = resolveOutputSourceMap(bundleAssetFilename)
      val compilerSourceMap = resolveCompilerSourceMap(bundleAssetFilename)

      val hermesCommand = getHermescCommand(detectedHermesCommand, bytecodeFile, bundleFile)
      runCommand(hermesCommand)
      bytecodeFile.moveTo(bundleFile)

      if (hermesFlags.get().contains("-output-source-map")) {
        val hermesTempSourceMapFile = File("$bytecodeFile.map")
        hermesTempSourceMapFile.moveTo(compilerSourceMap)

        val reactNativeDir = reactNativeDir.get().asFile
        val composeScriptFile = File(reactNativeDir, "scripts/compose-source-maps.js")
        val composeSourceMapsCommand =
            getComposeSourceMapsCommand(
                composeScriptFile,
                packagerSourceMap,
                compilerSourceMap,
                outputSourceMap,
            )
        runCommand(composeSourceMapsCommand)
      }
    }
  }

  internal fun resolvePackagerSourceMapFile(bundleAssetName: String) =
      if (hermesEnabled.get()) {
        File(jsIntermediateSourceMapsDir.get().asFile, "$bundleAssetName.packager.map")
      } else {
        resolveOutputSourceMap(bundleAssetName)
      }

  internal fun resolveOutputSourceMap(bundleAssetName: String) =
      File(jsSourceMapsDir.get().asFile, "$bundleAssetName.map")

  internal fun resolveCompilerSourceMap(bundleAssetName: String) =
      File(jsIntermediateSourceMapsDir.get().asFile, "$bundleAssetName.compiler.map")

  private fun runCommand(command: List<Any>) {
    execOperations.exec { exec ->
      exec.workingDir(root.get().asFile)
      exec.commandLine(command)
    }
  }

  internal fun getBundleCommand(bundleFile: File, sourceMapFile: File): List<Any> {
    val rootFile = root.get().asFile
    val commandLine =
        mutableListOf<String>().apply {
          addAll(nodeExecutableAndArgs.get())
          add(cliFile.get().asFile.cliPath(rootFile))
          add(bundleCommand.get())
          add("--platform")
          add("android")
          add("--dev")
          add(devEnabled.get().toString())
          add("--reset-cache")
          add("--entry-file")
          add(entryFile.get().asFile.cliPath(rootFile))
          add("--bundle-output")
          add(bundleFile.cliPath(rootFile))
          add("--assets-dest")
          add(resourcesDir.get().asFile.cliPath(rootFile))
          add("--sourcemap-output")
          add(sourceMapFile.cliPath(rootFile))
          if (bundleConfig.isPresent) {
            add("--config")
            add(bundleConfig.get().asFile.cliPath(rootFile))
          }
          add("--minify")
          add(minifyEnabled.get().toString())
          addAll(extraPackagerArgs.get())
          add("--verbose")
        }
    return windowsAwareCommandLine(commandLine)
  }

  internal fun getHermescCommand(
      hermesCommand: String,
      bytecodeFile: File,
      bundleFile: File,
  ): List<Any> {
    val rootFile = root.get().asFile
    return windowsAwareCommandLine(
        hermesCommand,
        "-w",
        "-emit-binary",
        "-max-diagnostic-width=80",
        "-out",
        bytecodeFile.cliPath(rootFile),
        bundleFile.cliPath(rootFile),
        *hermesFlags.get().toTypedArray(),
    )
  }

  internal fun getComposeSourceMapsCommand(
      composeScript: File,
      packagerSourceMap: File,
      compilerSourceMap: File,
      outputSourceMap: File,
  ): List<Any> {
    val rootFile = root.get().asFile
    return windowsAwareCommandLine(
        *nodeExecutableAndArgs.get().toTypedArray(),
        composeScript.cliPath(rootFile),
        packagerSourceMap.cliPath(rootFile),
        compilerSourceMap.cliPath(rootFile),
        "-o",
        outputSourceMap.cliPath(rootFile),
    )
  }
}
