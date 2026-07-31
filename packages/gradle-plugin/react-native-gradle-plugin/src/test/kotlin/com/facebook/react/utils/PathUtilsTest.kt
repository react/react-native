/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.ReactExtension
import com.facebook.react.TestReactExtension
import com.facebook.react.tests.OS
import com.facebook.react.tests.OsRule
import com.facebook.react.tests.WithOs
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.gradle.process.ProcessExecutionException
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PathUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()
  @get:Rule val osRule = OsRule()

  @Test
  fun detectedEntryFile_withProvidedVariable() {
    val extension = TestReactExtension(ProjectBuilder.builder().build())
    val expected = tempFolder.newFile("fake.index.js")
    extension.entryFile.set(expected)

    val actual = detectedEntryFile(extension)

    assertThat(actual).isEqualTo(expected)
  }

  @Test
  fun detectedEntryFile_withAndroidEntryPoint() {
    val extension = TestReactExtension(ProjectBuilder.builder().build())
    extension.root.set(tempFolder.root)
    tempFolder.newFile("index.android.js")

    val actual = detectedEntryFile(extension)

    assertThat(actual).isEqualTo(File(tempFolder.root, "index.android.js"))
  }

  @Test
  fun detectedEntryFile_withDefaultEntryPoint() {
    val extension = TestReactExtension(ProjectBuilder.builder().build())
    extension.root.set(tempFolder.root)

    val actual = detectedEntryFile(extension)

    assertThat(actual).isEqualTo(File(tempFolder.root, "index.js"))
  }

  @Test
  fun detectedEntryFile_withEnvironmentVariable() {
    val extension = TestReactExtension(ProjectBuilder.builder().build())
    val expected = tempFolder.newFile("./fromenv.index.js")
    // As we can't override env variable for tests, we're going to emulate them here.
    val envVariable = "./fromenv.index.js"

    extension.root.set(tempFolder.root)

    val actual = detectedEntryFile(extension, envVariable)

    assertThat(actual).isEqualTo(expected)
  }

  @Test
  fun detectedCliPath_withCliPathFromExtensionAndFileExists_returnsIt() {
    val project = ProjectBuilder.builder().build()
    val cliFile = tempFolder.newFile("cli.js").apply { createNewFile() }
    val extension = TestReactExtension(project)
    extension.cliFile.set(cliFile)

    val actual = detectedCliFile(extension)

    assertThat(actual).isEqualTo(cliFile)
  }

  @Test
  fun detectedCliPath_withCliFromNodeModules() {
    val project = ProjectBuilder.builder().build()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "node_modules/react-native/cli.js").apply {
      parentFile.mkdirs()
      writeText("<!-- nothing to see here -->")
    }
    val locationToResolveFrom = File(tempFolder.root, "a-subdirectory").apply { mkdirs() }
    extension.root.set(locationToResolveFrom)

    val actual = detectedCliFile(extension)

    assertThat(actual.readText()).isEqualTo("<!-- nothing to see here -->")
  }

  @Test(expected = ProcessExecutionException::class)
  fun detectedCliPath_failsIfNotFound() {
    val project = ProjectBuilder.builder().build()
    val extension = TestReactExtension(project)

    // Because react-native is now a package, it is always
    // accessible from <root>/node_modules/react-native
    // We need to provide location where cli.js file won't be resolved
    extension.root.set(tempFolder.root)

    detectedCliFile(extension)
  }

  @Test
  fun projectPathToLibraryName_withSimplePath() {
    assertThat(projectPathToLibraryName(":sample")).isEqualTo("SampleSpec")
  }

  @Test
  fun projectPathToLibraryName_withComplexPath() {
    assertThat(projectPathToLibraryName(":sample:android:app")).isEqualTo("SampleAndroidAppSpec")
  }

  @Test
  fun projectPathToLibraryName_withKebabCase() {
    assertThat(projectPathToLibraryName("sample-android-app")).isEqualTo("SampleAndroidAppSpec")
  }

  @Test
  fun projectPathToLibraryName_withDotsAndUnderscores() {
    assertThat(projectPathToLibraryName("sample_android.app")).isEqualTo("SampleAndroidAppSpec")
  }

  @Test
  fun detectOSAwareHermesCommand_withProvidedCommand() {
    assertThat(detectOSAwareHermesCommand(tempFolder.root, "./my-home/hermes"))
        .isEqualTo("./my-home/hermes")
  }

  @Test
  fun detectOSAwareHermesCommand_withHermescBuiltLocally() {
    // As we can't mock env variables, we skip this test if an override of the Hermes
    // path has been provided.
    assumeTrue(System.getenv("REACT_NATIVE_OVERRIDE_HERMES_DIR") == null)

    tempFolder.newFolder("node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/")
    val expected =
        tempFolder.newFile(
            "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc"
        )

    assertThat(detectOSAwareHermesCommand(tempFolder.root, "")).isEqualTo(expected.toString())
  }

  @Test
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_withHermescFromNPM() {
    tempFolder.newFolder("node_modules/hermes-compiler/hermesc/osx-bin/")
    val expected = tempFolder.newFile("node_modules/hermes-compiler/hermesc/osx-bin/hermesc")

    assertThat(detectOSAwareHermesCommand(tempFolder.root, "")).isEqualTo(expected.toString())
  }

  @Test
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_withHoistedHermescFromNPM() {
    val projectRoot = tempFolder.newFolder("apps", "mobile")
    val reactNativeDir = tempFolder.newFolder("node_modules", "react-native")
    tempFolder.newFolder("node_modules/hermes-compiler/hermesc/osx-bin/")
    val expected = tempFolder.newFile("node_modules/hermes-compiler/hermesc/osx-bin/hermesc")

    assertThat(detectOSAwareHermesCommand(projectRoot, "", reactNativeDir))
        .isEqualTo(expected.toString())
  }

  @Test
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_withLocalAndHoistedHermescFromNPM_prefersLocal() {
    val projectRoot = tempFolder.newFolder("apps", "mobile")
    val reactNativeDir = tempFolder.newFolder("node_modules", "react-native")
    File(projectRoot, "node_modules/hermes-compiler/hermesc/osx-bin/").mkdirs()
    val expected = File(projectRoot, "node_modules/hermes-compiler/hermesc/osx-bin/hermesc")
    expected.createNewFile()
    tempFolder.newFolder("node_modules/hermes-compiler/hermesc/osx-bin/")
    tempFolder.newFile("node_modules/hermes-compiler/hermesc/osx-bin/hermesc")

    assertThat(detectOSAwareHermesCommand(projectRoot, "", reactNativeDir))
        .isEqualTo(expected.toString())
  }

  @Test
  fun detectedHermesCommand_usesConfiguredReactNativeDirForHoistedHermescFromNPM() {
    val project = ProjectBuilder.builder().build()
    val extension = TestReactExtension(project)
    val projectRoot = tempFolder.newFolder("apps", "mobile")
    val reactNativeDir = tempFolder.newFolder("node_modules", "react-native")
    extension.root.set(projectRoot)
    extension.reactNativeDir.set(reactNativeDir)
    tempFolder.newFolder("node_modules/hermes-compiler/hermesc/${getHermesOSBin()}/")
    val expected = tempFolder.newFile("node_modules/hermes-compiler/hermesc/${getHermesOSBin()}/hermesc")

    assertThat(detectedHermesCommand(extension)).isEqualTo(expected.toString())
  }

  @Test(expected = IllegalStateException::class)
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_failsIfNotFound() {
    detectOSAwareHermesCommand(tempFolder.root, "")
  }

  @Test
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_whenHermescNotFound_reportsCheckedLocations() {
    val projectRoot = tempFolder.newFolder("apps", "mobile")
    val reactNativeDir = tempFolder.newFolder("node_modules", "react-native")

    assertThatThrownBy { detectOSAwareHermesCommand(projectRoot, "", reactNativeDir) }
        .isInstanceOf(IllegalStateException::class.java)
        .hasMessageContaining("Couldn't determine Hermesc location.")
        .hasMessageContaining("Checked:")
        .hasMessageContaining("node_modules/hermes-compiler/hermesc/osx-bin/hermesc")
        .hasMessageContaining("configured `reactNativeDir`")
        .hasMessageNotContaining("node_modules/react-native/sdks/hermesc")
  }

  @Test
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_withProvidedCommand_takesPrecedence() {
    tempFolder.newFolder("node_modules/react-native/sdks/hermes/build/bin/")
    tempFolder.newFile("node_modules/react-native/sdks/hermes/build/bin/hermesc")
    tempFolder.newFolder("node_modules/react-native/sdks/hermesc/osx-bin/")
    tempFolder.newFile("node_modules/react-native/sdks/hermesc/osx-bin/hermesc")

    assertThat(detectOSAwareHermesCommand(tempFolder.root, "./my-home/hermes"))
        .isEqualTo("./my-home/hermes")
  }

  @Test
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_withoutProvidedCommand_builtHermescTakesPrecedence() {
    // As we can't mock env variables, we skip this test if an override of the Hermes
    // path has been provided.
    assumeTrue(System.getenv("REACT_NATIVE_OVERRIDE_HERMES_DIR") == null)

    tempFolder.newFolder("node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/")
    val expected =
        tempFolder.newFile(
            "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc"
        )
    tempFolder.newFolder("node_modules/react-native/sdks/hermesc/osx-bin/")
    tempFolder.newFile("node_modules/react-native/sdks/hermesc/osx-bin/hermesc")

    assertThat(detectOSAwareHermesCommand(tempFolder.root, "")).isEqualTo(expected.toString())
  }

  @Test
  fun getBuiltHermescFile_withoutOverride() {
    assertThat(getBuiltHermescFile(tempFolder.root, ""))
        .isEqualTo(
            File(
                tempFolder.root,
                "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc",
            )
        )
  }

  @Test
  @WithOs(OS.WIN)
  fun getBuiltHermescFile_onWindows_withoutOverride() {
    assertThat(getBuiltHermescFile(tempFolder.root, ""))
        .isEqualTo(
            File(
                tempFolder.root,
                "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc.exe",
            )
        )
  }

  @Test
  fun getBuiltHermescFile_withOverride() {
    assertThat(getBuiltHermescFile(tempFolder.root, "/home/ci/hermes"))
        .isEqualTo(File("/home/ci/hermes/build/bin/hermesc"))
  }

  @Test
  @WithOs(OS.WIN)
  fun getHermesCBin_onWindows_returnsHermescExe() {
    assertThat(getHermesCBin()).isEqualTo("hermesc.exe")
  }

  @Test
  @WithOs(OS.LINUX)
  fun getHermesCBin_onLinux_returnsHermesc() {
    assertThat(getHermesCBin()).isEqualTo("hermesc")
  }

  @Test
  @WithOs(OS.MAC)
  fun getHermesCBin_onMac_returnsHermesc() {
    assertThat(getHermesCBin()).isEqualTo("hermesc")
  }

  @Test
  fun findPackageJsonFile_withFileInParentFolder_picksItUp() {
    tempFolder.newFile("package.json")
    val moduleFolder = tempFolder.newFolder("awesome-module")

    val project = ProjectBuilder.builder().withProjectDir(moduleFolder).build()
    project.plugins.apply("com.android.library")
    project.plugins.apply("com.facebook.react")
    val extension = project.extensions.getByType(ReactExtension::class.java)

    assertThat(findPackageJsonFile(project, extension.root))
        .isEqualTo(project.file("../package.json"))
  }

  @Test
  fun findPackageJsonFile_withFileConfiguredInExtension_picksItUp() {
    val moduleFolder = tempFolder.newFolder("awesome-module")
    val localFile = File(moduleFolder, "package.json").apply { writeText("{}") }

    val project = ProjectBuilder.builder().withProjectDir(moduleFolder).build()
    project.plugins.apply("com.android.library")
    project.plugins.apply("com.facebook.react")
    val extension =
        project.extensions.getByType(ReactExtension::class.java).apply { root.set(moduleFolder) }

    assertThat(findPackageJsonFile(project, extension.root)).isEqualTo(localFile)
  }

  @Test
  fun readPackageJsonFile_withMissingFile_returnsNull() {
    val moduleFolder = tempFolder.newFolder("awesome-module")
    val project = ProjectBuilder.builder().withProjectDir(moduleFolder).build()
    project.plugins.apply("com.android.library")
    project.plugins.apply("com.facebook.react")
    val extension =
        project.extensions.getByType(ReactExtension::class.java).apply { root.set(moduleFolder) }

    val actual = readPackageJsonFile(project, extension.root)

    assertThat(actual).isNull()
  }

  @Test
  fun readPackageJsonFile_withFileConfiguredInExtension_andMissingCodegenConfig_returnsNullCodegenConfig() {
    val moduleFolder = tempFolder.newFolder("awesome-module")
    File(moduleFolder, "package.json").apply { writeText("{}") }
    val project = ProjectBuilder.builder().withProjectDir(moduleFolder).build()
    project.plugins.apply("com.android.library")
    project.plugins.apply("com.facebook.react")
    val extension =
        project.extensions.getByType(ReactExtension::class.java).apply { root.set(moduleFolder) }

    val actual = readPackageJsonFile(project, extension.root)

    assertThat(actual).isNotNull()
    assertThat(actual!!.codegenConfig).isNull()
  }

  @Test
  fun readPackageJsonFile_withFileConfiguredInExtension_andHavingCodegenConfig_returnsValidCodegenConfig() {
    val moduleFolder = tempFolder.newFolder("awesome-module")
    File(moduleFolder, "package.json").apply {
      writeText(
          // language=json
          """
          {
            "name": "a-library",
            "codegenConfig": {}
          }
          """
              .trimIndent()
      )
    }
    val project = ProjectBuilder.builder().withProjectDir(moduleFolder).build()
    project.plugins.apply("com.android.library")
    project.plugins.apply("com.facebook.react")
    val extension =
        project.extensions.getByType(ReactExtension::class.java).apply { root.set(moduleFolder) }

    val actual = readPackageJsonFile(project, extension.root)

    assertThat(actual).isNotNull()
    assertThat(actual!!.codegenConfig).isNotNull()
  }
}
