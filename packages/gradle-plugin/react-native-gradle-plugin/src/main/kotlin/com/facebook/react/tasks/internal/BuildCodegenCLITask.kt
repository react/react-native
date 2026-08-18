/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.utils.Os.unixifyPath
import com.facebook.react.utils.windowsAwareBashCommandLine
import java.io.FileOutputStream
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.FileTree
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*

/**
 * A Task that will call the `scripts/oss/build.sh` script to trigger the creation of the codegen
 * lib artifacts.
 *
 * NOTE: This task is required when using react-native-codegen from source, instead of npm.
 */
abstract class BuildCodegenCLITask : Exec() {

  @get:Internal abstract val codegenDir: DirectoryProperty

  @get:Internal abstract val bashWindowsHome: Property<String>

  @get:Internal abstract val rootProjectName: Property<String>

  @get:InputFiles abstract val inputFiles: Property<FileTree>

  @get:OutputFiles abstract val outputFiles: Property<FileTree>

  @get:OutputFile abstract val logFile: RegularFileProperty

  override fun exec() {
    // For build from source scenario, we don't need to build the codegen at all.
    if (rootProjectName.get() == "react-native-build-from-source") {
      return
    }
    val logFileConcrete =
        logFile.get().asFile.apply {
          parentFile.mkdirs()
          if (exists()) {
            delete()
          }
          createNewFile()
        }
    standardOutput = FileOutputStream(logFileConcrete)
    commandLine(
        windowsAwareBashCommandLine(
            codegenDir.asFile.get().canonicalPath.unixifyPath().plus(BUILD_SCRIPT_PATH),
            bashWindowsHome = bashWindowsHome.orNull,
        ),
    )
    super.exec()
  }

  companion object {
    private const val BUILD_SCRIPT_PATH = "/scripts/oss/build.sh"
  }
}
