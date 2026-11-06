/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.ReactExtension
import com.facebook.react.model.ModelAutolinkingConfigJson
import com.facebook.react.model.ModelAutolinkingDependenciesPlatformAndroidJson
import com.facebook.react.utils.JsonUtils
import java.io.File
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.SetProperty
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction

abstract class GeneratePackageListTask : DefaultTask() {

  init {
    group = "react"
  }

  @get:InputFile abstract val autolinkInputFile: RegularFileProperty

  @get:OutputDirectory abstract val generatedOutputDirectory: DirectoryProperty

  /**
   * The names of the Gradle configurations on the compile classpath of the variant this task is
   * generating for: the variant's `<variant>CompileClasspath` configuration plus everything it
   * transitively extends from (e.g. `implementation`, `api`, `debugImplementation`,
   * `<flavor>Implementation`). A dependency is only listed when at least one of the configurations
   * it resolves to is present in this set, so the generated file only references packages that are
   * actually on the variant's compile classpath. When unset, all dependencies are included.
   */
  @get:Optional @get:Input abstract val applicableConfigurations: SetProperty<String>

  @TaskAction
  fun taskAction() {
    val model =
        JsonUtils.fromAutolinkingConfigJson(autolinkInputFile.get().asFile)
            ?: error(
                """
                   RNGP - Autolinking: Could not parse autolinking config file:
                   ${autolinkInputFile.get().asFile.absolutePath}
                   
                   The file is either missing or not containing valid JSON so the build won't succeed. 
                 """
                    .trimIndent(),
            )

    val packageName =
        model.project?.android?.packageName
            ?: error(
                "RNGP - Autolinking: Could not find project.android.packageName in react-native config output! Could not autolink packages without this field.",
            )

    val androidPackages = filterAndroidPackages(model, applicableConfigurations.orNull)
    val packageClassInstance = composePackageInstance(packageName, androidPackages)
    val generatedFileContents = composeFileContent(packageClassInstance)

    val outputDir = generatedOutputDirectory.get().asFile
    outputDir.mkdirs()
    File(outputDir, GENERATED_FILENAME).apply {
      parentFile.mkdirs()
      writeText(generatedFileContents)
    }
  }

  /**
   * Extracts the fully qualified class name from an import statement. E.g., "import
   * com.foo.bar.MyClass;" -> "com.foo.bar.MyClass"
   */
  internal fun extractFqcnFromImport(importStatement: String): String? {
    val match = Regex("import\\s+([\\w.]+)\\s*;").find(importStatement)
    return match?.groupValues?.get(1)
  }

  internal fun composePackageInstance(
      packageName: String,
      packages: Map<String, ModelAutolinkingDependenciesPlatformAndroidJson>,
  ): String {
    if (packages.isEmpty()) {
      return ""
    }

    val instances =
        packages.entries.map { (name, dep) ->
          val packageInstance =
              requireNotNull(dep.packageInstance) {
                "RNGP - Autolinking: Missing `packageInstance` in `config` for dependency $name. This is required to generate the autolinking package list."
              }
          val packageImportPath = dep.packageImportPath
          val interpolated = interpolateDynamicValues(packageInstance, packageName)

          // Use FQCN to avoid class name collisions between different packages
          val fqcn = extractFqcnFromImport(interpolateDynamicValues(packageImportPath, packageName))
          val fqcnInstance =
              if (fqcn != null) {
                val className = fqcn.substringAfterLast('.')
                // Replace the short class name with FQCN in the instance
                interpolated.replace(Regex("\\b${Regex.escape(className)}\\b")) { fqcn }
              } else {
                interpolated
              }

          // Add comment with package name before each instance
          "// $name\n      $fqcnInstance"
        }

    return ",\n      " + instances.joinToString(",\n      ")
  }

  internal fun filterAndroidPackages(
      model: ModelAutolinkingConfigJson?,
      applicableConfigurations: Set<String>? = null,
  ): Map<String, ModelAutolinkingDependenciesPlatformAndroidJson> {
    val packages = model?.dependencies?.values ?: emptyList()
    return packages
        .filter { it.platforms?.android != null }
        // The pure C++ dependencies won't have a .java/.kt file to import
        .filterNot { it.platforms?.android?.isPureCxxDependency == true }
        // Each dependency resolves to one or more Gradle configurations (e.g. `implementation`,
        // `debugImplementation` or a `dependencyConfiguration` override). It is only listed for
        // a variant whose compile classpath contains one of those configurations — otherwise
        // the generated file would reference a package that is not on the classpath.
        .filter {
          applicableConfigurations == null ||
              ReactExtension.resolveGradleConfigurations(checkNotNull(it.platforms?.android)).any {
                  configuration ->
                configuration in applicableConfigurations
              }
        }
        .associate { it.name to checkNotNull(it.platforms?.android) }
  }

  internal fun composeFileContent(packageClassInstance: String): String =
      generatedFileContentsTemplate.replace("{{ packageClassInstances }}", packageClassInstance)

  companion object {
    const val GENERATED_FILENAME = "com/facebook/react/PackageList.java"

    /**
     * Before adding the package replacement mechanism, BuildConfig and R classes were imported
     * automatically into the scope of the file. We want to replace all non-FQDN references to those
     * classes with the package name of the MainApplication.
     *
     *     We want to match "R" or "BuildConfig":
     *     - new Package(R.string…),
     *     - Module.configure(BuildConfig);
     *     ^ hence including (BuildConfig|R)
     *     but we don't want to match "R":
     *     - new Package(getResources…),
     *     - new PackageR…,
     *     - new Royal…,
     *     ^ hence excluding \w before and after matches
     *     and "BuildConfig" that has FQDN reference:
     *     - Module.configure(com.acme.BuildConfig);
     *     ^ hence excluding . before the match.
     */
    internal fun interpolateDynamicValues(input: String, packageName: String): String =
        input.replace(Regex("([^.\\w])(BuildConfig|R)(\\W)")) { match ->
          val (prefix, className, suffix) = match.destructured
          "${prefix}${packageName}.${className}${suffix}"
        }

    // language=java
    val generatedFileContentsTemplate =
        """
        package com.facebook.react;

        import android.app.Application;
        import android.content.Context;
        import android.content.res.Resources;

        import com.facebook.react.ReactPackage;
        import com.facebook.react.shell.MainPackageConfig;
        import com.facebook.react.shell.MainReactPackage;
        import java.util.Arrays;
        import java.util.ArrayList;

        @SuppressWarnings("deprecation")
        public class PackageList {
          private Application application;
          private ReactNativeHost reactNativeHost;
          private MainPackageConfig mConfig;

          public PackageList(ReactNativeHost reactNativeHost) {
            this(reactNativeHost, null);
          }

          public PackageList(Application application) {
            this(application, null);
          }

          public PackageList(ReactNativeHost reactNativeHost, MainPackageConfig config) {
            this.reactNativeHost = reactNativeHost;
            mConfig = config;
          }

          public PackageList(Application application, MainPackageConfig config) {
            this.reactNativeHost = null;
            this.application = application;
            mConfig = config;
          }

          private ReactNativeHost getReactNativeHost() {
            return this.reactNativeHost;
          }

          private Resources getResources() {
            return this.getApplication().getResources();
          }

          private Application getApplication() {
            if (this.reactNativeHost == null) return this.application;
            return this.reactNativeHost.getApplication();
          }

          private Context getApplicationContext() {
            return this.getApplication().getApplicationContext();
          }

          public ArrayList<ReactPackage> getPackages() {
            return new ArrayList<>(Arrays.<ReactPackage>asList(
              new MainReactPackage(mConfig){{ packageClassInstances }}
            ));
          }
        }
        """
            .trimIndent()
  }
}
