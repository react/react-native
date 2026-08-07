/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.ReactExtension.Companion.getGradleDependenciesToApply
import org.assertj.core.api.Assertions.assertThat
import org.intellij.lang.annotations.Language
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ReactExtensionTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun getGradleDependenciesToApply_withEmptyFile_returnsEmptyMap() {
    val validJsonFile =
        createJsonFile(
            """
            {
              "reactNativeVersion": "1000.0.0"
            }
            """
                .trimIndent()
        )

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertThat(deps).isEmpty()
  }

  @Test
  fun getGradleDependenciesToApply_withOneDependency_returnsValidDep() {
    val validJsonFile =
        createJsonFile(
            """
            {
              "reactNativeVersion": "1000.0.0",
              "dependencies": {
                "@react-native/oss-library-example": {
                  "root": "./node_modules/@react-native/oss-library-example",
                  "name": "@react-native/oss-library-example",
                  "platforms": {
                    "android": {
                      "sourceDir": "src/main/java",
                      "packageImportPath": "com.facebook.react"
                    }
                  }
                }
              }
            }
            """
                .trimIndent()
        )

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertThat(deps).containsExactly("implementation" to ":react-native_oss-library-example")
  }

  @Test
  fun getGradleDependenciesToApply_withDependencyConfiguration_returnsValidConfiguration() {
    val validJsonFile =
        createJsonFile(
            """
            {
              "reactNativeVersion": "1000.0.0",
              "dependencies": {
                "@react-native/oss-library-example": {
                  "root": "./node_modules/@react-native/oss-library-example",
                  "name": "@react-native/oss-library-example",
                  "platforms": {
                    "android": {
                      "sourceDir": "src/main/java",
                      "packageImportPath": "com.facebook.react",
                      "dependencyConfiguration": "compileOnly"
                    }
                  }
                }
              }
            }
            """
                .trimIndent()
        )

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertThat(deps).containsExactly("compileOnly" to ":react-native_oss-library-example")
  }

  @Test
  fun getGradleDependenciesToApply_withBuildTypes_returnsValidConfiguration() {
    val validJsonFile =
        createJsonFile(
            """
            {
              "reactNativeVersion": "1000.0.0",
              "dependencies": {
                "@react-native/oss-library-example": {
                  "root": "./node_modules/@react-native/oss-library-example",
                  "name": "@react-native/oss-library-example",
                  "platforms": {
                    "android": {
                      "sourceDir": "src/main/java",
                      "packageImportPath": "com.facebook.react",
                      "buildTypes": ["debug", "release"]
                    }
                  }
                }
              }
            }
            """
                .trimIndent()
        )

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertThat(deps)
        .containsExactly(
            "debugImplementation" to ":react-native_oss-library-example",
            "releaseImplementation" to ":react-native_oss-library-example",
        )
  }

  @Test
  fun getGradleDependenciesToApply_withMultipleDependencies_returnsValidConfiguration() {
    val validJsonFile =
        createJsonFile(
            """
            {
              "reactNativeVersion": "1000.0.0",
              "dependencies": {
                "@react-native/oss-library-example": {
                  "root": "./node_modules/@react-native/oss-library-example",
                  "name": "@react-native/oss-library-example",
                  "platforms": {
                    "android": {
                      "sourceDir": "src/main/java",
                      "packageImportPath": "com.facebook.react"
                    }
                  }
                },
                "@react-native/another-library-for-testing": {
                  "root": "./node_modules/@react-native/another-library-for-testing",
                  "name": "@react-native/another-library-for-testing",
                  "platforms": {
                    "android": {
                      "sourceDir": "src/main/java",
                      "packageImportPath": "com.facebook.react"
                    }
                  }
                }
              }
            }
            """
                .trimIndent()
        )

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertThat(deps)
        .containsExactly(
            "implementation" to ":react-native_oss-library-example",
            "implementation" to ":react-native_another-library-for-testing",
        )
  }

  @Test
  fun getGradleDependenciesToApply_withiOSOnlyLibrary_returnsEmptyDepsMap() {
    val validJsonFile =
        createJsonFile(
            """
            {
              "reactNativeVersion": "1000.0.0",
              "dependencies": {
                "@react-native/oss-library-example": {
                  "root": "./node_modules/@react-native/oss-library-example",
                  "name": "@react-native/oss-library-example",
                  "platforms": {
                    "ios": {
                      "podspecPath": "./node_modules/@react-native/oss-library-example/oss-library-example.podspec",
                      "version": "0.0.0",
                      "configurations": [],
                      "scriptPhases": []
                    },
                    "android": null
                  }
                }
              }
            }
            """
                .trimIndent()
        )

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertThat(deps).isEmpty()
  }

  @Test
  fun getGradleDependenciesToApply_withIsPureCxxDeps_filtersCorrectly() {
    val validJsonFile =
        createJsonFile(
            """
            {
              "reactNativeVersion": "1000.0.0",
              "dependencies": {
                "@react-native/oss-library-example": {
                  "root": "./node_modules/@react-native/android-example",
                  "name": "@react-native/android-example",
                  "platforms": {
                    "android": {
                      "sourceDir": "src/main/java",
                      "packageImportPath": "com.facebook.react"
                    }
                  }
                },
                "@react-native/another-library-for-testing": {
                  "root": "./node_modules/@react-native/cxx-testing",
                  "name": "@react-native/cxx-testing",
                  "platforms": {
                    "android": {
                      "sourceDir": "src/main/java",
                      "packageImportPath": "com.facebook.react",
                      "isPureCxxDependency": true
                    }
                  }
                }
              }
            }
            """
                .trimIndent()
        )

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertThat(deps).containsExactly("implementation" to ":react-native_android-example")
  }

  private fun createJsonFile(@Language("JSON") input: String) =
      tempFolder.newFile().apply { writeText(input) }
}
