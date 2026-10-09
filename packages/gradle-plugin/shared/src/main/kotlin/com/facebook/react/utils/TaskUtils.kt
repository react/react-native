/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.io.File

fun windowsAwareCommandLine(vararg args: Any): List<Any> = windowsAwareCommandLine(args.toList())

fun windowsAwareCommandLine(args: List<Any>): List<Any> =
    if (Os.isWindows()) {
      listOf("cmd", "/c") + args
    } else {
      args
    }

fun windowsAwareBashCommandLine(
    vararg args: String,
    bashWindowsHome: String? = null,
): List<String> =
    if (Os.isWindows()) {
      listOf(bashWindowsHome ?: "bash", "-c") + args
    } else {
      args.toList()
    }

/**
 * Returns `<root>\bin\bash.exe` for the first `<root>\<folder>\git.exe` on the PATH that has one,
 * or null. This is where Git for Windows keeps its bash.
 *
 * A bare `bash` is not reliable on Windows: the Git installer adds only `<git>\cmd` to the PATH by
 * default, and when WSL is installed `bash` resolves to the WSL launcher in `System32`, which
 * Windows searches before the PATH.
 */
fun findGitBashOnWindows(path: String? = System.getenv("PATH")): String? {
  if (!Os.isWindows() || path == null) {
    return null
  }
  return path
      .split(File.pathSeparatorChar)
      .asSequence()
      .map { it.trim().removeSurrounding("\"") }
      .filter { it.isNotEmpty() }
      .map { File(it, "git.exe") }
      .filter { it.isFile }
      .mapNotNull { it.absoluteFile.parentFile?.parentFile?.resolve("bin/bash.exe") }
      .firstOrNull { it.isFile }
      ?.absolutePath
}
