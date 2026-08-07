/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.model.ModelPackageJson
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty

object ProjectCodegenUtils {
  fun Project.needsCodegenFromPackageJson(rootProperty: DirectoryProperty): Boolean {
    val parsedPackageJson = readPackageJsonFile(this, rootProperty)
    return needsCodegenFromPackageJson(parsedPackageJson)
  }

  fun Project.needsCodegenFromPackageJson(model: ModelPackageJson?): Boolean {
    return model?.codegenConfig != null
  }
}
