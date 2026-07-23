/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.tests.createProject
import com.facebook.react.utils.DependencyUtils.configureDependencies
import com.facebook.react.utils.DependencyUtils.configureRepositories
import com.facebook.react.utils.DependencyUtils.exclusiveEnterpriseRepository
import com.facebook.react.utils.DependencyUtils.getDependencySubstitutions
import com.facebook.react.utils.DependencyUtils.isNightly
import com.facebook.react.utils.DependencyUtils.mavenRepoFromURI
import com.facebook.react.utils.DependencyUtils.mavenRepoFromUrl
import com.facebook.react.utils.DependencyUtils.readVersionAndGroupStrings
import com.facebook.react.utils.DependencyUtils.shouldAddJitPack
import java.net.URI
import org.assertj.core.api.Assertions.assertThat
import org.gradle.api.artifacts.repositories.MavenArtifactRepository
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class DependencyUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun configureRepositories_withProjectPropertySet_configuresMavenLocalCorrectly() {
    val localMaven = tempFolder.newFolder("m2")
    val localMavenURI = localMaven.toURI()
    val project = createProject()
    project.extensions.extraProperties.set("react.internal.mavenLocalRepo", localMaven.absolutePath)

    configureRepositories(project, false)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == localMavenURI
            }
        )
        .isNotNull()
  }

  @Test
  fun configureRepositories_containsMavenCentral() {
    val repositoryURI = URI.create("https://repo.maven.apache.org/maven2/")
    val project = createProject()

    configureRepositories(project, false)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNotNull()
  }

  @Test
  fun configureRepositories_containsGoogleRepo() {
    val repositoryURI = URI.create("https://dl.google.com/dl/android/maven2/")
    val project = createProject()

    configureRepositories(project, false)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNotNull()
  }

  @Test
  fun configureRepositories_containsJitPack() {
    val repositoryURI = URI.create("https://www.jitpack.io")
    val project = createProject()

    configureRepositories(project, false)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNotNull()
  }

  @Test
  fun configureRepositories_withExclusiveEnterpriseRepository_replacesAllRepositories() {
    val repositoryURI = URI.create("https://maven.myfabolousorganization.it")

    val project = createProject()
    project.rootProject.extensions.extraProperties.set(
        "exclusiveEnterpriseRepository",
        repositoryURI.toString(),
    )

    configureRepositories(project, false)

    assertThat(project.repositories).hasSize(1)
    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNotNull()
  }

  @Test
  fun configureRepositories_withIncludeJitpackRepositoryFalse_doesNotContainJitPack() {
    val repositoryURI = URI.create("https://www.jitpack.io")
    var project = createProject()
    project.extensions.extraProperties.set("includeJitpackRepository", "false")

    configureRepositories(project, false)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNull()

    // We test both with scoped and unscoped property
    project = createProject()
    project.extensions.extraProperties.set("react.includeJitpackRepository", "false")

    configureRepositories(project, false)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNull()
  }

  @Test
  fun configureRepositories_withincludeJitpackRepositoryTrue_containJitPack() {
    val repositoryURI = URI.create("https://www.jitpack.io")
    var project = createProject()
    project.extensions.extraProperties.set("includeJitpackRepository", "true")

    configureRepositories(project, false)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNotNull()

    // We test both with scoped and unscoped property
    project = createProject()
    project.extensions.extraProperties.set("react.includeJitpackRepository", "true")

    configureRepositories(project, false)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNotNull()
  }

  @Test
  fun configureRepositories_notNightly_doesNotContainSonatype() {
    val repositoryURI = URI.create("https://central.sonatype.com/repository/maven-snapshots/")
    var project = createProject()

    configureRepositories(project, false)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNull()
  }

  @Test
  fun configureRepositories_nightly_containSonatype() {
    val repositoryURI = URI.create("https://central.sonatype.com/repository/maven-snapshots/")
    var project = createProject()

    configureRepositories(project, true)

    assertThat(
            project.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNotNull()
  }

  @Test
  fun configureRepositories_withProjectPropertySet_hasHigherPriorityThanMavenCentral() {
    val localMaven = tempFolder.newFolder("m2")
    val localMavenURI = localMaven.toURI()
    val mavenCentralURI = URI.create("https://repo.maven.apache.org/maven2/")
    val project = createProject()
    project.extensions.extraProperties.set("react.internal.mavenLocalRepo", localMaven.absolutePath)

    configureRepositories(project, false)

    val indexOfLocalRepo =
        project.repositories.indexOfFirst {
          it is MavenArtifactRepository && it.url == localMavenURI
        }
    val indexOfMavenCentral =
        project.repositories.indexOfFirst {
          it is MavenArtifactRepository && it.url == mavenCentralURI
        }
    assertThat(indexOfLocalRepo < indexOfMavenCentral).isTrue()
  }

  @Test
  fun configureRepositories_snapshotRepoHasHigherPriorityThanMavenCentral() {
    val repositoryURI = URI.create("https://central.sonatype.com/repository/maven-snapshots/")
    val mavenCentralURI = URI.create("https://repo.maven.apache.org/maven2/")
    val project = createProject()

    configureRepositories(project, false)

    val indexOfSnapshotRepo =
        project.repositories.indexOfFirst {
          it is MavenArtifactRepository && it.url == repositoryURI
        }
    val indexOfMavenCentral =
        project.repositories.indexOfFirst {
          it is MavenArtifactRepository && it.url == mavenCentralURI
        }
    assertThat(indexOfSnapshotRepo < indexOfMavenCentral).isTrue()
  }

  @Test
  fun configureRepositories_appliesToAllProjects() {
    val repositoryURI = URI.create("https://repo.maven.apache.org/maven2/")
    val rootProject = ProjectBuilder.builder().build()
    val appProject = ProjectBuilder.builder().withName("app").withParent(rootProject).build()
    val libProject = ProjectBuilder.builder().withName("lib").withParent(rootProject).build()

    configureRepositories(appProject, false)

    assertThat(
            appProject.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNotNull()
    assertThat(
            libProject.repositories.firstOrNull {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isNotNull()
  }

  @Test
  fun configureRepositories_withPreviousExclusionRulesOnMavenCentral_appliesCorrectly() {
    val repositoryURI = URI.create("https://repo.maven.apache.org/maven2/")
    val rootProject = ProjectBuilder.builder().build()
    val appProject = ProjectBuilder.builder().withName("app").withParent(rootProject).build()
    val libProject = ProjectBuilder.builder().withName("lib").withParent(rootProject).build()

    // Let's emulate a library which set an `excludeGroup` on `com.facebook.react` for Central.
    libProject.repositories.mavenCentral { repo ->
      repo.content { content -> content.excludeGroup("com.facebook.react") }
    }

    configureRepositories(appProject, false)

    // We need to make sure we have Maven Central defined twice, one by the library,
    // and another is the override by RNGP.
    assertThat(
            libProject.repositories.count {
              it is MavenArtifactRepository && it.url == repositoryURI
            }
        )
        .isEqualTo(2)
  }

  @Test
  fun configureDependencies_withEmptyVersion_doesNothing() {
    val project = createProject()

    configureDependencies(project, DependencyUtils.Coordinates("", ""))

    assertThat(project.configurations.first().resolutionStrategy.forcedModules.isEmpty()).isTrue()
  }

  @Test
  fun configureDependencies_withVersionString_appliesResolutionStrategy() {
    val project = createProject()

    configureDependencies(project, DependencyUtils.Coordinates("1.2.3", "4.5.6"))

    val forcedModules = project.configurations.first().resolutionStrategy.forcedModules
    assertThat(forcedModules.any { it.toString() == "com.facebook.react:react-android:1.2.3" })
        .isTrue()
    assertThat(forcedModules.any { it.toString() == "com.facebook.hermes:hermes-android:4.5.6" })
        .isTrue()
  }

  @Test
  fun configureDependencies_withVersionString_appliesOnAllProjects() {
    val rootProject = ProjectBuilder.builder().build()
    val appProject = ProjectBuilder.builder().withName("app").withParent(rootProject).build()
    val libProject = ProjectBuilder.builder().withName("lib").withParent(rootProject).build()
    appProject.plugins.apply("com.android.application")
    libProject.plugins.apply("com.android.library")

    configureDependencies(appProject, DependencyUtils.Coordinates("1.2.3", "4.5.6"))

    val appForcedModules = appProject.configurations.first().resolutionStrategy.forcedModules
    val libForcedModules = libProject.configurations.first().resolutionStrategy.forcedModules
    assertThat(appForcedModules.any { it.toString() == "com.facebook.react:react-android:1.2.3" })
        .isTrue()
    assertThat(appForcedModules.any { it.toString() == "com.facebook.hermes:hermes-android:4.5.6" })
        .isTrue()
    assertThat(libForcedModules.any { it.toString() == "com.facebook.react:react-android:1.2.3" })
        .isTrue()
    assertThat(libForcedModules.any { it.toString() == "com.facebook.hermes:hermes-android:4.5.6" })
        .isTrue()
  }

  @Test
  fun configureDependencies_withVersionStringAndGroupString_appliesOnAllProjects() {
    val rootProject = ProjectBuilder.builder().build()
    val appProject = ProjectBuilder.builder().withName("app").withParent(rootProject).build()
    val libProject = ProjectBuilder.builder().withName("lib").withParent(rootProject).build()
    appProject.plugins.apply("com.android.application")
    libProject.plugins.apply("com.android.library")

    configureDependencies(
        appProject,
        DependencyUtils.Coordinates(
            "1.2.3",
            "4.5.6",
            "io.github.test",
            "io.github.test.hermes",
        ),
    )

    val appForcedModules = appProject.configurations.first().resolutionStrategy.forcedModules
    val libForcedModules = libProject.configurations.first().resolutionStrategy.forcedModules
    assertThat(appForcedModules.any { it.toString() == "io.github.test:react-android:1.2.3" })
        .isTrue()
    assertThat(
            appForcedModules.any { it.toString() == "io.github.test.hermes:hermes-android:4.5.6" }
        )
        .isTrue()
    assertThat(libForcedModules.any { it.toString() == "io.github.test:react-android:1.2.3" })
        .isTrue()
    assertThat(
            libForcedModules.any { it.toString() == "io.github.test.hermes:hermes-android:4.5.6" }
        )
        .isTrue()
  }

  @Test
  fun getDependencySubstitutions_withDefaultGroup_substitutesCorrectly() {
    val dependencySubstitutions =
        getDependencySubstitutions(DependencyUtils.Coordinates("0.42.0", "0.42.0"))

    assertThat("com.facebook.react:react-native").isEqualTo(dependencySubstitutions[0].first)
    assertThat("com.facebook.react:react-android:0.42.0")
        .isEqualTo(dependencySubstitutions[0].second)
    assertThat(
            "The react-native artifact was deprecated in favor of react-android due to https://github.com/facebook/react-native/issues/35210."
        )
        .isEqualTo(dependencySubstitutions[0].third)
    assertThat("com.facebook.react:hermes-engine").isEqualTo(dependencySubstitutions[1].first)
    assertThat("com.facebook.hermes:hermes-android:0.42.0")
        .isEqualTo(dependencySubstitutions[1].second)
    assertThat(
            "The hermes-engine artifact was deprecated in favor of hermes-android due to https://github.com/facebook/react-native/issues/35210."
        )
        .isEqualTo(dependencySubstitutions[1].third)
  }

  @Test
  fun getDependencySubstitutions_withCustomGroup_substitutesCorrectly() {
    val dependencySubstitutions =
        getDependencySubstitutions(
            DependencyUtils.Coordinates(
                "0.42.0",
                "0.42.0",
                "io.github.test",
                "io.github.test.hermes",
            )
        )

    assertThat("com.facebook.react:react-native").isEqualTo(dependencySubstitutions[0].first)
    assertThat("io.github.test:react-android:0.42.0").isEqualTo(dependencySubstitutions[0].second)
    assertThat(
            "The react-native artifact was deprecated in favor of react-android due to https://github.com/facebook/react-native/issues/35210."
        )
        .isEqualTo(dependencySubstitutions[0].third)
    assertThat("com.facebook.react:hermes-engine").isEqualTo(dependencySubstitutions[1].first)
    assertThat("io.github.test.hermes:hermes-android:0.42.0")
        .isEqualTo(dependencySubstitutions[1].second)
    assertThat(
            "The hermes-engine artifact was deprecated in favor of hermes-android due to https://github.com/facebook/react-native/issues/35210."
        )
        .isEqualTo(dependencySubstitutions[1].third)
    assertThat("com.facebook.react:hermes-android").isEqualTo(dependencySubstitutions[2].first)
    assertThat("io.github.test.hermes:hermes-android:0.42.0")
        .isEqualTo(dependencySubstitutions[2].second)
    assertThat("The hermes-android artifact was moved to com.facebook.hermes publishing group.")
        .isEqualTo(dependencySubstitutions[2].third)
    assertThat("com.facebook.react:react-android").isEqualTo(dependencySubstitutions[3].first)
    assertThat("io.github.test:react-android:0.42.0").isEqualTo(dependencySubstitutions[3].second)
    assertThat("The react-android dependency was modified to use the correct Maven group.")
        .isEqualTo(dependencySubstitutions[3].third)
    assertThat("com.facebook.react:hermes-android").isEqualTo(dependencySubstitutions[4].first)
    assertThat("io.github.test.hermes:hermes-android:0.42.0")
        .isEqualTo(dependencySubstitutions[4].second)
    assertThat("The hermes-android dependency was modified to use the correct Maven group.")
        .isEqualTo(dependencySubstitutions[4].third)
  }

  @Test
  fun readVersionString_withCorrectVersionString_returnsIt() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
              VERSION_NAME=1000.0.0
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val hermesVersionFile =
        tempFolder.newFile("version.properties").apply {
          writeText(
              """
              HERMES_VERSION_NAME=1000.0.0
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val project = createProject()
    val strings = readVersionAndGroupStrings(project, propertiesFile, hermesVersionFile)
    val versionString = strings.versionString
    val hermesVersionString = strings.hermesVersionString

    assertThat(versionString).isEqualTo("1000.0.0")
    assertThat(hermesVersionString).isEqualTo("1000.0.0")
  }

  @Test
  fun readVersionString_withNightlyVersionString_returnsSnapshotVersion() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
              VERSION_NAME=0.0.0-20221101-2019-cfe811ab1
              HERMES_VERSION_NAME=0.12.0-commitly-20221101-2019-cfe811ab1
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val hermesVersionFile =
        tempFolder.newFile("version.properties").apply {
          writeText(
              """
              HERMES_VERSION_NAME=0.14.0
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val project = createProject()
    val strings = readVersionAndGroupStrings(project, propertiesFile, hermesVersionFile)
    val versionString = strings.versionString
    val hermesVersionString = strings.hermesVersionString

    assertThat(versionString).isEqualTo("0.0.0-20221101-2019-cfe811ab1-SNAPSHOT")
    assertThat(hermesVersionString).isEqualTo("0.14.0")
  }

  @Test
  fun readVersionString_withMissingVersionString_returnsEmpty() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val hermesVersionFile =
        tempFolder.newFile("version.properties").apply {
          writeText(
              """
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val project = createProject()
    val strings = readVersionAndGroupStrings(project, propertiesFile, hermesVersionFile)
    val versionString = strings.versionString
    val hermesVersionString = strings.hermesVersionString
    assertThat(versionString).isEqualTo("")
    assertThat(hermesVersionString).isEqualTo("")
  }

  @Test
  fun readVersionString_withEmptyVersionString_returnsEmpty() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
              VERSION_NAME=
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val hermesVersionFile =
        tempFolder.newFile("version.properties").apply {
          writeText(
              """
              HERMES_VERSION_NAME=
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val project = createProject()
    val strings = readVersionAndGroupStrings(project, propertiesFile, hermesVersionFile)
    val versionString = strings.versionString
    val hermesVersionString = strings.hermesVersionString
    assertThat(versionString).isEqualTo("")
    assertThat(hermesVersionString).isEqualTo("")
  }

  @Test
  fun readGroupString_withCorrectGroupString_returnsIt() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
              react.internal.publishingGroup=io.github.test
              react.internal.hermesPublishingGroup=io.github.test
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val hermesVersionFile =
        tempFolder.newFile("version.properties").apply {
          writeText(
              """
              HERMES_VERSION_NAME=
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val project = createProject()
    val strings = readVersionAndGroupStrings(project, propertiesFile, hermesVersionFile)
    val reactGroupString = strings.reactGroupString
    val hermesGroupString = strings.hermesGroupString

    assertThat(reactGroupString).isEqualTo("io.github.test")
    assertThat(hermesGroupString).isEqualTo("io.github.test")
  }

  @Test
  fun readGroupString_withEmptyGroupString_returnsDefault() {
    val propertiesFile =
        tempFolder.newFile("gradle.properties").apply {
          writeText(
              """
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val hermesVersionFile =
        tempFolder.newFile("version.properties").apply {
          writeText(
              """
              HERMES_VERSION_NAME=
              ANOTHER_PROPERTY=true
              """
                  .trimIndent()
          )
        }

    val project = createProject()
    val strings = readVersionAndGroupStrings(project, propertiesFile, hermesVersionFile)
    val reactGroupString = strings.reactGroupString
    val hermesGroupString = strings.hermesGroupString

    assertThat(reactGroupString).isEqualTo("com.facebook.react")
    assertThat(hermesGroupString).isEqualTo("com.facebook.hermes")
  }

  @Test
  fun mavenRepoFromUrl_worksCorrectly() {
    val process = createProject()
    val mavenRepo = process.mavenRepoFromUrl("https://hello.world")

    assertThat(mavenRepo.url).isEqualTo(URI.create("https://hello.world"))
  }

  @Test
  fun mavenRepoFromURI_worksCorrectly() {
    val process = createProject()
    val repoFolder = tempFolder.newFolder("maven-repo")
    val mavenRepo = process.mavenRepoFromURI(repoFolder.toURI())

    assertThat(mavenRepo.url).isEqualTo(repoFolder.toURI())
  }

  @Test
  fun shouldAddJitPack_withScopedProperty() {
    val project = createProject(tempFolder.root)
    project.extensions.extraProperties.set("react.includeJitpackRepository", "false")
    assertThat(project.shouldAddJitPack()).isFalse()
  }

  @Test
  fun shouldAddJitPack_withUnscopedProperty() {
    val project = createProject(tempFolder.root)
    project.extensions.extraProperties.set("includeJitpackRepository", "false")
    assertThat(project.shouldAddJitPack()).isFalse()
  }

  @Test
  fun shouldAddJitPack_defaultIsTrue() {
    val project = createProject(tempFolder.root)
    assertThat(project.shouldAddJitPack()).isTrue()
  }

  @Test
  fun exclusiveEnterpriseRepository_withScopedProperty() {
    val project = createProject(tempFolder.root)
    project.extensions.extraProperties.set(
        "react.exclusiveEnterpriseRepository",
        "https://maven.myfabolousorganization.it",
    )
    assertThat(project.exclusiveEnterpriseRepository())
        .isEqualTo("https://maven.myfabolousorganization.it")
  }

  @Test
  fun exclusiveEnterpriseRepository_withUnscopedProperty() {
    val project = createProject(tempFolder.root)
    project.extensions.extraProperties.set(
        "exclusiveEnterpriseRepository",
        "https://maven.myfabolousorganization.it",
    )
    assertThat(project.exclusiveEnterpriseRepository())
        .isEqualTo("https://maven.myfabolousorganization.it")
  }

  @Test
  fun exclusiveEnterpriseRepository_defaultIsTrue() {
    val project = createProject(tempFolder.root)
    assertThat(project.exclusiveEnterpriseRepository()).isNull()
  }

  @Test
  fun isNightly_returnsTrue_forValidNightlyVersions() {
    val trueCases = listOf(
        "0.85.0-nightly-20260128-36f07a1b2",
        "0.82.0-nightly-date-commit",
        "0.0.0-20230505-2109-9b69263a1",
        "0.0.0-date-commit",
        "0.0.0-nightly-",
    )

    trueCases.forEach { version ->
      assert(version.isNightly()) { "Expected '$version' to be detected as nightly" }
    }
  }

  @Test
  fun isNightly_returnsFalse_forNonNightlyVersions() {
    val falseCases = listOf(
        "0.83.0", // Standard version
        "0.0.1",
        "nightly", // Missing hyphens
        "0.83.0-nightly", // Missing trailing hyphen
        "any-nightly", // Missing trailing hyphen
        "nightly-build", // Missing leading hyphen
        "", // Empty string
        "   ", // Blank string
    )

    falseCases.forEach { version ->
      assert(!version.isNightly()) { "Expected '$version' to NOT be detected as nightly" }
    }
  }
}
