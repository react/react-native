/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal

import javax.inject.Inject
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.ListProperty

/**
 * A private extension we set on the rootProject to make easier to share values at execution time
 * between app project and library project.
 *
 * Specifically, the [codegenDir], [reactNativeDir] and other properties should be provided by apps
 * (for setups like a monorepo which are app specific) and libraries should honor those values.
 *
 * Users are not supposed to access directly this extension from their build.gradle file.
 */
abstract class PrivateReactExtension @Inject constructor(project: Project) {

  private val objects = project.objects

  val root: DirectoryProperty =
      objects
          .directoryProperty()
          .convention(
              // This is the default for the project root if the users hasn't specified anything.
              // If the project is called "react-native-github" or "react-native-build-from-source"
              //   - We're inside the Github Repo -> root is defined by RN Tester (so no default
              // needed)
              //   - We're inside an includedBuild as we're performing a build from source
              //     (then we're inside `node_modules/react-native`, so default should be ../../)
              // If the project is called in any other name
              //   - We're inside a user project, so inside the ./android folder. Default should be
              // ../
              // User can always override this default by setting a `root =` inside the template.
              if (
                  project.rootProject.name == "react-native-github" ||
                      project.rootProject.name == "react-native-build-from-source"
              ) {
                project.rootProject.layout.projectDirectory.dir("../../")
              } else {
                project.rootProject.layout.projectDirectory.dir("../")
              }
          )

  val reactNativeDir: DirectoryProperty =
      objects.directoryProperty().convention(root.dir("node_modules/react-native"))

  val nodeExecutableAndArgs: ListProperty<String> =
      objects.listProperty(String::class.java).convention(listOf("node"))

  val codegenDir: DirectoryProperty =
      objects.directoryProperty().convention(root.dir("node_modules/@react-native/codegen"))
}
