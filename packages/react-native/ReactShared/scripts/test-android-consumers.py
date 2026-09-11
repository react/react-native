#!/usr/bin/env python3
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Build fresh Android consumers of the Maven AAR and packed npm source.

Requires Python 3.12+, Node/Yarn/npm, JDK 17 and the Android SDK/NDK. Run after
the repository's Yarn install. A supplied device runs both release APKs; without
one the report explicitly records compilation/packaging validation only.
The packed-source build also builds Hermes from source, as the standard React
Native composite does; the repository-only stable-Hermes flag does not apply.
"""

import argparse
from collections import Counter
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import tempfile
import textwrap
import time
import tomllib
import uuid
import zipfile


SHARED = Path(__file__).resolve().parents[1]
RN = SHARED.parent
REPOSITORY = RN.parent.parent


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip(), encoding="utf-8")


def groovy_string(value):
    return "'" + str(value).replace("\\", "\\\\").replace("'", "\\'") + "'"


def run(command, cwd, log, env=None):
    print("Running: " + " ".join(map(str, command)), flush=True)
    with log.open("w", encoding="utf-8") as output:
        subprocess.run(command, cwd=cwd, env=env, stdout=output,
                       stderr=subprocess.STDOUT, check=True)


def properties(path):
    return dict(line.strip().split("=", 1) for line in path.read_text().splitlines()
                if "=" in line and not line.lstrip().startswith("#"))


def pack(package, destination, environment):
    result = subprocess.run(
        ["npm", "pack", "--ignore-scripts", "--json", "--pack-destination", str(destination)],
        cwd=package, env=environment, check=True, capture_output=True, text=True,
    )
    metadata = json.loads(result.stdout)
    if isinstance(metadata, dict):
        metadata = [metadata] if "filename" in metadata else list(metadata.values())
    if len(metadata) != 1:
        raise AssertionError(f"Expected one npm package: {metadata}")
    return destination / metadata[0]["filename"]


def unpack(archive, destination):
    destination.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive) as tar:
        members = tar.getmembers()
        if any(not member.name.startswith("package/") for member in members):
            raise AssertionError(f"Unexpected npm archive layout: {archive}")
        for member in members:
            member.name = member.name.removeprefix("package/")
        tar.extractall(destination, members=members, filter="data")


def inspect_aar(aar):
    classes = Counter()
    with zipfile.ZipFile(aar) as archive:
        for entry in archive.namelist():
            if entry == "classes.jar" or (entry.startswith("libs/") and entry.endswith(".jar")):
                with zipfile.ZipFile(io.BytesIO(archive.read(entry))) as jar:
                    classes.update(name for name in jar.namelist()
                                   if name.startswith("com/facebook/react/shared/")
                                   and name.endswith(".class"))
    required = {f"com/facebook/react/shared/{name}.class"
                for name in ["GradientStops", "GradientStopInput", "ResolvedGradientStop",
                             "MultipartFraming", "MultipartChunk", "MultipartHeaders", "MultipartHeader",
                             "ScrollSnapOffsets", "ScrollSnapDirection", "ScrollSnapResult"]}
    if not required.issubset(classes) or any(count != 1 for count in classes.values()):
        raise AssertionError(f"Missing or duplicated shared classes in {aar}: {classes}")
    with tempfile.TemporaryDirectory(prefix="react-native-kmp-bytecode-") as directory:
        jar = Path(directory) / "classes.jar"
        with zipfile.ZipFile(aar) as archive:
            jar.write_bytes(archive.read("classes.jar"))
        adapters = {
            "com.facebook.react.uimanager.style.ColorStopUtils": ("GradientStops.resolve",),
            "com.facebook.react.devsupport.MultipartStreamReader": (
                "MultipartFraming.nextChunk", "MultipartHeaders.parse"),
        }
        for view in ("ReactScrollView", "ReactHorizontalScrollView", "ReactNestedScrollView"):
            adapters[f"com.facebook.react.views.scroll.{view}"] = ("ScrollSnapOffsets.resolve",)
        for adapter, methods in adapters.items():
            bytecode = subprocess.check_output(
                ["javap", "-c", "-p", "-classpath", str(jar), adapter], text=True)
            for method in methods:
                pattern = r"invoke(?:static|virtual)\s+.*// Method com/facebook/react/shared/" + re.escape(method) + r"(?:\$default)?:"
                if not re.search(pattern, bytecode):
                    raise AssertionError(f"{adapter} does not invoke shared {method} in {aar}")
    return {"path": str(aar), "sha256": hashlib.sha256(aar.read_bytes()).hexdigest(),
            "shared_class_counts": dict(classes), "adapter_invokes_shared_resolver": True}


ACTIVITY = r"""
package com.facebook.react.kmp.consumer;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.util.Log;
import android.widget.TextView;
import com.facebook.react.devsupport.MultipartStreamReader;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.style.ColorStop;
import com.facebook.react.uimanager.style.ColorStopUtils;
import com.facebook.react.uimanager.style.ProcessedColorStop;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.io.IOException;
import okio.Buffer;
import okio.BufferedSource;

// Java deliberately exercises the packaged Android adapter through its JVM API.
// No shared source files or replacement implementation are compiled into this app.
public final class MainActivity extends Activity {
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    DisplayMetrics metrics = new DisplayMetrics();
    metrics.setTo(getResources().getDisplayMetrics());
    metrics.density = 2f;
    DisplayMetricsHolder.setScreenDisplayMetrics(metrics);
    List<ProcessedColorStop> density = ColorStopUtils.INSTANCE.getFixedColorStops(
        Arrays.asList(new ColorStop(Color.RED,
            new LengthPercentage(25f, LengthPercentageType.POINT)),
            new ColorStop(Color.BLUE, null)), 200f);
    if (density.get(0).getPosition() != .25f) throw new AssertionError("Android density");
    List<ProcessedColorStop> hint = ColorStopUtils.INSTANCE.getFixedColorStops(
        Arrays.asList(new ColorStop(Color.argb(128, 255, 0, 0), null),
            new ColorStop(null, new LengthPercentage(25f, LengthPercentageType.PERCENT)),
            new ColorStop(Color.BLUE, null)), 100f);
    if (hint.size() != 11 || hint.get(3).getPosition() != .25f
        || hint.get(3).getColor() != Color.argb(191, 127, 0, 127)) {
      throw new AssertionError("Shared hint expansion or Android alpha rounding");
    }
    checkMultipart();
    String result = "KMP consumer PASS " + BuildConfig.CONSUMER_MODE
        + " " + getIntent().getStringExtra("validationToken");
    TextView text = new TextView(this);
    text.setText(result);
    setContentView(text);
    Log.i("KmpConsumer", result);
  }

  private static void checkMultipart() {
    // The first body ends in CRLF, so a header marker can straddle the boundary.
    Buffer input = new Buffer().writeUtf8(
        "\r\n--sample\r\nfirst\r\n\r\n--sample\r\n"
        + "content-type: text/plain\r\n\r\nsecond\r\n--sample--\r\n");
    int[] parts = {0};
    try {
      boolean complete = new MultipartStreamReader(input, "sample").readAllParts(
          new MultipartStreamReader.ChunkListener() {
            @Override public void onChunkComplete(
                Map<String, String> headers, BufferedSource body, boolean last) throws IOException {
              int index = parts[0]++;
              String expected = index == 0 ? "first\r\n" : "second";
              if (index > 1 || !expected.equals(body.readUtf8()) || last != (index == 1)) {
                throw new AssertionError("Shared multipart body or completion");
              }
              if (index == 0 ? !headers.isEmpty()
                  : !"text/plain".equals(headers.get("CONTENT-TYPE"))) {
                throw new AssertionError("Android multipart header policy");
              }
            }
            @Override public void onChunkProgress(
                Map<String, String> headers, long loaded, long total) {}
          });
      if (!complete || parts[0] != 2) throw new AssertionError("Shared multipart framing");
    } catch (IOException error) {
      throw new AssertionError(error);
    }
  }
}
"""


def fixture(path, mode, versions, version, hermes_version, maven, abi):
    source_builds = """
        includeBuild('node_modules/@react-native/gradle-plugin')
        includeBuild('node_modules/react-native') {
          name = 'react-native-build-from-source'
          dependencySubstitution {
            substitute module('com.facebook.react:react-android') using project(':packages:react-native:ReactAndroid')
            substitute module('com.facebook.hermes:hermes-android') using project(':packages:react-native:ReactAndroid:hermes-engine')
          }
        }
    """ if mode == "source" else ""
    write(path / "settings.gradle", f"""
        pluginManagement {{ repositories {{ google(); mavenCentral(); gradlePluginPortal() }} }}
        dependencyResolutionManagement {{
          repositories {{
            exclusiveContent {{
              forRepository {{ maven {{ url = uri({groovy_string(maven)}) }} }}
              filter {{ includeModule('com.facebook.react', 'react-android') }}
            }}
            google()
            mavenCentral()
          }}
        }}
        rootProject.name = 'kmp-{mode}-consumer'
        include ':app'
        {source_builds}
    """)
    write(path / "gradle.properties", """
        android.useAndroidX=true
        org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
        org.gradle.caching=true
    """)
    if mode == "source":
        write(path / "build.gradle", """
            tasks.register('prepareSourceAars') {
              dependsOn gradle.includedBuild('react-native-build-from-source').task(':packages:react-native:ReactAndroid:bundleDebugAar')
              dependsOn gradle.includedBuild('react-native-build-from-source').task(':packages:react-native:ReactAndroid:bundleReleaseAar')
            }
        """)
    write(path / "app/build.gradle", f"""
        import groovy.json.JsonOutput
        import org.gradle.api.artifacts.component.ModuleComponentIdentifier
        import org.gradle.api.artifacts.component.ProjectComponentIdentifier

        plugins {{ id 'com.android.application' version '{versions['agp']}' }}
        android {{
          namespace 'com.facebook.react.kmp.consumer'
          compileSdk {versions['compileSdk']}
          ndkVersion '{versions['ndkVersion']}'
          defaultConfig {{
            applicationId 'com.facebook.react.kmp.consumer.{mode}'
            minSdk {versions['minSdk']}
            targetSdk {versions['targetSdk']}
            versionCode 1
            versionName '1.0'
            ndk {{ abiFilters '{abi}' }}
            buildConfigField 'String', 'CONSUMER_MODE', '"{mode}"'
          }}
          buildFeatures {{ buildConfig true }}
          // Match React Native's Gradle plugin rules for shared Prefab libraries.
          packaging {{
            jniLibs.pickFirsts += ['**/libfbjni.so', '**/libreactnative.so', '**/libjsi.so',
                                  '**/libc++_shared.so', '**/libhermesvm.so', '**/libhermestooling.so']
          }}
          compileOptions {{
            sourceCompatibility JavaVersion.VERSION_17
            targetCompatibility JavaVersion.VERSION_17
          }}
          buildTypes {{
            release {{
              minifyEnabled true
              shrinkResources true
              signingConfig signingConfigs.debug
              proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
            }}
          }}
        }}
        dependencies {{
          implementation 'com.facebook.react:react-android:{version}'
          implementation 'com.facebook.hermes:hermes-android:{hermes_version}'
        }}
        tasks.register('verifyResolution') {{
          dependsOn 'assembleDebug', 'assembleRelease'
          {"dependsOn ':prepareSourceAars'" if mode == "source" else ""}
          doLast {{
            def result = ['debug', 'release'].collectEntries {{ variant ->
              def configuration = configurations.getByName(variant + 'RuntimeClasspath')
              def components = configuration.incoming.resolutionResult.allComponents.findAll {{ component ->
                def id = component.id
                (id instanceof ModuleComponentIdentifier && id.group == 'com.facebook.react' && id.module == 'react-android') ||
                    (id instanceof ProjectComponentIdentifier && id.projectPath.endsWith(':ReactAndroid'))
              }}
              assert components.size() == 1 : components
              def id = components.first().id
              assert {str(mode == 'source').lower()} == (id instanceof ProjectComponentIdentifier) : id
              if (id instanceof ModuleComponentIdentifier) assert id.version == '{version}' : id
              def artifacts = configuration.incoming.artifactView {{
                componentFilter {{ component -> component == id }}
                {"attributes.attribute(org.gradle.api.artifacts.type.ArtifactTypeDefinition.ARTIFACT_TYPE_ATTRIBUTE, 'android-classes-jar')" if mode == "source" else ""}
              }}.artifacts.artifacts
              assert !artifacts.empty
              def engines = configuration.incoming.resolutionResult.allComponents.findAll {{ component ->
                def engine = component.id
                (engine instanceof ModuleComponentIdentifier && engine.group == 'com.facebook.hermes' && engine.module == 'hermes-android') ||
                    (engine instanceof ProjectComponentIdentifier && engine.projectPath.endsWith(':hermes-engine'))
              }}
              assert engines.size() == 1 : engines
              def engine = engines.first().id
              assert {str(mode == 'source').lower()} == (engine instanceof ProjectComponentIdentifier) : engine
              if (engine instanceof ModuleComponentIdentifier) assert engine.version == '{hermes_version}' : engine
              [(variant): [component: id.displayName, artifacts: artifacts.collect {{ it.file.absolutePath }}, hermes_component: engine.displayName]]
            }}
            file(layout.buildDirectory.file('consumer-resolution.json')).text = JsonOutput.prettyPrint(JsonOutput.toJson(result))
          }}
        }}
    """)
    write(path / "app/src/main/AndroidManifest.xml", """
        <manifest xmlns:android="http://schemas.android.com/apk/res/android">
          <application android:label="KMP consumer" android:theme="@android:style/Theme.Material.Light.NoActionBar">
            <activity android:name="com.facebook.react.kmp.consumer.MainActivity" android:exported="true">
              <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
              </intent-filter>
            </activity>
          </application>
        </manifest>
    """)
    write(path / "app/src/main/java/com/facebook/react/kmp/consumer/MainActivity.java", ACTIVITY)


def device_check(adb, serial, fixture_dir, mode, log):
    package = f"com.facebook.react.kmp.consumer.{mode}"
    apk = fixture_dir / "app/build/outputs/apk/release/app-release.apk"
    prefix = [adb, "-s", serial]
    token = uuid.uuid4().hex
    with log.open("w", encoding="utf-8") as output:
        subprocess.run(prefix + ["install", "-r", str(apk)], stdout=output,
                       stderr=subprocess.STDOUT, check=True)
        try:
            subprocess.run(prefix + ["shell", "am", "start", "-W", "-n",
                           package + "/com.facebook.react.kmp.consumer.MainActivity",
                           "--es", "validationToken", token],
                           stdout=output, stderr=subprocess.STDOUT, check=True)
            for _ in range(20):
                text = subprocess.check_output(prefix + ["logcat", "-d", "-s", "KmpConsumer:I", "*:S"], text=True)
                if f"KMP consumer PASS {mode} {token}" in text:
                    output.write(text)
                    return {"serial": serial, "release_adapter_assertions": "passed"}
                time.sleep(0.5)
            raise AssertionError(f"Release app did not report successful adapter checks: {mode}")
        finally:
            subprocess.run(prefix + ["shell", "am", "force-stop", package], check=False)
            subprocess.run(prefix + ["uninstall", package], stdout=output,
                           stderr=subprocess.STDOUT, check=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--maven-repository", type=Path, help="Use an existing real ReactAndroid Maven publication instead of publishing locally")
    parser.add_argument("--device", help="adb serial for executing both minified release APKs")
    parser.add_argument("--abi", default="arm64-v8a")
    parser.add_argument("--max-workers", type=int, default=4, help="Maximum concurrent Gradle workers")
    parser.add_argument("--prepare-only", action="store_true", help="Pack and prepare fixtures; do not claim build or runtime validation")
    args = parser.parse_args()
    if args.max_workers < 1:
        parser.error("--max-workers must be positive")
    output = args.output_dir.resolve() if args.output_dir else Path(tempfile.mkdtemp(prefix="react-native-kmp-android-"))
    output.mkdir(parents=True, exist_ok=True)
    if any((output / name).exists() for name in ["binary", "source"]):
        parser.error("Use a fresh output directory; existing consumer fixtures are never overwritten")
    environment = dict(os.environ, npm_config_cache=str(output / "npm-cache"),
                       npm_config_fetch_timeout="30000", npm_config_fetch_retries="2")
    packages = output / "packages"
    packages.mkdir()
    run(["yarn", "--cwd", str(REPOSITORY / "packages/react-native-codegen"), "build"], REPOSITORY, output / "codegen.log", environment)
    archives = {name: pack(path, packages, environment) for name, path in {
        "react-native": RN, "@react-native/codegen": REPOSITORY / "packages/react-native-codegen",
        "@react-native/gradle-plugin": REPOSITORY / "packages/gradle-plugin",
    }.items()}
    source = output / "source"
    for name, archive in archives.items():
        unpack(archive, source / "node_modules" / name)
    packed_rn = source / "node_modules/react-native"
    excluded_parts = {"build", ".build", ".gradle", ".kotlin", ".cxx", ".swiftpm", "__pycache__"}
    leaked = [str(path.relative_to(packed_rn)) for path in (packed_rn / "ReactShared").rglob("*")
              if any(part in excluded_parts for part in path.relative_to(packed_rn / "ReactShared").parts)
              or path.suffix in {".pyc", ".o", ".a", ".so", ".dylib", ".class", ".framework", ".xcframework"}]
    if leaked:
        raise AssertionError(f"Generated ReactShared outputs leaked into the npm archive: {leaked}")
    versions = tomllib.loads((packed_rn / "gradle/libs.versions.toml").read_text())["versions"]
    version = properties(packed_rn / "ReactAndroid/gradle.properties")["VERSION_NAME"]
    hermes = properties(packed_rn / "sdks/hermes-engine/version.properties")["HERMES_VERSION_NAME"]
    maven = args.maven_repository.resolve() if args.maven_repository else output / "maven"
    for mode in ["binary", "source"]:
        fixture(output / mode, mode, versions, version, hermes, maven, args.abi)
    report = {"status": "prepared", "archives": {name: {"path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for name, path in archives.items()},
              "maven_repository": str(maven), "abi": args.abi,
              "hermes_build": {"publication": "stable Maven dependency", "packed_source": "standard Hermes source build"},
              "consumers": {}}
    report_file = output / "results.json"
    report_file.write_text(json.dumps(report, indent=2) + "\n")
    if args.prepare_only:
        print(f"Prepared fixtures only; no Android builds or device tests ran. Report: {report_file}")
        return
    gradle = [str(REPOSITORY / "gradlew"), f"--max-workers={args.max_workers}", "--console=plain",
              f"-PreactNativeArchitectures={args.abi}",
              "-Dorg.gradle.internal.http.connectionTimeout=30000", "-Dorg.gradle.internal.http.socketTimeout=30000"]
    try:
        if not args.maven_repository:
            init = output / "publication.gradle"
            write(init, f"""
                gradle.projectsEvaluated {{
                  rootProject.allprojects.each {{ project ->
                    def publishing = project.extensions.findByType(org.gradle.api.publish.PublishingExtension)
                    publishing?.repositories?.withType(org.gradle.api.artifacts.repositories.MavenArtifactRepository)?.each {{ repository ->
                      if (repository.name == 'mavenTempLocal') repository.url = project.uri({groovy_string(maven)})
                    }}
                  }}
                }}
            """)
            run(gradle + ["-Preact.internal.useHermesStable=true", "--init-script", str(init), ":packages:react-native:ReactAndroid:publishReleasePublicationToMavenTempLocalRepository"], REPOSITORY, output / "publication.log")
        aars = list((maven / "com/facebook/react/react-android" / version).glob("*.aar"))
        if not aars:
            raise AssertionError("The Maven publication contains no ReactAndroid AARs")
        report["published_aars"] = [inspect_aar(aar) for aar in aars]
        # Install dependencies for the packed tools, without installing an unpublished
        # React Native version or replacing the extracted React Native source package.
        write(source / "package.json", json.dumps({"private": True, "dependencies": {
            name: f"file:{archives[name]}" for name in ["@react-native/codegen", "@react-native/gradle-plugin"]}}, indent=2))
        run(["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund"], source, output / "source-dependencies.log", environment)
        # npm may prune the manually extracted package because it is deliberately not
        # installed from the registry. Re-extract the same immutable npm archive.
        if (source / "node_modules/react-native").exists():
            shutil.rmtree(source / "node_modules/react-native")
        unpack(archives["react-native"], source / "node_modules/react-native")
        for mode in ["binary", "source"]:
            consumer = output / mode
            run(gradle + [":app:verifyResolution"], consumer, output / f"{mode}-build.log")
            resolution = json.loads((consumer / "app/build/consumer-resolution.json").read_text())
            report["consumers"][mode] = {"debug_and_minified_release": "passed", "resolution": resolution,
                                          "runtime": "not run: no --device supplied"}
            if mode == "source":
                built = list((packed_rn / "ReactAndroid/build/outputs/aar").glob("*.aar"))
                if not built:
                    raise AssertionError("Packed-source consumer did not build a ReactAndroid AAR")
                report["source_aars"] = [inspect_aar(aar) for aar in built]
            if args.device:
                sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
                adb = str(Path(sdk) / "platform-tools/adb") if sdk else shutil.which("adb")
                if not adb:
                    raise RuntimeError("adb is required for --device")
                report["consumers"][mode]["runtime"] = device_check(adb, args.device, consumer, mode, output / f"{mode}-device.log")
        report["status"] = "passed"
    except Exception as error:
        report["status"] = "failed"
        report["error"] = str(error)
        raise
    finally:
        report_file.write_text(json.dumps(report, indent=2) + "\n")
        print(f"Android consumer report: {report_file}")


if __name__ == "__main__":
    main()
