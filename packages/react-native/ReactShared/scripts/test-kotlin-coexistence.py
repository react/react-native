#!/usr/bin/env python3
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Check two independent Kotlin/Native frameworks built with the same compiler.

Tests all four combinations of static and dynamic runtime ownership. No
Kotlin classes are cast between frameworks. This does not promise compatibility
with arbitrary third-party compiler versions or exported Kotlin dependencies.
"""

import argparse
import json
import os
import pathlib
import platform
import re
import subprocess


def run(command, log):
    result = subprocess.run([str(item) for item in command], capture_output=True, text=True)
    log.write_text(result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError(f"Command failed with exit {result.returncode}; inspect {log}")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-only", action="store_true", help="Compile and inspect linkage without simulator execution.")
    parser.add_argument("--output", type=pathlib.Path)
    args = parser.parse_args()
    shared = pathlib.Path(__file__).resolve().parent.parent
    output = (args.output or shared / "build/kotlin-coexistence").resolve()
    output.mkdir(parents=True, exist_ok=True)
    fixture = shared / "tests/coexistence"
    version_matches = re.findall(r'kotlin\("multiplatform"\) version "([^"]+)"', (shared / "build.gradle.kts").read_text())
    if len(version_matches) != 1:
        raise RuntimeError("Cannot identify the shared module's Kotlin compiler version.")
    version = version_matches[0]
    architecture = platform.machine()
    host = "macos-aarch64" if architecture == "arm64" else "macos-x86_64"
    target = "ios_simulator_arm64" if architecture == "arm64" else "ios_x64"
    konan = pathlib.Path(os.environ.get("KONAN_DATA_DIR", pathlib.Path.home() / ".konan"))
    compiler = pathlib.Path(os.environ.get("RCT_KMP_KONANC", konan / f"kotlin-native-prebuilt-{host}-{version}/bin/konanc"))
    if not compiler.is_file():
        raise RuntimeError("Build ReactShared once to install its compiler, or set RCT_KMP_KONANC to the matching konanc.")
    compiler_version = run([compiler, "-version"], output / "compiler-version.log")
    if not re.search(rf'(?<![\d.]){re.escape(version)}(?![\d.])', compiler_version.stdout + compiler_version.stderr):
        raise RuntimeError(f"Coexistence fixture requires the same compiler as ReactShared ({version}).")
    framework_task = "linkReleaseFrameworkIosSimulatorArm64" if architecture == "arm64" else "linkReleaseFrameworkIosX64"
    run([shared / "gradlew", "-p", shared, framework_task, "--max-workers=2", "--console=plain"], output / "shared-build.log")
    kotlin_target = "iosSimulatorArm64" if architecture == "arm64" else "iosX64"
    shared_frameworks = shared / f"build/bin/{kotlin_target}/releaseFramework"
    for linkage in ("static", "dynamic"):
        (output / linkage).mkdir(exist_ok=True)
        command = [compiler, fixture / "IndependentKotlin.kt", "-target", target, "-produce", "framework", "-opt",
                   "-Xbinary=bundleId=com.facebook.react.kmp.independentfixture", "-o", output / linkage / "IndependentKotlin"]
        if linkage == "static":
            command.append("-Xstatic-framework")
        run(command, output / f"independent-{linkage}.log")
    sdk = subprocess.check_output(["xcrun", "--sdk", "iphonesimulator", "--show-sdk-path"], text=True).strip()
    flags = ["-std=c++20", "-fobjc-arc", "-O2", "-target", f"{architecture}-apple-ios15.1-simulator", "-isysroot", sdk,
             "-F", str(shared_frameworks), "-F", str(output / "static")]
    # React-Core must export the shared classes even when only dependent pods
    # call them. Exercise its linker flags without any algorithm references.
    empty_owner = output / "libReactNativeRuntimeOnly.dylib"
    run(["xcrun", "clang++", *flags, "-dynamiclib", "-ObjC", "-framework", "ReactNativeShared",
         "-framework", "Foundation", "-Wl,-dead_strip", "-o", empty_owner], output / "empty-owner-link.log")
    empty_symbols = run(["xcrun", "nm", "-gU", empty_owner], output / "empty-owner-symbols.log").stdout
    for class_name in ("RNSBase", "RNSGradientStops"):
        if f"_OBJC_CLASS_$_{class_name}" not in empty_symbols:
            raise RuntimeError(f"An owner without algorithm references did not retain {class_name}.")
    run(["xcrun", "clang++", *flags, "-c", fixture / "ReactNativeRuntimeOwner.mm", "-o", output / "owner.o"], output / "owner-compile.log")
    run(["xcrun", "clang++", *flags, "-c", fixture / "AppleKotlinCoexistence.mm", "-o", output / "host.o"], output / "host-compile.log")
    run(["xcrun", "clang++", *flags, "-dynamiclib", output / "owner.o", "-framework", "ReactNativeShared", "-framework", "Foundation",
         "-Wl,-install_name,@rpath/libReactNativeRuntimeOwner.dylib", "-o", output / "libReactNativeRuntimeOwner.dylib"], output / "owner-link.log")
    owner_symbols = run(["xcrun", "nm", "-gU", output / "libReactNativeRuntimeOwner.dylib"], output / "owner-defined-symbols.log").stdout
    if "_OBJC_CLASS_$_RNSBase" not in owner_symbols:
        raise RuntimeError("Dynamic RN owner does not contain the shared framework's runtime classes.")
    records = []
    for name, independent, dynamic_owner in (
        ("static-static", "static", False),
        ("static-dynamic", "dynamic", False),
        ("dynamic-static", "static", True),
        ("dynamic-dynamic", "dynamic", True),
    ):
        executable = output / f"Coexistence-{name}"
        link = ["xcrun", "clang++", "-fobjc-arc", "-target", f"{architecture}-apple-ios15.1-simulator", "-isysroot", sdk,
                output / "host.o", "-F", shared_frameworks, "-F", output / independent,
                "-framework", "IndependentKotlin", "-framework", "Foundation", "-Wl,-dead_strip", "-o", executable]
        if dynamic_owner:
            link.extend(["-L", output, "-lReactNativeRuntimeOwner", f"-Wl,-rpath,{output}"])
        else:
            link.extend([output / "owner.o", "-framework", "ReactNativeShared"])
        if independent == "dynamic":
            link.append(f"-Wl,-rpath,{output / 'dynamic'}")
        run(link, output / f"{name}-link.log")
        imports = run(["xcrun", "otool", "-L", executable], output / f"{name}-dependencies.log").stdout
        # Inspect an exported Objective-C base class to check which Mach-O image
        # owns RN's runtime classes. Do not rely on private Kotlin symbol names.
        symbols = run(["xcrun", "nm", "-gU", executable], output / f"{name}-defined-symbols.log").stdout
        defines_rn_classes = "_OBJC_CLASS_$_RNSBase" in symbols
        if defines_rn_classes != (not dynamic_owner):
            raise RuntimeError(f"Unexpected RN runtime ownership in {name}.")
        defines_independent_classes = "_OBJC_CLASS_$_IndependentKotlinBase" in symbols
        if defines_independent_classes != (independent == "static"):
            raise RuntimeError(f"Unexpected independent runtime ownership in {name}.")
        if dynamic_owner != ("libReactNativeRuntimeOwner.dylib" in imports):
            raise RuntimeError(f"Unexpected RN runtime owner dependency in {name}.")
        if (independent == "dynamic") != ("IndependentKotlin.framework/IndependentKotlin" in imports):
            raise RuntimeError(f"Unexpected independent runtime linkage in {name}.")
        records.append({"configuration": name, "compiled": True, "runtimeExecuted": False,
                        "reactNativeRuntimeOwner": "libReactNativeRuntimeOwner.dylib" if dynamic_owner else "host",
                        "independentRuntimeOwner": "IndependentKotlin.framework" if independent == "dynamic" else "host"})
    if not args.build_only:
        simulator = os.environ.get("RCT_KMP_SIMULATOR_UDID")
        if not simulator:
            devices = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "devices", "available", "-j"], text=True))["devices"]
            simulator = next((items[0]["udid"] for runtime, items in devices.items() if ".iOS-" in runtime and items), None)
        if not simulator:
            raise RuntimeError("A compatible iOS simulator runtime is required.")
        for record in records:
            name = record["configuration"]
            result = run(["xcrun", "simctl", "spawn", "--standalone", simulator, output / f"Coexistence-{name}"], output / f"{name}-runtime.log")
            if re.search(r"Class .* is implemented in both", result.stderr):
                raise RuntimeError(f"Duplicate Objective-C runtime classes in {name}; inspect the runtime log.")
            if "Kotlin framework coexistence passed" not in result.stdout:
                raise RuntimeError(f"Missing coexistence success marker for {name}.")
            record["runtimeExecuted"] = True
    report = {"kotlinCompiler": version, "target": target, "configurations": records,
              "scope": "same compiler; independent modules; primitive values copied across API boundaries"}
    (output / "results.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"Kotlin framework coexistence {'compiled' if args.build_only else 'passed'}: {output / 'results.json'}")


if __name__ == "__main__":
    main()
