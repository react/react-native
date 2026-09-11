#!/usr/bin/env python3
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Measure the real native and KMP adapters in separate Release executables.

Requires the same toolchain and simulator runtime as test-apple-gradient.sh.
Results are simulator microbenchmarks, not device or application benchmarks.
"""

import argparse
import hashlib
import json
import os
import pathlib
import platform
import statistics
import subprocess
import time


def run(command, **kwargs):
    started = time.perf_counter()
    result = subprocess.run(command, capture_output=True, text=True, **kwargs)
    if result.returncode:
        raise RuntimeError(
            f"Command failed ({result.returncode}): {command}\n"
            + (result.stdout + result.stderr)[-12000:]
        )
    return result, time.perf_counter() - started


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-only", action="store_true", help="Compile without accessing the simulator.")
    parser.add_argument("--iterations", type=int, default=2000)
    parser.add_argument("--samples", type=int, default=7)
    parser.add_argument("--repeats", type=int, default=3, help="Fresh processes per case and variant.")
    parser.add_argument("--output", type=pathlib.Path)
    parser.add_argument("--prepared-release-dir", type=pathlib.Path,
                        help="Reuse artifacts previously built by test-apple-gradient.sh with RCT_KMP_BUILD_TYPE=Release.")
    args = parser.parse_args()
    if not 1 <= args.iterations <= 1000000 or not 1 <= args.samples <= 100 or not 1 <= args.repeats <= 100:
        parser.error("iterations must be 1..1000000; samples and repeats must be 1..100")
    shared = pathlib.Path(__file__).resolve().parent.parent
    react = shared.parent
    output = (args.output or shared / "build/apple-gradient-benchmark").resolve()
    output.mkdir(parents=True, exist_ok=True)
    prepared = args.prepared_release_dir.resolve() if args.prepared_release_dir else output / "prepared"
    preparation_seconds = None
    if not args.prepared_release_dir:
        env = dict(os.environ, RCT_KMP_BUILD_TYPE="Release", RCT_KMP_BUILD_ONLY="1", RCT_KMP_TEST_OUTPUT_DIR=str(prepared))
        preparation, preparation_seconds = run([str(shared / "scripts/test-apple-gradient.sh")], env=env)
        (output / "prepare.log").write_text(preparation.stdout + preparation.stderr)
    sdk = run(["xcrun", "--sdk", "iphonesimulator", "--show-sdk-path"])[0].stdout.strip()
    architecture = platform.machine()
    graphics = react / "ReactCommon/react/renderer/graphics"
    flags = [
        "-std=c++20", "-O2", "-fobjc-arc", "-DREACT_NATIVE_PRODUCTION", "-DRCTLOG_ENABLED=0",
        "-include", "memory", "-include", "vector", "-target", f"{architecture}-apple-ios15.1-simulator",
        "-isysroot", sdk, "-I", str(prepared / "include"), "-I", str(react / "ReactCommon"),
        "-I", str(graphics / "platform/ios"), "-F", str(prepared / "ReactNativeSharedKMP"),
    ]
    native_objects = [str(prepared / name) for name in [
        "RCTAnimationUtils.mm.o", "Color.cpp.o", "ColorComponents.cpp.o", "HostPlatformColor.mm.o",
        "RCTPlatformColorUtils.mm.o", "ManagedObjectWrapper.mm.o",
    ]]
    frameworks = ["-framework", "Foundation", "-framework", "UIKit", "-framework", "QuartzCore", "-framework", "CoreGraphics"]
    builds = {}
    executables = {}
    for variant in ("native", "kmp"):
        adapter = output / f"{variant}-adapter.o"
        defines = ["-DRCT_USE_KMP=1"] if variant == "kmp" else ["-DRCT_USE_KMP=0", "-DRCTGradientUtils=RCTGradientUtilsBaseline"]
        _, compile_seconds = run(["xcrun", "clang++", *flags, *defines, "-c", str(react / "React/Fabric/Utils/RCTGradientUtils.mm"), "-o", str(adapter)])
        executable = output / f"AppleGradientBenchmark-{variant}"
        link = ["xcrun", "clang++", *flags, f"-DRCT_BENCHMARK_KMP={int(variant == 'kmp')}",
                str(shared / "tests/AppleGradientBenchmark.mm"), str(adapter), *native_objects,
                *frameworks, "-Wl,-dead_strip", "-o", str(executable)]
        if variant == "kmp":
            link.extend(["-framework", "ReactNativeShared"])
        _, link_seconds = run(link)
        executables[variant] = executable
        builds[variant] = {"adapterCompileSeconds": compile_seconds, "harnessCompileAndLinkSeconds": link_seconds,
                           "executableBytes": executable.stat().st_size}
        size = run(["xcrun", "size", "-m", str(executable)])[0].stdout
        (output / f"{variant}-segments.txt").write_text(size)
    framework = prepared / "ReactNativeSharedKMP/ReactNativeShared.framework/ReactNativeShared"
    report = {
        "configuration": "Release; clang -O2; dead stripping; separate native-only and KMP executables",
        "platform": "iOS simulator", "hostArchitecture": architecture, "sdk": sdk,
        "xcode": run(["xcodebuild", "-version"])[0].stdout.strip(),
        "preparationSeconds": preparation_seconds, "builds": builds,
        "reusedReleaseArtifacts": bool(args.prepared_release_dir),
        "artifactSha256": {str(path): hashlib.sha256(path.read_bytes()).hexdigest()
                           for path in [framework, *(pathlib.Path(item) for item in native_objects)]},
        "staticFrameworkBytes": framework.stat().st_size,
        "incrementalExecutableBytes": builds["kmp"]["executableBytes"] - builds["native"]["executableBytes"],
        "runtimeExecuted": False, "measurements": [], "firstCallProcesses": [],
        "limitations": [
            "Simulator results are not physical-device performance or RN application startup.",
            "First-call latency starts after inputs exist; process elapsed time includes simctl/OS launch overhead.",
            "Memory values are process footprint snapshots, not total allocated bytes; Kotlin GC is not forced.",
            "Binary size is this isolated executable, not an installed, signed, or compressed application delta.",
            "Compilation timings are one warm-cache observation; preparation includes framework and parity harness builds.",
        ],
    }
    if not args.build_only:
        simulator = os.environ.get("RCT_KMP_SIMULATOR_UDID")
        if not simulator:
            devices = json.loads(run(["xcrun", "simctl", "list", "devices", "available", "-j"])[0].stdout)["devices"]
            simulator = next((items[0]["udid"] for runtime, items in devices.items() if ".iOS-" in runtime and items), None)
        if not simulator:
            raise RuntimeError("Install a compatible iOS simulator runtime or set RCT_KMP_SIMULATOR_UDID.")
        for repetition in range(args.repeats):
            for variant in (("native", "kmp") if repetition % 2 == 0 else ("kmp", "native")):
                result, elapsed = run(["xcrun", "simctl", "spawn", "--standalone", simulator,
                                       str(executables[variant]), "two_stops", "1", "1", "--first-call-only"])
                measurement = json.loads(result.stdout)
                measurement.update(repetition=repetition, processElapsedSeconds=elapsed)
                report["firstCallProcesses"].append(measurement)
                (output / f"first-call-{variant}-{repetition}.stderr.log").write_text(result.stderr)
        cases = ("two_stops", "implicit_16", "explicit_64", "asymmetric_hint", "multiple_hints")
        for repetition in range(args.repeats):
            for case in cases:
                # Alternate order across independent processes to reduce ordering bias.
                for variant in (("native", "kmp") if repetition % 2 == 0 else ("kmp", "native")):
                    result, elapsed = run(["xcrun", "simctl", "spawn", "--standalone", simulator,
                                           str(executables[variant]), case, str(args.iterations), str(args.samples)])
                    measurement = json.loads(result.stdout)
                    measurement.update(repetition=repetition, processElapsedSeconds=elapsed)
                    measurement["medianNanosecondsPerCall"] = statistics.median(measurement["nanosecondsPerCall"])
                    report["measurements"].append(measurement)
                    (output / f"{case}-{variant}-{repetition}.stderr.log").write_text(result.stderr)
                pair = report["measurements"][-2:]
                if pair[0]["checksum"] != pair[1]["checksum"]:
                    raise RuntimeError(f"Observed output checksum differs for {case}; inspect parity before comparing timings.")
        report["runtimeExecuted"] = True
    (output / "results.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"{'Compiled' if args.build_only else 'Measured'} native and KMP gradient executables: {output / 'results.json'}")


if __name__ == "__main__":
    main()
