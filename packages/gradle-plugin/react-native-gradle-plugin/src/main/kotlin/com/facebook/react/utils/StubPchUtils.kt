/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.google.gson.Gson
import com.google.gson.JsonArray
import java.io.File
import org.gradle.api.GradleException

internal object StubPchUtils {
  private const val COMPILE_COMMANDS_FILENAME = "compile_commands.json"
  private const val PCH_SOURCE_SUFFIX = "cmake_pch.hxx.cxx"
  private const val SOURCE_EXTENSION = ".cxx"
  private const val PCH_EXTENSION = ".pch"
  private const val STUB_HEADER_FILENAME = "stub_pch.hxx"

  /** Generates the missing stub precompiled headers for every configuration under [cxxDir]. */
  fun generateStubs(cxxDir: File) {
    if (!cxxDir.isDirectory) {
      return
    }

    cxxDir
        .walkTopDown()
        .filter { it.isFile && it.name == COMPILE_COMMANDS_FILENAME }
        .forEach { generateStubsFor(it) }
  }

  internal fun generateStubsFor(compileCommands: File) {
    val entries =
        runCatching { Gson().fromJson(compileCommands.readText(), JsonArray::class.java) }
            .getOrNull() ?: return

    for (element in entries) {
      val entry = element.asJsonObject
      val source = entry.get("file")?.asString ?: continue
      if (!source.endsWith(PCH_SOURCE_SUFFIX)) {
        continue
      }

      val header = source.removeSuffix(SOURCE_EXTENSION)
      val pchFile = File(header + PCH_EXTENSION)
      // Anything already on disk was either built for real or stubbed by an earlier sync.
      if (pchFile.length() > 0L) {
        continue
      }

      val command = entry.get("command")?.asString ?: continue
      val directory = entry.get("directory")?.asString ?: continue
      compileEmptyPch(command, header, File(directory), pchFile)

      // A stub is not a valid input for the real compilation, so keep it older than its source.
      // That way the next build treats it as stale and replaces it before anything consumes it.
      pchFile.setLastModified(File(source).lastModified() - 1)
    }
  }

  private fun compileEmptyPch(
      command: String,
      header: String,
      workingDir: File,
      pchFile: File,
  ) {
    pchFile.parentFile.mkdirs()
    val stubHeader = File(pchFile.parentFile, STUB_HEADER_FILENAME).apply { writeText("") }

    val process =
        ProcessBuilder(stubCompilerArguments(command, header, stubHeader))
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
      header: String,
      stubHeader: File,
      windows: Boolean = Os.isWindows(),
  ): List<String> {
    val arguments = splitCompilerCommand(command, windows)
    if (arguments.none { it == header }) {
      throw GradleException("RNGP - Could not find $header in: $command")
    }

    return arguments.map { if (it == header) stubHeader.absolutePath else it }
  }

  private fun splitCompilerCommand(command: String, windows: Boolean): List<String> {
    val arguments = mutableListOf<String>()
    var argument: StringBuilder? = null
    var quote: Char? = null
    var index = 0

    while (index < command.length) {
      val char = command[index++]
      if (char.isWhitespace() && quote == null) {
        argument?.let { arguments.add(it.toString()) }
        argument = null
        continue
      }

      // POSIX line continuations don't start an argument or contribute any characters.
      if (!windows && char == '\\' && quote != '\'' && command.getOrNull(index) == '\n') {
        index++
        continue
      }

      val token = argument ?: StringBuilder().also { argument = it }
      when {
        char == '\\' && windows -> {
          val start = index - 1
          while (command.getOrNull(index) == '\\') {
            index++
          }
          val count = index - start
          val followedByQuote = command.getOrNull(index) == '"'
          repeat(if (followedByQuote) count / 2 else count) { token.append('\\') }
          if (followedByQuote && count % 2 != 0) {
            token.append(command[index++])
          }
        }
        char == '\\' && quote != '\'' -> {
          val next =
              command.getOrNull(index)
                  ?: throw GradleException("RNGP - Trailing escape in compiler command: $command")
          // Inside POSIX double quotes, backslashes only escape these shell characters.
          val escaped = quote != '"' || next in "\"\\\$`"
          token.append(if (escaped) command[index++] else char)
        }
        quote == char && windows && command.getOrNull(index) == '"' ->
            token.append(command[index++])
        quote == char -> quote = null
        quote == null && (char == '"' || (!windows && char == '\'')) -> quote = char
        else -> token.append(char)
      }
    }

    if (quote != null) {
      throw GradleException("RNGP - Unclosed quote in compiler command: $command")
    }

    argument?.let { arguments.add(it.toString()) }

    return arguments
  }
}
