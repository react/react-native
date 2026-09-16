/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import javax.inject.Inject
import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.CopySpec
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.DuplicatesStrategy
import org.gradle.api.file.FileSystemOperations
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*

/**
 * A task that takes care of extracting gflags from a source folder/zip and preparing it to be
 * consumed by the NDK. This task will also take care of applying the mapping for gflags parameters.
 */
abstract class PrepareGflagsTask : DefaultTask() {

  @get:InputFiles abstract val gflagsPath: ConfigurableFileCollection
  @get:InputDirectory abstract val gflagsThirdPartyPath: DirectoryProperty
  @get:Input abstract val gflagsVersion: Property<String>

  @get:OutputDirectory abstract val outputDir: DirectoryProperty

  @get:Inject abstract val fs: FileSystemOperations

  @TaskAction
  fun taskAction() {
    val commonCopyConfig: (action: CopySpec) -> Unit = { action ->
      action.from(gflagsPath)
      action.from(gflagsThirdPartyPath)
      action.duplicatesStrategy = DuplicatesStrategy.INCLUDE
      action.includeEmptyDirs = false
      action.into(outputDir)
    }

    fs.copy { action ->
      commonCopyConfig(action)
      action.include(
          "gflags-${gflagsVersion.get()}/src/*.h",
          "gflags-${gflagsVersion.get()}/src/*.cc",
          "CMakeLists.txt",
      )
      action.filesMatching("*/src/*") { matchedFile ->
        matchedFile.path = "gflags/${matchedFile.name}"
      }
    }

    fs.copy { action ->
      commonCopyConfig(action)
      action.include("gflags-${gflagsVersion.get()}/src/gflags_declare.h.in")
      action.filesMatching("*/src/*") { matchedFile ->
        matchedFile.filter { line ->
          // Replace all placeholders with appropriate values
          // see https://github.com/gflags/gflags/blob/v2.2.0/src/gflags_declare.h.in
          line
              .replace(Regex("@GFLAGS_NAMESPACE@"), "gflags")
              .replace(
                  Regex(
                      "@(HAVE_STDINT_H|HAVE_SYS_TYPES_H|HAVE_INTTYPES_H|GFLAGS_INTTYPES_FORMAT_C99)@",
                  ),
                  "1",
              )
              .replace(Regex("@([A-Z0-9_]+)@"), "1")
        }
        matchedFile.path = "gflags/${matchedFile.name.removeSuffix(".in")}"
      }
    }

    fs.copy { action ->
      commonCopyConfig(action)
      action.include("gflags-${gflagsVersion.get()}/src/config.h.in")
      action.filesMatching("*/src/*") { matchedFile ->
        matchedFile.filter { line -> line.replace(Regex("^#cmakedefine"), "//cmakedefine") }
        matchedFile.path = "gflags/${matchedFile.name.removeSuffix(".in")}"
      }
    }

    fs.copy { action ->
      commonCopyConfig(action)
      action.include("gflags-${gflagsVersion.get()}/src/gflags_ns.h.in")
      action.filesMatching("*/src/*") { matchedFile ->
        matchedFile.filter { line ->
          line.replace(Regex("@ns@"), "google").replace(Regex("@NS@"), "google".uppercase())
        }
        matchedFile.path = "gflags/gflags_google.h"
      }
    }

    fs.copy { action ->
      commonCopyConfig(action)
      action.include("gflags-${gflagsVersion.get()}/src/gflags.h.in")
      action.filesMatching("*/src/*") { matchedFile ->
        matchedFile.filter { line ->
          line
              .replace(Regex("@GFLAGS_ATTRIBUTE_UNUSED@"), "")
              .replace(Regex("@INCLUDE_GFLAGS_NS_H@"), "#include \"gflags/gflags_google.h\"")
        }
        matchedFile.path = "gflags/${matchedFile.name.removeSuffix(".in")}"
      }
    }

    fs.copy { action ->
      commonCopyConfig(action)
      action.include("gflags-${gflagsVersion.get()}/src/gflags_completions.h.in")
      action.filesMatching("*/src/*") { matchedFile ->
        matchedFile.filter { line -> line.replace(Regex("@GFLAGS_NAMESPACE@"), "gflags") }
        matchedFile.path = "gflags/${matchedFile.name.removeSuffix(".in")}"
      }
    }
  }
}
