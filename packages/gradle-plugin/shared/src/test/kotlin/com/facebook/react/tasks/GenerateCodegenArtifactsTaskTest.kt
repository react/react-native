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

class GenerateCodegenArtifactsTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @get:Rule val osRule = OsRule()

  @Test
  fun generateCodegenSchema_inputFiles_areSetCorrectly() {
    val outputDir = tempFolder.newFolder("output")

    val task = createTestTask<GenerateCodegenArtifactsTask> { it.generatedSrcDir.set(outputDir) }

    assertThat(task.generatedSchemaFile.get().asFile).isEqualTo(File(outputDir, "schema.json"))
  }

  @Test
  fun generateCodegenSchema_outputFile_isSetCorrectly() {
    val outputDir = tempFolder.newFolder("output")

    val task = createTestTask<GenerateCodegenArtifactsTask> { it.generatedSrcDir.set(outputDir) }

    assertThat(task.generatedJavaFiles.get().asFile).isEqualTo(File(outputDir, "java"))
    assertThat(task.generatedJniFiles.get().asFile).isEqualTo(File(outputDir, "jni"))
  }

  @Test
  fun generateCodegenSchema_simpleProperties_areInsideInput() {
    val packageJsonFile = tempFolder.newFile("package.json")

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.nodeExecutableAndArgs.set(listOf("npm", "help"))
          it.codegenJavaPackageName.set("com.example.test")
          it.libraryName.set("example-test")
          it.packageJsonFile.set(packageJsonFile)
        }

    assertThat(task.nodeExecutableAndArgs.get()).isEqualTo(listOf("npm", "help"))
    assertThat(task.codegenJavaPackageName.get()).isEqualTo("com.example.test")
    assertThat(task.libraryName.get()).isEqualTo("example-test")
    assertThat(task.inputs.properties)
        .containsKeys("nodeExecutableAndArgs", "codegenJavaPackageName", "libraryName")
  }

  @Test
  @WithOs(OS.LINUX)
  fun setupCommandLine_willSetupCorrectly() {
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native/")
    val outputDir = tempFolder.newFolder("output")

    val task =
        createTestTask<GenerateCodegenArtifactsTask> { task ->
          task.reactNativeDir.set(reactNativeDir)
          task.generatedSrcDir.set(outputDir)
          task.nodeExecutableAndArgs.set(listOf("--verbose"))
          task.nodeWorkingDir.set(tempFolder.root.absolutePath)
        }

    task.setupCommandLine("example-test", "com.example.test")

    assertThat(task.commandLine)
        .containsExactly(
            "--verbose",
            File(reactNativeDir, "scripts/generate-specs-cli.js").toString(),
            "--platform",
            "android",
            "--schemaPath",
            File(outputDir, "schema.json").toString(),
            "--outputDir",
            outputDir.toString(),
            "--libraryName",
            "example-test",
            "--javaPackageName",
            "com.example.test",
        )
  }

  @Test
  @WithOs(OS.WIN)
  fun setupCommandLine_onWindows_willSetupCorrectly() {
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native/")
    val outputDir = tempFolder.newFolder("output")

    val project = createProject()
    val task =
        createTestTask<GenerateCodegenArtifactsTask>(project) { task ->
          task.reactNativeDir.set(reactNativeDir)
          task.generatedSrcDir.set(outputDir)
          task.nodeExecutableAndArgs.set(listOf("--verbose"))
          task.nodeWorkingDir.set(project.projectDir.absolutePath)
        }

    task.setupCommandLine("example-test", "com.example.test")

    assertThat(task.commandLine)
        .containsExactly(
            "cmd",
            "/c",
            "--verbose",
            File(reactNativeDir, "scripts/generate-specs-cli.js")
                .relativeTo(project.projectDir)
                .path,
            "--platform",
            "android",
            "--schemaPath",
            File(outputDir, "schema.json").relativeTo(project.projectDir).path,
            "--outputDir",
            outputDir.relativeTo(project.projectDir).path,
            "--libraryName",
            "example-test",
            "--javaPackageName",
            "com.example.test",
        )
  }

  @Test
  fun resolveTaskParameters_withConfigInPackageJson_usesIt() {
    val packageJsonFile =
        tempFolder.newFile("package.json").apply {
          // language=JSON
          writeText(
              """
              {
                  "name": "@a/library",
                  "codegenConfig": {
                      "name": "an-awesome-library",
                      "android": {
                        "javaPackageName": "com.awesome.package"
                      }
                  }
              }
              """
                  .trimIndent()
          )
        }

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.packageJsonFile.set(packageJsonFile)
          it.codegenJavaPackageName.set("com.example.ignored")
          it.libraryName.set("a-library-name-that-is-ignored")
        }

    val (libraryName, javaPackageName) = task.resolveTaskParameters()

    assertThat(libraryName).isEqualTo("an-awesome-library")
    assertThat(javaPackageName).isEqualTo("com.awesome.package")
  }

  @Test
  fun resolveTaskParameters_withConfigMissingInPackageJson_usesGradleOne() {
    val packageJsonFile =
        tempFolder.newFile("package.json").apply {
          // language=JSON
          writeText(
              """
              {
                  "name": "@a/library",
                  "codegenConfig": {
                  }
              }
              """
                  .trimIndent()
          )
        }

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.packageJsonFile.set(packageJsonFile)
          it.codegenJavaPackageName.set("com.example.test")
          it.libraryName.set("a-library-name-from-gradle")
        }

    val (libraryName, javaPackageName) = task.resolveTaskParameters()

    assertThat(libraryName).isEqualTo("a-library-name-from-gradle")
    assertThat(javaPackageName).isEqualTo("com.example.test")
  }

  @Test
  fun resolveTaskParameters_withMissingPackageJson_usesGradleOne() {
    val task =
        createTestTask<GenerateCodegenArtifactsTask> { task ->
          task.packageJsonFile.set(File(tempFolder.root, "package.json"))
          task.codegenJavaPackageName.set("com.example.test")
          task.libraryName.set("a-library-name-from-gradle")
        }

    val (libraryName, javaPackageName) = task.resolveTaskParameters()

    assertThat(libraryName).isEqualTo("a-library-name-from-gradle")
    assertThat(javaPackageName).isEqualTo("com.example.test")
  }
}
