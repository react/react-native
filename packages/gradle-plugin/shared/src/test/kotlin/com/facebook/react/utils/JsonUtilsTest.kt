/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import org.assertj.core.api.Assertions.assertThat
import org.intellij.lang.annotations.Language
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class JsonUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun fromPackageJson_withInvalidJson_returnsNull() {
    val invalidJson = createJsonFile("""¯\_(ツ)_/¯""")

    assertThat(JsonUtils.fromPackageJson(invalidJson)).isNull()
  }

  @Test
  fun fromPackageJson_withEmptyJson_returnsEmptyObject() {
    val invalidJson = createJsonFile("""{}""")

    val parsed = JsonUtils.fromPackageJson(invalidJson)

    assertThat(parsed).isNotNull()
    assertThat(parsed?.codegenConfig).isNull()
  }

  @Test
  fun fromPackageJson_withOldJsonConfig_returnsAnEmptyLibrary() {
    val oldJsonConfig = createJsonFile(
        """
        {
          "name": "yet another npm package",
          "codegenConfig": {
            "libraries": [
              {
                "name": "an awesome library",
                "jsSrcsDir": "../js/",
                "android": {}
              }
            ]
          }
        }
        """
            .trimIndent(),
    )

    val parsed = JsonUtils.fromPackageJson(oldJsonConfig)!!

    assertThat(parsed.codegenConfig?.name).isNull()
    assertThat(parsed.codegenConfig?.jsSrcsDir).isNull()
    assertThat(parsed.codegenConfig?.android).isNull()
  }

  @Test
  fun fromPackageJson_withValidJson_parsesCorrectly() {
    val validJson = createJsonFile(
        """
        {
          "name": "yet another npm package",
          "codegenConfig": {
            "name": "an awesome library",
            "jsSrcsDir": "../js/",
            "android": {
              "javaPackageName": "com.awesome.library"
            },
            "ios": {
              "other ios only keys": "which are ignored during parsing"
            }
          }
        }
        """
            .trimIndent(),
    )

    val parsed = JsonUtils.fromPackageJson(validJson)!!

    assertThat("an awesome library").isEqualTo(parsed.codegenConfig!!.name)
    assertThat("../js/").isEqualTo(parsed.codegenConfig!!.jsSrcsDir)
    assertThat("com.awesome.library").isEqualTo(parsed.codegenConfig!!.android!!.javaPackageName)
  }

  @Test
  fun fromReactNativePackageJson_withInvalidJson_returnsNull() {
    val invalidJson = createJsonFile("""¯\_(ツ)_/¯""")

    assertThat(JsonUtils.fromPackageJson(invalidJson)).isNull()
  }

  @Test
  fun fromReactNativePackageJson_withEmptyJson_returnsEmptyObject() {
    val invalidJson = createJsonFile("""{}""")

    val parsed = JsonUtils.fromPackageJson(invalidJson)

    assertThat(parsed).isNotNull()
    assertThat(parsed?.version).isNull()
  }

  @Test
  fun fromReactNativePackageJson_withValidJson_parsesJsonCorrectly() {
    val validJson = createJsonFile(
        """
        {
          "version": "1000.0.0"
        }
        """
            .trimIndent(),
    )
    val parsed = JsonUtils.fromPackageJson(validJson)!!

    assertThat("1000.0.0").isEqualTo(parsed.version)
  }

  @Test
  fun fromAutolinkingConfigJson_withInvalidJson_returnsNull() {
    val invalidJson = createJsonFile("""¯\_(ツ)_/¯""")

    assertThat(JsonUtils.fromAutolinkingConfigJson(invalidJson)).isNull()
  }

  @Test
  fun fromAutolinkingConfigJson_withSimpleJson_returnsIt() {
    val validJson = createJsonFile(
        """
        {
          "reactNativeVersion": "1000.0.0"
        }
        """
            .trimIndent(),
    )
    val parsed = JsonUtils.fromAutolinkingConfigJson(validJson)!!

    assertThat("1000.0.0").isEqualTo(parsed.reactNativeVersion)
  }

  @Test
  fun fromAutolinkingConfigJson_withProjectSpecified_canParseIt() {
    val validJson = createJsonFile(
        """
        {
          "reactNativeVersion": "1000.0.0",
          "project": {
            "ios": {
              "sourceDir": "./packages/rn-tester",
              "xcodeProject": {
                "name": "RNTesterPods.xcworkspace",
                "isWorkspace": true
              },
              "automaticPodsInstallation": false
            },
            "android": {
              "sourceDir": "./packages/rn-tester",
              "appName": "RN-Tester",
              "packageName": "com.facebook.react.uiapp",
              "applicationId": "com.facebook.react.uiapp",
              "mainActivity": ".RNTesterActivity",
              "watchModeCommandParams": [
                "--mode HermesDebug"
              ],
              "dependencyConfiguration": "implementation"
            }
          }
        }
        """
            .trimIndent(),
    )
    val parsed = JsonUtils.fromAutolinkingConfigJson(validJson)!!

    assertThat("./packages/rn-tester").isEqualTo(parsed.project!!.android!!.sourceDir)
    assertThat("RN-Tester").isEqualTo(parsed.project!!.android!!.appName)
    assertThat("com.facebook.react.uiapp").isEqualTo(parsed.project!!.android!!.packageName)
    assertThat("com.facebook.react.uiapp").isEqualTo(parsed.project!!.android!!.applicationId)
    assertThat(".RNTesterActivity").isEqualTo(parsed.project!!.android!!.mainActivity)
    assertThat("--mode HermesDebug")
        .isEqualTo(parsed.project!!.android!!.watchModeCommandParams!![0])
    assertThat("implementation").isEqualTo(parsed.project!!.android!!.dependencyConfiguration)
  }

  @Test
  fun fromAutolinkingConfigJson_withInfoLogs_sanitizeAndParseIt() {
    @Suppress("JsonStandardCompliance")
    val validJson = createJsonFile(
        """

        > AwesomeProject@0.0.1 npx
        > rnc-cli config

         {
          "reactNativeVersion": "1000.0.0",
          "project": {
            "ios": {
              "sourceDir": "./packages/rn-tester",
              "xcodeProject": {
                "name": "RNTesterPods.xcworkspace",
                "isWorkspace": true
              },
              "automaticPodsInstallation": false
            },
            "android": {
              "sourceDir": "./packages/rn-tester",
              "appName": "RN-Tester",
              "packageName": "com.facebook.react.uiapp",
              "applicationId": "com.facebook.react.uiapp",
              "mainActivity": ".RNTesterActivity",
              "watchModeCommandParams": [
                "--mode HermesDebug"
              ],
              "dependencyConfiguration": "implementation"
            }
          }
        } 
        """
            .trimIndent(),
    )
    val parsed = JsonUtils.fromAutolinkingConfigJson(validJson)!!

    assertThat("./packages/rn-tester").isEqualTo(parsed.project!!.android!!.sourceDir)
    assertThat("RN-Tester").isEqualTo(parsed.project!!.android!!.appName)
    assertThat("com.facebook.react.uiapp").isEqualTo(parsed.project!!.android!!.packageName)
    assertThat("com.facebook.react.uiapp").isEqualTo(parsed.project!!.android!!.applicationId)
    assertThat(".RNTesterActivity").isEqualTo(parsed.project!!.android!!.mainActivity)
    assertThat("--mode HermesDebug")
        .isEqualTo(parsed.project!!.android!!.watchModeCommandParams!![0])
    assertThat("implementation").isEqualTo(parsed.project!!.android!!.dependencyConfiguration)
  }

  @Test
  fun fromAutolinkingConfigJson_withDependenciesSpecified_canParseIt() {
    val validJson = createJsonFile(
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
    val parsed = JsonUtils.fromAutolinkingConfigJson(validJson)!!

    assertThat("./node_modules/@react-native/oss-library-example")
        .isEqualTo(parsed.dependencies!!["@react-native/oss-library-example"]!!.root)
    assertThat("@react-native/oss-library-example")
        .isEqualTo(parsed.dependencies!!["@react-native/oss-library-example"]!!.name)
    assertThat("react-native_oss-library-example")
        .isEqualTo(parsed.dependencies!!["@react-native/oss-library-example"]!!.nameCleansed)
    assertThat("./node_modules/@react-native/oss-library-example/android")
        .isEqualTo(
            parsed.dependencies!!["@react-native/oss-library-example"]!!
                .platforms!!
                .android!!
                .sourceDir,
        )
    assertThat("import com.facebook.react.osslibraryexample.OSSLibraryExamplePackage;")
        .isEqualTo(
            parsed.dependencies!!["@react-native/oss-library-example"]!!
                .platforms!!
                .android!!
                .packageImportPath,
        )
    assertThat("new OSSLibraryExamplePackage()")
        .isEqualTo(
            parsed.dependencies!!["@react-native/oss-library-example"]!!
                .platforms!!
                .android!!
                .packageInstance,
        )
    assertThat(listOf("staging", "debug", "release"))
        .isEqualTo(
            parsed.dependencies!!["@react-native/oss-library-example"]!!
                .platforms!!
                .android!!
                .buildTypes,
        )
    assertThat("OSSLibraryExampleSpec")
        .isEqualTo(
            parsed.dependencies!!["@react-native/oss-library-example"]!!
                .platforms!!
                .android!!
                .libraryName,
        )
    assertThat(listOf("SampleNativeComponentComponentDescriptor"))
        .isEqualTo(
            parsed.dependencies!!["@react-native/oss-library-example"]!!
                .platforms!!
                .android!!
                .componentDescriptors,
        )
    assertThat(
        "./node_modules/@react-native/oss-library-example/android/build/generated/source/codegen/jni/CMakeLists.txt",
    )
        .isEqualTo(
            parsed.dependencies!!["@react-native/oss-library-example"]!!
                .platforms!!
                .android!!
                .cmakeListsPath,
        )
    assertThat(
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .cxxModuleHeaderName,
    )
        .isNull()
    assertThat(
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .cxxModuleCMakeListsPath,
    )
        .isNull()
    assertThat(
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .cxxModuleCMakeListsModuleName,
    )
        .isNull()
    assertThat("implementation")
        .isEqualTo(
            parsed.dependencies!!["@react-native/oss-library-example"]!!
                .platforms!!
                .android!!
                .dependencyConfiguration,
        )
    assertThat(
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .isPureCxxDependency!!,
    )
        .isFalse()
  }

  private fun createJsonFile(@Language("JSON") input: String) =
      tempFolder.newFile().apply { writeText(input) }
}
