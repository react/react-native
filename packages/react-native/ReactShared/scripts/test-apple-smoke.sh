#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -euo pipefail

shared_root="$(cd "$(dirname "$0")/.." && pwd)"
architecture="$(uname -m)"
case "$architecture" in
  arm64) target=IosSimulatorArm64; kotlin_target=iosSimulatorArm64 ;;
  x86_64) target=IosX64; kotlin_target=iosX64 ;;
  *) echo "error: Unsupported simulator architecture: $architecture" >&2; exit 1 ;;
esac

"$shared_root/gradlew" -p "$shared_root" -PreactNativeSharedSmoke=true \
  "linkDebugFramework$target" "linkReleaseFramework$target" --max-workers=2 --console=plain

output="$shared_root/build/smoke/apple-interop"
mkdir -p "$output"
sdk="$(xcrun --sdk iphonesimulator --show-sdk-path)"
simulator="${RCT_KMP_SIMULATOR_UDID:-}"
if [[ -z "$simulator" ]]; then
  simulator="$(xcrun simctl list -j | python3 -c '
import json, sys
state = json.load(sys.stdin)
runtimes = sorted((r for r in state["runtimes"] if r.get("isAvailable") and ".iOS-" in r["identifier"]),
                  key=lambda r: tuple(map(int, r["version"].split("."))), reverse=True)
for runtime in runtimes:
    devices = [d for d in state["devices"].get(runtime["identifier"], []) if d.get("isAvailable")]
    if devices:
        print(devices[0]["udid"])
        break
')"
fi
if [[ -z "$simulator" ]]; then
  echo 'error: Install an iOS simulator runtime and create a device in Xcode.' >&2
  exit 1
fi

for configuration in debug release; do
  frameworks="$shared_root/build/smoke/bin/$kotlin_target/${configuration}Framework"
  executable="$output/AppleKmpSmoke-$configuration"
  xcrun clang++ -std=c++20 -fobjc-arc -target "$architecture-apple-ios15.1-simulator" \
    -isysroot "$sdk" -F "$frameworks" "$shared_root/tests/smoke/AppleKmpSmoke.mm" \
    -framework ReactNativeShared -framework Foundation -o "$executable"
  # Standalone execution does not boot or alter the selected simulator.
  xcrun simctl spawn --standalone "$simulator" "$executable" 2>&1 | tee "$output/$configuration.log"
  grep -q '^Kotlin Objective-C smoke passed: 5 cases$' "$output/$configuration.log"
done
