/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import java.io.File
import javax.inject.Inject
import org.apache.tools.ant.filters.ReplaceTokens
import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.DuplicatesStrategy
import org.gradle.api.file.FileSystemOperations
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*

/**
 * A task that takes care of extracting Glog from a source folder/zip and preparing it to be
 * consumed by the NDK. This task will also take care of applying the mapping for Glog parameters.
 */
abstract class PrepareGlogTask : DefaultTask() {

  @get:InputFiles abstract val glogPath: ConfigurableFileCollection
  @get:InputDirectory abstract val glogThirdPartyJniPath: DirectoryProperty
  @get:Input abstract val glogVersion: Property<String>

  @get:OutputDirectory abstract val outputDir: DirectoryProperty

  @get:Inject abstract val fs: FileSystemOperations

  @TaskAction
  fun taskAction() {
    fs.copy { action ->
      action.from(glogPath)
      action.from(glogThirdPartyJniPath)
      action.include("glog-${glogVersion.get()}/src/**/*", "CMakeLists.txt", "config.h")
      action.duplicatesStrategy = DuplicatesStrategy.INCLUDE
      action.includeEmptyDirs = false
      action.filesMatching("**/*.h.in") { matchedFile ->
        matchedFile.filter(
            mapOf(
                "tokens" to
                    mapOf(
                        "ac_cv_have_unistd_h" to "1",
                        "ac_cv_have_stdint_h" to "1",
                        "ac_cv_have_systypes_h" to "1",
                        "ac_cv_have_inttypes_h" to "1",
                        "ac_cv_have_libgflags" to "0",
                        "ac_google_start_namespace" to "namespace google {",
                        "ac_cv_have_uint16_t" to "1",
                        "ac_cv_have_u_int16_t" to "1",
                        "ac_cv_have___uint16" to "0",
                        "ac_google_end_namespace" to "}",
                        "ac_cv_have___builtin_expect" to "1",
                        "ac_google_namespace" to "google",
                        "ac_cv___attribute___noinline" to "__attribute__ ((noinline))",
                        "ac_cv___attribute___noreturn" to "__attribute__ ((noreturn))",
                        "ac_cv___attribute___printf_4_5" to
                            "__attribute__((__format__ (__printf__, 4, 5)))",
                    ),
            ),
            ReplaceTokens::class.java,
        )
        matchedFile.path = (matchedFile.name.removeSuffix(".in"))
      }
      action.into(outputDir)
    }
    val exportedDir = File(outputDir.asFile.get(), "exported/glog/").apply { mkdirs() }
    fs.copy { action ->
      action.from(outputDir)
      action.include(
          "stl_logging.h",
          "logging.h",
          "raw_logging.h",
          "vlog_is_on.h",
          "**/src/glog/log_severity.h",
      )
      action.eachFile { file -> file.path = file.name }
      action.includeEmptyDirs = false
      action.into(exportedDir)
    }
  }
}
