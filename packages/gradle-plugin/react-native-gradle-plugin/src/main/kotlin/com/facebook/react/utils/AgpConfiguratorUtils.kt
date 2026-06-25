/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.android.build.api.variant.ApplicationAndroidComponentsExtension
import com.android.build.api.variant.LibraryAndroidComponentsExtension
import com.facebook.react.ReactExtension
import com.facebook.react.utils.ProjectUtils.isEdgeToEdgeEnabled
import com.facebook.react.utils.ProjectUtils.isHermesEnabled
import java.io.File
import java.net.Inet4Address
import java.net.NetworkInterface
import javax.xml.parsers.DocumentBuilder
import javax.xml.parsers.DocumentBuilderFactory
import org.gradle.api.Action
import org.gradle.api.Project
import org.gradle.api.plugins.AppliedPlugin
import org.w3c.dom.Element

@Suppress("UnstableApiUsage")
internal object AgpConfiguratorUtils {

  fun configureBuildTypesForApp(project: Project) {
    val action =
        Action<AppliedPlugin> {
          project.extensions
              .getByType(ApplicationAndroidComponentsExtension::class.java)
              .finalizeDsl { ext ->
                ext.buildTypes {
                  val debug =
                      getByName("debug").apply {
                        manifestPlaceholders["usesCleartextTraffic"] = "true"
                      }
                  getByName("release").apply {
                    manifestPlaceholders["usesCleartextTraffic"] = "false"
                  }
                  maybeCreate("debugOptimized").apply {
                    manifestPlaceholders["usesCleartextTraffic"] = "true"
                    initWith(debug)
                    matchingFallbacks += listOf("release")
                    externalNativeBuild { cmake { arguments("-DCMAKE_BUILD_TYPE=Release") } }
                  }
                }
              }
        }
    project.pluginManager.withPlugin("com.android.application", action)
  }

  fun configureBuildConfigFieldsForApp(project: Project, extension: ReactExtension) {
    val action =
        Action<AppliedPlugin> {
          project.extensions
              .getByType(ApplicationAndroidComponentsExtension::class.java)
              .finalizeDsl { ext ->
                ext.buildFeatures.buildConfig = true
                ext.defaultConfig.buildConfigField("boolean", "IS_NEW_ARCHITECTURE_ENABLED", "true")
                ext.defaultConfig.buildConfigField(
                    "boolean",
                    "IS_HERMES_ENABLED",
                    project.isHermesEnabled.toString(),
                )
                ext.defaultConfig.buildConfigField(
                    "boolean",
                    "IS_EDGE_TO_EDGE_ENABLED",
                    project.isEdgeToEdgeEnabled.toString(),
                )
              }
        }
    project.pluginManager.withPlugin("com.android.application", action)
    project.pluginManager.withPlugin("com.android.library", action)
  }

  fun configureBuildConfigFieldsForLibraries(project: Project) {
    project.extensions.getByType(LibraryAndroidComponentsExtension::class.java).finalizeDsl { ext ->
      ext.buildFeatures.buildConfig = true
    }
  }

  fun configureDevServerLocation(project: Project) {
    val devServerIp = project.properties["reactNativeDevServerIp"]?.toString() ?: getHostIpAddress()
    val devServerPort =
        project.properties["reactNativeDevServerPort"]?.toString() ?: DEFAULT_DEV_SERVER_PORT

    val action =
        Action<AppliedPlugin> {
          project.extensions
              .getByType(ApplicationAndroidComponentsExtension::class.java)
              .finalizeDsl { ext ->
                ext.buildFeatures.resValues = true
                ext.defaultConfig.resValue(
                    "string",
                    "react_native_dev_server_ip",
                    devServerIp,
                )
                ext.defaultConfig.resValue("integer", "react_native_dev_server_port", devServerPort)
              }
        }

    project.pluginManager.withPlugin("com.android.application", action)
    project.pluginManager.withPlugin("com.android.library", action)
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
              getPackageNameFromManifest(file)?.let { packageName ->
                ext.namespace = packageName
              }
            }
      }
    }
  }
}

private const val NAMESPACE_CONFIGURED_PROPERTY = "com.facebook.react.internal.namespaceConfigured"

const val DEFAULT_DEV_SERVER_PORT = "8081"

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

internal fun getHostIpAddress(): String =
    NetworkInterface.getNetworkInterfaces()
        .asSequence()
        .filter { it.isUp && !it.isLoopback }
        .flatMap { it.inetAddresses.asSequence() }
        .filter { it is Inet4Address && !it.isLoopbackAddress }
        .map { it.hostAddress }
        .firstOrNull() ?: "localhost"
