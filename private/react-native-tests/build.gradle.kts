/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import com.facebook.react.tasks.internal.*
import com.facebook.react.tasks.internal.utils.*

plugins { id("com.facebook.react") }

// CMake shipped with the Android SDK (same version the Fantom tester uses). The
// CI container provides it and this path is executed directly, so the component
// must exist; override CMAKE_VERSION to point at a different installed SDK CMake.
val cmakeVersion = System.getenv("CMAKE_VERSION") ?: "3.30.5"
val cmakePath = "${getSDKPath()}/cmake/$cmakeVersion"
val cmakeBinaryPath = "${cmakePath}/bin/cmake"
val ctestBinaryPath = "${cmakePath}/bin/ctest"
val buildJobs = Runtime.getRuntime().availableProcessors().toString()

fun getSDKPath(): String {
  val androidSdkRoot = System.getenv("ANDROID_SDK_ROOT")
  val androidHome = System.getenv("ANDROID_HOME")
  return when {
    !androidSdkRoot.isNullOrBlank() -> androidSdkRoot
    !androidHome.isNullOrBlank() -> androidHome
    else -> throw IllegalStateException("Neither ANDROID_SDK_ROOT nor ANDROID_HOME is set.")
  }
}

val buildDir = project.layout.buildDirectory.get().asFile
val reportsDir = File("$buildDir/reports")
val reactNativeRootDir = projectDir.parentFile.parentFile
val reactNativeDir = File("$reactNativeRootDir/packages/react-native")
val reactAndroidDir = File("$reactNativeDir/ReactAndroid")
val reactAndroidBuildDir = File("$reactAndroidDir/build")

// The C++ test harness reuses the third-party dependencies staged by the Fantom
// tester build: folly and gflags land in <fantom>/build/third-party; glog,
// double-conversion, fast_float, fmt and boost land in
// ReactAndroid/build/third-party-ndk. Depending on Fantom's
// prepareNative3pDependencies guarantees all of them are prepared.
val fantomDir = File("$reactNativeRootDir/private/react-native-fantom")
val stagedThirdPartyDir = File("$fantomDir/build/third-party")
val testerThirdPartySrcDir = File("$fantomDir/tester/third-party")

val cxxDir = File("$projectDir/cxx")
val cxxBuildDir = File("$buildDir/cxx")
val cxxBuildOutputFileTree =
    fileTree(cxxBuildDir.toString())
        .include("**/*.cmake", "**/*.marks", "**/compiler_depends.ts", "**/Makefile", "**/link.txt")

val createReportsDir by tasks.registering { reportsDir.mkdirs() }

// Generated codegen sources (FBReactNativeSpec) that Fabric component tests
// depend on. `generateCodegenArtifactsFromSchema` produces them under
// ReactAndroid/build/generated; stage them next to codegen/CMakeLists.txt.
val codegenSrcDir = File("$reactAndroidBuildDir/generated/source/codegen/jni")
val codegenOutDir = File("$buildDir/codegen")
val prepareRNCodegen by
    tasks.registering(Copy::class) {
      dependsOn(":packages:react-native:ReactAndroid:generateCodegenArtifactsFromSchema")
      from(codegenSrcDir)
      from("codegen")
      include("react/**/*.h", "react/**/*.cpp", "CMakeLists.txt")
      includeEmptyDirs = false
      duplicatesStrategy = DuplicatesStrategy.INCLUDE
      into(codegenOutDir)
    }

// Hermes VM + prefab headers, for suites whose tests create a JS runtime
// (hermes::makeHermesRuntime). Mirrors the Fantom tester's Hermes setup.
val enableHermesBuild by tasks.registering {
  project(":packages:react-native:ReactAndroid:hermes-engine") {
    tasks.configureEach { enabled = true }
  }
}
val prepareHermesDependencies by tasks.registering {
  dependsOn(
      enableHermesBuild,
      ":packages:react-native:ReactAndroid:hermes-engine:buildHermesLibWithDebugger",
      ":packages:react-native:ReactAndroid:hermes-engine:prepareHeadersForPrefabWithDebugger",
  )
}

val configureCxxTests by
    tasks.registering(CustomExecTask::class) {
      dependsOn(
          createReportsDir,
          prepareRNCodegen,
          prepareHermesDependencies,
          ":private:react-native-fantom:prepareNative3pDependencies",
      )
      workingDir(cxxDir)
      inputs.dir(cxxDir)
      outputs.files(cxxBuildOutputFileTree)
      commandLine(
          cmakeBinaryPath,
          "--log-level=ERROR",
          "-S",
          ".",
          "-B",
          cxxBuildDir.toString(),
          "-DCMAKE_BUILD_TYPE=Debug",
          "-DREACT_ANDROID_DIR=$reactAndroidDir",
          "-DREACT_COMMON_DIR=$reactNativeDir/ReactCommon",
          "-DREACT_THIRD_PARTY_NDK_DIR=$reactAndroidBuildDir/third-party-ndk",
          "-DRN_STAGED_THIRD_PARTY_DIR=$stagedThirdPartyDir",
          "-DRN_TESTER_THIRD_PARTY_SRC_DIR=$testerThirdPartySrcDir",
          "-DRN_CODEGEN_DIR=$codegenOutDir",
          "-DRN_ENABLE_DEBUG_STRING_CONVERTIBLE=ON",
      )
      standardOutputFile.set(project.file("$buildDir/reports/configure-cxx-tests.log"))
      errorOutputFile.set(project.file("$buildDir/reports/configure-cxx-tests.error.log"))
    }

val buildCxxTests by
    tasks.registering(CustomExecTask::class) {
      dependsOn(configureCxxTests)
      workingDir(cxxDir)
      inputs.files(cxxBuildOutputFileTree)
      commandLine(cmakeBinaryPath, "--build", cxxBuildDir.toString(), "-j", buildJobs)
      standardOutputFile.set(project.file("$buildDir/reports/build-cxx-tests.log"))
      errorOutputFile.set(project.file("$buildDir/reports/build-cxx-tests.error.log"))
    }

val runCxxTests by
    tasks.registering(CustomExecTask::class) {
      dependsOn(buildCxxTests)
      workingDir(cxxBuildDir)
      commandLine(
          ctestBinaryPath,
          "--output-on-failure",
          "--output-junit",
          "$reportsDir/cxx-tests-results.xml",
      )
      standardOutputFile.set(project.file("$buildDir/reports/run-cxx-tests.log"))
      errorOutputFile.set(project.file("$buildDir/reports/run-cxx-tests.error.log"))
    }
