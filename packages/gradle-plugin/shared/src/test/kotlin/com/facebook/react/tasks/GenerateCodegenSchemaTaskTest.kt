/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.tests.*
import com.facebook.react.tests.createProject
import com.facebook.react.tests.createTestTask
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class GenerateCodegenSchemaTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @get:Rule val osRule = OsRule()

  @Test
  fun generateCodegenSchema_outputFile_isSetCorrectly() {
    val outputDir = tempFolder.newFolder("output")

    val task = createTestTask<GenerateCodegenSchemaTask> { it.generatedSrcDir.set(outputDir) }

    assertThat(task.generatedSchemaFile.get().asFile).isEqualTo(File(outputDir, "schema.json"))
  }

  @Test
  fun generateCodegenSchema_nodeExecutablesArgs_areInsideInput() {
    val task =
        createTestTask<GenerateCodegenSchemaTask> {
          it.nodeExecutableAndArgs.set(listOf("npm", "help"))
        }

    assertThat(task.nodeExecutableAndArgs.get()).isEqualTo(listOf("npm", "help"))
    assertThat(task.inputs.properties).containsKey("nodeExecutableAndArgs")
  }

  @Test
  fun wipeOutputDir_willCreateOutputDir() {
    val task =
        createTestTask<GenerateCodegenSchemaTask> {
          it.generatedSrcDir.set(File(tempFolder.root, "output"))
        }

    task.wipeOutputDir()

    assertThat(File(tempFolder.root, "output")).exists()
    assertThat(File(tempFolder.root, "output").listFiles()).isEmpty()
  }

  @Test
  fun wipeOutputDir_willWipeOutputDir() {
    val outputDir =
        tempFolder.newFolder("output").apply { File(this, "some-generated-file").createNewFile() }

    val task = createTestTask<GenerateCodegenSchemaTask> { it.generatedSrcDir.set(outputDir) }

    task.wipeOutputDir()

    assertThat(outputDir.exists()).isTrue()
    assertThat(outputDir.listFiles()).isEmpty()
  }

  @Test
  @WithOs(OS.LINUX)
  fun setupCommandLine_willSetupCorrectly() {
    val codegenDir = tempFolder.newFolder("codegen")
    val jsRootDir = tempFolder.newFolder("js")
    val outputDir = tempFolder.newFolder("output")
    val workingDir = jsRootDir

    val task =
        createTestTask<GenerateCodegenSchemaTask> { task ->
          task.codegenDir.set(codegenDir)
          task.jsRootDir.set(jsRootDir)
          task.generatedSrcDir.set(outputDir)
          task.nodeExecutableAndArgs.set(listOf("node", "--verbose"))
          task.nodeWorkingDir.set(workingDir.absolutePath)
        }

    task.setupCommandLine()

    assertThat(task.commandLine)
        .containsExactly(
            "node",
            "--verbose",
            File(codegenDir, "lib/cli/combine/combine-js-to-schema-cli.js").toString(),
            "--platform",
            "android",
            File(outputDir, "schema.json").toString(),
            jsRootDir.toString(),
        )
  }

  @Test
  @WithOs(OS.WIN)
  fun setupCommandLine_onWindows_willSetupCorrectly() {
    val codegenDir = tempFolder.newFolder("codegen")
    val jsRootDir = tempFolder.newFolder("js")
    val outputDir = tempFolder.newFolder("output")

    val project = createProject()
    val task =
        createTestTask<GenerateCodegenSchemaTask>(project) { task ->
          task.codegenDir.set(codegenDir)
          task.jsRootDir.set(jsRootDir)
          task.generatedSrcDir.set(outputDir)
          task.nodeExecutableAndArgs.set(listOf("node", "--verbose"))
          task.nodeWorkingDir.set(project.rootDir.absolutePath)
        }

    task.setupCommandLine()

    assertThat(task.commandLine)
        .containsExactly(
            "cmd",
            "/c",
            "node",
            "--verbose",
            File(codegenDir, "lib/cli/combine/combine-js-to-schema-cli.js")
                .relativeTo(project.projectDir)
                .path,
            "--platform",
            "android",
            File(outputDir, "schema.json").relativeTo(project.projectDir).path,
            jsRootDir.relativeTo(project.projectDir).path,
        )
  }
}
