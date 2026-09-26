/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.android.build.api.variant.LibraryAndroidComponentsExtension
import java.io.File
import javax.xml.parsers.DocumentBuilder
import javax.xml.parsers.DocumentBuilderFactory
import org.gradle.api.Project
import org.w3c.dom.Element

@Suppress("UnstableApiUsage")
object LibraryAgpConfiguratorUtils {
  fun configureBuildConfigFieldsForLibraries(project: Project) {
    project.extensions.getByType(LibraryAndroidComponentsExtension::class.java).finalizeDsl { ext ->
      ext.buildFeatures.buildConfig = true
    }
  }

  fun configureNamespaceForLibraries(project: Project) {
    // This helper can be reached both from a library's own application of the React plugin and
    // from the app-level sweep in ReactPlugin (which also covers libraries that don't apply
    // `com.facebook.react`). A project's `finalizeDsl` callback must be registered before AGP
    // finalizes its DSL — registering it twice (or after finalization) is a hard error on AGP 9+ —
    // so we guard to register the namespace fallback at most once per project.
    if (project.extensions.extraProperties.has(NAMESPACE_CONFIGURED_PROPERTY)) {
      return
    }
    project.extensions.extraProperties.set(NAMESPACE_CONFIGURED_PROPERTY, true)
    project.extensions.getByType(LibraryAndroidComponentsExtension::class.java).finalizeDsl { ext ->
      if (ext.namespace == null) {
        val manifestFile =
            project.layout.projectDirectory.file("src/main/AndroidManifest.xml").asFile
        manifestFile
            .takeIf { it.exists() }
            ?.let { file ->
              getPackageNameFromManifest(file)?.let { packageName -> ext.namespace = packageName }
            }
      }
    }
  }
}

private const val NAMESPACE_CONFIGURED_PROPERTY = "com.facebook.react.internal.namespaceConfigured"

fun getPackageNameFromManifest(manifest: File): String? {
  val factory: DocumentBuilderFactory = DocumentBuilderFactory.newInstance()
  val builder: DocumentBuilder = factory.newDocumentBuilder()

  try {
    val xmlDocument = builder.parse(manifest)

    val manifestElement = xmlDocument.getElementsByTagName("manifest").item(0) as? Element
    val packageName = manifestElement?.getAttribute("package")

    return if (packageName.isNullOrEmpty()) null else packageName
  } catch (e: Exception) {
    return null
  }
}
