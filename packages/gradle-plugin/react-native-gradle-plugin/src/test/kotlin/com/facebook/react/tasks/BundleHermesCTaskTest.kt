/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.tests.OS
import com.facebook.react.tests.OsRule
import com.facebook.react.tests.WithOs
import com.facebook.react.tests.createTestTask
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class BundleHermesCTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @get:Rule val osRule = OsRule()

  @Test
  fun bundleTask_groupIsSetCorrectly() {
    val task = createTestTask<BundleHermesCTask> {}
    assertThat(task.group).isEqualTo("react")
  }

  @Test
  fun bundleTask_inputFiles_areSetCorrectly() {
    val rootDir =
        tempFolder.newFolder("js").apply {
          File(this, "file.js").createNewFile()
          File(this, "file.jsx").createNewFile()
          File(this, "file.ts").createNewFile()
          File(this, "file.tsx").createNewFile()
        }

    val task = createTestTask<BundleHermesCTask> { it.root.set(rootDir) }

    assertThat(task.sources.files.size).isEqualTo(4)
    assertThat(task.sources.files)
        .containsExactlyInAnyOrder(
            File(rootDir, "file.js"),
            File(rootDir, "file.jsx"),
            File(rootDir, "file.ts"),
            File(rootDir, "file.tsx"),
        )
  }

  @Test
  fun bundleTask_inputFilesInExcludedPath_areExcluded() {
    fun File.createFileAndPath() {
      parentFile.mkdirs()
      createNewFile()
    }

    val rootDir =
        tempFolder.newFolder("js").apply {
          File(this, "afolder/includedfile.js").createFileAndPath()
          // Those files should be excluded due to their filepath
          File(this, "android/excludedfile.js").createFileAndPath()
          File(this, "ios/excludedfile.js").createFileAndPath()
          File(this, "build/excludedfile.js").createFileAndPath()
          File(this, "node_modules/react-native/excludedfile.js").createFileAndPath()
        }

    val task = createTestTask<BundleHermesCTask> { it.root.set(rootDir) }

    assertThat(task.sources.excludes)
        .containsExactlyInAnyOrder(
            "**/android/**/*",
            "**/ios/**/*",
            "**/build/**/*",
            "**/node_modules/**/*",
        )
    assertThat(task.sources.files.size).isEqualTo(1)
    assertThat(task.sources.files).containsExactly(File(rootDir, "afolder/includedfile.js"))
  }

  @Test
  fun bundleTask_staticInputs_areSetCorrectly() {
    val task =
        createTestTask<BundleHermesCTask> {
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
          it.bundleCommand.set("bundle")
          it.bundleAssetName.set("myassetname")
          it.minifyEnabled.set(true)
          it.hermesEnabled.set(true)
          it.devEnabled.set(true)
          it.resetMetroCacheBeforeBundling.set(true)
          it.extraPackagerArgs.set(listOf("extra", "arg"))
          it.hermesCommand.set("./my-hermesc")
          it.hermesFlags.set(listOf("flag1", "flag2"))
        }

    assertThat(task.nodeExecutableAndArgs.get()).isEqualTo(listOf("node", "arg1", "arg2"))
    assertThat(task.bundleCommand.get()).isEqualTo("bundle")
    assertThat(task.bundleAssetName.get()).isEqualTo("myassetname")
    assertThat(task.minifyEnabled.get()).isTrue()
    assertThat(task.hermesEnabled.get()).isTrue()
    assertThat(task.devEnabled.get()).isTrue()
    assertThat(task.resetMetroCacheBeforeBundling.get()).isTrue()
    assertThat(task.extraPackagerArgs.get()).isEqualTo(listOf("extra", "arg"))
    assertThat(task.hermesCommand.get()).isEqualTo("./my-hermesc")
    assertThat(task.hermesFlags.get()).isEqualTo(listOf("flag1", "flag2"))
  }

  @Test
  fun bundleTask_filesInput_areSetCorrectly() {
    val entryFile = tempFolder.newFile("entry.js")
    val cliFile = tempFolder.newFile("cli.js")
    val jsBundleDir = tempFolder.newFolder("jsbundle")
    val resourcesDir = tempFolder.newFolder("resources")
    val jsIntermediateSourceMapsDir = tempFolder.newFolder("jsIntermediateSourceMaps")
    val jsSourceMapsDir = tempFolder.newFolder("jsSourceMaps")
    val bundleConfig = tempFolder.newFile("bundle.config")
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native")

    val task =
        createTestTask<BundleHermesCTask> {
          it.entryFile.set(entryFile)
          it.cliFile.set(cliFile)
          it.jsBundleDir.set(jsBundleDir)
          it.resourcesDir.set(resourcesDir)
          it.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
          it.jsSourceMapsDir.set(jsSourceMapsDir)
          it.bundleConfig.set(bundleConfig)
          it.reactNativeDir.set(reactNativeDir)
        }

    assertThat(task.entryFile.get().asFile).isEqualTo(entryFile)
    assertThat(task.cliFile.get().asFile).isEqualTo(cliFile)
    assertThat(task.jsBundleDir.get().asFile).isEqualTo(jsBundleDir)
    assertThat(task.resourcesDir.get().asFile).isEqualTo(resourcesDir)
    assertThat(task.jsIntermediateSourceMapsDir.get().asFile).isEqualTo(jsIntermediateSourceMapsDir)
    assertThat(task.jsSourceMapsDir.get().asFile).isEqualTo(jsSourceMapsDir)
    assertThat(task.bundleConfig.get().asFile).isEqualTo(bundleConfig)
    assertThat(task.reactNativeDir.get().asFile).isEqualTo(reactNativeDir)
  }

  @Test
  fun resolvePackagerSourceMapFile_withHermesEnabled_returnsCorrectFile() {
    val jsIntermediateSourceMapsDir = tempFolder.newFolder("jsIntermediateSourceMaps")
    val bundleAssetName = "myassetname"
    val task =
        createTestTask<BundleHermesCTask> {
          it.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
          it.hermesEnabled.set(true)
          it.bundleAssetName.set(bundleAssetName)
        }

    assertThat(task.resolvePackagerSourceMapFile(bundleAssetName))
        .isEqualTo(File(jsIntermediateSourceMapsDir, "myassetname.packager.map"))
  }

  @Test
  fun resolvePackagerSourceMapFile_withHermesDisabled_returnsCorrectFile() {
    val jsSourceMapsDir = tempFolder.newFolder("jsSourceMaps")
    val bundleAssetName = "myassetname"
    val task =
        createTestTask<BundleHermesCTask> {
          it.jsSourceMapsDir.set(jsSourceMapsDir)
          it.hermesEnabled.set(false)
        }

    assertThat(task.resolvePackagerSourceMapFile(bundleAssetName))
        .isEqualTo(File(jsSourceMapsDir, "myassetname.map"))
  }

  @Test
  fun resolveOutputSourceMap_returnsCorrectFile() {
    val jsSourceMapsDir = tempFolder.newFolder("jsSourceMaps")
    val bundleAssetName = "myassetname"
    val task = createTestTask<BundleHermesCTask> { it.jsSourceMapsDir.set(jsSourceMapsDir) }

    assertThat(task.resolveOutputSourceMap(bundleAssetName))
        .isEqualTo(File(jsSourceMapsDir, "myassetname.map"))
  }

  @Test
  fun resolveCompilerSourceMap_returnsCorrectFile() {
    val jsIntermediateSourceMapsDir = tempFolder.newFolder("jsIntermediateSourceMaps")
    val bundleAssetName = "myassetname"
    val task =
        createTestTask<BundleHermesCTask> {
          it.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
        }

    assertThat(task.resolveCompilerSourceMap(bundleAssetName))
        .isEqualTo(File(jsIntermediateSourceMapsDir, "myassetname.compiler.map"))
  }

  @Test
  fun getBundleCommand_returnsCorrectCommand() {
    val entryFile = tempFolder.newFile("index.js")
    val cliFile = tempFolder.newFile("cli.js")
    val bundleFile = tempFolder.newFile("bundle.js")
    val sourceMapFile = tempFolder.newFile("bundle.js.map")
    val resourcesDir = tempFolder.newFolder("res")
    val bundleConfig = tempFolder.newFile("bundle.config")
    val task =
        createTestTask<BundleHermesCTask> {
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
          it.root.set(tempFolder.root)
          it.cliFile.set(cliFile)
          it.bundleCommand.set("bundle")
          it.devEnabled.set(true)
          it.entryFile.set(entryFile)
          it.resourcesDir.set(resourcesDir)
          it.bundleConfig.set(bundleConfig)
          it.minifyEnabled.set(true)
          it.resetMetroCacheBeforeBundling.set(true)
          it.extraPackagerArgs.set(listOf("--read-global-cache"))
        }

    val bundleCommand = task.getBundleCommand(bundleFile, sourceMapFile)

    assertThat(bundleCommand)
        .containsExactly(
            "node",
            "arg1",
            "arg2",
            cliFile.absolutePath,
            "bundle",
            "--platform",
            "android",
            "--dev",
            "true",
            "--reset-cache",
            "--entry-file",
            entryFile.absolutePath,
            "--bundle-output",
            bundleFile.absolutePath,
            "--assets-dest",
            resourcesDir.absolutePath,
            "--sourcemap-output",
            sourceMapFile.absolutePath,
            "--config",
            bundleConfig.absolutePath,
            "--minify",
            "true",
            "--read-global-cache",
            "--verbose",
        )
  }

  @Test
  @WithOs(OS.WIN)
  fun getBundleCommand_onWindows_returnsWinValidCommandsPaths() {
    val entryFile = tempFolder.newFile("index.js")
    val cliFile = tempFolder.newFile("cli.js")
    val bundleFile = tempFolder.newFile("bundle.js")
    val sourceMapFile = tempFolder.newFile("bundle.js.map")
    val resourcesDir = tempFolder.newFolder("res")
    val bundleConfig = tempFolder.newFile("bundle.config")
    val task =
        createTestTask<BundleHermesCTask> {
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
          it.root.set(tempFolder.root)
          it.cliFile.set(cliFile)
          it.bundleCommand.set("bundle")
          it.devEnabled.set(true)
          it.entryFile.set(entryFile)
          it.resourcesDir.set(resourcesDir)
          it.bundleConfig.set(bundleConfig)
          it.minifyEnabled.set(true)
          it.resetMetroCacheBeforeBundling.set(true)
          it.extraPackagerArgs.set(listOf("--read-global-cache"))
        }

    val bundleCommand = task.getBundleCommand(bundleFile, sourceMapFile)

    assertThat(bundleCommand)
        .containsExactly(
            "cmd",
            "/c",
            "node",
            "arg1",
            "arg2",
            cliFile.relativeTo(tempFolder.root).path,
            "bundle",
            "--platform",
            "android",
            "--dev",
            "true",
            "--reset-cache",
            "--entry-file",
            entryFile.relativeTo(tempFolder.root).path,
            "--bundle-output",
            bundleFile.relativeTo(tempFolder.root).path,
            "--assets-dest",
            resourcesDir.relativeTo(tempFolder.root).path,
            "--sourcemap-output",
            sourceMapFile.relativeTo(tempFolder.root).path,
            "--config",
            bundleConfig.relativeTo(tempFolder.root).path,
            "--minify",
            "true",
            "--read-global-cache",
            "--verbose",
        )
  }

  @Test
  fun getBundleCommand_withoutConfig_returnsCommandWithoutConfig() {
    val entryFile = tempFolder.newFile("index.js")
    val cliFile = tempFolder.newFile("cli.js")
    val bundleFile = tempFolder.newFile("bundle.js")
    val sourceMapFile = tempFolder.newFile("bundle.js.map")
    val resourcesDir = tempFolder.newFolder("res")
    val task =
        createTestTask<BundleHermesCTask> {
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
          it.root.set(tempFolder.root)
          it.cliFile.set(cliFile)
          it.bundleCommand.set("bundle")
          it.devEnabled.set(true)
          it.entryFile.set(entryFile)
          it.resourcesDir.set(resourcesDir)
          it.minifyEnabled.set(true)
          it.resetMetroCacheBeforeBundling.set(true)
          it.extraPackagerArgs.set(listOf("--read-global-cache"))
        }

    val bundleCommand = task.getBundleCommand(bundleFile, sourceMapFile)

    assertThat(bundleCommand).doesNotContain("--config")
  }

  @Test
  fun getBundleCommand_withResetMetroCacheBeforeBundlingDisabled_returnsCommandWithoutResetCache() {
    val entryFile = tempFolder.newFile("index.js")
    val cliFile = tempFolder.newFile("cli.js")
    val bundleFile = tempFolder.newFile("bundle.js")
    val sourceMapFile = tempFolder.newFile("bundle.js.map")
    val resourcesDir = tempFolder.newFolder("res")
    val task =
        createTestTask<BundleHermesCTask> {
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
          it.root.set(tempFolder.root)
          it.cliFile.set(cliFile)
          it.bundleCommand.set("bundle")
          it.devEnabled.set(true)
          it.entryFile.set(entryFile)
          it.resourcesDir.set(resourcesDir)
          it.minifyEnabled.set(true)
          it.resetMetroCacheBeforeBundling.set(false)
          it.extraPackagerArgs.set(listOf("--read-global-cache"))
        }

    val bundleCommand = task.getBundleCommand(bundleFile, sourceMapFile)

    assertThat(bundleCommand).doesNotContain("--reset-cache")
  }

  @Test
  fun getHermescCommand_returnsCorrectCommand() {
    val customHermesc = "hermesc"
    val bytecodeFile = tempFolder.newFile("bundle.js.hbc")
    val bundleFile = tempFolder.newFile("bundle.js")
    val task =
        createTestTask<BundleHermesCTask> {
          it.root.set(tempFolder.root)
          it.hermesFlags.set(listOf("my-custom-hermes-flag"))
        }

    val hermesCommand = task.getHermescCommand(customHermesc, bytecodeFile, bundleFile)

    assertThat(hermesCommand)
        .containsExactly(
            customHermesc,
            "-w",
            "-emit-binary",
            "-max-diagnostic-width=80",
            "-out",
            bytecodeFile.absolutePath,
            bundleFile.absolutePath,
            "my-custom-hermes-flag",
        )
  }

  @Test
  @WithOs(OS.WIN)
  fun getHermescCommand_onWindows_returnsRelativePaths() {
    val customHermesc = "hermesc"
    val bytecodeFile = tempFolder.newFile("bundle.js.hbc")
    val bundleFile = tempFolder.newFile("bundle.js")
    val task =
        createTestTask<BundleHermesCTask> {
          it.root.set(tempFolder.root)
          it.hermesFlags.set(listOf("my-custom-hermes-flag"))
        }

    val hermesCommand = task.getHermescCommand(customHermesc, bytecodeFile, bundleFile)

    assertThat(hermesCommand)
        .containsExactly(
            "cmd",
            "/c",
            customHermesc,
            "-w",
            "-emit-binary",
            "-max-diagnostic-width=80",
            "-out",
            bytecodeFile.relativeTo(tempFolder.root).path,
            bundleFile.relativeTo(tempFolder.root).path,
            "my-custom-hermes-flag",
        )
  }

  @Test
  fun getComposeSourceMapsCommand_returnsCorrectCommand() {
    val packagerMap = tempFolder.newFile("bundle.js.packager.map")
    val compilerMap = tempFolder.newFile("bundle.js.compiler.map")
    val outputMap = tempFolder.newFile("bundle.js.map")
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native")
    val composeSourceMapsFile = File(reactNativeDir, "scripts/compose-source-maps.js")
    val task =
        createTestTask<BundleHermesCTask> {
          it.root.set(tempFolder.root)
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
        }

    val composeSourcemapCommand =
        task.getComposeSourceMapsCommand(composeSourceMapsFile, packagerMap, compilerMap, outputMap)

    assertThat(composeSourcemapCommand)
        .containsExactly(
            "node",
            "arg1",
            "arg2",
            composeSourceMapsFile.absolutePath,
            packagerMap.absolutePath,
            compilerMap.absolutePath,
            "-o",
            outputMap.absolutePath,
        )
  }

  @Test
  @WithOs(OS.WIN)
  fun getComposeSourceMapsCommand_onWindows_returnsRelativePaths() {
    val packagerMap = tempFolder.newFile("bundle.js.packager.map")
    val compilerMap = tempFolder.newFile("bundle.js.compiler.map")
    val outputMap = tempFolder.newFile("bundle.js.map")
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native")
    val composeSourceMapsFile = File(reactNativeDir, "scripts/compose-source-maps.js")
    val task =
        createTestTask<BundleHermesCTask> {
          it.root.set(tempFolder.root)
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
        }

    val composeSourcemapCommand =
        task.getComposeSourceMapsCommand(composeSourceMapsFile, packagerMap, compilerMap, outputMap)

    assertThat(composeSourcemapCommand)
        .containsExactly(
            "cmd",
            "/c",
            "node",
            "arg1",
            "arg2",
            composeSourceMapsFile.relativeTo(tempFolder.root).path,
            packagerMap.relativeTo(tempFolder.root).path,
            compilerMap.relativeTo(tempFolder.root).path,
            "-o",
            outputMap.relativeTo(tempFolder.root).path,
        )
  }
}
