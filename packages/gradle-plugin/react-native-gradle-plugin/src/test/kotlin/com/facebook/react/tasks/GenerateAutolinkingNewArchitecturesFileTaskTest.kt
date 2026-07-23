/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.model.ModelAutolinkingConfigJson
import com.facebook.react.model.ModelAutolinkingDependenciesJson
import com.facebook.react.model.ModelAutolinkingDependenciesPlatformAndroidJson
import com.facebook.react.model.ModelAutolinkingDependenciesPlatformJson
import com.facebook.react.tasks.GenerateAutolinkingNewArchitecturesFileTask.Companion.sanitizeCmakeListsPath
import com.facebook.react.tests.createTestTask
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class GenerateAutolinkingNewArchitecturesFileTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun generatePackageListTask_groupIsSetCorrectly() {
    val task = createTestTask<GenerateAutolinkingNewArchitecturesFileTask> {}
    assertThat(task.group).isEqualTo("react")
  }

  @Test
  fun generatePackageListTask_staticInputs_areSetCorrectly() {
    val outputFolder = tempFolder.newFolder("build")
    val inputFile = tempFolder.newFile("config.json")

    val task =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask> { task ->
          task.generatedOutputDirectory.set(outputFolder)
          task.autolinkInputFile.set(inputFile)
        }

    assertThat(task.generatedOutputDirectory.get().asFile).isEqualTo(outputFolder)
    assertThat(task.generatedOutputDirectory.get().asFile).isEqualTo(outputFolder)
    assertThat(task.generatedPureCxxSourceDirectory.isPresent).isFalse()
  }

  @Test
  fun filterAndroidPackages_withNull_returnsEmpty() {
    val task = createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
    val result = task.filterAndroidPackages(null)
    assertThat(result).isEmpty()
  }

  @Test
  fun filterAndroidPackages_withEmptyObject_returnsEmpty() {
    val task = createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
    val result = task.filterAndroidPackages(ModelAutolinkingConfigJson("1000.0.0", null, null))
    assertThat(result).isEmpty()
  }

  @Test
  fun filterAndroidPackages_withNoAndroidObject_returnsEmpty() {
    val task = createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
    val result =
        task.filterAndroidPackages(
            ModelAutolinkingConfigJson(
                reactNativeVersion = "1000.0.0",
                dependencies =
                    mapOf(
                        "a-dependency" to
                            ModelAutolinkingDependenciesJson(
                                root = "./a/directory",
                                name = "a-dependency",
                                platforms =
                                    ModelAutolinkingDependenciesPlatformJson(android = null),
                            )
                    ),
                project = null,
            )
        )
    assertThat(result).isEmpty()
  }

  @Test
  fun filterAndroidPackages_withValidAndroidObject_returnsIt() {
    val task = createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
    val android = ModelAutolinkingDependenciesPlatformAndroidJson(
        sourceDir = "./a/directory/android",
        packageImportPath = "import com.facebook.react.aPackage;",
        packageInstance = "new APackage()",
        buildTypes = emptyList(),
    )

    val result =
        task.filterAndroidPackages(
            ModelAutolinkingConfigJson(
                reactNativeVersion = "1000.0.0",
                dependencies =
                    mapOf(
                        "a-dependency" to
                            ModelAutolinkingDependenciesJson(
                                root = "./a/directory",
                                name = "a-dependency",
                                platforms =
                                    ModelAutolinkingDependenciesPlatformJson(android = android),
                            )
                    ),
                project = null,
            )
        )
    assertThat(result).containsExactly(android)
  }

  @Test
  fun cmakeListsPathForDependency_withCmakeListsPath_returnsIt() {
    val task = createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
    val dependency = ModelAutolinkingDependenciesPlatformAndroidJson(
        sourceDir = "./a/directory",
        packageImportPath = "import com.facebook.react.aPackage;",
        packageInstance = "new APackage()",
        buildTypes = emptyList(),
        libraryName = "aPackage",
        cmakeListsPath = "./a/directory/CMakeLists.txt",
        isPureCxxDependency = true,
    )

    assertThat(task.cmakeListsPathForDependency(dependency))
        .isEqualTo("./a/directory/CMakeLists.txt")
  }

  @Test
  fun cmakeListsPathForDependency_withPureCxxDependency_returnsGeneratedPath() {
    val generatedPureCxxSourceDirectory = tempFolder.newFolder("pureCxx")
    val task =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask> {
          it.generatedPureCxxSourceDirectory.set(generatedPureCxxSourceDirectory)
        }
    val dependency = ModelAutolinkingDependenciesPlatformAndroidJson(
        sourceDir = "./a/directory",
        packageImportPath = "import com.facebook.react.aPackage;",
        packageInstance = "new APackage()",
        buildTypes = emptyList(),
        libraryName = "aPackage",
        isPureCxxDependency = true,
    )

    assertThat(task.cmakeListsPathForDependency(dependency))
        .isEqualTo(
            File(generatedPureCxxSourceDirectory, "aPackage/jni/CMakeLists.txt").absolutePath
        )
  }

  @Test
  fun cmakeListsPathForDependency_withMissingGeneratedDirectory_returnsNull() {
    val task = createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
    val dependency = ModelAutolinkingDependenciesPlatformAndroidJson(
        sourceDir = "./a/directory",
        packageImportPath = "import com.facebook.react.aPackage;",
        packageInstance = "new APackage()",
        buildTypes = emptyList(),
        libraryName = "aPackage",
        isPureCxxDependency = true,
    )

    assertThat(task.cmakeListsPathForDependency(dependency)).isNull()
  }

  @Test
  fun cmakeListsPathForDependency_withNonPureCxxDependency_returnsNull() {
    val generatedPureCxxSourceDirectory = tempFolder.newFolder("pureCxx")
    val task =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask> {
          it.generatedPureCxxSourceDirectory.set(generatedPureCxxSourceDirectory)
        }
    val dependency = ModelAutolinkingDependenciesPlatformAndroidJson(
        sourceDir = "./a/directory",
        packageImportPath = "import com.facebook.react.aPackage;",
        packageInstance = "new APackage()",
        buildTypes = emptyList(),
        libraryName = "aPackage",
        isPureCxxDependency = false,
    )

    assertThat(task.cmakeListsPathForDependency(dependency)).isNull()
  }

  @Test
  fun generateCmakeFileContent_withNoPackages_returnsEmpty() {
    val output =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
            .generateCmakeFileContent(emptyList())
    // language=cmake
    assertThat(output)
        .isEqualTo(
            """
            # This code was generated by [React Native](https://www.npmjs.com/package/@react-native/gradle-plugin)
            cmake_minimum_required(VERSION 3.13)
            set(CMAKE_VERBOSE_MAKEFILE on)

            # We set REACTNATIVE_MERGED_SO so libraries/apps can selectively decide to depend on either libreactnative.so
            # or link against a old prefab target (this is needed for React Native 0.76 on).
            set(REACTNATIVE_MERGED_SO true)

            set(AUTOLINKED_LIBRARIES)


            """
                .trimIndent()
        )
  }

  @Test
  fun generateCmakeFileContent_withPackages_returnsImportCorrectly() {
    val output =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
            .generateCmakeFileContent(testDependencies)
    // language=cmake
    assertThat(output)
        .isEqualTo(
            """
            # This code was generated by [React Native](https://www.npmjs.com/package/@react-native/gradle-plugin)
            cmake_minimum_required(VERSION 3.13)
            set(CMAKE_VERBOSE_MAKEFILE on)

            # We set REACTNATIVE_MERGED_SO so libraries/apps can selectively decide to depend on either libreactnative.so
            # or link against a old prefab target (this is needed for React Native 0.76 on).
            set(REACTNATIVE_MERGED_SO true)

            set(AUTOLINKED_LIBRARIES)

            if(EXISTS "./a/directory/")
              add_subdirectory("./a/directory/" aPackage_autolinked_build)
              list(APPEND AUTOLINKED_LIBRARIES react_codegen_aPackage)
            else()
              message(WARNING "React Native: Skipping autolinked library 'react_codegen_aPackage' because the source directory does not exist: ./a/directory/")
            endif()
            if(EXISTS "./another/directory/with\ spaces/")
              add_subdirectory("./another/directory/with\ spaces/" anotherPackage_autolinked_build)
              list(APPEND AUTOLINKED_LIBRARIES react_codegen_anotherPackage)
            else()
              message(WARNING "React Native: Skipping autolinked library 'react_codegen_anotherPackage' because the source directory does not exist: ./another/directory/with\ spaces/")
            endif()
            if(EXISTS "./another/directory/cxx/")
              add_subdirectory("./another/directory/cxx/" anotherPackage_cxxmodule_autolinked_build)
              list(APPEND AUTOLINKED_LIBRARIES another_cxxModule)
            else()
              message(WARNING "React Native: Skipping autolinked C++ module 'another_cxxModule' because the source directory does not exist: ./another/directory/cxx/")
            endif()
            """
                .trimIndent()
        )
  }

  @Test
  fun generateCmakeFileContent_withGeneratedPureCxxPath_usesItWhenCmakeListsPathIsMissing() {
    val generatedPureCxxSourceDirectory = tempFolder.newFolder("pureCxx")
    val generatedCmakeListsPath =
        File(generatedPureCxxSourceDirectory, "aPackage/jni/CMakeLists.txt").absolutePath
    val generatedNativeFolderPath = sanitizeCmakeListsPath(generatedCmakeListsPath)

    val task =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask> {
          it.generatedPureCxxSourceDirectory.set(generatedPureCxxSourceDirectory)
        }

    val output =
        task.generateCmakeFileContent(
            listOf(
                ModelAutolinkingDependenciesPlatformAndroidJson(
                    sourceDir = "./a/directory",
                    packageImportPath = "import com.facebook.react.aPackage;",
                    packageInstance = "new APackage()",
                    buildTypes = emptyList(),
                    libraryName = "aPackage",
                    isPureCxxDependency = true,
                )
            )
        )

    assertThat(output)
        .contains(
            """
            if(EXISTS "$generatedNativeFolderPath")
              add_subdirectory("$generatedNativeFolderPath" aPackage_autolinked_build)
              list(APPEND AUTOLINKED_LIBRARIES react_codegen_aPackage)
            else()
              message(WARNING "React Native: Skipping autolinked library 'react_codegen_aPackage' because the source directory does not exist: $generatedNativeFolderPath")
            endif()
            """
                .trimIndent()
        )
  }

  @Test
  fun generateCmakeFileContent_withGeneratedPureCxxPath_preservesCmakeListsPath() {
    val generatedPureCxxSourceDirectory = tempFolder.newFolder("pureCxx")

    val task =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask> {
          it.generatedPureCxxSourceDirectory.set(generatedPureCxxSourceDirectory)
        }

    val output =
        task.generateCmakeFileContent(
            listOf(
                ModelAutolinkingDependenciesPlatformAndroidJson(
                    sourceDir = "./a/directory",
                    packageImportPath = "import com.facebook.react.aPackage;",
                    packageInstance = "new APackage()",
                    buildTypes = emptyList(),
                    libraryName = "aPackage",
                    cmakeListsPath = "./a/directory/CMakeLists.txt",
                    isPureCxxDependency = true,
                )
            )
        )

    assertThat(output)
        .contains(
            """
            if(EXISTS "./a/directory/")
              add_subdirectory("./a/directory/" aPackage_autolinked_build)
              list(APPEND AUTOLINKED_LIBRARIES react_codegen_aPackage)
            else()
              message(WARNING "React Native: Skipping autolinked library 'react_codegen_aPackage' because the source directory does not exist: ./a/directory/")
            endif()
            """
                .trimIndent()
        )
    assertThat(output).doesNotContain(generatedPureCxxSourceDirectory.absolutePath)
  }

  @Test
  fun generateCmakeFileContent_withGeneratedPureCxxPath_ignoresNonPureCxxDependency() {
    val generatedPureCxxSourceDirectory = tempFolder.newFolder("pureCxx")

    val task =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask> {
          it.generatedPureCxxSourceDirectory.set(generatedPureCxxSourceDirectory)
        }

    val output =
        task.generateCmakeFileContent(
            listOf(
                ModelAutolinkingDependenciesPlatformAndroidJson(
                    sourceDir = "./a/directory",
                    packageImportPath = "import com.facebook.react.aPackage;",
                    packageInstance = "new APackage()",
                    buildTypes = emptyList(),
                    libraryName = "aPackage",
                    isPureCxxDependency = false,
                )
            )
        )

    assertThat(output).doesNotContain("aPackage_autolinked_build")
    assertThat(output).doesNotContain(generatedPureCxxSourceDirectory.absolutePath)
  }

  @Test
  fun generateCmakeFileContent_withPureCxxDependencyAndMissingGeneratedDirectory_skipsIt() {
    val output =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
            .generateCmakeFileContent(
                listOf(
                    ModelAutolinkingDependenciesPlatformAndroidJson(
                        sourceDir = "./a/directory",
                        packageImportPath = "import com.facebook.react.aPackage;",
                        packageInstance = "new APackage()",
                        buildTypes = emptyList(),
                        libraryName = "aPackage",
                        isPureCxxDependency = true,
                    )
                )
            )

    assertThat(output).doesNotContain("aPackage_autolinked_build")
  }

  @Test
  fun generateCppFileContent_withNoPackages_returnsEmpty() {
    val output =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
            .generateCppFileContent(emptyList())
    // language=cpp
    assertThat(output)
        .isEqualTo(
            """
            /**
             * This code was generated by [React Native](https://www.npmjs.com/package/@react-native/gradle-plugin).
             *
             * Do not edit this file as changes may cause incorrect behavior and will be lost
             * once the code is regenerated.
             *
             */

            #include "autolinking.h"


            namespace facebook {
            namespace react {

            std::shared_ptr<TurboModule> autolinking_ModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params) {

              return nullptr;
            }

            std::shared_ptr<TurboModule> autolinking_cxxModuleProvider(const std::string moduleName, const std::shared_ptr<CallInvoker>& jsInvoker) {

              return nullptr;
            }

            void autolinking_registerProviders(std::shared_ptr<ComponentDescriptorProviderRegistry const> providerRegistry) {

              return;
            }

            } // namespace react
            } // namespace facebook
            """
                .trimIndent()
        )
  }

  @Test
  fun generateCppFileContent_withPackages_returnsImportCorrectly() {
    val output =
        createTestTask<GenerateAutolinkingNewArchitecturesFileTask>()
            .generateCppFileContent(testDependencies)
    // language=cpp
    assertThat(output)
        .isEqualTo(
            """
            /**
             * This code was generated by [React Native](https://www.npmjs.com/package/@react-native/gradle-plugin).
             *
             * Do not edit this file as changes may cause incorrect behavior and will be lost
             * once the code is regenerated.
             *
             */

            #include "autolinking.h"
            #include <aPackage.h>
            #include <anotherPackage.h>
            #include <react/renderer/components/anotherPackage/ComponentDescriptors.h>
            #include <AnotherCxxModule.h>

            namespace facebook {
            namespace react {

            std::shared_ptr<TurboModule> autolinking_ModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params) {
            auto module_aPackage = aPackage_ModuleProvider(moduleName, params);
            if (module_aPackage != nullptr) {
            return module_aPackage;
            }
            auto module_anotherPackage = anotherPackage_ModuleProvider(moduleName, params);
            if (module_anotherPackage != nullptr) {
            return module_anotherPackage;
            }
              return nullptr;
            }

            std::shared_ptr<TurboModule> autolinking_cxxModuleProvider(const std::string moduleName, const std::shared_ptr<CallInvoker>& jsInvoker) {
            if (moduleName == AnotherCxxModule::kModuleName) {
            return std::make_shared<AnotherCxxModule>(jsInvoker);
            }
              return nullptr;
            }

            void autolinking_registerProviders(std::shared_ptr<ComponentDescriptorProviderRegistry const> providerRegistry) {
            providerRegistry->add(concreteComponentDescriptorProvider<AnotherPackageComponentDescriptor>());
              return;
            }

            } // namespace react
            } // namespace facebook
            """
                .trimIndent()
        )
  }

  @Test
  fun sanitizeCmakeListsPath_withPathEndingWithFileName_removesFilename() {
    val input = "./a/directory/CMakeLists.txt"
    assertThat(sanitizeCmakeListsPath(input)).isEqualTo("./a/directory/")
  }

  @Test
  fun sanitizeCmakeListsPath_withSpaces_removesSpaces() {
    val input = "./a/dir ectory/with spaces/"
    assertThat(sanitizeCmakeListsPath(input)).isEqualTo("./a/dir\\ ectory/with\\ spaces/")
  }

  @Test
  fun sanitizeCmakeListsPath_withPathEndingWithFileNameAndSpaces_sanitizesIt() {
    val input = "./a/dir ectory/CMakeLists.txt"
    assertThat(sanitizeCmakeListsPath(input)).isEqualTo("./a/dir\\ ectory/")
  }

  private val testDependencies = listOf(
      ModelAutolinkingDependenciesPlatformAndroidJson(
          sourceDir = "./a/directory",
          packageImportPath = "import com.facebook.react.aPackage;",
          packageInstance = "new APackage()",
          buildTypes = emptyList(),
          libraryName = "aPackage",
          componentDescriptors = emptyList(),
          cmakeListsPath = "./a/directory/CMakeLists.txt",
      ),
      ModelAutolinkingDependenciesPlatformAndroidJson(
          sourceDir = "./another/directory",
          packageImportPath = "import com.facebook.react.anotherPackage;",
          packageInstance = "new AnotherPackage()",
          buildTypes = emptyList(),
          libraryName = "anotherPackage",
          componentDescriptors = listOf("AnotherPackageComponentDescriptor"),
          cmakeListsPath = "./another/directory/with spaces/CMakeLists.txt",
          cxxModuleCMakeListsPath = "./another/directory/cxx/CMakeLists.txt",
          cxxModuleHeaderName = "AnotherCxxModule",
          cxxModuleCMakeListsModuleName = "another_cxxModule",
      ),
  )
}
