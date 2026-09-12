/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.tests.createTestTask
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.gradle.api.GradleException
import org.junit.Assume.assumeFalse
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class GenerateStubPchTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun generateStubPchTask_groupIsSetCorrectly() {
    val task = createTestTask<GenerateStubPchTask> {}
    assertThat(task.group).isEqualTo("react")
  }

  @Test
  fun stubCompilerArguments_extractsCompilerAndFlags() {
    val task = createTestTask<GenerateStubPchTask>()
    val pchFile = tempFolder.newFile("cmake_pch.hxx.pch")
    val stubHeader = tempFolder.newFile("stub_pch.hxx")

    val arguments =
        task.stubCompilerArguments(
            "/ndk/clang++ --target=aarch64-none-linux-android24 --sysroot=/ndk/sysroot -Wall -c x.cxx",
            pchFile,
            stubHeader,
        )

    assertThat(arguments)
        .containsExactly(
            "/ndk/clang++",
            "--target=aarch64-none-linux-android24",
            "--sysroot=/ndk/sysroot",
            "-x",
            "c++-header",
            "-o",
            pchFile.absolutePath,
            stubHeader.absolutePath,
        )
  }

  @Test
  fun stubCompilerArguments_withoutTarget_fails() {
    val task = createTestTask<GenerateStubPchTask>()

    assertThatThrownBy {
          task.stubCompilerArguments(
              "/ndk/clang++ --sysroot=/ndk/sysroot -c x.cxx",
              tempFolder.newFile("a.pch"),
              tempFolder.newFile("a.hxx"),
          )
        }
        .isInstanceOf(GradleException::class.java)
        .hasMessageContaining("--target")
  }

  @Test
  fun stubCompilerArguments_withoutSysroot_fails() {
    val task = createTestTask<GenerateStubPchTask>()

    assertThatThrownBy {
          task.stubCompilerArguments(
              "/ndk/clang++ --target=aarch64-none-linux-android24 -c x.cxx",
              tempFolder.newFile("a.pch"),
              tempFolder.newFile("a.hxx"),
          )
        }
        .isInstanceOf(GradleException::class.java)
        .hasMessageContaining("--sysroot")
  }
}
