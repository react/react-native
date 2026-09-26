/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.internal.PrivateReactExtension
import com.facebook.react.utils.LibraryAgpConfiguratorUtils.configureBuildConfigFieldsForLibraries
import com.facebook.react.utils.LibraryAgpConfiguratorUtils.configureNamespaceForLibraries
import org.gradle.api.Project

object ReactLibraryConfigurator {
  fun configure(
      project: Project,
      extension: ReactExtension,
      rootExtension: PrivateReactExtension,
  ) {
    configureBuildConfigFieldsForLibraries(project)
    configureNamespaceForLibraries(project)
    ReactLibraryCodegenConfigurator.configureCodegen(
        project = project,
        localExtension = extension,
        rootExtension = rootExtension,
    )
  }
}
