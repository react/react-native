/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.google.gson.Gson
import com.google.gson.JsonArray
import java.io.File
import org.gradle.api.DefaultTask
import org.gradle.api.GradleException
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.tasks.Internal
import org.gradle.api.tasks.TaskAction

abstract class GenerateStubPchTask : DefaultTask() {

  init {
    group = "react"
    description = "Generates stub precompiled headers so Android Studio can sync C++ sources."
    outputs.upToDateWhen { false }
  }

  /** The AGP-managed `.cxx` directory. */
  @get:Internal abstract val cxxDirectory: DirectoryProperty

  @TaskAction
  fun taskAction() {
    val cxxDir = cxxDirectory.get().asFile
    if (!cxxDir.isDirectory) {
      return
    }

    cxxDir
      .walkTopDown()
      .filter { it.isFile && it.name == COMPILE_COMMANDS_FILENAME }
      .forEach { generateStubsFor(it) }
  }

  internal fun generateStubsFor(compileCommands: File) {
    val entries = runCatching { 
      Gson().fromJson(compileCommands.readText(), JsonArray::class.java)
    }.getOrNull() ?: return

    for (element in entries) {
      val entry = element.asJsonObject
      val source = entry.get("file")?.asString ?: continue
      if (!source.endsWith(PCH_SOURCE_SUFFIX)) {
        continue
      }

      val pchFile = File(source.removeSuffix(SOURCE_EXTENSION) + PCH_EXTENSION)
      // Anything already on disk was either built for real or stubbed by an earlier sync.
      if (pchFile.length() > 0L) {
        continue
      }

      val command = entry.get("command")?.asString ?: continue
      val directory = entry.get("directory")?.asString ?: continue
      compileEmptyPch(command, File(directory), pchFile)

      // A stub is not a valid input for the real compilation, so keep it older than its source.
      // That way the next build treats it as stale and replaces it before anything consumes it.
      pchFile.setLastModified(File(source).lastModified() - 1)
    }
  }

  private fun compileEmptyPch(command: String, workingDir: File, pchFile: File) {
    pchFile.parentFile.mkdirs()
    val stubHeader = File(pchFile.parentFile, STUB_HEADER_FILENAME).apply { writeText("") }

    val process = ProcessBuilder(stubCompilerArguments(command, pchFile, stubHeader))
      .directory(workingDir)
      .redirectErrorStream(true)
      .start()
    
    val output = process.inputStream.bufferedReader().use { it.readText() }
    process.outputStream.close()
    
    if (process.waitFor() != 0) {
      throw GradleException("RNGP - Stub precompiled header generation failed:\n$output")
    }
  }

  internal fun stubCompilerArguments(
    command: String,
    pchFile: File,
    stubHeader: File,
  ): List<String> {
    val target =
        TARGET_FLAG.find(command)?.value
            ?: throw GradleException("RNGP - Could not find --target in: $command")
    val sysroot =
        SYSROOT_FLAG.find(command)?.value
            ?: throw GradleException("RNGP - Could not find --sysroot in: $command")

    return listOf(
        command.substringBefore(' '),
        target,
        sysroot,
        "-x",
        "c++-header",
        "-o",
        pchFile.absolutePath,
        stubHeader.absolutePath,
    )
  }

  companion object {
    private const val COMPILE_COMMANDS_FILENAME = "compile_commands.json"
    private const val PCH_SOURCE_SUFFIX = "cmake_pch.hxx.cxx"
    private const val SOURCE_EXTENSION = ".cxx"
    private const val PCH_EXTENSION = ".pch"
    private const val STUB_HEADER_FILENAME = "stub_pch.hxx"
    private val TARGET_FLAG = Regex("""--target=\S+""")
    private val SYSROOT_FLAG = Regex("""--sysroot=\S+""")
  }
}
