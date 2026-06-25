/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.utils.PropertyUtils.DEFAULT_INTERNAL_HERMES_PUBLISHING_GROUP
import com.facebook.react.utils.PropertyUtils.DEFAULT_INTERNAL_REACT_PUBLISHING_GROUP
import com.facebook.react.utils.PropertyUtils.EXCLUSIVE_ENTEPRISE_REPOSITORY
import com.facebook.react.utils.PropertyUtils.INCLUDE_JITPACK_REPOSITORY
import com.facebook.react.utils.PropertyUtils.INCLUDE_JITPACK_REPOSITORY_DEFAULT
import com.facebook.react.utils.PropertyUtils.INTERNAL_HERMES_PUBLISHING_GROUP
import com.facebook.react.utils.PropertyUtils.INTERNAL_HERMES_VERSION_NAME
import com.facebook.react.utils.PropertyUtils.INTERNAL_REACT_NATIVE_MAVEN_LOCAL_REPO
import com.facebook.react.utils.PropertyUtils.INTERNAL_REACT_PUBLISHING_GROUP
import com.facebook.react.utils.PropertyUtils.INTERNAL_USE_HERMES_NIGHTLY
import com.facebook.react.utils.PropertyUtils.INTERNAL_VERSION_NAME
import com.facebook.react.utils.PropertyUtils.SCOPED_EXCLUSIVE_ENTEPRISE_REPOSITORY
import com.facebook.react.utils.PropertyUtils.SCOPED_INCLUDE_JITPACK_REPOSITORY
import java.io.File
import java.net.URI
import java.util.*
import org.gradle.api.Project
import org.gradle.api.artifacts.repositories.MavenArtifactRepository

internal object DependencyUtils {

  internal data class Coordinates(
      val versionString: String,
      val hermesVersionString: String,
      val reactGroupString: String = DEFAULT_INTERNAL_REACT_PUBLISHING_GROUP,
      val hermesGroupString: String = DEFAULT_INTERNAL_HERMES_PUBLISHING_GROUP,
      private val isHermesNightly: Boolean = false,
  ) {
    val isNightly: Boolean
      get() = versionString.isNightly() || isHermesNightly
  }

  /**
   * This method takes care of configuring the repositories{} block for both the app and all the 3rd
   * party libraries which are auto-linked.
   */
  fun configureRepositories(project: Project, isNightly: Boolean) {
    val exclusiveEnterpriseRepository = project.rootProject.exclusiveEnterpriseRepository()
    if (exclusiveEnterpriseRepository != null) {
      project.logger.lifecycle(
          "Replacing ALL Maven Repositories with: $exclusiveEnterpriseRepository"
      )
    }

    project.rootProject.allprojects { eachProject ->
      with(eachProject) {
        if (hasProperty(INTERNAL_REACT_NATIVE_MAVEN_LOCAL_REPO)) {
          val mavenLocalRepoPath = property(INTERNAL_REACT_NATIVE_MAVEN_LOCAL_REPO) as String
          mavenRepoFromURI(File(mavenLocalRepoPath).toURI()) { repo ->
            repo.content { it.excludeGroup("org.webkit") }
          }
        }

        if (exclusiveEnterpriseRepository != null) {
          // We remove all previously set repositories and only configure the proxy provided by the
          // user.
          rootProject.repositories.clear()
          mavenRepoFromUrl(exclusiveEnterpriseRepository)
          // We return here as we don't want to configure other repositories as well.
          return@allprojects
        }

        if (isNightly) {
          // We add the snapshot for users on nightlies.
          mavenRepoFromUrl("https://central.sonatype.com/repository/maven-snapshots/") { repo ->
            repo.content { it.excludeGroup("org.webkit") }
          }
        }
        repositories.mavenCentral { repo ->
          // We don't want to fetch JSC from Maven Central as there are older versions there.
          repo.content { it.excludeGroup("org.webkit") }

          // If the user provided a react.internal.mavenLocalRepo, do not attempt to load
          // anything from Maven Central that is react related.
          if (hasProperty(INTERNAL_REACT_NATIVE_MAVEN_LOCAL_REPO)) {
            repo.content { it.excludeGroup("com.facebook.react") }
          }
        }
        repositories.google { repo ->
          repo.content {
            // We don't want to fetch JSC or React from Google
            it.excludeGroup("org.webkit")
            it.excludeGroup("io.github.react-native-community")
            it.excludeGroup("com.facebook.react")
          }
        }
        if (shouldAddJitPack()) {
          mavenRepoFromUrl("https://www.jitpack.io") { repo ->
            repo.content { content ->
              // We don't want to fetch JSC or React from JitPack
              content.excludeGroup("org.webkit")
              content.excludeGroup("io.github.react-native-community")
              content.excludeGroup("com.facebook.react")
            }
          }
        }
      }
    }
  }

  /**
   * This method takes care of configuring the resolution strategy for both the app and all the 3rd
   * party libraries which are auto-linked. Specifically it takes care of:
   * - Forcing the react-android/hermes-android version to the one specified in the package.json
   * - Substituting `react-native` with `react-android` and `hermes-engine` with `hermes-android`
   */
  fun configureDependencies(
      project: Project,
      coordinates: Coordinates,
  ) {
    if (coordinates.versionString.isBlank() || coordinates.hermesVersionString.isBlank()) return
    project.rootProject.allprojects { eachProject ->
      eachProject.configurations.all { configuration ->
        // Here we set a dependencySubstitution for both react-native and hermes-engine as those
        // coordinates are voided due to https://github.com/facebook/react-native/issues/35210
        // This allows users to import libraries that are still using
        // implementation("com.facebook.react:react-native:+") and resolve the right dependency.
        configuration.resolutionStrategy.dependencySubstitution {
          getDependencySubstitutions(coordinates).forEach { (module, dest, reason) ->
            it.substitute(it.module(module)).using(it.module(dest)).because(reason)
          }
        }
        configuration.resolutionStrategy.force(
            "${coordinates.reactGroupString}:react-android:${coordinates.versionString}",
        )
        if (!(eachProject.findProperty(INTERNAL_USE_HERMES_NIGHTLY) as? String).toBoolean()) {
          // Contributors only: The hermes-engine version is forced only if the user has
          // not opted into using nightlies for local development.
          configuration.resolutionStrategy.force(
              "${coordinates.hermesGroupString}:hermes-android:${coordinates.hermesVersionString}"
          )
        }
      }
    }
  }

  internal fun getDependencySubstitutions(
      coordinates: Coordinates,
  ): List<Triple<String, String, String>> {
    val dependencySubstitution = mutableListOf<Triple<String, String, String>>()
    val hermesVersionString =
        "${coordinates.hermesGroupString}:hermes-android:${coordinates.hermesVersionString}"
    dependencySubstitution.add(
        Triple(
            "com.facebook.react:react-native",
            "${coordinates.reactGroupString}:react-android:${coordinates.versionString}",
            "The react-native artifact was deprecated in favor of react-android due to https://github.com/facebook/react-native/issues/35210.",
        )
    )
    dependencySubstitution.add(
        Triple(
            "com.facebook.react:hermes-engine",
            hermesVersionString,
            "The hermes-engine artifact was deprecated in favor of hermes-android due to https://github.com/facebook/react-native/issues/35210.",
        )
    )
    dependencySubstitution.add(
        Triple(
            "com.facebook.react:hermes-android",
            hermesVersionString,
            "The hermes-android artifact was moved to com.facebook.hermes publishing group.",
        )
    )
    if (coordinates.reactGroupString != DEFAULT_INTERNAL_REACT_PUBLISHING_GROUP) {
      dependencySubstitution.add(
          Triple(
              "com.facebook.react:react-android",
              "${coordinates.reactGroupString}:react-android:${coordinates.versionString}",
              "The react-android dependency was modified to use the correct Maven group.",
          )
      )
      dependencySubstitution.add(
          Triple(
              "com.facebook.react:hermes-android",
              hermesVersionString,
              "The hermes-android dependency was modified to use the correct Maven group.",
          )
      )
    }
    if (coordinates.hermesGroupString != DEFAULT_INTERNAL_HERMES_PUBLISHING_GROUP) {
      dependencySubstitution.add(
          Triple(
              "com.facebook.hermes:hermes-android",
              hermesVersionString,
              "The hermes-android dependency was modified to use the correct Maven group.",
          )
      )
    }
    return dependencySubstitution
  }

  fun readVersionAndGroupStrings(
      project: Project,
      propertiesFile: File,
      hermesVersionFile: File,
  ): Coordinates {
    val reactAndroidProperties = Properties()
    propertiesFile.inputStream().use { reactAndroidProperties.load(it) }
    val versionStringFromFile = (reactAndroidProperties[INTERNAL_VERSION_NAME] as? String).orEmpty()
    // If on a nightly, we need to fetch the -SNAPSHOT artifact from Sonatype.
    val versionString =
        if (versionStringFromFile.isNightly()) {
          "$versionStringFromFile-SNAPSHOT"
        } else {
          versionStringFromFile
        }
    // Returns Maven group for repos using different group for Maven artifacts
    val reactGroupString =
        reactAndroidProperties[INTERNAL_REACT_PUBLISHING_GROUP] as? String
            ?: DEFAULT_INTERNAL_REACT_PUBLISHING_GROUP
    val hermesGroupString =
        reactAndroidProperties[INTERNAL_HERMES_PUBLISHING_GROUP] as? String
            ?: DEFAULT_INTERNAL_HERMES_PUBLISHING_GROUP

    val hermesVersionProperties = Properties()
    hermesVersionFile.inputStream().use { hermesVersionProperties.load(it) }

    val hermesVersionString =
        (hermesVersionProperties[INTERNAL_HERMES_VERSION_NAME] as? String).orEmpty()
    val hermesVersion =
        if (hermesVersionString.startsWith("0.0.0") || "-commitly-" in hermesVersionString) {
          "$hermesVersionString-SNAPSHOT"
        } else {
          hermesVersionString
        }

    val isHermesNightly = (project.findProperty(INTERNAL_USE_HERMES_NIGHTLY) as? String).toBoolean()

    return Coordinates(
        versionString,
        hermesVersion,
        reactGroupString,
        hermesGroupString,
        isHermesNightly,
    )
  }

  fun Project.mavenRepoFromUrl(
      url: String,
      action: (MavenArtifactRepository) -> Unit = {},
  ): MavenArtifactRepository =
      project.repositories.maven {
        it.url = URI.create(url)
        action(it)
      }

  fun Project.mavenRepoFromURI(
      uri: URI,
      action: (MavenArtifactRepository) -> Unit = {},
  ): MavenArtifactRepository =
      project.repositories.maven {
        it.url = uri
        action(it)
      }

  internal fun Project.shouldAddJitPack() =
      when {
        hasProperty(SCOPED_INCLUDE_JITPACK_REPOSITORY) ->
            property(SCOPED_INCLUDE_JITPACK_REPOSITORY).toString().toBoolean()
        hasProperty(INCLUDE_JITPACK_REPOSITORY) ->
            property(INCLUDE_JITPACK_REPOSITORY).toString().toBoolean()
        else -> INCLUDE_JITPACK_REPOSITORY_DEFAULT
      }

  internal fun String.isNightly(): Boolean = this.startsWith("0.0.0") || "-nightly-" in this

  internal fun Project.exclusiveEnterpriseRepository() =
      when {
        hasProperty(SCOPED_EXCLUSIVE_ENTEPRISE_REPOSITORY) ->
            property(SCOPED_EXCLUSIVE_ENTEPRISE_REPOSITORY).toString()
        hasProperty(EXCLUSIVE_ENTEPRISE_REPOSITORY) ->
            property(EXCLUSIVE_ENTEPRISE_REPOSITORY).toString()
        else -> null
      }
}
