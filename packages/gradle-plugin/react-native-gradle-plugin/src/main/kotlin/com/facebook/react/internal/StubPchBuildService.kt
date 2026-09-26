/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal

import com.facebook.react.utils.StubPchUtils
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.logging.Logging
import org.gradle.api.services.BuildService
import org.gradle.api.services.BuildServiceParameters

/**
 * Generates stub precompiled headers when the build finishes. See [StubPchUtils].
 *
 * Android Studio configures the C++ projects of the selected variant while it fetches the Gradle
 * models (during sync), which happens after all tasks have run. A build service is closed after
 * that, so by the time [close] runs the `compile_commands.json` files of exactly the variant and
 * ABI that Studio requested are on disk.
 */
abstract class StubPchBuildService : BuildService<StubPchBuildService.Params>, AutoCloseable {

  interface Params : BuildServiceParameters {
    val cxxDirectory: DirectoryProperty
  }

  override fun close() {
    try {
      StubPchUtils.generateStubs(parameters.cxxDirectory.get().asFile)
    } catch (e: Exception) {
      logger.warn("RNGP - Could not generate stub precompiled headers: ${e.message}")
    }
  }

  companion object {
    private val logger = Logging.getLogger(StubPchBuildService::class.java)
  }
}
