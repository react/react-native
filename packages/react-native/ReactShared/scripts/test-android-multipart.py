#!/usr/bin/env python3
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Run the real Android multipart adapter's JVM tests without building ReactAndroid.

An optional benchmark compares the adapter with an explicitly selected native Git
baseline. This measures a host JVM, not Android ART or network throughput.
"""

import argparse
import json
import pathlib
import re
import shutil
import subprocess
import tomllib


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=pathlib.Path)
    parser.add_argument("--baseline-ref", help="Git revision of the native adapter")
    parser.add_argument("--benchmark", action="store_true")
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--max-workers", type=int, default=2)
    args = parser.parse_args()
    if args.benchmark and not args.baseline_ref:
        parser.error("--benchmark requires an explicit --baseline-ref")

    shared = pathlib.Path(__file__).resolve().parents[1]
    react_native = shared.parent
    repo = react_native.parents[1]
    adapter = react_native / "ReactAndroid/src/main/java/com/facebook/react/devsupport/MultipartStreamReader.kt"
    tests = react_native / "ReactAndroid/src/test/java/com/facebook/react/devsupport/MultipartStreamReaderTest.kt"
    if not tests.is_file():
        parser.error("This fixture requires a React Native repository checkout; Android test sources are not included in the npm package.")
    versions = tomllib.loads((react_native / "gradle/libs.versions.toml").read_text())["versions"]
    language_version = ".".join(versions["kotlin"].split(".")[:2])
    output = (args.output or shared / "build/android-multipart-test").resolve()
    output.mkdir(parents=True, exist_ok=True)
    gradle = [str(shared / "gradlew"), "--console=plain", f"--max-workers={args.max_workers}"]
    if args.offline:
        gradle.append("--offline")
    subprocess.run(gradle + ["-p", str(shared), "exportAndroidJar"], check=True)

    version = re.search(r'kotlin\("multiplatform"\) version "([^"]+)"', (shared / "build.gradle.kts").read_text())
    if not version:
        raise RuntimeError("Could not find the shared module's Kotlin compiler version")
    (output / "settings.gradle.kts").write_text('''
pluginManagement {
  resolutionStrategy { eachPlugin {
    if (requested.id.id == "org.jetbrains.kotlin.jvm")
      useModule("org.jetbrains.kotlin:kotlin-gradle-plugin:${requested.version}")
  } }
  repositories { mavenCentral(); gradlePluginPortal() }
}
dependencyResolutionManagement { repositories { mavenCentral() } }
rootProject.name = "multipart-adapter-tests"
''')
    # Keep the standalone compiler compatible with its Gradle wrapper while
    # matching ReactAndroid's language/API level and runtime dependencies.
    (output / "gradle.properties").write_text("kotlin.stdlib.default.dependency=false\n")
    (output / "build.gradle.kts").write_text('''
import org.jetbrains.kotlin.gradle.dsl.KotlinVersion

plugins { kotlin("jvm") version %s }
kotlin {
  jvmToolchain(17)
  compilerOptions {
    languageVersion.set(KotlinVersion.fromVersion(%s))
    apiVersion.set(KotlinVersion.fromVersion(%s))
  }
}
sourceSets {
  main { kotlin.srcDir("main") }
  test { kotlin.srcDir("test") }
}
dependencies {
  implementation(files(%s))
  implementation("org.jetbrains.kotlin:kotlin-stdlib:%s")
  implementation("com.squareup.okio:okio:%s")
  testImplementation("junit:junit:%s")
  testImplementation("org.assertj:assertj-core:%s")
}
tasks.test { testLogging { events("passed", "failed", "skipped") } }
tasks.register<JavaExec>("benchmark") {
  classpath = sourceSets.main.get().runtimeClasspath
  mainClass.set("com.facebook.react.devsupport.AndroidMultipartBenchmarkKt")
}
''' % (json.dumps(version[1]), json.dumps(language_version), json.dumps(language_version),
       json.dumps(str(shared / "build/android/react-native-shared.jar")),
       versions["kotlin"], versions["okio"], versions["junit"], versions["assertj"]))

    # Keep only this runner's generated fixture inputs when reusing an output path.
    generated = {
        "main": ("MultipartStreamReader.kt", "MultipartStreamReaderBaseline.kt", "AndroidMultipartBenchmark.kt"),
        "test": ("MultipartStreamReaderTest.kt", "MultipartStreamReaderBaselineTest.kt"),
    }
    for name, files in generated.items():
        directory = output / name
        directory.mkdir(exist_ok=True)
        for source in files:
            (directory / source).unlink(missing_ok=True)
    shutil.copyfile(adapter, output / "main" / adapter.name)
    shutil.copyfile(tests, output / "test" / tests.name)
    if args.baseline_ref:
        baseline_commit = subprocess.check_output(
            ["git", "rev-parse", "--verify", f"{args.baseline_ref}^{{commit}}"], cwd=repo, text=True
        ).strip()
        print(f"Native baseline: {baseline_commit}", flush=True)
        baseline = subprocess.check_output(
            ["git", "show", f"{baseline_commit}:{adapter.relative_to(repo)}"], cwd=repo, text=True
        )
        if "com.facebook.react.shared" in baseline:
            raise RuntimeError("The selected baseline already uses shared Kotlin code")
        (output / "main/MultipartStreamReaderBaseline.kt").write_text(
            baseline.replace("MultipartStreamReader", "MultipartStreamReaderBaseline")
        )
        (output / "test/MultipartStreamReaderBaselineTest.kt").write_text(
            tests.read_text().replace("MultipartStreamReader", "MultipartStreamReaderBaseline")
        )
        if args.benchmark:
            shutil.copyfile(shared / "tests/AndroidMultipartBenchmark.kt", output / "main/AndroidMultipartBenchmark.kt")
    subprocess.run(gradle + ["-p", str(output), "test"], check=True)
    if args.benchmark:
        # Keep test compilation/execution out of the measurement window.
        subprocess.run(gradle + ["-p", str(output), "benchmark"], check=True)


if __name__ == "__main__":
    main()
