/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.api.variant.ApplicationAndroidComponentsExtension
import com.android.build.api.variant.LibraryAndroidComponentsExtension
import com.android.build.gradle.internal.tasks.factory.dependsOn
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
object ReactCodegenConfigurator {
  fun configureCodegen(
      project: Project,
      localExtension: ReactExtension,
      rootExtension: PrivateReactExtension,
      isLibrary: Boolean,
      needsCodegenFromPackageJson: (Project, PrivateReactExtension) -> Boolean,
  ) {
    val generatedSrcDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/source/codegen")

    if (isLibrary) {
      localExtension.jsRootDir.convention(project.layout.projectDirectory.dir("../"))
    } else {
      localExtension.jsRootDir.convention(localExtension.root)
    }

    val generateCodegenArtifactsTask =
        registerCodegenTasks(
            project = project,
            rootExtension = rootExtension,
            generatedSrcDir = generatedSrcDir,
            packageJsonFile = { findPackageJsonFile(project, rootExtension.root) },
            schemaTaskName = "generateCodegenSchemaFromJavaScript",
            artifactsTaskName = "generateCodegenArtifactsFromSchema",
            configureJsRoot = { task, packageJson ->
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
              val needsCodegenFromPackageJson =
                  needsCodegenFromPackageJson(project, rootExtension)
              val parsedPackageJson = packageJson?.let { JsonUtils.fromPackageJson(it) }
              val includesGeneratedCode =
                  parsedPackageJson?.codegenConfig?.includesGeneratedCode ?: false
              (isLibrary || needsCodegenFromPackageJson) && !includesGeneratedCode
            },
        )

    if (isLibrary) {
      project.extensions.getByType(LibraryAndroidComponentsExtension::class.java).finalizeDsl { ext
        ->
        ext.sourceSets
            .getByName("main")
            .java
            .directories
            .add(generatedSrcDir.get().dir("java").asFile.path)
      }
    } else {
      project.extensions.getByType(ApplicationAndroidComponentsExtension::class.java).finalizeDsl {
          ext ->
        ext.sourceSets
            .getByName("main")
            .java
            .directories
            .add(generatedSrcDir.get().dir("java").asFile.path)
      }
    }

    project.tasks.named("preBuild", Task::class.java).dependsOn(generateCodegenArtifactsTask)
  }

  fun registerCodegenTasks(
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
                tree.exclude("**/build/**/*")
              }
          )
          val shouldRunTask = onlyIf(packageJson)
          task.onlyIf { shouldRunTask }
        }

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

      val shouldRunTask = onlyIf(packageJson)
      task.onlyIf { shouldRunTask }
    }
  }
}
