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
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PrepareGflagsTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test(expected = IllegalStateException::class)
  fun prepareGflagsTask_withMissingConfiguration_fails() {
    val task = createTestTask<PrepareGflagsTask>()

    task.taskAction()
  }

  @Test
  fun prepareGflagsTask_copiesCMakefile() {
    val gflagspath = tempFolder.newFolder("gflagspath")
    val output = tempFolder.newFolder("output")
    val project = createProject()
    val gflagsThirdPartyPath = File(project.projectDir, "src/main/jni/third-party/gflags/")
    val task =
        createTestTask<PrepareGflagsTask>(project = project) {
          it.gflagsPath.setFrom(gflagspath)
          it.gflagsThirdPartyPath.set(gflagsThirdPartyPath)
          it.gflagsVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(gflagsThirdPartyPath, "CMakeLists.txt").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertThat(output.listFiles()!!.any { it.name == "CMakeLists.txt" }).isTrue()
  }

  @Test
  fun prepareGflagsTask_copiesSourceCodeAndHeaders() {
    val gflagspath = tempFolder.newFolder("gflagspath")
    val gflagsThirdPartyPath = tempFolder.newFolder("gflagspath/jni")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareGflagsTask> {
          it.gflagsPath.setFrom(gflagspath)
          it.gflagsThirdPartyPath.set(gflagsThirdPartyPath)
          it.gflagsVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(gflagspath, "gflags-1.0.0/src/gflags.cc").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    File(gflagspath, "gflags-1.0.0/src/util.h").apply {
      parentFile.mkdirs()
      createNewFile()
    }

    task.taskAction()

    assertThat(File(output, "gflags/gflags.cc").exists()).isTrue()
    assertThat(File(output, "gflags/util.h").exists()).isTrue()
  }

  @Test
  fun prepareGflagsTask_replacesTokenCorrectly() {
    val gflagspath = tempFolder.newFolder("gflagspath")
    val gflagsThirdPartyPath = tempFolder.newFolder("gflagspath/jni")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareGflagsTask> { taskConfig ->
          taskConfig.gflagsPath.setFrom(gflagspath)
          taskConfig.gflagsThirdPartyPath.set(gflagsThirdPartyPath)
          taskConfig.gflagsVersion.set("1.0.0")
          taskConfig.outputDir.set(output)
        }
    File(gflagspath, "gflags-1.0.0/src/gflags_declare.h.in").apply {
      parentFile.mkdirs()
      writeText(
          """
#define GFLAGS_NAMESPACE @GFLAGS_NAMESPACE@
#include <string>
#if @HAVE_STDINT_H@
#  include <stdint.h>
#elif @HAVE_SYS_TYPES_H@
#  include <sys/types.h>
#elif @HAVE_INTTYPES_H@
#  include <inttypes.h>
#endif


namespace GFLAGS_NAMESPACE {

#if @GFLAGS_INTTYPES_FORMAT_C99@ // C99
typedef int32_t          int32;
typedef uint32_t         uint32;
typedef int64_t          int64;
typedef uint64_t         uint64;
#elif @GFLAGS_INTTYPES_FORMAT_BSD@ // BSD
typedef int32_t          int32;
typedef u_int32_t        uint32;
typedef int64_t          int64;
typedef u_int64_t        uint64;
#elif @GFLAGS_INTTYPES_FORMAT_VC7@ // Windows
typedef __int32          int32;
typedef unsigned __int32 uint32;
typedef __int64          int64;
typedef unsigned __int64 uint64;
#else
#  error Do not know how to define a 32-bit integer quantity on your system
#endif

} // namespace GFLAGS_NAMESPACE
""",
      )
    }
    File(gflagspath, "gflags-1.0.0/src/config.h.in").apply {
      parentFile.mkdirs()
      createNewFile()
      writeText("#cmakedefine")
    }
    File(gflagspath, "gflags-1.0.0/src/gflags_ns.h.in").apply {
      parentFile.mkdirs()
      createNewFile()
      writeText("@ns@ @NS@")
    }
    File(gflagspath, "gflags-1.0.0/src/gflags.h.in").apply {
      parentFile.mkdirs()
      createNewFile()
      writeText("@GFLAGS_ATTRIBUTE_UNUSED@\n@INCLUDE_GFLAGS_NS_H@")
    }
    File(gflagspath, "gflags-1.0.0/src/gflags_completions.h.in").apply {
      parentFile.mkdirs()
      createNewFile()
      writeText("@GFLAGS_NAMESPACE@")
    }

    task.taskAction()

    val declareFile = File(output, "gflags/gflags_declare.h")
    assertThat(declareFile.exists()).isTrue()
    assertEquals(
        declareFile.readText(),
        """
#define GFLAGS_NAMESPACE gflags
#include <string>
#if 1
#  include <stdint.h>
#elif 1
#  include <sys/types.h>
#elif 1
#  include <inttypes.h>
#endif


namespace GFLAGS_NAMESPACE {

#if 1 // C99
typedef int32_t          int32;
typedef uint32_t         uint32;
typedef int64_t          int64;
typedef uint64_t         uint64;
#elif 1 // BSD
typedef int32_t          int32;
typedef u_int32_t        uint32;
typedef int64_t          int64;
typedef u_int64_t        uint64;
#elif 1 // Windows
typedef __int32          int32;
typedef unsigned __int32 uint32;
typedef __int64          int64;
typedef unsigned __int64 uint64;
#else
#  error Do not know how to define a 32-bit integer quantity on your system
#endif

} // namespace GFLAGS_NAMESPACE
""",
    )

    val configFile = File(output, "gflags/config.h")
    assertThat(configFile.exists()).isTrue()
    assertEquals(configFile.readText(), "//cmakedefine")

    val nsFile = File(output, "gflags/gflags_google.h")
    assertThat(nsFile.exists()).isTrue()
    assertEquals(nsFile.readText(), "google GOOGLE")

    val gflagsFile = File(output, "gflags/gflags.h")
    assertThat(gflagsFile.exists()).isTrue()
    assertEquals(gflagsFile.readText(), "\n#include \"gflags/gflags_google.h\"")

    val completionsFile = File(output, "gflags/gflags_completions.h")
    assertThat(completionsFile.exists()).isTrue()
    assertEquals(completionsFile.readText(), "gflags")
  }
}
