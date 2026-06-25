/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.io.File

object Os {

  fun isWindows(): Boolean =
      System.getProperty("os.name")?.lowercase()?.contains("windows") ?: false

  fun isMac(): Boolean = System.getProperty("os.name")?.lowercase()?.contains("mac") ?: false

  fun isLinuxAmd64(): Boolean {
    val osNameMatch = System.getProperty("os.name")?.lowercase()?.contains("linux") ?: false
    val archMatch = System.getProperty("os.arch")?.lowercase()?.contains("amd64") ?: false
    return osNameMatch && archMatch
  }

  fun String.unixifyPath() =
      this.replace('\\', '/').replace(":", "").let {
        if (!it.startsWith("/")) {
          "/$it"
        } else {
          it
        }
      }

  /**
   * As Gradle doesn't support well path with spaces on Windows, we need to return relative path on
   * Win. On Linux & Mac we'll default to return absolute path.
   */
  fun File.cliPath(base: File): String =
      if (isWindows()) {
        this.relativeTo(base).path
      } else {
        absolutePath
      }
}
