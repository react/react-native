/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Duplicated from react-native-library-plugin for backward compat; remove when
// `com.facebook.react` library support is dropped.

package com.facebook.react.internal.deprecated

import com.facebook.react.ReactExtension
import com.facebook.react.internal.PrivateReactExtension
import org.gradle.api.Project

object DeprecatedReactLibraryConfigurator {
  fun configure(
      project: Project,
      extension: ReactExtension,
      rootExtension: PrivateReactExtension,
  ) {
    DeprecatedLibraryAgpConfiguratorUtils.configureBuildConfigFieldsForLibraries(project)
    DeprecatedLibraryAgpConfiguratorUtils.configureNamespaceForLibraries(project)
    DeprecatedReactLibraryCodegenConfigurator.configureCodegen(
        project = project,
        localExtension = extension,
        rootExtension = rootExtension,
    )
  }
}
