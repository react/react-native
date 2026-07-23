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
import com.facebook.react.model.ModelAutolinkingDependenciesJson
import com.facebook.react.tasks.GenerateAutolinkingNewArchitecturesFileTask
import com.facebook.react.tasks.GenerateCodegenArtifactsTask
import com.facebook.react.tasks.GenerateCodegenSchemaTask
import com.facebook.react.tasks.GenerateEntryPointTask
import com.facebook.react.tasks.GeneratePackageListTask
import com.facebook.react.utils.AgpConfiguratorUtils.configureBuildConfigFieldsForApp
import com.facebook.react.utils.AgpConfiguratorUtils.configureBuildConfigFieldsForLibraries
import com.facebook.react.utils.AgpConfiguratorUtils.configureBuildTypesForApp
import com.facebook.react.utils.AgpConfiguratorUtils.configureDevServerLocation
import com.facebook.react.utils.AgpConfiguratorUtils.configureNamespaceForLibraries
import com.facebook.react.utils.BackwardCompatUtils.configureBackwardCompatibilityReactMap
import com.facebook.react.utils.DependencyUtils.configureDependencies
import com.facebook.react.utils.DependencyUtils.configureRepositories
import com.facebook.react.utils.DependencyUtils.readVersionAndGroupStrings
import com.facebook.react.utils.JdkConfiguratorUtils.configureJavaToolChains
import com.facebook.react.utils.JsonUtils
import com.facebook.react.utils.NdkConfiguratorUtils.configureReactNativeNdk
import com.facebook.react.utils.ProjectUtils.needsCodegenFromPackageJson
import com.facebook.react.utils.PropertyUtils
import com.facebook.react.utils.findPackageJsonFile
import java.io.File
import kotlin.system.exitProcess
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.file.Directory
import org.gradle.api.provider.Provider
import org.gradle.api.tasks.TaskProvider
import org.gradle.internal.jvm.Jvm

class ReactPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    checkJvmVersion(project)
    val extension = project.extensions.create("react", ReactExtension::class.java, project)

    // We register a private extension on the rootProject so that project wide configs
    // like codegen config can be propagated from app project to libraries.
    val rootExtension =
        project.rootProject.extensions.findByType(PrivateReactExtension::class.java)
            ?: project.rootProject.extensions.create(
                "privateReact",
                PrivateReactExtension::class.java,
                project,
            )

    // Warn users if they still have the hermesV1Enabled property set.
    if (
        project.rootProject.hasProperty(PropertyUtils.HERMES_V1_ENABLED) ||
            project.rootProject.hasProperty(PropertyUtils.SCOPED_HERMES_V1_ENABLED)
    ) {
      val value =
          (project.rootProject.findProperty(PropertyUtils.HERMES_V1_ENABLED)
                  ?: project.rootProject.findProperty(PropertyUtils.SCOPED_HERMES_V1_ENABLED))
              .toString()
              .toBoolean()
      if (value) {
        project.logger.warn(
            "WARNING: The 'hermesV1Enabled' property is no longer needed. Hermes V1 is now always enabled. You can safely remove this property from your gradle.properties."
        )
      } else {
        project.logger.warn(
            "WARNING: Opting out of Hermes V1 is no longer supported. The 'hermesV1Enabled=false' property will be ignored. Hermes V1 is now always enabled. Please remove this property from your gradle.properties."
        )
      }
    }

    // App Only Configuration
    project.pluginManager.withPlugin("com.android.application") {
      // We wire the root extension with the values coming from the app (either user populated or
      // defaults).
      rootExtension.root.set(extension.root)
      rootExtension.reactNativeDir.set(extension.reactNativeDir)
      rootExtension.codegenDir.set(extension.codegenDir)
      rootExtension.nodeExecutableAndArgs.set(extension.nodeExecutableAndArgs)

      project.afterEvaluate {
        val reactNativeDir = extension.reactNativeDir.get().asFile
        val propertiesFile = File(reactNativeDir, "ReactAndroid/gradle.properties")
        val hermesVersionPropertiesFile =
            File(reactNativeDir, "sdks/hermes-engine/version.properties")
        val versionAndGroupStrings =
            readVersionAndGroupStrings(project, propertiesFile, hermesVersionPropertiesFile)
        configureDependencies(project, versionAndGroupStrings)
        configureRepositories(project, versionAndGroupStrings.isNightly)
      }

      configureReactNativeNdk(project, extension)
      configureBuildConfigFieldsForApp(project, extension)
      configureDevServerLocation(project)
      configureBackwardCompatibilityReactMap(project)
      configureJavaToolChains(project)

      project.extensions.getByType(ApplicationAndroidComponentsExtension::class.java).apply {
        onVariants(selector().all()) { variant ->
          project.configureReactTasks(variant = variant, config = extension)
        }
      }
      configureAutolinking(project, extension, rootExtension)
      configureCodegen(project, extension, rootExtension, isLibrary = false)
      configureResources(project, extension)
      configureBuildTypesForApp(project)

      // Apply the namespace fallback to every Android library in the build, including third-party
      // libraries that don't apply the `com.facebook.react` plugin and still rely on the manifest
      // `package` attribute (which AGP 9 no longer accepts as a namespace). The per-library hook
      // below only covers libraries that apply our plugin, so we additionally sweep all library
      // subprojects from the app. We do this once, from the application project, because re-running
      // a rootProject-wide traversal from every library breaks on AGP 9, which errors when
      // `finalizeDsl` is registered after a project's DSL has been finalized.
      // See https://github.com/facebook/react-native/pull/57038.
      //
      // We skip projects that have already been evaluated: AGP finalizes a project's DSL during/
      // after its evaluation, so registering a `finalizeDsl` callback on an already-evaluated
      // project is "too late" and fails on AGP 9. In a regular app build the app is evaluated
      // before its libraries (see ReactRootProjectPlugin's `evaluationDependsOn(":app")`), so every
      // library is still pending here. In composite/monorepo builds (e.g. rn-tester, where
      // ReactAndroid is a sibling) some library projects are already evaluated by this point; those
      // already define their own namespace, so skipping them is safe.
      project.rootProject.allprojects { subproject ->
        subproject.pluginManager.withPlugin("com.android.library") {
          if (!subproject.state.executed) {
            configureNamespaceForLibraries(subproject)
          }
        }
      }
    }

    // Library Only Configuration
    project.pluginManager.withPlugin("com.android.library") {
      configureBuildConfigFieldsForLibraries(project)
      configureNamespaceForLibraries(project)
      configureCodegen(project, extension, rootExtension, isLibrary = true)
    }
  }

  private fun checkJvmVersion(project: Project) {
    val jvmVersion = Jvm.current().javaVersion?.majorVersion
    if ((jvmVersion?.toIntOrNull() ?: 0) <= 16) {
      project.logger.error(
          """

      ********************************************************************************

      ERROR: requires JDK17 or higher.
      Incompatible major version detected: '$jvmVersion'

      ********************************************************************************

      """
              .trimIndent()
      )
      exitProcess(1)
    }
  }

  /** This function configures Android resources - in this case just the bundle */
  private fun configureResources(project: Project, reactExtension: ReactExtension) {
    project.extensions.getByType(ApplicationAndroidComponentsExtension::class.java).finalizeDsl {
        ext ->
      val bundleFileExtension = reactExtension.bundleAssetName.get().substringAfterLast('.', "")
      if (!reactExtension.enableBundleCompression.get() && bundleFileExtension.isNotBlank()) {
        ext.androidResources.noCompress.add(bundleFileExtension)
      }
    }
  }

  /** This function sets up `react-native-codegen` in our Gradle plugin. */
  @Suppress("UnstableApiUsage")
  private fun configureCodegen(
      project: Project,
      localExtension: ReactExtension,
      rootExtension: PrivateReactExtension,
      isLibrary: Boolean,
  ) {
    // First, we set up the output dir for the codegen.
    val generatedSrcDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/source/codegen")

    // We specify the default value (convention) for jsRootDir.
    // It's the root folder for apps (so ../../ from the Gradle project)
    // and the package folder for library (so ../ from the Gradle project)
    if (isLibrary) {
      localExtension.jsRootDir.convention(project.layout.projectDirectory.dir("../"))
    } else {
      localExtension.jsRootDir.convention(localExtension.root)
    }

    // We create the tasks to produce schema from JS files and generate artifacts from schema.
    val generateCodegenArtifactsTask = registerCodegenTasks(
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
          // Please note that needsCodegenFromPackageJson is triggering a read of the
          // package.json at configuration time as we need to feed the onlyIf condition of this
          // task. Therefore, needsCodegenFromPackageJson needs to be invoked inside this
          // lambda.
          val needsCodegenFromPackageJson = project.needsCodegenFromPackageJson(rootExtension.root)
          val parsedPackageJson = packageJson?.let { JsonUtils.fromPackageJson(it) }
          val includesGeneratedCode =
              parsedPackageJson?.codegenConfig?.includesGeneratedCode ?: false
          (isLibrary || needsCodegenFromPackageJson) && !includesGeneratedCode
        },
    )

    // We update the android configuration to include the generated sources.
    // This is equivalent to this DSL:
    //
    // android { sourceSets { main { java { srcDirs += "$generatedSrcDir/java" } } } }
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
              }
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

  /** This function sets up Autolinking for App users */
  private fun configureAutolinking(
      project: Project,
      extension: ReactExtension,
      rootExtension: PrivateReactExtension,
  ) {
    val generatedAutolinkingJavaDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/autolinking/src/main/java")
    val generatedAutolinkingJniDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/autolinking/src/main/jni")
    val generatedPureCxxSourceDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/source/codegen/pureCxx")

    // The autolinking.json file is available in the root build folder as it's generated
    // by ReactSettingsPlugin.kt
    val rootGeneratedAutolinkingFile =
        project.rootProject.layout.buildDirectory.file("generated/autolinking/autolinking.json")
    val pureCxxDependencies =
        getPureCxxCodegenDependencies(rootGeneratedAutolinkingFile.get().asFile)
    val pureCxxCodegenTasks = configurePureCxxDependenciesCodegen(
        project,
        extension,
        rootExtension,
        generatedPureCxxSourceDir,
        pureCxxDependencies,
    )

    // We add a task called generateAutolinkingPackageList to do not clash with the existing task
    // called generatePackageList. This can to be renamed once we unlink the rn <-> cli
    // dependency.
    val generatePackageListTask =
        project.tasks.register(
            "generateAutolinkingPackageList",
            GeneratePackageListTask::class.java,
        ) { task ->
          task.autolinkInputFile.set(rootGeneratedAutolinkingFile)
          task.generatedOutputDirectory.set(generatedAutolinkingJavaDir)
        }

    // We add a task called generateReactNativeEntryPoint to generate the React Native entry point.
    val generateEntryPointTask =
        project.tasks.register(
            "generateReactNativeEntryPoint",
            GenerateEntryPointTask::class.java,
        ) { task ->
          task.autolinkInputFile.set(rootGeneratedAutolinkingFile)
          task.generatedOutputDirectory.set(generatedAutolinkingJavaDir)
        }

    // We also need to generate code for C++ Autolinking
    val generateAutolinkingNewArchitectureFilesTask =
        project.tasks.register(
            "generateAutolinkingNewArchitectureFiles",
            GenerateAutolinkingNewArchitecturesFileTask::class.java,
        ) { task ->
          task.autolinkInputFile.set(rootGeneratedAutolinkingFile)
          task.generatedOutputDirectory.set(generatedAutolinkingJniDir)

          if (pureCxxDependencies.isNotEmpty()) {
            task.generatedPureCxxSourceDirectory.set(generatedPureCxxSourceDir)
          }

          task.dependsOn(pureCxxCodegenTasks)
        }
    project.tasks
        .named("preBuild", Task::class.java)
        .dependsOn(generateAutolinkingNewArchitectureFilesTask)

    // We make preBuild depend on generateAutolinkingPackageList and generateEntryPoint so they run
    // before everything else.
    project.tasks
        .named("preBuild", Task::class.java)
        .dependsOn(generatePackageListTask, generateEntryPointTask)

    // We tell Android Gradle Plugin that inside /build/generated/autolinking/src/main/java there
    // are sources to be compiled as well.
    project.extensions.getByType(ApplicationAndroidComponentsExtension::class.java).apply {
      onVariants(selector().all()) { variant ->
        variant.sources.java?.addStaticSourceDirectory(
            generatedAutolinkingJavaDir.get().asFile.absolutePath
        )
      }
    }
  }

  private fun configurePureCxxDependenciesCodegen(
      project: Project,
      extension: ReactExtension,
      rootExtension: PrivateReactExtension,
      generatedPureCxxSourceDir: Provider<Directory>,
      dependencies: List<ModelAutolinkingDependenciesJson>,
  ): List<TaskProvider<GenerateCodegenArtifactsTask>> {
    // Pure C++ dependencies are not included as Gradle subprojects, so configureCodegen won't run
    // for them. The app owns these generated codegen artifacts and links them from autolinking.
    return dependencies.mapNotNull { dependency ->
      val android = dependency.platforms?.android ?: return@mapNotNull null
      val libraryName = android.libraryName ?: return@mapNotNull null
      val dependencyRoot = File(dependency.root)
      val packageJson = File(dependencyRoot, "package.json")
      val parsedPackageJson = JsonUtils.fromPackageJson(packageJson)
      val jsSrcsDir = parsedPackageJson?.codegenConfig?.jsSrcsDir
      val generatedSrcDir = generatedPureCxxSourceDir.map { it.dir(libraryName) }
      val taskNameSuffix = taskNameSuffixForDependency(dependency)

      registerCodegenTasks(
          project = project,
          rootExtension = rootExtension,
          generatedSrcDir = generatedSrcDir,
          packageJsonFile = { packageJson },
          schemaTaskName = "generate${taskNameSuffix}CodegenSchemaFromJavaScript",
          artifactsTaskName = "generate${taskNameSuffix}CodegenArtifactsFromSchema",
          configureJsRoot = { task, _ ->
            if (jsSrcsDir != null) {
              task.jsRootDir.set(File(packageJson.parentFile, jsSrcsDir))
            } else {
              task.jsRootDir.set(dependencyRoot)
            }
          },
          configureCodegenArtifacts = { task, _ ->
            val codegenJavaPackageName = parsedPackageJson?.codegenConfig?.android?.javaPackageName
            if (codegenJavaPackageName != null) {
              task.codegenJavaPackageName.set(codegenJavaPackageName)
            } else {
              task.codegenJavaPackageName.set(extension.codegenJavaPackageName)
            }
            task.libraryName.set(libraryName)
          },
      )
    }
  }

  internal fun getPureCxxCodegenDependencies(
      autolinkingFile: File
  ): List<ModelAutolinkingDependenciesJson> {
    val model = JsonUtils.fromAutolinkingConfigJson(autolinkingFile)
    return model?.dependencies?.values?.filter { dependency ->
      val android = dependency.platforms?.android

      if (android?.isPureCxxDependency != true || android.libraryName == null) {
        return@filter false
      }

      val packageJson = File(dependency.root, "package.json")
      val codegenConfig = JsonUtils.fromPackageJson(packageJson)?.codegenConfig
      codegenConfig != null && codegenConfig.includesGeneratedCode != true
    } ?: emptyList()
  }

  internal fun taskNameSuffixForDependency(dependency: ModelAutolinkingDependenciesJson): String =
      dependency.name
          .map { char -> if (char.isLetterOrDigit()) char.toString() else "_${char.code}_" }
          .joinToString("")
          .replaceFirstChar { char -> char.titlecase() }
}
