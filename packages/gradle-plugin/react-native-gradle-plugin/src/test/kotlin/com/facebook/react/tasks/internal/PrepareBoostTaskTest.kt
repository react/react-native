/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.tests.createProject
import com.facebook.react.tests.createTestTask
import java.io.*
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PrepareBoostTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun prepareBoostTask_withMissingConfiguration_fails() {
    val task = createTestTask<PrepareBoostTask>()
    assertThatThrownBy { task.taskAction() }
        .isInstanceOf(IllegalStateException::class.java)
        .hasMessage(
            "Cannot query the value of task ':PrepareBoostTask' property 'boostVersion' because it has no value available.",
        )
  }

  @Test
  fun prepareBoostTask_copiesCMakefile() {
    val boostpath = tempFolder.newFolder("boostpath")
    val output = tempFolder.newFolder("output")
    val project = createProject()
    val boostThirdPartyJniPath = File(project.projectDir, "src/main/jni/third-party/boost/")
    val task =
        createTestTask<PrepareBoostTask>(project = project) {
          it.boostPath.setFrom(boostpath)
          it.boostThirdPartyJniPath.set(boostThirdPartyJniPath)
          it.boostVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(boostThirdPartyJniPath, "CMakeLists.txt").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertThat(output.listFiles()).extracting("name").contains("CMakeLists.txt")
  }

  @Test
  fun prepareBoostTask_copiesAsmFiles() {
    val boostpath = tempFolder.newFolder("boostpath")
    val boostThirdPartyJniPath = tempFolder.newFolder("boostpath/jni")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareBoostTask> { task ->
          task.boostPath.setFrom(boostpath)
          task.boostThirdPartyJniPath.set(boostThirdPartyJniPath)
          task.boostVersion.set("1.0.0")
          task.outputDir.set(output)
        }
    File(boostpath, "asm/asm.S").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertThat(File(output, "asm/asm.S")).exists()
  }

  @Test
  fun prepareBoostTask_copiesBoostSourceFiles() {
    val boostpath = tempFolder.newFolder("boostpath")
    val boostThirdPartyJniPath = tempFolder.newFolder("boostpath/jni")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareBoostTask> { task ->
          task.boostPath.setFrom(boostpath)
          task.boostThirdPartyJniPath.set(boostThirdPartyJniPath)
          task.boostVersion.set("1.0.0")
          task.outputDir.set(output)
        }
    File(boostpath, "boost_1.0.0/boost/config.hpp").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertThat(File(output, "boost_1.0.0/boost/config.hpp")).exists()
  }

  @Test
  fun prepareBoostTask_copiesVersionlessBoostSourceFiles() {
    val boostpath = tempFolder.newFolder("boostpath")
    val boostThirdPartyJniPath = tempFolder.newFolder("boostpath/jni")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareBoostTask> { task ->
          task.boostPath.setFrom(boostpath)
          task.boostThirdPartyJniPath.set(boostThirdPartyJniPath)
          task.boostVersion.set("1.0.0")
          task.outputDir.set(output)
        }
    File(boostpath, "boost/boost/config.hpp").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertThat(File(output, "boost_1.0.0/boost/config.hpp")).exists()
  }
}
