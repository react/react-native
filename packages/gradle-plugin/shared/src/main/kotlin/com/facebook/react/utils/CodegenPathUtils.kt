/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.model.ModelPackageJson
import java.io.File
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty

fun projectPathToLibraryName(projectPath: String): String =
    projectPath
        .split(':', '-', '_', '.')
        .joinToString("") { token -> token.replaceFirstChar { it.titlecase() } }
        .plus("Spec")

/**
 * Function to look for the relevant `package.json`. We first look in the parent folder of this
 * Gradle module (generally the case for library projects) or we fallback to looking into the `root`
 * folder of a React Native project (generally the case for app projects).
 */
fun findPackageJsonFile(project: Project, rootProperty: DirectoryProperty): File? {
  val inParent = project.file("../package.json")
  if (inParent.exists()) {
    return inParent
  }

  val fromExtension = rootProperty.file("package.json").orNull?.asFile
  if (fromExtension?.exists() == true) {
    return fromExtension
  }

  return null
}

/**
 * Function to look for the `package.json` and parse it. It returns a [ModelPackageJson] if found or
 * null otherwise.
 *
 * Please note that this function accesses the [DirectoryProperty] parameter and calls .get() on it,
 * so calling this during apply() of the ReactPlugin is not recommended. It should be invoked inside
 * lazy lambdas or at execution time.
 */
fun readPackageJsonFile(
    project: Project,
    rootProperty: DirectoryProperty,
): ModelPackageJson? {
  val packageJson = findPackageJsonFile(project, rootProperty)
  return packageJson?.let { JsonUtils.fromPackageJson(it) }
}
