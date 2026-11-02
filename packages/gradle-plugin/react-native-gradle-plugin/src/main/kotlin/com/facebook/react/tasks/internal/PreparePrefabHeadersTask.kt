/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.tasks.internal.utils.PrefabPreprocessingEntry
import java.io.File
import javax.inject.Inject
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.FileCollection
import org.gradle.api.file.FileSystemOperations
import org.gradle.api.file.FileTree
import org.gradle.api.file.RegularFile
import org.gradle.api.model.ObjectFactory
import org.gradle.api.provider.ListProperty
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputFiles
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction

/**
 * A task that takes care of copying headers and filtering them so that can be consumed by the
 * Prefab protocol. This task handles also the header prefixes.
 *
 * It currently filters out some of the Boost headers as they're not used by React Native and are
 * resulting in bigger .aar (250Mb+).
 *
 * You should provide in input a list fo [PrefabPreprocessingEntry] that will be used by this task
 * to do the necessary copy operations.
 */
abstract class PreparePrefabHeadersTask : DefaultTask() {

  @get:Input abstract val input: ListProperty<PrefabPreprocessingEntry>

  @get:OutputDirectory abstract val outputDir: DirectoryProperty

  @get:InputFiles
  val headers: FileCollection
    get() =
        objects
            .fileCollection()
            .from(
                input.map { entries ->
                  entries.flatMap { (_, pathToPrefixCouples) ->
                    pathToPrefixCouples.map { (headerPath, _) -> headersUnder(headerPath) }
                  }
                }
            )

  @get:Inject abstract val fs: FileSystemOperations

  @get:Inject abstract val objects: ObjectFactory

  @TaskAction
  fun taskAction() {
    input.get().forEach { (libraryName, pathToPrefixCouples) ->
      val outputFolder: RegularFile = outputDir.file(libraryName).get()
      fs.delete { deleteSpec -> deleteSpec.delete(outputFolder) }
      pathToPrefixCouples.forEach { (headerPath, headerPrefix) ->
        fs.copy { copySpec ->
          copySpec.from(headersUnder(headerPath))
          copySpec.into(File(outputFolder.asFile, headerPrefix))
        }
      }
    }
  }

  private fun headersUnder(headerPath: String): FileTree =
      objects.fileTree().from(headerPath).matching { patterns ->
        patterns.include("**/*.h")
        patterns.exclude("**/*.cpp")
        patterns.exclude("**/*.txt")
        // We don't want to copy all the boost headers as they are 250Mb+
        patterns.include("boost/config.hpp")
        patterns.include("boost/config/**/*.hpp")
        patterns.include("boost/core/*.hpp")
        patterns.include("boost/detail/workaround.hpp")
        patterns.include("boost/operators.hpp")
        patterns.include("boost/preprocessor/**/*.hpp")
        // Headers needed for exposing rrc_text and rrc_textinput
        patterns.include("boost/container_hash/**/*.hpp")
        patterns.include("boost/detail/**/*.hpp")
        patterns.include("boost/intrusive/**/*.hpp")
        patterns.include("boost/iterator/**/*.hpp")
        patterns.include("boost/move/**/*.hpp")
        patterns.include("boost/mpl/**/*.hpp")
        patterns.include("boost/mp11/**/*.hpp")
        patterns.include("boost/describe/**/*.hpp")
        patterns.include("boost/type_traits/**/*.hpp")
        patterns.include("boost/utility/**/*.hpp")
        patterns.include("boost/assert.hpp")
        patterns.include("boost/static_assert.hpp")
        patterns.include("boost/cstdint.hpp")
        patterns.include("boost/utility.hpp")
        patterns.include("boost/version.hpp")
      }
}
