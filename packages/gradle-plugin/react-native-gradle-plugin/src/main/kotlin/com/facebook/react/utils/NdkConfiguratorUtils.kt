/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.android.build.api.variant.ApplicationAndroidComponentsExtension
import com.android.build.api.variant.Variant
import com.facebook.react.ReactExtension
import com.facebook.react.utils.ProjectUtils.getReactNativeArchitectures
import java.io.File
import org.gradle.api.Project

internal object NdkConfiguratorUtils {
  @Suppress("UnstableApiUsage")
  fun configureReactNativeNdk(project: Project, extension: ReactExtension) {
    project.pluginManager.withPlugin("com.android.application") {
      project.extensions.getByType(ApplicationAndroidComponentsExtension::class.java).finalizeDsl {
          ext ->
        // We enable prefab so users can consume .so/headers from ReactAndroid and hermes-engine
        // .aar
        ext.buildFeatures.prefab = true

        // If the user has not provided a CmakeLists.txt path, let's provide
        // the default one from the framework
        if (ext.externalNativeBuild.cmake.path == null) {
          ext.externalNativeBuild.cmake.path =
              File(
                  extension.reactNativeDir.get().asFile,
                  "ReactAndroid/cmake-utils/default-app-setup/CMakeLists.txt",
              )
        }

        // Parameters should be provided in an additive manner (do not override what
        // the user provided, but allow for sensible defaults).
        val cmakeArgs = ext.defaultConfig.externalNativeBuild.cmake.arguments
        if (cmakeArgs.none { it.startsWith("-DPROJECT_BUILD_DIR") }) {
          cmakeArgs.add("-DPROJECT_BUILD_DIR=${project.layout.buildDirectory.get().asFile}")
        }
        if (cmakeArgs.none { it.startsWith("-DPROJECT_ROOT_DIR") }) {
          cmakeArgs.add("-DPROJECT_ROOT_DIR=${project.rootProject.layout.projectDirectory.asFile}")
        }
        if (cmakeArgs.none { it.startsWith("-DREACT_ANDROID_DIR") }) {
          cmakeArgs.add(
              "-DREACT_ANDROID_DIR=${extension.reactNativeDir.file("ReactAndroid").get().asFile}",
          )
        }
        if (cmakeArgs.none { it.startsWith("-DANDROID_STL") }) {
          cmakeArgs.add("-DANDROID_STL=c++_shared")
        }
        if (cmakeArgs.none { it.startsWith("-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES") }) {
          cmakeArgs.add("-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON")
        }

        val architectures = project.getReactNativeArchitectures()
        // abiFilters are split ABI are not compatible each other, so we set the abiFilters
        // only if the user hasn't enabled the split abi feature.
        if (architectures.isNotEmpty() && !ext.splits.abi.isEnable) {
          ext.defaultConfig.ndk.abiFilters.addAll(architectures)
        }
      }
    }
  }

  /**
   * This method is used to configure the .so Packaging Options for the given variant. It will make
   * sure we specify the correct .pickFirsts for all the .so files we are producing or that we're
   * aware of as some of our dependencies are pulling them in.
   */
  fun configureNewArchPackagingOptions(
      project: Project,
      extension: ReactExtension,
      variant: Variant,
  ) {
    // We set some packagingOptions { pickFirst ... } for our users for libraries we own.
    variant.packaging.jniLibs.pickFirsts.addAll(
        listOf(
            // This is the .so provided by FBJNI via prefab
            "**/libfbjni.so",
            // Those are prefab libraries we distribute via ReactAndroid
            // Due to a bug in AGP, they fire a warning on console as both the JNI
            // and the prefab .so files gets considered.
            "**/libreactnative.so",
            "**/libjsi.so",
            // AGP will give priority of libc++_shared coming from App modules.
            "**/libc++_shared.so",
        ),
    )
  }

  /**
   * This method is used to configure the .so Cleanup for the given variant. It takes care of
   * cleaning up the .so files that are not needed for Hermes or JSC, given a specific variant.
   */
  fun configureJsEnginePackagingOptions(
      config: ReactExtension,
      variant: Variant,
      hermesEnabled: Boolean,
      useThirdPartyJSC: Boolean,
  ) {
    if (config.enableSoCleanup.get()) {
      val (excludes, includes) = getPackagingOptionsForVariant(hermesEnabled, useThirdPartyJSC)
      variant.packaging.jniLibs.excludes.addAll(excludes)
      variant.packaging.jniLibs.pickFirsts.addAll(includes)
    }
  }

  fun getPackagingOptionsForVariant(
      hermesEnabled: Boolean,
      useThirdPartyJSC: Boolean,
  ): Pair<List<String>, List<String>> {
    val excludes = mutableListOf<String>()
    val includes = mutableListOf<String>()

    // note: libjsctooling.so is kept here for backward compatibility.
    when {
      hermesEnabled -> {
        excludes.add("**/libjsc.so")
        excludes.add("**/libjsctooling.so")
        includes.add("**/libhermesvm.so")
        includes.add("**/libhermestooling.so")
      }
      useThirdPartyJSC -> {
        excludes.add("**/libhermesvm.so")
        excludes.add("**/libhermestooling.so")
        excludes.add("**/libjsctooling.so")
        includes.add("**/libjsc.so")
      }
      else -> {
        excludes.add("**/libhermesvm.so")
        excludes.add("**/libhermestooling.so")
        includes.add("**/libjsc.so")
        includes.add("**/libjsctooling.so")
      }
    }
    return excludes to includes
  }
}
