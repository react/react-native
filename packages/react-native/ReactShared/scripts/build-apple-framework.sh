#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -euo pipefail

if [[ "${EFFECTIVE_PLATFORM_NAME:-}" == "-maccatalyst" || "${IS_MACCATALYST:-NO}" == "YES" ]]; then
  echo 'React Native KMP: Catalyst uses the existing native gradient implementation.'
  exit 0
fi

if [[ "${ACTION:-}" == "clean" ]]; then
  exit 0
fi

shared_root="$(cd "$(dirname "$0")/.." && pwd)"
build_type="${RCT_KMP_BUILD_TYPE:-${CONFIGURATION:-Debug}}"
case "$build_type" in
  Debug|*Debug*) build_type=Debug; framework_variant=debugFramework ;;
  Release|*Release*) build_type=Release; framework_variant=releaseFramework ;;
  *) echo 'error: Set RCT_KMP_BUILD_TYPE=Debug or Release for a custom Xcode configuration.' >&2; exit 1 ;;
esac

read -r -a architectures <<< "${ARCHS:-arm64}"
gradle_tasks=()
frameworks=()
for architecture in "${architectures[@]}"; do
  case "${PLATFORM_NAME:-}:$architecture" in
    iphoneos:arm64) kotlin_target=iosArm64; task_target=IosArm64 ;;
    iphonesimulator:arm64) kotlin_target=iosSimulatorArm64; task_target=IosSimulatorArm64 ;;
    iphonesimulator:x86_64) kotlin_target=iosX64; task_target=IosX64 ;;
    *) echo "error: React Native KMP has no framework for ${PLATFORM_NAME:-unknown}:$architecture." >&2; exit 1 ;;
  esac
  gradle_tasks+=("link${build_type}Framework${task_target}")
  frameworks+=("$shared_root/build/bin/$kotlin_target/$framework_variant/ReactNativeShared.framework")
done

"$shared_root/gradlew" -p "$shared_root" --console=plain "${gradle_tasks[@]}"

destination="${PODS_CONFIGURATION_BUILD_DIR:?Run this script from the React-KMP CocoaPods build phase}/ReactNativeSharedKMP"
mkdir -p "$destination"
rm -rf "$destination/ReactNativeShared.framework"
ditto "${frameworks[0]}" "$destination/ReactNativeShared.framework"
if [[ ${#frameworks[@]} -gt 1 ]]; then
  binaries=()
  for framework in "${frameworks[@]}"; do
    binaries+=("$framework/ReactNativeShared")
  done
  xcrun lipo -create "${binaries[@]}" -output "$destination/ReactNativeShared.framework/ReactNativeShared"
fi
