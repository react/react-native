/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:JvmName("PathUtils")

package com.facebook.react.utils

import com.facebook.react.ReactExtension
import com.facebook.react.model.ModelPackageJson
import com.facebook.react.utils.Os.cliPath
import java.io.File
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty

/**
 * Computes the entry file for React Native. The Algo follows this order:
 * 1. The file pointed by the ENTRY_FILE env variable, if set.
 * 2. The file provided by the `entryFile` config in the `reactApp` Gradle extension
 * 3. The `index.android.js` file, if available.
 * 4. Fallback to the `index.js` file.
 *
 * @param config The [ReactExtension] configured for this project
 */
internal fun detectedEntryFile(
    config: ReactExtension,
    envVariableOverride: String? = null,
): File = detectEntryFile(
    entryFile = config.entryFile.orNull?.asFile,
    reactRoot = config.root.get().asFile,
    envVariableOverride = envVariableOverride,
)

/**
 * Computes the CLI file for React Native. The Algo follows this order:
 * 1. The path provided by the `cliFile` config in the `react {}` Gradle extension
 * 2. The output of `node --print "require.resolve('react-native/cli');"` if not failing.
 * 3. The `node_modules/react-native/cli.js` file if exists
 * 4. Fails otherwise
 */
internal fun detectedCliFile(config: ReactExtension): File = detectCliFile(
    project = config.project,
    reactNativeRoot = config.root.get().asFile,
    preconfiguredCliFile = config.cliFile.asFile.orNull,
)

/**
 * Computes the `hermesc` command location. The Algo follows this order:
 * 1. The path provided by the `hermesCommand` config in the `react` Gradle extension
 * 2. The file located in `node_modules/react-native/sdks/hermes/build/bin/hermesc`. This will be
 *    used if the user is building Hermes from source.
 * 3. The file located in `node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc` where `%OS-BIN%`
 *    is substituted with the correct OS arch. This will be used if the user is using a precompiled
 *    hermes-engine package.
 * 4. Fails otherwise
 */
internal fun detectedHermesCommand(config: ReactExtension): String =
    detectOSAwareHermesCommand(config.root.get().asFile, config.hermesCommand.get())

private fun detectEntryFile(
    entryFile: File?,
    reactRoot: File,
    envVariableOverride: String? = null,
): File =
    when {
      envVariableOverride != null -> File(reactRoot, envVariableOverride)
      entryFile != null -> entryFile
      File(reactRoot, "index.android.js").exists() -> File(reactRoot, "index.android.js")
      else -> File(reactRoot, "index.js")
    }

private fun detectCliFile(
    project: Project,
    reactNativeRoot: File,
    preconfiguredCliFile: File?,
): File {
  // 1. preconfigured path
  if (preconfiguredCliFile != null) {
    if (preconfiguredCliFile.exists()) {
      return preconfiguredCliFile
    }
  }

  // 2. node module path
  val nodeProcess =
      project.providers.exec { exec ->
        exec.commandLine("node", "--print", "require.resolve('react-native/cli');")
        exec.workingDir(reactNativeRoot)
      }

  val nodeProcessOutput = nodeProcess.standardOutput.asText.get().trim()

  if (nodeProcessOutput.isNotEmpty()) {
    val nodeModuleCliJs = File(nodeProcessOutput)
    if (nodeModuleCliJs.exists()) {
      return nodeModuleCliJs
    }
  }

  // 3. cli.js in the root folder
  val rootCliJs = File(reactNativeRoot, "node_modules/react-native/cli.js")
  if (rootCliJs.exists()) {
    return rootCliJs
  }

  error(
      """
      Couldn't determine CLI location!

      Please set `react { cliFile = file(...) }` inside your
      build.gradle to the path of the react-native cli.js file.
      This file typically resides in `node_modules/react-native/cli.js`
      """
          .trimIndent()
  )
}

/**
 * Computes the `hermesc` command location. The Algo follows this order:
 * 1. The path provided by the `hermesCommand` config in the `react` Gradle extension
 * 2. The file located in `node_modules/react-native/sdks/hermes/build/bin/hermesc`. This will be
 *    used if the user is building Hermes from source.
 * 3. The file located in `node_modules/hermes-compiler/%OS-BIN%/hermesc` where `%OS-BIN%` is
 *    substituted with the correct OS arch. This is used when Hermes V1 is consumed as a prebuilt
 *    package via the `hermes-compiler` npm package.
 * 4. Fails otherwise
 */
internal fun detectOSAwareHermesCommand(
    projectRoot: File,
    hermesCommand: String,
): String { // 1. If the project specifies a Hermes command, don't second guess it.
  if (hermesCommand.isNotBlank()) {
    val osSpecificHermesCommand =
        if ("%OS-BIN%" in hermesCommand) {
          hermesCommand.replace("%OS-BIN%", getHermesOSBin())
        } else {
          hermesCommand
        }
    return osSpecificHermesCommand
        // Execution on Windows fails with / as separator
        .replace('/', File.separatorChar)
  }

  // 2. If the project is building hermes-engine from source, use hermesc from there
  val builtHermesc =
      getBuiltHermescFile(projectRoot, System.getenv("REACT_NATIVE_OVERRIDE_HERMES_DIR"))
  if (builtHermesc.exists()) {
    return builtHermesc.cliPath(projectRoot)
  }

  // 3. Use hermes-compiler from npm
  val prebuiltHermesPath =
      HERMES_COMPILER_NPM_DIR.plus(getHermesCBin())
          .replace("%OS-BIN%", getHermesOSBin())
          // Execution on Windows fails with / as separator
          .replace('/', File.separatorChar)

  val prebuiltHermes = File(projectRoot, prebuiltHermesPath)
  if (prebuiltHermes.exists()) {
    return prebuiltHermes.cliPath(projectRoot)
  }

  error(
      "Couldn't determine Hermesc location. " +
          "Please set `react.hermesCommand` to the path of the hermesc binary file. " +
          "node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc"
  )
}

/**
 * Gets the location where Hermesc should be. If nothing is specified, built hermesc is assumed to
 * be inside [HERMESC_BUILT_FROM_SOURCE_DIR]. Otherwise user can specify an override with
 * [pathOverride], which is assumed to be an absolute path where Hermes source code is
 * provided/built.
 *
 * @param projectRoot The root of the Project.
 */
internal fun getBuiltHermescFile(projectRoot: File, pathOverride: String?) =
    if (!pathOverride.isNullOrBlank()) {
      File(pathOverride, "build/bin/${getHermesCBin()}")
    } else {
      File(projectRoot, HERMESC_BUILT_FROM_SOURCE_DIR.plus(getHermesCBin()))
    }

internal fun getHermesCBin() = if (Os.isWindows()) "hermesc.exe" else "hermesc"

internal fun getHermesOSBin(): String {
  if (Os.isWindows()) return "win64-bin"
  if (Os.isMac()) return "osx-bin"
  if (Os.isLinuxAmd64()) return "linux64-bin"
  error(
      "OS not recognized. Please set project.react.hermesCommand " +
          "to the path of a working Hermes compiler."
  )
}

internal fun projectPathToLibraryName(projectPath: String): String =
    projectPath
        .split(':', '-', '_', '.')
        .joinToString("") { token -> token.replaceFirstChar { it.titlecase() } }
        .plus("Spec")

/**
 * Function to look for the relevant `package.json`. We first look in the parent folder of this
 * Gradle module (generally the case for library projects) or we fallback to looking into the `root`
 * folder of a React Native project (generally the case for app projects).
 */
internal fun findPackageJsonFile(project: Project, rootProperty: DirectoryProperty): File? {
  val inParent = project.file("../package.json")
  if (inParent.exists()) {
    return inParent
  }

  val fromExtension = rootProperty.file("package.json").orNull?.asFile
  if (fromExtension?.exists() == true) {
    return fromExtension
  }

  return null
}

/**
 * Function to look for the `package.json` and parse it. It returns a [ModelPackageJson] if found or
 * null others.
 *
 * Please note that this function access the [DirectoryProperty] parameter and calls .get() on them,
 * so calling this during apply() of the ReactPlugin is not recommended. It should be invoked inside
 * lazy lambdas or at execution time.
 */
internal fun readPackageJsonFile(
    project: Project,
    rootProperty: DirectoryProperty,
): ModelPackageJson? {
  val packageJson = findPackageJsonFile(project, rootProperty)
  return packageJson?.let { JsonUtils.fromPackageJson(it) }
}

private const val HERMES_COMPILER_NPM_DIR = "node_modules/hermes-compiler/hermesc/%OS-BIN%/"
private const val HERMESC_BUILT_FROM_SOURCE_DIR =
    "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/"
