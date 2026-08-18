/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.ReactSettingsExtension.Companion.checkAndUpdateCache
import com.facebook.react.ReactSettingsExtension.Companion.checkAndUpdateLockfiles
import com.facebook.react.ReactSettingsExtension.Companion.computeSha256
import com.facebook.react.ReactSettingsExtension.Companion.getLibrariesToAutolink
import com.facebook.react.ReactSettingsExtension.GenerateConfig
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.gradle.testfixtures.ProjectBuilder
import org.intellij.lang.annotations.Language
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ReactSettingsExtensionTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun computeSha256_worksCorrectly() {
    val validFile = createJsonFile(
        """
        {
          "value": "¯\\_(ツ)_/¯"
        }
        """
            .trimIndent(),
    )
    assertThat(computeSha256(validFile))
        .isEqualTo("838aa9a72a16fdd55b0d49b510a82e264a30f59333b5fdd97c7798a29146f6a8")
  }

  @Test
  fun getLibrariesToAutolink_withEmptyFile_returnsEmptyMap() {
    val validJsonFile = createJsonFile(
        """
        {
          "reactNativeVersion": "1000.0.0"
        }
        """
            .trimIndent(),
    )

    val map = getLibrariesToAutolink(validJsonFile)
    assertThat(map.keys).isEmpty()
  }

  @Test
  fun getLibrariesToAutolink_withLibraryToAutolink_returnsValidMap() {
    val validJsonFile = createJsonFile(
        """
        {
          "reactNativeVersion": "1000.0.0",
          "dependencies": {
            "@react-native/oss-library-example": {
              "root": "./node_modules/@react-native/oss-library-example",
              "name": "@react-native/oss-library-example",
              "platforms": {
                "ios": {
                  "podspecPath": "./node_modules/@react-native/oss-library-example/OSSLibraryExample.podspec",
                  "version": "0.0.1",
                  "configurations": [],
                  "scriptPhases": []
                },
                "android": {
                  "sourceDir": "./node_modules/@react-native/oss-library-example/android",
                  "packageImportPath": "import com.facebook.react.osslibraryexample.OSSLibraryExamplePackage;",
                  "packageInstance": "new OSSLibraryExamplePackage()",
                  "buildTypes": ["staging", "debug", "release"],
                  "libraryName": "OSSLibraryExampleSpec",
                  "componentDescriptors": [
                    "SampleNativeComponentComponentDescriptor"
                  ],
                  "cmakeListsPath": "./node_modules/@react-native/oss-library-example/android/build/generated/source/codegen/jni/CMakeLists.txt",
                  "cxxModuleCMakeListsModuleName": null,
                  "cxxModuleCMakeListsPath": null,
                  "cxxModuleHeaderName": null,
                  "dependencyConfiguration": "implementation",
                  "isPureCxxDependency": false
                }
              }
            }
          }
        }
        """
            .trimIndent(),
    )

    val map = getLibrariesToAutolink(validJsonFile)
    assertThat(map.keys).containsExactly(":react-native_oss-library-example")
    assertThat(map[":react-native_oss-library-example"])
        .isEqualTo(File("./node_modules/@react-native/oss-library-example/android"))
  }

  @Test
  fun getLibrariesToAutolink_withiOSOnlyLibrary_returnsEmptyMap() {
    val validJsonFile = createJsonFile(
        """
        {
          "reactNativeVersion": "1000.0.0",
          "dependencies": {
            "@react-native/oss-library-example": {
              "root": "./node_modules/@react-native/oss-library-example",
              "name": "@react-native/oss-library-example",
              "platforms": {
                "ios": {
                  "podspecPath": "./node_modules/@react-native/oss-library-example/OSSLibraryExample.podspec",
                  "version": "0.0.1",
                  "configurations": [],
                  "scriptPhases": []
                }
              }
            }
          }
        }
        """
            .trimIndent(),
    )

    val map = getLibrariesToAutolink(validJsonFile)
    assertThat(map.keys).isEmpty()
  }

  @Test
  fun checkAndUpdateLockfiles_withNothingToCheck_returnsFalse() {
    val project = ProjectBuilder.builder().build()
    val noFiles = project.files()
    assertThat(checkAndUpdateLockfiles(noFiles, tempFolder.root)).isFalse()
  }

  @Test
  fun checkAndUpdateLockfiles_withOneLockfileNoHash_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder = tempFolder.newFolder("build")
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfileCollection = project.files("yarn.lock")

    assertThat(checkAndUpdateLockfiles(lockfileCollection, buildFolder)).isTrue()
    assertThat(File(buildFolder, "yarn.lock.sha").exists()).isTrue()
    assertThat(File(buildFolder, "yarn.lock.sha").readText())
        .isEqualTo("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
  }

  @Test
  fun checkAndUpdateLockfiles_withOneLockfileInvalidHash_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha").writeText("Just a stale hash")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfileCollection = project.files("yarn.lock")

    assertThat(checkAndUpdateLockfiles(lockfileCollection, buildFolder)).isTrue()
    assertThat(File(buildFolder, "yarn.lock.sha").exists()).isTrue()
    assertThat(File(buildFolder, "yarn.lock.sha").readText())
        .isEqualTo("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
  }

  @Test
  fun checkAndUpdateLockfiles_withOneLockfileValidHash_returnsFalse() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha")
              .writeText("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfileCollection = project.files("yarn.lock")

    assertThat(checkAndUpdateLockfiles(lockfileCollection, buildFolder)).isFalse()
    assertThat(File(buildFolder, "yarn.lock.sha").exists()).isTrue()
    assertThat(File(buildFolder, "yarn.lock.sha").readText())
        .isEqualTo("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
  }

  @Test
  fun checkAndUpdateLockfiles_withMultipleLockfilesInvalidHash_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha").writeText("I'm an invalid hash")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    tempFolder.newFile("package-lock.json").apply { writeText("and I'm another lockfile") }
    val lockfileCollection = project.files("yarn.lock", "package-lock.json")

    assertThat(checkAndUpdateLockfiles(lockfileCollection, buildFolder)).isTrue()
    assertThat(File(buildFolder, "yarn.lock.sha").exists()).isTrue()
    assertThat(File(buildFolder, "package-lock.json.sha").exists()).isTrue()
    assertThat(File(buildFolder, "yarn.lock.sha").readText())
        .isEqualTo("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
    assertThat(File(buildFolder, "package-lock.json.sha").readText())
        .isEqualTo("9be5bca432b81becf4f54451aea021add68376330581eaa93ab9a0b3e4e29a3b")
  }

  @Test
  fun checkAndUpdateLockfiles_withMultipleLockfilesValidHash_returnsFalse() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha")
              .writeText("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
          File(this, "package-lock.json.sha")
              .writeText("9be5bca432b81becf4f54451aea021add68376330581eaa93ab9a0b3e4e29a3b")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    tempFolder.newFile("package-lock.json").apply { writeText("and I'm another lockfile") }
    val lockfileCollection = project.files("yarn.lock", "package-lock.json")

    assertThat(checkAndUpdateLockfiles(lockfileCollection, buildFolder)).isFalse()
    assertThat(File(buildFolder, "yarn.lock.sha").exists()).isTrue()
    assertThat(File(buildFolder, "package-lock.json.sha").exists()).isTrue()
    assertThat(File(buildFolder, "yarn.lock.sha").readText())
        .isEqualTo("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
    assertThat(File(buildFolder, "package-lock.json.sha").readText())
        .isEqualTo("9be5bca432b81becf4f54451aea021add68376330581eaa93ab9a0b3e4e29a3b")
  }

  @Test
  fun skipUpdateIfConfigInCacheIsValid() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder = tempFolder.newFolder("build")
    val generatedFolder = tempFolder.newFolder("build", "generated")
    val outputFile =
        File(generatedFolder, "autolinking.json").apply {
          writeText(
              """
              {
                "root": "/",
                "reactNativePath": "/node_modules/react-native",
                "reactNativeVersion": "0.75",
                "dependencies": {},
                "healthChecks": [],
                "platforms": {
                  "ios": {},
                  "android": {}
                },
                "assets": [],
                "project": {
                  "ios": {},
                  "android": {
                    "sourceDir": "/",
                    "appName": "app",
                    "packageName": "com.TestApp",
                    "applicationId": "com.TestApp",
                    "mainActivity": ".MainActivity",
                    "assets": []
                  }
                }
              }
              """
                  .trimIndent(),
          )
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfileCollection = project.files("yarn.lock")

    // Prebuild the shas with the invalid empty autolinking.json
    checkAndUpdateLockfiles(lockfileCollection, buildFolder)

    val monitoredUpdateConfig = createMonitoredUpdateConfig()

    checkAndUpdateCache(monitoredUpdateConfig, outputFile, buildFolder, lockfileCollection)

    // The autolinking.json file is valid, SHA's are untouched therefore config should NOT be
    // refreshed
    assertThat(monitoredUpdateConfig.run).isFalse()
  }

  @Test
  fun checkAndUpdateConfigIfEmpty() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder = tempFolder.newFolder("build")
    val generatedFolder = tempFolder.newFolder("build", "generated")
    val outputFile = File(generatedFolder, "autolinking.json").apply { writeText("") }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfileCollection = project.files("yarn.lock")

    // Prebuild the shas with the invalid empty autolinking.json
    checkAndUpdateLockfiles(lockfileCollection, buildFolder)

    val monitoredUpdateConfig = createMonitoredUpdateConfig()

    checkAndUpdateCache(monitoredUpdateConfig, outputFile, buildFolder, lockfileCollection)

    // The autolinking.json file is invalid and should be refreshed
    assertThat(monitoredUpdateConfig.run).isTrue()
  }

  @Test
  fun checkAndUpdateConfigIfCachedConfigInvalid() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder = tempFolder.newFolder("build")
    val generatedFolder = tempFolder.newFolder("build", "generated")
    val outputFile =
        File(generatedFolder, "autolinking.json").apply {
          writeText(
              """
              {
                "project": {
                  "ios": {},
                  "android": {}
                }
              }
              """
                  .trimIndent(),
          )
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfileCollection = project.files("yarn.lock")

    // Prebuild the shas with the invalid empty autolinking.json
    checkAndUpdateLockfiles(lockfileCollection, buildFolder)

    val monitoredUpdateConfig = createMonitoredUpdateConfig()

    checkAndUpdateCache(monitoredUpdateConfig, outputFile, buildFolder, lockfileCollection)

    // The autolinking.json file is invalid and should be refreshed
    assertThat(monitoredUpdateConfig.run).isTrue()
  }

  @Test
  fun isCacheDirty_withMissingAutolinkingFile_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha")
              .writeText("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfiles = project.files("yarn.lock")
    val emptyConfigFile = File(tempFolder.newFolder("build", "autolinking"), "autolinking.json")

    assertThat(ReactSettingsExtension.isCacheDirty(emptyConfigFile, buildFolder, lockfiles))
        .isTrue()
  }

  @Test
  fun isCacheDirty_withInvalidAutolinkingFile_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha")
              .writeText("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfiles = project.files("yarn.lock")
    val invalidConfigFile = createJsonFile(
        """
        {}
        """
            .trimIndent(),
    )

    assertThat(ReactSettingsExtension.isCacheDirty(invalidConfigFile, buildFolder, lockfiles))
        .isTrue()
  }

  @Test
  fun isCacheDirty_withMissingDependenciesInJson_returnsFalse() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha")
              .writeText("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfiles = project.files("yarn.lock")
    val invalidConfigFile = createJsonFile(
        """
        {
          "reactNativeVersion": "1000.0.0"
        }
        """
            .trimIndent(),
    )

    assertThat(ReactSettingsExtension.isCacheDirty(invalidConfigFile, buildFolder, lockfiles))
        .isTrue()
  }

  @Test
  fun isCacheDirty_withExistingEmptyDependenciesInJson_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha")
              .writeText("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfiles = project.files("yarn.lock")
    val invalidConfigFile = createJsonFile(
        """
        {
          "reactNativeVersion": "1000.0.0",
          "dependencies": {}
        }
        """
            .trimIndent(),
    )

    assertThat(ReactSettingsExtension.isCacheDirty(invalidConfigFile, buildFolder, lockfiles))
        .isTrue()
  }

  @Test
  fun isCacheDirty_withExistingDependenciesInJson_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha")
              .writeText("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfiles = project.files("yarn.lock")
    val invalidConfigFile = createJsonFile(
        """
        {
          "reactNativeVersion": "1000.0.0",
          "dependencies": {
            "@react-native/oss-library-example": {
              "root": "./node_modules/@react-native/oss-library-example",
              "name": "@react-native/oss-library-example",
              "platforms": {
                "ios": {
                  "podspecPath": "./node_modules/@react-native/oss-library-example/OSSLibraryExample.podspec",
                  "version": "0.0.1",
                  "configurations": [],
                  "scriptPhases": []
                }
              }
            }
          }
        }
        """
            .trimIndent(),
    )

    assertThat(ReactSettingsExtension.isCacheDirty(invalidConfigFile, buildFolder, lockfiles))
        .isTrue()
  }

  private fun createJsonFile(@Language("JSON") input: String) =
      tempFolder.newFile().apply { writeText(input) }

  private fun createMonitoredUpdateConfig() =
      object : GenerateConfig {
        var run = false

        override fun execute(): Int {
          run = true
          return 0
        }

        override fun command(): List<String> = listOf("true")
      }
}
