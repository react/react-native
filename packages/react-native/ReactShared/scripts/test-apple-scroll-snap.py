#!/usr/bin/env python3
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Compile the real Apple scroll adapter in both modes, compare it, and measure Release calls.

Uses an iOS simulator; does not build RNTester or change an existing simulator's state.
Measurements are isolated simulator observations, not device interaction or app startup results.
"""

import argparse
import hashlib
import json
import os
import pathlib
import platform
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=pathlib.Path)
    parser.add_argument("--build-only", action="store_true")
    parser.add_argument("--benchmark-repeats", type=int, default=3)
    args = parser.parse_args()
    if not 0 <= args.benchmark_repeats <= 20:
        parser.error("benchmark-repeats must be 0..20")
    shared = pathlib.Path(__file__).resolve().parent.parent
    react = shared.parent
    output = (args.output or shared / "build/apple-scroll-snap").resolve()
    output.mkdir(parents=True, exist_ok=False)
    command_number = 0

    def run(command, **kwargs):
        nonlocal command_number
        command_number += 1
        result = subprocess.run(command, capture_output=True, text=True, **kwargs)
        (output / f"command-{command_number}.log").write_text(
            repr(command) + "\n" + result.stdout + result.stderr
        )
        if result.returncode:
            raise RuntimeError(f"Command failed; see {output}/command-{command_number}.log\n{result.stderr[-4000:]}")
        return result.stdout

    architecture = platform.machine()
    task_target = {"arm64": "IosSimulatorArm64", "x86_64": "IosX64"}[architecture]
    native_target = {"arm64": "iosSimulatorArm64", "x86_64": "iosX64"}[architecture]
    run([str(shared / "gradlew"), "-p", str(shared), f"linkReleaseFramework{task_target}",
         "--max-workers=2", "--console=plain"])
    framework_parent = shared / f"build/bin/{native_target}/releaseFramework"
    include = output / "include/React"
    include.mkdir(parents=True)
    for header in (react / "React/Base").glob("*.h"):
        (include / header.name).symlink_to(header)
    scroll = react / "React/Fabric/Mounting/ComponentViews/ScrollView"
    splitter = react / "React/Fabric/Utils"
    for header in [scroll / "RCTEnhancedScrollView.h", splitter / "RCTGenericDelegateSplitter.h"]:
        (include / header.name).symlink_to(header)
    # EnhancedScrollView.h includes this header without using any of its declarations.
    # Keep unrelated Fabric/Folly dependencies out of the standalone UIKit fixture.
    (include / "RCTViewComponentView.h").write_text("// Unused transitive Fabric header in this standalone fixture.\n")
    sdk = run(["xcrun", "--sdk", "iphonesimulator", "--show-sdk-path"]).strip()
    flags = ["-std=c++20", "-O2", "-fobjc-arc", "-DREACT_NATIVE_PRODUCTION", "-DRCTLOG_ENABLED=0",
             "-target", f"{architecture}-apple-ios15.1-simulator", "-isysroot", sdk,
             "-I", str(output / "include"), "-I", str(react / "ReactCommon"), "-F", str(framework_parent)]
    frameworks = ["-framework", "Foundation", "-framework", "UIKit", "-framework", "QuartzCore", "-framework", "CoreGraphics"]
    adapter = scroll / "RCTEnhancedScrollView.mm"
    harness = shared / "tests/AppleScrollSnapParity.mm"
    splitter_object = output / "splitter.o"
    run(["xcrun", "clang++", *flags, "-c", str(splitter / "RCTGenericDelegateSplitter.mm"), "-o", str(splitter_object)])
    for mode, defines in {
        "kmp": ["-DRCT_USE_KMP=1"],
        "baseline": ["-DRCT_USE_KMP=0", "-DRCTEnhancedScrollView=RCTEnhancedScrollViewBaseline"],
        "native": ["-DRCT_USE_KMP=0"],
    }.items():
        run(["xcrun", "clang++", *flags, *defines, "-c", str(adapter), "-o", str(output / f"{mode}.o")])
    # Control for the benefit of caching alone: compile the actual native implementation
    # with vector storage/access, leaving its selection algorithm unchanged. This staged
    # file is a measurement fixture, never a production source edit.
    cached_source = adapter.read_text()
    edits = {
        '#import "RCTEnhancedScrollView.h"': '#import <React/RCTEnhancedScrollView.h>\n#include <vector>',
        '  BOOL _isSetContentOffsetDisabled;': '  BOOL _isSetContentOffsetDisabled;\n  std::vector<CGFloat> _cachedNativeOffsets;',
        '}\n\n#if RCT_SCROLL_SNAP_USE_KMP\n@synthesize': '''}
@synthesize snapToOffsets = _snapToOffsets;
- (void)setSnapToOffsets:(NSArray<NSNumber *> *)snapToOffsets
{
  _snapToOffsets = [snapToOffsets copy];
  _cachedNativeOffsets.clear();
  _cachedNativeOffsets.reserve(_snapToOffsets.count);
  for (NSNumber *offset in _snapToOffsets) {
    _cachedNativeOffsets.push_back(offset.floatValue);
  }
}

#if RCT_SCROLL_SNAP_USE_KMP
@synthesize''',
        'i < self.snapToOffsets.count': 'i < _cachedNativeOffsets.size()',
        '[[self.snapToOffsets objectAtIndex:i] floatValue]': '_cachedNativeOffsets[i]',
        '[[self.snapToOffsets firstObject] floatValue]': '_cachedNativeOffsets.front()',
        '[[self.snapToOffsets lastObject] floatValue]': '_cachedNativeOffsets.back()',
    }
    for before, after in edits.items():
        if cached_source.count(before) != 1:
            raise RuntimeError(f"Native cache control requires review after adapter change: {before}")
        cached_source = cached_source.replace(before, after)
    cached_path = output / "CachedNativeScrollView.mm"
    cached_path.write_text(cached_source)
    for name, defines in {"cached": [], "cached-parity": ["-DRCTEnhancedScrollView=RCTEnhancedScrollViewCached"]}.items():
        run(["xcrun", "clang++", *flags, "-DRCT_USE_KMP=0", *defines, "-c", str(cached_path), "-o", str(output / f"{name}.o")])
    symbols = {mode: run(["xcrun", "nm", "-u", str(output / f"{mode}.o")]) for mode in ("kmp", "native")}
    if "RNSScrollSnapOffsets" not in symbols["kmp"] or "RNS" in symbols["native"]:
        raise RuntimeError("Compiled adapters did not use the expected KMP/native paths")
    parity = output / "AppleScrollSnapParity"
    run(["xcrun", "clang++", *flags, str(harness), str(output / "kmp.o"), str(output / "baseline.o"), str(output / "cached-parity.o"),
         str(splitter_object), *frameworks, "-framework", "ReactNativeShared", "-o", str(parity)])
    executables = {}
    for mode in ("native", "cached", "kmp"):
        executable = output / f"AppleScrollSnapBenchmark-{mode}"
        run(["xcrun", "clang++", *flags, "-DRCT_SCROLL_BENCHMARK=1", str(harness), str(output / f"{mode}.o"),
             str(splitter_object), *frameworks, *(["-framework", "ReactNativeShared"] if mode == "kmp" else []),
             "-Wl,-dead_strip", "-o", str(executable)])
        executables[mode] = executable
    mac_sdk = run(["xcrun", "--sdk", "macosx", "--show-sdk-path"]).strip()
    catalyst = output / "catalyst.o"
    run(["xcrun", "clang++", "-std=c++20", "-fobjc-arc", "-DRCT_USE_KMP=1", "-DREACT_NATIVE_PRODUCTION",
         "-target", f"{architecture}-apple-ios15.1-macabi", "-isysroot", mac_sdk,
         "-isystem", f"{mac_sdk}/System/iOSSupport/usr/include",
         "-iframework", f"{mac_sdk}/System/iOSSupport/System/Library/Frameworks",
         "-I", str(output / "include"), "-I", str(react / "ReactCommon"), "-c", str(adapter), "-o", str(catalyst)])
    if "RNS" in run(["xcrun", "nm", "-u", str(catalyst)]):
        raise RuntimeError("Catalyst unexpectedly references Kotlin/Native")
    sources = [adapter, harness, shared / "src/commonMain/kotlin/com/facebook/react/shared/ScrollSnapOffsets.kt"]
    report = {
        "configuration": "Release; actual UIKit adapter compiled with KMP enabled and disabled",
        "platform": f"{architecture} iOS simulator", "sdk": sdk,
        "cachedNativeControlSha256": hashlib.sha256(cached_path.read_bytes()).hexdigest(),
        "sourceSha256": {str(path.relative_to(react)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sources},
        "catalystNativeFallbackCompiled": True, "runtimeExecuted": False,
        "executableBytes": {mode: path.stat().st_size for mode, path in executables.items()},
        "benchmarks": [],
        "limitations": [
            "Not physical-device performance, gesture interaction, or full-application startup/size.",
            "First property assignment includes snapshot conversion and lazy Kotlin initialization.",
            "Repeated flings reuse the property snapshot; each sample includes an autorelease pool per call.",
            "Cached-native control changes only property storage/access in a staged native adapter copy.",
            "Runs share the host with unrelated processes; timing is observational, with no pass/fail threshold.",
            "One unrelated unused Fabric header is omitted; RN logging sanitizer is replaced by a finite-input assertion.",
        ],
    }
    simulator = os.environ.get("RCT_KMP_SIMULATOR_UDID")
    owned = None
    try:
        if not args.build_only:
            if not simulator:
                inventory = json.loads(run(["xcrun", "simctl", "list", "-j"]))
                runtime = next((item for item in inventory["runtimes"]
                                if item.get("isAvailable") and "iOS" in item["identifier"]), None)
                device = next((item["identifier"] for item in (runtime or {}).get("supportedDeviceTypes", [])
                               if "iPhone" in item["name"]), None)
                if not device:
                    raise RuntimeError("Install a compatible iOS simulator runtime")
                owned = run(["xcrun", "simctl", "create", "KMP Scroll Snap Validation", device, runtime["identifier"]]).strip()
                simulator = owned
            report["parity"] = json.loads(run(["xcrun", "simctl", "spawn", "--standalone", simulator, str(parity)]))
            report["runtimeExecuted"] = True
            for repetition in range(args.benchmark_repeats):
                for count in (3, 16, 256):
                    for mode in (("native", "cached", "kmp") if repetition % 2 == 0 else ("kmp", "cached", "native")):
                        measurement = json.loads(run(["xcrun", "simctl", "spawn", "--standalone", simulator,
                                                      str(executables[mode]), str(count)]))
                        measurement.update(mode=mode, repetition=repetition)
                        report["benchmarks"].append(measurement)
    finally:
        if owned:
            run(["xcrun", "simctl", "delete", owned])
        (output / "results.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
