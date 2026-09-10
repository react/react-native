#!/usr/bin/env python3
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Measure clean, unchanged, and edited shared-module builds in an isolated copy.

Dependency/compiler caches stay warm. Gradle's build-output cache is disabled so
the clean build measures compilation instead of restoring another build's outputs.
This measures the added shared module, not the entire Android or iOS application.
"""

import argparse
import json
import pathlib
import platform
import shutil
import subprocess
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plan-only", action="store_true", help="Print the measurement plan without building.")
    parser.add_argument("--output", type=pathlib.Path)
    args = parser.parse_args()
    shared = pathlib.Path(__file__).resolve().parent.parent
    output = (args.output or shared / "build/kmp-build-benchmark").resolve()
    output.mkdir(parents=True, exist_ok=True)
    target = "IosSimulatorArm64" if platform.machine() == "arm64" else "IosX64"
    tasks = ["jvmTest", f"linkReleaseFramework{target}"]
    phases = [
        {"name": "clean_outputs", "tasks": ["clean", *tasks]},
        {"name": "unchanged_incremental", "tasks": tasks},
        {"name": "edited_common_source", "tasks": tasks},
    ]
    report = {
        "dependencyAndCompilerCaches": "warm; existing user caches",
        "gradleBuildOutputCache": "disabled", "measurementsExecuted": False,
        "scope": "isolated shared module; not total application build time",
        "sourceEdit": "append a comment to the copied common source; original source remains unchanged",
        "phases": phases,
    }
    if not args.plan_only:
        if platform.system() != "Darwin":
            parser.error("The paired JVM/iOS measurement requires macOS and Xcode.")
        fixture = output / "fixture"
        if fixture.exists():
            parser.error(f"Choose a fresh --output directory; fixture already exists: {fixture}")
        copied_shared = fixture / "ReactShared"
        copied_shared.mkdir(parents=True)
        for name in ("build.gradle.kts", "settings.gradle.kts", "gradle.properties", "gradlew", "gradlew.bat", "gradle", "src"):
            source = shared / name
            if source.is_dir():
                shutil.copytree(source, copied_shared / name)
            else:
                shutil.copy2(source, copied_shared / name)
        (fixture / "ReactAndroid").mkdir()
        shutil.copy2(shared.parent / "ReactAndroid/gradle.properties", fixture / "ReactAndroid/gradle.properties")
        for phase in phases:
            if phase["name"] == "edited_common_source":
                source = copied_shared / "src/commonMain/kotlin/com/facebook/react/shared/GradientStops.kt"
                with source.open("a") as stream:
                    stream.write("\n// Non-semantic edit in the isolated build-cost fixture.\n")
            command = [str(copied_shared / "gradlew"), *phase["tasks"], "--no-build-cache", "--max-workers=2", "--console=plain"]
            started = time.perf_counter()
            completed = subprocess.run(command, cwd=copied_shared, capture_output=True, text=True)
            phase.update(elapsedSeconds=time.perf_counter() - started, exitCode=completed.returncode)
            (output / f"{phase['name']}.log").write_text(completed.stdout + completed.stderr)
            if completed.returncode != 0:
                report["failurePhase"] = phase["name"]
                (output / "results.json").write_text(json.dumps(report, indent=2) + "\n")
                raise SystemExit(f"Build measurement failed in {phase['name']}; inspect {output}.")
        report["measurementsExecuted"] = True
    (output / "results.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"{'Planned' if args.plan_only else 'Measured'} shared-module build costs: {output / 'results.json'}")


if __name__ == "__main__":
    main()
