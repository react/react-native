/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Duplicated from react-native-library-plugin for backward compat; remove when
// `com.facebook.react` library support is dropped.

package com.facebook.react.internal.deprecated

import com.android.build.api.variant.LibraryAndroidComponentsExtension
import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.ReactExtension
import com.facebook.react.internal.PrivateReactExtension
import com.facebook.react.tasks.GenerateCodegenArtifactsTask
import com.facebook.react.tasks.GenerateCodegenSchemaTask
import com.facebook.react.utils.JsonUtils
import com.facebook.react.utils.findPackageJsonFile
import java.io.File
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.file.Directory
import org.gradle.api.provider.Provider
import org.gradle.api.tasks.TaskProvider

@Suppress("UnstableApiUsage")
object DeprecatedReactLibraryCodegenConfigurator {
  fun configureCodegen(
      project: Project,
      localExtension: ReactExtension,
      rootExtension: PrivateReactExtension,
  ) {
    // First, we set up the output dir for the codegen.
    val generatedSrcDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/source/codegen")

    // It's the package folder for library (so ../ from the Gradle project)
    localExtension.jsRootDir.convention(project.layout.projectDirectory.dir("../"))

    // We create the tasks to produce schema from JS files and generate artifacts from schema.
    val generateCodegenArtifactsTask =
        registerCodegenTasks(
            project = project,
            rootExtension = rootExtension,
            generatedSrcDir = generatedSrcDir,
            packageJsonFile = { findPackageJsonFile(project, rootExtension.root) },
            schemaTaskName = "generateCodegenSchemaFromJavaScript",
            artifactsTaskName = "generateCodegenArtifactsFromSchema",
            configureJsRoot = { task, packageJson ->
              // We're reading the package.json at configuration time to properly feed
              // the `jsRootDir` @Input property of this task & the onlyIf. Therefore, the
              // parsePackageJson should be invoked inside this lambda.
              val parsedPackageJson = packageJson?.let { JsonUtils.fromPackageJson(it) }
              val jsSrcsDirInPackageJson = parsedPackageJson?.codegenConfig?.jsSrcsDir

              if (packageJson != null && jsSrcsDirInPackageJson != null) {
                task.jsRootDir.set(File(packageJson.parentFile, jsSrcsDirInPackageJson))
              } else {
                task.jsRootDir.set(localExtension.jsRootDir)
              }
            },
            configureCodegenArtifacts = { task, _ ->
              task.codegenJavaPackageName.set(localExtension.codegenJavaPackageName)
              task.libraryName.set(localExtension.libraryName)
            },
            onlyIf = { packageJson ->
              val parsedPackageJson = packageJson?.let { JsonUtils.fromPackageJson(it) }
              val includesGeneratedCode =
                  parsedPackageJson?.codegenConfig?.includesGeneratedCode ?: false
              !includesGeneratedCode
            },
        )

    // We update the android configuration to include the generated sources.
    // This is equivalent to this DSL:
    //
    // android { sourceSets { main { java { srcDirs += "$generatedSrcDir/java" } } } }
    project.extensions.getByType(LibraryAndroidComponentsExtension::class.java).finalizeDsl { ext ->
      ext.sourceSets
          .getByName("main")
          .java
          .directories
          .add(generatedSrcDir.get().dir("java").asFile.path)
    }

    // `preBuild` is one of the base tasks automatically registered by AGP.
    // This will invoke the codegen before compiling the entire project.
    project.tasks.named("preBuild", Task::class.java).dependsOn(generateCodegenArtifactsTask)
  }

  private fun registerCodegenTasks(
      project: Project,
      rootExtension: PrivateReactExtension,
      generatedSrcDir: Provider<Directory>,
      packageJsonFile: () -> File?,
      schemaTaskName: String,
      artifactsTaskName: String,
      configureJsRoot: (GenerateCodegenSchemaTask, File?) -> Unit,
      configureCodegenArtifacts: (GenerateCodegenArtifactsTask, File?) -> Unit,
      onlyIf: (File?) -> Boolean = { true },
  ): TaskProvider<GenerateCodegenArtifactsTask> {
    // We create the task to produce schema from JS files.
    val generateCodegenSchemaTask =
        project.tasks.register(
            schemaTaskName,
            GenerateCodegenSchemaTask::class.java,
        ) { task ->
          val packageJson = packageJsonFile()

          task.nodeExecutableAndArgs.set(rootExtension.nodeExecutableAndArgs)
          task.codegenDir.set(rootExtension.codegenDir)
          task.generatedSrcDir.set(generatedSrcDir)
          task.nodeWorkingDir.set(project.layout.projectDirectory.asFile.absolutePath)

          configureJsRoot(task, packageJson)

          task.jsInputFiles.set(
              project.fileTree(task.jsRootDir) { tree ->
                tree.include("**/*.js")
                tree.include("**/*.jsx")
                tree.include("**/*.ts")
                tree.include("**/*.tsx")

                tree.exclude("node_modules/**/*")
                tree.exclude("**/*.d.ts")
                // We want to exclude the build directory, to avoid picking them up for execution
                // avoidance.
                tree.exclude("**/build/**/*")
              },
          )
          val shouldRunTask = onlyIf(packageJson)
          task.onlyIf { shouldRunTask }
        }

    // We create the task to generate Java code from schema.
    return project.tasks.register(
        artifactsTaskName,
        GenerateCodegenArtifactsTask::class.java,
    ) { task ->
      val packageJson = packageJsonFile()

      task.dependsOn(generateCodegenSchemaTask)
      task.reactNativeDir.set(rootExtension.reactNativeDir)
      task.nodeExecutableAndArgs.set(rootExtension.nodeExecutableAndArgs)
      task.generatedSrcDir.set(generatedSrcDir)
      task.packageJsonFile.set(packageJson)
      task.nodeWorkingDir.set(project.layout.projectDirectory.asFile.absolutePath)

      configureCodegenArtifacts(task, packageJson)

      // The caller decides whether codegen should run. For app/library projects this depends on
      // package.json and includesGeneratedCode. Pure C++ dependencies are filtered before task
      // registration, so their generated tasks can always run.
      val shouldRunTask = onlyIf(packageJson)
      task.onlyIf { shouldRunTask }
    }
  }
}
