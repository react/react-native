/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import com.facebook.react.tasks.internal.*
import de.undercouch.gradle.tasks.download.Download
import org.apache.tools.ant.taskdefs.condition.Os

plugins {
  id("signing")
  alias(libs.plugins.android.library)
  alias(libs.plugins.download)
}

group = "com.facebook.react"

version = parent?.properties?.get("publishing_version")?.toString()!!

val cmakeVersion = parent?.properties?.get("cmake_version")?.toString()!!
val cmakePath = "${getSDKPath()}/cmake/$cmakeVersion"
val cmakeBinaryPath = "${cmakePath}/bin/cmake"

fun getSDKPath(): String {
  val androidSdkRoot = System.getenv("ANDROID_SDK_ROOT")
  val androidHome = System.getenv("ANDROID_HOME")
  return when {
    !androidSdkRoot.isNullOrBlank() -> androidSdkRoot
    !androidHome.isNullOrBlank() -> androidHome
    else -> throw IllegalStateException("Neither ANDROID_SDK_ROOT nor ANDROID_HOME is set.")
  }
}

fun getSDKManagerPath(): String {
  val metaSdkManagerPath = File("${getSDKPath()}/cmdline-tools/latest/bin/sdkmanager")
  val ossSdkManagerPath = File("${getSDKPath()}/tools/bin/sdkmanager")
  val windowsMetaSdkManagerPath = File("${getSDKPath()}/cmdline-tools/latest/bin/sdkmanager.bat")
  val windowsOssSdkManagerPath = File("${getSDKPath()}/tools/bin/sdkmanager.bat")
  val linuxSdkManagerPath = File("${getSDKPath()}/cmdline-tools/tools/bin/sdkmanager")
  return when {
    metaSdkManagerPath.exists() -> metaSdkManagerPath.absolutePath
    windowsMetaSdkManagerPath.exists() -> windowsMetaSdkManagerPath.absolutePath
    ossSdkManagerPath.exists() -> ossSdkManagerPath.absolutePath
    windowsOssSdkManagerPath.exists() -> windowsOssSdkManagerPath.absolutePath
    linuxSdkManagerPath.exists() -> linuxSdkManagerPath.absolutePath
    else -> throw GradleException("Could not find sdkmanager executable.")
  }
}

val reactNativeRootDir = project(":packages:react-native:ReactAndroid").projectDir.parent
val customDownloadDir = System.getenv("REACT_NATIVE_DOWNLOADS_DIR")
val downloadsDir =
    if (customDownloadDir != null) {
      File(customDownloadDir)
    } else {
      File(reactNativeRootDir, "sdks/download")
    }

// By default we are going to download and unzip hermes inside the /sdks/hermes folder
// but you can provide an override for where the hermes source code is located.
val buildDir = project.layout.buildDirectory.get().asFile
val overrideHermesDir = System.getenv("REACT_NATIVE_OVERRIDE_HERMES_DIR") != null
val hermesDir =
    if (overrideHermesDir) {
      File(System.getenv("REACT_NATIVE_OVERRIDE_HERMES_DIR"))
    } else {
      File(reactNativeRootDir, "sdks/hermes")
    }
val hermesBuildDir = File("$buildDir/hermes")
val hermesCOutputBinary = File("$buildDir/hermes/bin/hermesc")

// This filetree represents the file of the Hermes build that we want as input/output
// of the buildHermesC task. Gradle will compute the hash of files in the file tree
// and won't rebuilt hermesc unless those files are changing.
val hermesBuildOutputFileTree =
    fileTree(hermesBuildDir.toString())
        .include("**/*.cmake", "**/*.marks", "**/compiler_depends.ts", "**/Makefile", "**/link.txt")

val hermesVersionProvider: Provider<String> = providers.provider {
  var hermesVersion = "250829098.0.0-stable"
  val hermesVersionFile = File(
      reactNativeRootDir,
      "sdks/.hermesv1version",
  )

  if (hermesVersionFile.exists()) {
    hermesVersion = hermesVersionFile.readText()
  }

  hermesVersion
}

val ndkBuildJobs = Runtime.getRuntime().availableProcessors().toString()
val prefabHeadersDir = File("$buildDir/prefab-headers")

// We inject the JSI directory used inside the Hermes build with the -DJSI_DIR config.
val jsiDir = File(reactNativeRootDir, "ReactCommon/jsi")

val downloadHermesDest = File(downloadsDir, "hermes.tar.gz")
val downloadHermes by
    tasks.registering(Download::class) {
      src(
          providers.provider {
            "https://github.com/facebook/hermes/tarball/${hermesVersionProvider.get()}"
          }
      )
      onlyIfModified(true)
      overwrite(true)
      quiet(true)
      useETag("all")
      retries(5)
      dest(downloadHermesDest)
    }

val unzipHermes by
    tasks.registering(Copy::class) {
      dependsOn(downloadHermes)
      from(tarTree(downloadHermesDest)) {
        eachFile {
          // We flatten the unzip as the tarball contains a `facebook-hermes-<SHA>`
          // folder at the top level.
          if (this.path.startsWith("facebook-hermes-")) {
            this.path = this.path.substringAfter("/")
          }
        }
      }
      into(hermesDir)
    }

// NOTE: ideally, we would like CMake to be installed automatically by the `externalNativeBuild`
// below. To do that, we would need the various `ConfigureCMake*` tasks to run *before*
// `configureBuildForHermes` and `buildHermesC` so that CMake is available for their run. But the
// `ConfigureCMake*` tasks depend upon the `ImportHostCompilers.cmake` file which is actually
// generated by
// the two tasks mentioned before, so we install CMake manually to break the circular dependency.

val installCMake by
    tasks.registering(CustomExecTask::class) {
      onlyIfProvidedPathDoesNotExists.set(cmakePath)
      commandLine(
          windowsAwareCommandLine(getSDKManagerPath(), "--install", "cmake;${cmakeVersion}")
      )
    }

fun configureBuildForHermesCommandLineArgs(
    hermesBuildDir: File,
    jsiDir: File,
    enableDebugger: Boolean,
): List<String> {
  var cmakeCommandLine = windowsAwareCommandLine(
      cmakeBinaryPath,
      // Suppress all warnings as this is the Hermes build and we can't fix them.
      "--log-level=ERROR",
      "-Wno-dev",
      "-S",
      ".",
      "-B",
      hermesBuildDir.toString(),
      "-DJSI_DIR=" + jsiDir.absolutePath,
      "-DCMAKE_BUILD_TYPE=Release",
  )
  if (enableDebugger) {
    cmakeCommandLine = cmakeCommandLine + "-DHERMES_ENABLE_DEBUGGER=True"
  }
  if (Os.isFamily(Os.FAMILY_WINDOWS)) {
    cmakeCommandLine = cmakeCommandLine + "-GNMake Makefiles"
  }
  cmakeCommandLine = cmakeCommandLine + "-DHERMESVM_HEAP_HV_MODE=HEAP_HV_PREFER32"

  return cmakeCommandLine
}

fun buildHermesCCommandLineArgs() = listOf(
    cmakeBinaryPath,
    "--build",
    hermesBuildDir.toString(),
    "--target",
    "hermesc",
    "-j",
    ndkBuildJobs,
)

val configureBuildForHermes by
    tasks.registering(CustomExecTask::class) {
      dependsOn(installCMake)
      workingDir(hermesDir)
      inputs.dir(hermesDir)
      outputs.files(hermesBuildOutputFileTree)
      val cmakeCommandLine = configureBuildForHermesCommandLineArgs(hermesBuildDir, jsiDir, false)
      commandLine(cmakeCommandLine)
      standardOutputFile.set(project.file("$buildDir/configure-hermesc.log"))
    }

val buildHermesC by
    tasks.registering(CustomExecTask::class) {
      dependsOn(configureBuildForHermes)
      workingDir(hermesDir)
      inputs.files(hermesBuildOutputFileTree)
      outputs.file(hermesCOutputBinary)
      val cmakeCommandLine = buildHermesCCommandLineArgs()
      commandLine(cmakeCommandLine)
      standardOutputFile.set(project.file("$buildDir/build-hermesc.log"))
      errorOutputFile.set(project.file("$buildDir/build-hermesc.error.log"))
    }

val prepareHeadersForPrefab by
    tasks.registering(Copy::class) {
      dependsOn(buildHermesC)
      from("$hermesDir/API")
      from("$hermesDir/public")
      include("**/*.h")
      exclude("jsi/**")
      into(prefabHeadersDir)
    }

val buildHermesLib by
    tasks.registering(CustomExecTask::class) {
      dependsOn(buildHermesC)
      workingDir(hermesDir)
      inputs.files(hermesBuildOutputFileTree)
      commandLine(
          cmakeBinaryPath,
          "--build",
          hermesBuildDir.toString(),
          "--target",
          "hermesvm",
          "-j",
          ndkBuildJobs,
      )
      standardOutputFile.set(project.file("$buildDir/build-hermes-lib.log"))
      errorOutputFile.set(project.file("$buildDir/build-hermes-lib.error.log"))
    }

// The repeated tasks below named "*WithDebugger" are required by Fantom.
// Hermes V1 by default builds with the debugger disabled, while Fantom needs
// it to be enabled as it does a debug build of React Native.
val configureBuildForHermesWithDebugger by
    tasks.registering(CustomExecTask::class) {
      dependsOn(installCMake)
      workingDir(hermesDir)
      inputs.dir(hermesDir)
      outputs.files(hermesBuildOutputFileTree)
      val cmakeCommandLine = configureBuildForHermesCommandLineArgs(hermesBuildDir, jsiDir, true)
      commandLine(cmakeCommandLine)
      standardOutputFile.set(project.file("$buildDir/configure-hermesc.log"))
    }

val buildHermesCWithDebugger by
    tasks.registering(CustomExecTask::class) {
      dependsOn(configureBuildForHermesWithDebugger)
      workingDir(hermesDir)
      inputs.files(hermesBuildOutputFileTree)
      outputs.file(hermesCOutputBinary)
      val cmakeCommandLine = buildHermesCCommandLineArgs()
      commandLine(cmakeCommandLine)
      standardOutputFile.set(project.file("$buildDir/build-hermesc.log"))
      errorOutputFile.set(project.file("$buildDir/build-hermesc.error.log"))
    }

val prepareHeadersForPrefabWithDebugger by
    tasks.registering(Copy::class) {
      dependsOn(buildHermesCWithDebugger)
      from("$hermesDir/API")
      from("$hermesDir/public")
      include("**/*.h")
      exclude("jsi/**")
      into(prefabHeadersDir)
    }

val buildHermesLibWithDebugger by
    tasks.registering(CustomExecTask::class) {
      dependsOn(buildHermesCWithDebugger)
      workingDir(hermesDir)
      inputs.files(hermesBuildOutputFileTree)
      commandLine(
          cmakeBinaryPath,
          "--build",
          hermesBuildDir.toString(),
          "--target",
          "hermesvm",
          "-j",
          ndkBuildJobs,
      )
      standardOutputFile.set(project.file("$buildDir/build-hermes-lib.log"))
      errorOutputFile.set(project.file("$buildDir/build-hermes-lib.error.log"))
    }

fun windowsAwareCommandLine(vararg commands: String): List<String> {
  val result =
      if (Os.isFamily(Os.FAMILY_WINDOWS)) {
        mutableListOf("cmd", "/c")
      } else {
        mutableListOf()
      }
  result.addAll(commands)
  return result
}

fun reactNativeArchitectures(): List<String> {
  val value = project.properties["reactNativeArchitectures"]
  return value?.toString()?.split(",") ?: listOf("armeabi-v7a", "x86", "x86_64", "arm64-v8a")
}

repositories {
  // Normally RNGP will set repositories for all modules,
  // but when consumed from source, we need to re-declare
  // those repositories as there is no app module there.
  mavenCentral()
  google()
}

android {
  compileSdk = libs.versions.compileSdk.get().toInt()
  buildToolsVersion = libs.versions.buildTools.get()
  namespace = "com.facebook.hermes"

  // Used to override the NDK path/version on internal CI or by allowing
  // users to customize the NDK path/version from their root project (e.g. for Apple Silicon
  // support)
  if (rootProject.hasProperty("ndkPath") && rootProject.properties["ndkPath"] != null) {
    ndkPath = rootProject.properties["ndkPath"].toString()
  }
  if (rootProject.hasProperty("ndkVersion") && rootProject.properties["ndkVersion"] != null) {
    ndkVersion = rootProject.properties["ndkVersion"].toString()
  } else {
    ndkVersion = libs.versions.ndkVersion.get()
  }

  defaultConfig {
    minSdk = libs.versions.minSdk.get().toInt()

    externalNativeBuild {
      cmake {
        arguments(
            "--log-level=ERROR",
            "-Wno-dev",
            "-DHERMES_IS_ANDROID=True",
            "-DANDROID_STL=c++_shared",
            "-DANDROID_PIE=True",
            "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON",
            "-DIMPORT_HOST_COMPILERS=${File(hermesBuildDir, "ImportHostCompilers.cmake").toString()}",
            "-DJSI_DIR=${jsiDir}",
            "-DHERMES_BUILD_SHARED_JSI=True",
            "-DHERMES_RELEASE_VERSION=for RN ${version}",
            "-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=True",
            // We intentionally build Hermes with Intl support only. This is to simplify
            // the build setup and to avoid overcomplicating the build-type matrix.
            "-DHERMES_ENABLE_INTL=True",
        )

        arguments("-DHERMESVM_HEAP_HV_MODE=HEAP_HV_PREFER32")

        targets("hermesvm")
      }
    }
    ndk { abiFilters.addAll(reactNativeArchitectures()) }

    compileOptions {
      sourceCompatibility = JavaVersion.VERSION_17
      targetCompatibility = JavaVersion.VERSION_17
    }
  }

  externalNativeBuild {
    cmake {
      version = cmakeVersion
      path = File("$hermesDir/CMakeLists.txt")
    }
  }

  buildTypes {
    debug {
      externalNativeBuild {
        cmake {
          // JS developers aren't VM developers.
          // Therefore we're passing as build type Release, to provide a faster build.
          // This has the (unlucky) side effect of letting AGP call the build
          // tasks `configureCMakeRelease` while is actually building the debug flavor.
          arguments(
              "-DCMAKE_BUILD_TYPE=Release",
              // For debug builds, explicitly enable the Hermes Debugger.
              "-DHERMES_ENABLE_DEBUGGER=True",
          )
        }
      }
    }
    release {
      externalNativeBuild {
        cmake {
          arguments(
              "-DCMAKE_BUILD_TYPE=MinSizeRel",
              // For release builds, we don't want to enable the Hermes Debugger.
              "-DHERMES_ENABLE_DEBUGGER=False",
          )
        }
      }
    }
    buildTypes {
      create("debugOptimized") {
        initWith(getByName("debug"))
        externalNativeBuild { cmake { arguments("-DCMAKE_BUILD_TYPE=Release") } }
      }
    }
  }

  sourceSets {
    named("main") {
      manifest.srcFile("$hermesDir/android/hermes/src/main/AndroidManifest.xml")
      java.directories.addAll(
          listOf(
              "$hermesDir/lib/Platform/Intl/java",
              "$hermesDir/lib/Platform/Unicode/java",
          )
      )
    }
  }

  buildFeatures {
    prefab = true
    prefabPublishing = true
  }

  dependencies {
    implementation(libs.fbjni)
    implementation(libs.yoga.proguard.annotations)
    implementation(libs.androidx.annotation)
  }

  packaging {
    jniLibs.excludes.add("**/libc++_shared.so")
    jniLibs.excludes.add("**/libjsi.so")
    jniLibs.excludes.add("**/libfbjni.so")
  }

  prefab { create("hermesvm") { headers = prefabHeadersDir.absolutePath } }
}

afterEvaluate {
  if (!overrideHermesDir) {
    // If you're not specifying a Hermes Path override, we want to
    // download/unzip Hermes from Github then.
    tasks.getByName("configureBuildForHermes").dependsOn(unzipHermes)
    tasks.getByName("prepareHeadersForPrefab").dependsOn(unzipHermes)
    tasks.getByName("configureBuildForHermesWithDebugger").dependsOn(unzipHermes)
    tasks.getByName("prepareHeadersForPrefabWithDebugger").dependsOn(unzipHermes)
  }
  tasks.getByName("preBuild").dependsOn(buildHermesC)
  tasks.getByName("preBuild").dependsOn(prepareHeadersForPrefab)
}

tasks.withType<JavaCompile>().configureEach {
  options.compilerArgs.add("-Xlint:deprecation,unchecked")
  options.compilerArgs.add("-Werror")
}
