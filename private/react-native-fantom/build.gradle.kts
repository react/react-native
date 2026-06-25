/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.tasks.internal.*
import com.facebook.react.tasks.internal.utils.*
import de.undercouch.gradle.tasks.download.Download

plugins {
  id("com.facebook.react")
  alias(libs.plugins.download)
}

// This is the version of CMake we're requesting to the Android SDK to use.
// If missing it will be downloaded automatically. Only CMake versions shipped with the
// Android SDK are supported (you can find them listed in the SDK Manager of Android Studio).
val cmakeVersion = System.getenv("CMAKE_VERSION") ?: "3.30.5"
val cmakePath = "${getSDKPath()}/cmake/$cmakeVersion"
val cmakeBinaryPath = "${cmakePath}/bin/cmake"
val ndkBuildJobs = Runtime.getRuntime().availableProcessors().toString()

fun getSDKPath(): String {
  val androidSdkRoot = System.getenv("ANDROID_SDK_ROOT")
  val androidHome = System.getenv("ANDROID_HOME")
  return when {
    !androidSdkRoot.isNullOrBlank() -> androidSdkRoot
    !androidHome.isNullOrBlank() -> androidHome
    else -> throw IllegalStateException("Neither ANDROID_SDK_ROOT nor ANDROID_HOME is set.")
  }
}

val FOLLY_VERSION = libs.versions.folly.get()
val GFLAGS_VERSION = libs.versions.gflags.get()
val NLOHMANNJSON_VERSION = libs.versions.nlohmannjson.get()

val buildDir = project.layout.buildDirectory.get().asFile
val downloadsDir =
    if (System.getenv("REACT_NATIVE_DOWNLOADS_DIR") != null) {
      File(System.getenv("REACT_NATIVE_DOWNLOADS_DIR"))
    } else {
      File("$buildDir/downloads")
    }
val thirdParty = File("$buildDir/third-party")
val reportsDir = File("$buildDir/reports")
val reactNativeRootDir = projectDir.parentFile.parentFile
val reactNativeDir = File("$reactNativeRootDir/packages/react-native")
val reactAndroidDir = File("$reactNativeDir/ReactAndroid")
val reactAndroidBuildDir = File("$reactAndroidDir/build")
val reactAndroidDownloadsDir =
    if (System.getenv("REACT_NATIVE_DOWNLOADS_DIR") != null) {
      File(System.getenv("REACT_NATIVE_DOWNLOADS_DIR"))
    } else {
      File("$reactAndroidBuildDir/downloads")
    }

val testerDir = File("$projectDir/tester")
val testerBuildDir = File("$buildDir/tester")
val testerBuildOutputFileTree =
    fileTree(testerBuildDir.toString())
        .include("**/*.cmake", "**/*.marks", "**/compiler_depends.ts", "**/Makefile", "**/link.txt")

val createNativeDepsDirectories by tasks.registering {
  downloadsDir.mkdirs()
  thirdParty.mkdirs()
  reportsDir.mkdirs()
}

val downloadFollyDest = File(reactAndroidDownloadsDir, "folly-${FOLLY_VERSION}.tar.gz")

val prepareFolly by
    tasks.registering(Copy::class) {
      dependsOn(listOf(":packages:react-native:ReactAndroid:downloadFolly"))
      from(tarTree(downloadFollyDest))
      from("tester/third-party/folly/")
      include("folly-${FOLLY_VERSION}/folly/**/*", "CMakeLists.txt")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/folly")
    }

val downloadGflagsDest = File(downloadsDir, "gflags-${GFLAGS_VERSION}.tar.gz")
val downloadGflags by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://github.com/gflags/gflags/archive/v${GFLAGS_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadGflagsDest)
    }

val prepareGflags by
    tasks.registering(PrepareGflagsTask::class) {
      dependsOn(listOf(downloadGflags))
      gflagsPath.setFrom(tarTree(downloadGflagsDest))
      gflagsThirdPartyPath.set(project.file("tester/third-party/gflags/"))
      gflagsVersion.set(GFLAGS_VERSION)
      outputDir.set(File(thirdParty, "gflags"))
    }

val downloadNlohmannJsonDest = File(downloadsDir, "nlohmann_json-${NLOHMANNJSON_VERSION}.tar.gz")
val downloadNlohmannJson by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://github.com/nlohmann/json/archive/v${NLOHMANNJSON_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadNlohmannJsonDest)
    }

val prepareNlohmannJson by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadNlohmannJson))
      from(tarTree(downloadNlohmannJsonDest))
      from("tester/third-party/nlohmann_json/")
      include(
          "json-${NLOHMANNJSON_VERSION}/src/**/*",
          "json-${NLOHMANNJSON_VERSION}/include/**/*",
          "CMakeLists.txt",
      )
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/nlohmann_json")
    }

var codegenSrcDir = File("$reactAndroidBuildDir/generated/source/codegen/jni")
var codegenOutDir = File("$buildDir/codegen")
val prepareRNCodegen by
    tasks.registering(Copy::class) {
      dependsOn(":packages:react-native:ReactAndroid:generateCodegenArtifactsFromSchema")
      from(codegenSrcDir)
      from("tester/codegen")
      include("react/**/*.h", "react/**/*.cpp", "CMakeLists.txt")
      includeEmptyDirs = false
      duplicatesStrategy = DuplicatesStrategy.INCLUDE
      into(codegenOutDir)
    }

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

val prepareNative3pDependencies by tasks.registering {
  dependsOn(
      prepareGflags,
      prepareNlohmannJson,
      prepareFolly,
      ":packages:react-native:ReactAndroid:prepareBoost",
      ":packages:react-native:ReactAndroid:prepareDoubleConversion",
      ":packages:react-native:ReactAndroid:prepareFastFloat",
      ":packages:react-native:ReactAndroid:prepareFmt",
      ":packages:react-native:ReactAndroid:prepareGlog",
  )
}

val prepareAllDependencies by tasks.registering {
  dependsOn(prepareRNCodegen, prepareHermesDependencies, prepareNative3pDependencies)
}

val configureFantomTester by
    tasks.registering(CustomExecTask::class) {
      dependsOn(prepareAllDependencies)
      workingDir(testerDir)
      inputs.dir(testerDir)
      outputs.files(testerBuildOutputFileTree)
      val cmdArgs =
          mutableListOf(
              cmakeBinaryPath,
              // Suppress all warnings as this is the Hermes build and we can't fix them.
              "--log-level=ERROR",
              "-S",
              ".",
              "-B",
              testerBuildDir.toString(),
              "-DCMAKE_BUILD_TYPE=Debug",
              "-DFANTOM_CODEGEN_DIR=$buildDir/codegen",
              "-DFANTOM_THIRD_PARTY_DIR=$buildDir/third-party",
              "-DREACT_ANDROID_DIR=$reactAndroidDir",
              "-DREACT_COMMON_DIR=$reactNativeDir/ReactCommon",
              "-DREACT_CXX_PLATFORM_DIR=$reactNativeDir/ReactCxxPlatform",
              "-DREACT_THIRD_PARTY_NDK_DIR=$reactAndroidBuildDir/third-party-ndk",
              "-DRN_ENABLE_DEBUG_STRING_CONVERTIBLE=ON",
          )

      cmdArgs.add("-DHERMES_V1_ENABLED=1")

      commandLine(cmdArgs)
      standardOutputFile.set(project.file("$buildDir/reports/configure-fantom_tester.log"))
      errorOutputFile.set(project.file("$buildDir/reports/configure-fantom_tester.error.log"))
    }

val buildFantomTester by
    tasks.registering(CustomExecTask::class) {
      dependsOn(configureFantomTester)
      workingDir(testerDir)
      inputs.files(testerBuildOutputFileTree)
      commandLine(
          cmakeBinaryPath,
          "--build",
          testerBuildDir.toString(),
          "--target",
          "fantom_tester",
          "-j",
          ndkBuildJobs,
      )
      standardOutputFile.set(project.file("$buildDir/reports/build-fantom_tester.log"))
      errorOutputFile.set(project.file("$buildDir/reports/build-fantom_tester.error.log"))
    }
