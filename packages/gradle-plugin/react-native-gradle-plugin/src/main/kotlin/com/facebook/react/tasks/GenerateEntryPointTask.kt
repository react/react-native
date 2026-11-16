/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.JsonUtils
import java.io.File
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction

abstract class GenerateEntryPointTask : DefaultTask() {

  init {
    group = "react"
  }

  @get:InputFile abstract val autolinkInputFile: RegularFileProperty

  @get:OutputDirectory abstract val generatedOutputDirectory: DirectoryProperty

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
    val generatedFileContents = composeFileContent(packageName)

    val outputDir = generatedOutputDirectory.get().asFile
    outputDir.mkdirs()
    File(outputDir, GENERATED_FILENAME).apply {
      parentFile.mkdirs()
      writeText(generatedFileContents)
    }
  }

  internal fun composeFileContent(packageName: String): String =
      generatedFileContentsTemplate.replace("{{packageName}}", packageName)

  companion object {
    const val GENERATED_FILENAME = "com/facebook/react/ReactNativeApplicationEntryPoint.java"

    // language=java
    val generatedFileContentsTemplate =
        """
        package com.facebook.react;

        import android.app.Application;
        import android.content.Context;
        import android.content.res.Resources;

        import com.facebook.react.ReactApplication;
        import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
        import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger;
        import com.facebook.react.views.view.WindowUtilKt;
        import com.facebook.react.soloader.OpenSourceMergedSoMapping;
        import com.facebook.soloader.SoLoader;

        /**
          * This class is the entry point for loading React Native using the configuration
          * that the users specifies in their .gradle files.
          *
          * The `loadReactNative(this)` method invocation should be called inside the
          * application onCreate otherwise the app won't load correctly.            
          *
          * `loadReactNative(this, true)` additionally starts the ReactHost right away, so the
          * React instance (JS runtime, TurboModules, bundle evaluation) is created on the
          * ReactHost background thread while the first Activity is being created, instead of
          * only once that Activity starts its surface. This makes the first React content
          * appear earlier at the cost of a slightly later first (empty) frame, and it creates
          * the React instance for every process start, including ones that never show an
          * Activity (e.g. a headless task or a push service).
          */
        public class ReactNativeApplicationEntryPoint {
          public static void loadReactNative(Context context) {
            loadReactNative(context, false);
          }

          public static void loadReactNative(Context context, boolean startReactHost) {
            SoLoader.init(context, OpenSourceMergedSoMapping.INSTANCE);
            
            if ({{packageName}}.BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
              DefaultNewArchitectureEntryPoint.load();
            }
            
            if ({{packageName}}.BuildConfig.IS_EDGE_TO_EDGE_ENABLED) {
              WindowUtilKt.setEdgeToEdgeFeatureFlagOn();
            }

            if (startReactHost && context instanceof ReactApplication) {
              ((ReactApplication) context).getReactHost().start();
            }
          }
        }
        """
            .trimIndent()
  }
}
