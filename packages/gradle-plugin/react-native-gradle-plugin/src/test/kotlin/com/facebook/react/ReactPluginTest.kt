/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.model.ModelAutolinkingDependenciesJson
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.intellij.lang.annotations.Language
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ReactPluginTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun getPureCxxCodegenDependencies_filtersDependenciesCorrectly() {
    val includesGeneratedCode = createPackage("includes-generated-code", true)
    val withoutGeneratedCode = createPackage("without-generated-code", false)
    val withoutIncludesGeneratedCode = createPackage("without-includes-generated-code", null)
    val withoutCodegenConfig = createPackageWithoutCodegenConfig("without-codegen-config")
    val missingNonPureCxxPackage = File(tempFolder.root, "missing-non-pure-cxx-package")

    val autolinkingFile =
        createAutolinkingFile(
            """
            {
              "reactNativeVersion": "1000.0.0",
              "dependencies": {
                "includes-generated-code": {
                  "root": "${includesGeneratedCode.invariantSeparatorsPath}",
                  "name": "includes-generated-code",
                  "platforms": {
                    "android": {
                      "sourceDir": "${includesGeneratedCode.invariantSeparatorsPath}/android",
                      "packageImportPath": "import com.facebook.react.IncludesGeneratedCodePackage;",
                      "packageInstance": "new IncludesGeneratedCodePackage()",
                      "buildTypes": [],
                      "libraryName": "IncludesGeneratedCode",
                      "isPureCxxDependency": true
                    }
                  }
                },
                "without-generated-code": {
                  "root": "${withoutGeneratedCode.invariantSeparatorsPath}",
                  "name": "without-generated-code",
                  "platforms": {
                    "android": {
                      "sourceDir": "${withoutGeneratedCode.invariantSeparatorsPath}/android",
                      "packageImportPath": "import com.facebook.react.WithoutGeneratedCodePackage;",
                      "packageInstance": "new WithoutGeneratedCodePackage()",
                      "buildTypes": [],
                      "libraryName": "WithoutGeneratedCode",
                      "isPureCxxDependency": true
                    }
                  }
                },
                "without-includes-generated-code": {
                  "root": "${withoutIncludesGeneratedCode.invariantSeparatorsPath}",
                  "name": "without-includes-generated-code",
                  "platforms": {
                    "android": {
                      "sourceDir": "${withoutIncludesGeneratedCode.invariantSeparatorsPath}/android",
                      "packageImportPath": "import com.facebook.react.WithoutIncludesGeneratedCodePackage;",
                      "packageInstance": "new WithoutIncludesGeneratedCodePackage()",
                      "buildTypes": [],
                      "libraryName": "WithoutIncludesGeneratedCode",
                      "isPureCxxDependency": true
                    }
                  }
                },
                "without-codegen-config": {
                  "root": "${withoutCodegenConfig.invariantSeparatorsPath}",
                  "name": "without-codegen-config",
                  "platforms": {
                    "android": {
                      "sourceDir": "${withoutCodegenConfig.invariantSeparatorsPath}/android",
                      "packageImportPath": "import com.facebook.react.WithoutCodegenConfigPackage;",
                      "packageInstance": "new WithoutCodegenConfigPackage()",
                      "buildTypes": [],
                      "libraryName": "WithoutCodegenConfig",
                      "isPureCxxDependency": true
                    }
                  }
                },
                "missing-non-pure-cxx-package": {
                  "root": "${missingNonPureCxxPackage.invariantSeparatorsPath}",
                  "name": "missing-non-pure-cxx-package",
                  "platforms": {
                    "android": {
                      "sourceDir": "${missingNonPureCxxPackage.invariantSeparatorsPath}/android",
                      "packageImportPath": "import com.facebook.react.MissingNonPureCxxPackage;",
                      "packageInstance": "new MissingNonPureCxxPackage()",
                      "buildTypes": [],
                      "libraryName": "MissingNonPureCxxPackage",
                      "isPureCxxDependency": false
                    }
                  }
                }
              }
            }
            """
                .trimIndent()
        )

    val result = ReactPlugin().getPureCxxCodegenDependencies(autolinkingFile)

    assertThat(result.map { it.name })
        .containsExactly("without-generated-code", "without-includes-generated-code")
  }

  @Test
  fun taskNameSuffixForDependency_withSimpleName_capitalizesIt() {
    val dependency =
        ModelAutolinkingDependenciesJson(root = "./simple", name = "simple", platforms = null)

    val result = ReactPlugin().taskNameSuffixForDependency(dependency)

    assertThat(result).isEqualTo("Simple")
  }

  @Test
  fun taskNameSuffixForDependency_withNonAlphanumericCharacters_encodesThem() {
    val dependency =
        ModelAutolinkingDependenciesJson(
            root = "./node_modules/@foo/bar-baz",
            name = "@foo/bar-baz",
            platforms = null,
        )

    val result = ReactPlugin().taskNameSuffixForDependency(dependency)

    assertThat(result).isEqualTo("_64_foo_47_bar_45_baz")
  }

  @Test
  fun taskNameSuffixForDependency_withSimilarCleansedNames_avoidsCollisions() {
    val plugin = ReactPlugin()
    val suffixes =
        listOf("@foo/bar", "foo.bar", "foo-bar", "foo_bar", "foo_45_bar").map { name ->
          val dependency =
              ModelAutolinkingDependenciesJson(
                  root = "./node_modules/$name",
                  name = name,
                  platforms = null,
              )

          plugin.taskNameSuffixForDependency(dependency)
        }

    assertThat(suffixes).doesNotHaveDuplicates()
  }

  @Test
  fun taskNameSuffixForDependency_withLocalModuleRoot_usesPackageName() {
    val dependency =
        ModelAutolinkingDependenciesJson(
            root = "./modules/local-module",
            name = "local-module",
            platforms = null,
        )

    val result = ReactPlugin().taskNameSuffixForDependency(dependency)

    assertThat(result).isEqualTo("Local_45_module")
  }

  private fun createPackage(name: String, includesGeneratedCode: Boolean? = null): File {
    val folder = tempFolder.newFolder(name)
    File(folder, "package.json").writeText(packageJson(includesGeneratedCode))
    return folder
  }

  private fun createPackageWithoutCodegenConfig(name: String): File {
    val folder = tempFolder.newFolder(name)
    File(folder, "package.json").writeText(packageJson())
    return folder
  }

  private fun createAutolinkingFile(@Language("JSON") input: String) =
      tempFolder.newFile("autolinking.json").apply { writeText(input) }

  private fun packageJson(includesGeneratedCode: Boolean?): String {
    val includesGeneratedCodeLine =
        includesGeneratedCode?.let { ""","includesGeneratedCode": $it""" } ?: ""
    // language=JSON
    return """
      {
        "version": "1.0.0",
        "codegenConfig": {
          "name": "TestSpec",
          "type": "modules",
          "jsSrcsDir": "src"$includesGeneratedCodeLine
        }
      }
      """
        .trimIndent()
  }

  private fun packageJson(): String {
    // language=JSON
    return """
    {
      "version": "1.0.0"
    }
    """
        .trimIndent()
  }
}
