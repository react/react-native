/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.tests.OS
import com.facebook.react.tests.OsRule
import com.facebook.react.tests.WithOs
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class TaskUtilsTest {

  @get:Rule val osRule = OsRule()

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun windowsAwareCommandLine_withEmptyInput_isEmpty() {
    assertThat(windowsAwareCommandLine().isEmpty()).isTrue()
  }

  @Test
  fun windowsAwareCommandLine_withList_isEqualAsVararg() {
    assertThat(windowsAwareCommandLine(listOf("a", "b", "c")))
        .isEqualTo(windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.MAC)
  fun windowsAwareCommandLine_onMac_returnsTheList() {
    assertThat(listOf("a", "b", "c")).isEqualTo(windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.LINUX)
  fun windowsAwareCommandLine_onLinux_returnsTheList() {
    assertThat(listOf("a", "b", "c")).isEqualTo(windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.WIN)
  fun windowsAwareCommandLine_onWindows_prependsCmd() {
    assertThat(listOf("cmd", "/c", "a", "b", "c")).isEqualTo(windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.MAC)
  fun windowsAwareBashCommandLine_onMac_returnsTheList() {
    assertThat(listOf("a", "b", "c"))
        .isEqualTo(windowsAwareBashCommandLine("a", "b", "c", bashWindowsHome = "abc"))
  }

  @Test
  @WithOs(OS.LINUX)
  fun windowsAwareBashCommandLine_onLinux_returnsTheList() {
    assertThat(listOf("a", "b", "c")).isEqualTo(windowsAwareBashCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.WIN)
  fun windowsAwareBashCommandLine_onWindows_prependsBash() {
    assertThat(listOf("bash", "-c", "a", "b", "c"))
        .isEqualTo(windowsAwareBashCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.WIN)
  fun windowsAwareBashCommandLine_onWindows_prependsCustomBashPath() {
    assertThat(listOf("/custom/bash", "-c", "a", "b", "c"))
        .isEqualTo(windowsAwareBashCommandLine("a", "b", "c", bashWindowsHome = "/custom/bash"))
  }

  @Test
  @WithOs(OS.WIN)
  fun findGitBashOnWindows_withGitOnPath_returnsBashOfThatInstall() {
    val gitRoot = createGitInstall("Git")

    assertThat(findGitBashOnWindows(File(gitRoot, "cmd").absolutePath))
        .isEqualTo(File(gitRoot, "bin/bash.exe").absolutePath)
  }

  @Test
  @WithOs(OS.WIN)
  fun findGitBashOnWindows_skipsGitWithoutBashNextToIt() {
    val gitWithoutBash = tempFolder.newFolder("mingw64", "bin")
    File(gitWithoutBash, "git.exe").createNewFile()
    val gitRoot = createGitInstall("Git")
    val path =
        listOf(gitWithoutBash.absolutePath, File(gitRoot, "cmd").absolutePath)
            .joinToString(File.pathSeparator)

    assertThat(findGitBashOnWindows(path)).isEqualTo(File(gitRoot, "bin/bash.exe").absolutePath)
  }

  @Test
  @WithOs(OS.WIN)
  fun findGitBashOnWindows_withoutGitOnPath_returnsNull() {
    assertThat(findGitBashOnWindows(tempFolder.newFolder("empty").absolutePath)).isNull()
  }

  @Test
  @WithOs(OS.WIN)
  fun findGitBashOnWindows_withBashButNoGitOnPath_returnsNull() {
    val toolsRoot = tempFolder.newFolder("tools")
    File(toolsRoot, "cmd").mkdirs()
    File(toolsRoot, "bin").mkdirs()
    File(toolsRoot, "bin/bash.exe").createNewFile()

    assertThat(findGitBashOnWindows(File(toolsRoot, "cmd").absolutePath)).isNull()
  }

  @Test
  @WithOs(OS.WIN)
  fun findGitBashOnWindows_withNullPath_returnsNull() {
    assertThat(findGitBashOnWindows(null)).isNull()
  }

  @Test
  @WithOs(OS.LINUX)
  fun findGitBashOnWindows_onLinux_returnsNull() {
    val gitRoot = createGitInstall("Git")

    assertThat(findGitBashOnWindows(File(gitRoot, "cmd").absolutePath)).isNull()
  }

  private fun createGitInstall(name: String): File {
    val gitRoot = tempFolder.newFolder(name)
    File(gitRoot, "cmd").mkdirs()
    File(gitRoot, "cmd/git.exe").createNewFile()
    File(gitRoot, "bin").mkdirs()
    File(gitRoot, "bin/bash.exe").createNewFile()
    return gitRoot
  }
}
