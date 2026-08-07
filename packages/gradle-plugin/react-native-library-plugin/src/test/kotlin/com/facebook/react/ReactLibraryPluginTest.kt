/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.internal.PrivateReactExtension
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ReactLibraryPluginTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun apply_createsReactExtensions() {
    val project = ProjectBuilder.builder().build()

    project.plugins.apply("com.facebook.react.library")

    assertThat(project.extensions.findByType(ReactExtension::class.java)).isNotNull()
    assertThat(project.rootProject.extensions.findByType(PrivateReactExtension::class.java))
        .isNotNull()
  }

  @Test
  fun apply_afterAndroidLibrary_configuresLibraryCodegenTasks() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.newFolder("library")).build()

    project.plugins.apply("com.android.library")
    project.plugins.apply("com.facebook.react.library")

    assertThat(project.tasks.findByName("generateCodegenSchemaFromJavaScript")).isNotNull()
    assertThat(project.tasks.findByName("generateCodegenArtifactsFromSchema")).isNotNull()
  }

  @Test
  fun apply_beforeAndroidLibrary_configuresLibraryCodegenTasks() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.newFolder("library")).build()

    project.plugins.apply("com.facebook.react.library")
    project.plugins.apply("com.android.library")

    assertThat(project.tasks.findByName("generateCodegenSchemaFromJavaScript")).isNotNull()
    assertThat(project.tasks.findByName("generateCodegenArtifactsFromSchema")).isNotNull()
  }

  @Test
  fun apply_afterReactPlugin_fails() {
    val project = ProjectBuilder.builder().build()
    project.plugins.apply("com.facebook.react")

    assertThatThrownBy { project.plugins.apply("com.facebook.react.library") }
        .hasRootCauseMessage(
            "A React Native Android project must not apply both com.facebook.react and " +
                "com.facebook.react.library. Use com.facebook.react.library for Android " +
                "libraries and com.facebook.react for Android applications."
        )
  }

  @Test
  fun apply_beforeReactPlugin_failsWhenReactPluginIsApplied() {
    val project = ProjectBuilder.builder().build()
    project.plugins.apply("com.facebook.react.library")

    assertThatThrownBy { project.plugins.apply("com.facebook.react") }
        .hasRootCauseMessage(
            "A React Native Android project must not apply both com.facebook.react and " +
                "com.facebook.react.library. Use com.facebook.react.library for Android " +
                "libraries and com.facebook.react for Android applications."
        )
  }

  @Test
  fun apply_afterAndroidApplication_fails() {
    val project =
        ProjectBuilder.builder().withProjectDir(tempFolder.newFolder("application")).build()
    project.plugins.apply("com.android.application")

    assertThatThrownBy { project.plugins.apply("com.facebook.react.library") }
        .hasRootCauseMessage(
            "com.facebook.react.library can only be used with Android library projects. " +
                "Use com.facebook.react for Android applications."
        )
  }

  @Test
  fun apply_beforeAndroidApplication_failsWhenAndroidApplicationIsApplied() {
    val project =
        ProjectBuilder.builder().withProjectDir(tempFolder.newFolder("application")).build()
    project.plugins.apply("com.facebook.react.library")

    assertThatThrownBy { project.plugins.apply("com.android.application") }
        .hasRootCauseMessage(
            "com.facebook.react.library can only be used with Android library projects. " +
                "Use com.facebook.react for Android applications."
        )
  }
}
