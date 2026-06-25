/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

/** Collection of all the Gradle Properties that are accepted by React Native Gradle Plugin. */
object PropertyUtils {

  /** Public property that toggles the New Architecture */
  const val NEW_ARCH_ENABLED = "newArchEnabled"
  const val SCOPED_NEW_ARCH_ENABLED = "react.newArchEnabled"

  /** Public property that toggles Hermes */
  const val HERMES_ENABLED = "hermesEnabled"
  const val SCOPED_HERMES_ENABLED = "react.hermesEnabled"

  /**
   * Deprecated property that used to toggle Hermes V1. Hermes V1 is now always enabled. Kept here
   * so we can detect usage and warn users to remove it from their gradle.properties.
   */
  const val HERMES_V1_ENABLED = "hermesV1Enabled"
  const val SCOPED_HERMES_V1_ENABLED = "react.hermesV1Enabled"

  /** Public property that toggles edge-to-edge */
  const val EDGE_TO_EDGE_ENABLED = "edgeToEdgeEnabled"
  const val SCOPED_EDGE_TO_EDGE_ENABLED = "react.edgeToEdgeEnabled"

  /** Public property that excludes jsctooling from core */
  const val USE_THIRD_PARTY_JSC = "useThirdPartyJSC"
  const val SCOPED_USE_THIRD_PARTY_JSC = "react.useThirdPartyJSC"

  /** Public property that allows to control which architectures to build for React Native. */
  const val REACT_NATIVE_ARCHITECTURES = "reactNativeArchitectures"
  const val SCOPED_REACT_NATIVE_ARCHITECTURES = "react.nativeArchitectures"

  /** Public property that allows to control whether the JitPack repository is included or not */
  const val INCLUDE_JITPACK_REPOSITORY = "includeJitpackRepository"
  const val SCOPED_INCLUDE_JITPACK_REPOSITORY = "react.includeJitpackRepository"

  /**
   * Public property that allows to configure an enterprise repository proxy as exclusive repository
   */
  const val EXCLUSIVE_ENTEPRISE_REPOSITORY = "exclusiveEnterpriseRepository"
  const val SCOPED_EXCLUSIVE_ENTEPRISE_REPOSITORY = "react.exclusiveEnterpriseRepository"

  /** By default we include JitPack to avoid breaking user builds */
  internal const val INCLUDE_JITPACK_REPOSITORY_DEFAULT = true

  /**
   * Internal Property that acts as a killswitch to configure the JDK version and align it for app
   * and all the libraries.
   */
  const val INTERNAL_DISABLE_JAVA_VERSION_ALIGNMENT = "react.internal.disableJavaVersionAlignment"

  /**
   * Internal Property that allows to specify a local Maven repository to use for React Native
   * artifacts It's used on CI to test templates against a version of React Native built on the fly.
   */
  const val INTERNAL_REACT_NATIVE_MAVEN_LOCAL_REPO = "react.internal.mavenLocalRepo"

  /**
   * Internal property used to specify where the Windows Bash executable is located. This is useful
   * for contributors who are running Windows on their machine.
   */
  const val INTERNAL_REACT_WINDOWS_BASH = "react.internal.windowsBashPath"

  /**
   * Controls whether to use Hermes from stable builds. This will force hermes version set in the
   * sdks/hermes-engine/version.properties file to be used. This has a higher priority than
   * react.internal.useHermesNightly.
   */
  const val INTERNAL_USE_HERMES_STABLE = "react.internal.useHermesStable"

  /**
   * Internal property to force the build to use Hermes from the latest nightly. This speeds up the
   * build at the cost of not testing the latest integration against Hermes.
   */
  const val INTERNAL_USE_HERMES_NIGHTLY = "react.internal.useHermesNightly"

  /** Internal property used to override the publishing group for the React Native artifacts. */
  const val INTERNAL_REACT_PUBLISHING_GROUP = "react.internal.publishingGroup"
  const val INTERNAL_HERMES_PUBLISHING_GROUP = "react.internal.hermesPublishingGroup"
  const val DEFAULT_INTERNAL_REACT_PUBLISHING_GROUP = "com.facebook.react"
  const val DEFAULT_INTERNAL_HERMES_PUBLISHING_GROUP = "com.facebook.hermes"

  /** Internal property used to control the version name of React Native */
  const val INTERNAL_VERSION_NAME = "VERSION_NAME"

  /**
   * Internal properties, shared with iOS, used to control the version name of Hermes Engine. They
   * are stored in sdks/hermes-engine/version.properties
   */
  const val INTERNAL_HERMES_VERSION_NAME = "HERMES_VERSION_NAME"
}
