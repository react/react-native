/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.utils.StubPchUtils.stubCompilerArguments
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.gradle.api.GradleException
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class StubPchUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun stubCompilerArguments_swapsTheForceIncludedHeaderAndKeepsEveryFlag() {
    val stubHeader = tempFolder.newFile("stub_pch.hxx")

    val arguments =
        stubCompilerArguments(
            "/ndk/clang++ --target=aarch64-none-linux-android24 --sysroot=/ndk/sysroot " +
                "-std=c++20 -fPIC -fstack-protector-strong -Winvalid-pch " +
                "-Xclang -emit-pch -Xclang -include -Xclang /cxx/foo.dir/cmake_pch.hxx " +
                "-x c++-header -o CMakeFiles/foo.dir/cmake_pch.hxx.pch " +
                "-c /cxx/foo.dir/cmake_pch.hxx.cxx",
            "/cxx/foo.dir/cmake_pch.hxx",
            stubHeader,
        )

    assertThat(arguments)
        .containsExactly(
            "/ndk/clang++",
            "--target=aarch64-none-linux-android24",
            "--sysroot=/ndk/sysroot",
            "-std=c++20",
            "-fPIC",
            "-fstack-protector-strong",
            "-Winvalid-pch",
            "-Xclang",
            "-emit-pch",
            "-Xclang",
            "-include",
            "-Xclang",
            stubHeader.absolutePath,
            "-x",
            "c++-header",
            "-o",
            "CMakeFiles/foo.dir/cmake_pch.hxx.pch",
            "-c",
            "/cxx/foo.dir/cmake_pch.hxx.cxx",
        )
  }

  @Test
  fun stubCompilerArguments_withEscapedMacroQuotes_preservesTheMacroValue() {
    val stubHeader = tempFolder.newFile("stub_pch.hxx")

    for (windows in listOf(false, true)) {
      val arguments =
          stubCompilerArguments(
              """/ndk/clang++ -DLOG_TAG=\"ReactNative\" -Xclang -include -Xclang /cxx/cmake_pch.hxx""",
              "/cxx/cmake_pch.hxx",
              stubHeader,
              windows,
          )

      assertThat(arguments)
          .containsExactly(
              "/ndk/clang++",
              "-DLOG_TAG=\"ReactNative\"",
              "-Xclang",
              "-include",
              "-Xclang",
              stubHeader.absolutePath,
          )
    }
  }

  @Test
  fun stubCompilerArguments_withPosixQuoting_preservesSpacesAndLiteralQuotes() {
    val stubHeader = tempFolder.newFile("stub_pch.hxx")

    val arguments =
        stubCompilerArguments(
            """"/Android SDK/clang++" -DFIRST='"React Native"' "-DSECOND=\"React Native\"" """ +
                """-I/Some\ Directory/include -include '/My Project/cmake_pch.hxx'""",
            "/My Project/cmake_pch.hxx",
            stubHeader,
            windows = false,
        )

    assertThat(arguments)
        .containsExactly(
            "/Android SDK/clang++",
            "-DFIRST=\"React Native\"",
            "-DSECOND=\"React Native\"",
            "-I/Some Directory/include",
            "-include",
            stubHeader.absolutePath,
        )
  }

  @Test
  fun stubCompilerArguments_withQuotedWindowsPaths_keepsSpaces() {
    val stubHeader = tempFolder.newFile("stub_pch.hxx")

    val arguments =
        stubCompilerArguments(
            """"C:\Program Files\Android\ndk\clang++.exe" -std=c++20 """ +
                """-Xclang -include -Xclang "C:\My Project\cmake_pch.hxx" -x c++-header""",
            """C:\My Project\cmake_pch.hxx""",
            stubHeader,
            windows = true,
        )

    assertThat(arguments)
        .containsExactly(
            """C:\Program Files\Android\ndk\clang++.exe""",
            "-std=c++20",
            "-Xclang",
            "-include",
            "-Xclang",
            stubHeader.absolutePath,
            "-x",
            "c++-header",
        )
  }

  @Test
  fun stubCompilerArguments_withPosixBackslashes_preservesLiteralCharacters() {
    val stubHeader = tempFolder.newFile("stub_pch.hxx")

    val arguments =
        stubCompilerArguments(
            """clang++ -DFIRST="a\q" -DSECOND='a\b' -DTHIRD=a\\b """ +
                """-DFOURTH="\${'$'}HOME" -include /cxx/cmake_pch.hxx""",
            "/cxx/cmake_pch.hxx",
            stubHeader,
            windows = false,
        )

    assertThat(arguments)
        .containsExactly(
            "clang++",
            """-DFIRST=a\q""",
            """-DSECOND=a\b""",
            """-DTHIRD=a\b""",
            "-DFOURTH=\$HOME",
            "-include",
            stubHeader.absolutePath,
        )
  }

  @Test
  fun stubCompilerArguments_withWindowsBackslashesBeforeQuotes_preservesTheArguments() {
    val stubHeader = tempFolder.newFile("stub_pch.hxx")

    val arguments =
        stubCompilerArguments(
            """clang++ -I"C:\My Project\\" -DVALUE=\"a\\\"b\" """ +
                "\"-DOTHER=\"\"a b\"\"\" " +
                """-include "C:\My Project\cmake_pch.hxx"""",
            """C:\My Project\cmake_pch.hxx""",
            stubHeader,
            windows = true,
        )

    assertThat(arguments)
        .containsExactly(
            "clang++",
            "-IC:\\My Project\\",
            "-DVALUE=\"a\\\"b\"",
            "-DOTHER=\"a b\"",
            "-include",
            stubHeader.absolutePath,
        )
  }

  @Test
  fun stubCompilerArguments_withEmptyArguments_preservesThem() {
    val stubHeader = tempFolder.newFile("stub_pch.hxx")

    for (windows in listOf(false, true)) {
      val arguments =
          stubCompilerArguments(
              """  clang++ "" -DEMPTY="" -include /cxx/cmake_pch.hxx  """,
              "/cxx/cmake_pch.hxx",
              stubHeader,
              windows,
          )

      assertThat(arguments)
          .containsExactly("clang++", "", "-DEMPTY=", "-include", stubHeader.absolutePath)
    }
  }

  @Test
  fun stubCompilerArguments_withPosixLineContinuations_joinsLines() {
    val stubHeader = tempFolder.newFile("stub_pch.hxx")

    val arguments =
        stubCompilerArguments(
            "clang++ \\\n -DLOG_TAG=React\\\nNative -include /cxx/cmake_pch.hxx \\\n",
            "/cxx/cmake_pch.hxx",
            stubHeader,
            windows = false,
        )

    assertThat(arguments)
        .containsExactly("clang++", "-DLOG_TAG=ReactNative", "-include", stubHeader.absolutePath)
  }

  @Test
  fun stubCompilerArguments_withUnclosedQuotes_fails() {
    for (windows in listOf(false, true)) {
      assertThatThrownBy {
            stubCompilerArguments(
                "clang++ -include /cxx/cmake_pch.hxx \"unfinished",
                "/cxx/cmake_pch.hxx",
                tempFolder.root.resolve("stub_pch.hxx"),
                windows,
            )
          }
          .isInstanceOf(GradleException::class.java)
          .hasMessageContaining("Unclosed quote")
    }
  }

  @Test
  fun stubCompilerArguments_withTrailingPosixEscape_fails() {
    assertThatThrownBy {
          stubCompilerArguments(
              "clang++ -include /cxx/cmake_pch.hxx \\",
              "/cxx/cmake_pch.hxx",
              tempFolder.root.resolve("stub_pch.hxx"),
              windows = false,
          )
        }
        .isInstanceOf(GradleException::class.java)
        .hasMessageContaining("Trailing escape")
  }

  @Test
  fun stubCompilerArguments_withoutTheHeader_fails() {
    assertThatThrownBy {
          stubCompilerArguments(
              "/ndk/clang++ --target=aarch64-none-linux-android24 -c x.cxx",
              "/cxx/foo.dir/cmake_pch.hxx",
              tempFolder.newFile("stub_pch.hxx"),
          )
        }
        .isInstanceOf(GradleException::class.java)
        .hasMessageContaining("cmake_pch.hxx")
  }

  @Test
  fun generateStubsFor_withAnExistingPrecompiledHeader_leavesItAlone() {
    val cxxDir = tempFolder.newFolder("foo.dir")
    val source = File(cxxDir, "cmake_pch.hxx.cxx").apply { writeText("/* generated by CMake */") }
    val pch = File(cxxDir, "cmake_pch.hxx.pch").apply { writeText("a real precompiled header") }
    val compileCommands =
        tempFolder.newFile("compile_commands.json").apply {
          // A command that would fail loudly if it were ever run.
          writeText(
              """[{"directory":"${cxxDir.absolutePath}",""" +
                  """"command":"/does/not/exist ${File(cxxDir, "cmake_pch.hxx").absolutePath}",""" +
                  """"file":"${source.absolutePath}"}]"""
          )
        }

    StubPchUtils.generateStubsFor(compileCommands)

    assertThat(pch.readText()).isEqualTo("a real precompiled header")
  }

  @Test
  fun generateStubs_withoutCxxDirectory_doesNothing() {
    StubPchUtils.generateStubs(tempFolder.root.resolve("missing"))
  }
}
