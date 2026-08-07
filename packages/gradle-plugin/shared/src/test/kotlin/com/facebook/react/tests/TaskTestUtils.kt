/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

import java.io.File
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.testfixtures.ProjectBuilder

internal fun createProject(projectDir: File? = null): Project =
    ProjectBuilder.builder()
        .apply {
          if (projectDir != null) {
            withProjectDir(projectDir)
          }
        }
        .build()

internal inline fun <reified T : Task> createTestTask(
    project: Project = createProject(),
    taskName: String = T::class.java.simpleName,
    crossinline block: (T) -> Unit = {},
): T = project.tasks.register(taskName, T::class.java) { block(it) }.get()
