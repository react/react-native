#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -euo pipefail

shared_root="$(cd "$(dirname "$0")/.." && pwd)"
react_native_root="$(cd "$shared_root/.." && pwd)"
repo_root="$(cd "$react_native_root/../.." && pwd)"
test_root="${RCT_KMP_TEST_OUTPUT_DIR:-$shared_root/build/apple-multipart-test}"
architecture="$(uname -m)"
sdk_root="$(xcrun --sdk iphonesimulator --show-sdk-path)"
developer="$(xcode-select -p)/Platforms/iPhoneSimulator.platform/Developer"
mkdir -p "$test_root/include/React"
ln -sf "$react_native_root/React/Base/RCTMultipartStreamReader.h" "$test_root/include/React/RCTMultipartStreamReader.h"

PLATFORM_NAME=iphonesimulator ARCHS="$architecture" CONFIGURATION=Release \
  PODS_CONFIGURATION_BUILD_DIR="$test_root" "$shared_root/scripts/build-apple-framework.sh"

flags=(
  -fobjc-arc -O2 -target "$architecture-apple-ios15.1-simulator" -isysroot "$sdk_root"
  -I "$test_root/include" -F "$test_root/ReactNativeSharedKMP"
)
adapter="$react_native_root/React/Base/RCTMultipartStreamReader.m"
xcrun clang "${flags[@]}" -DRCT_USE_KMP=1 -c "$adapter" -o "$test_root/adapter.o"
xcrun clang "${flags[@]}" -DRCT_USE_KMP=0 -DRCTMultipartStreamReader=RCTMultipartStreamReaderBaseline \
  -c "$adapter" -o "$test_root/baseline.o"

# Check that the opt-in actually calls the shared framing/header types.
nm -u "$test_root/adapter.o" | grep -q 'OBJC_CLASS_\$_RNSMultipartFraming'
nm -u "$test_root/adapter.o" | grep -q 'OBJC_CLASS_\$_RNSMultipartHeaders'
if nm -u "$test_root/baseline.o" | grep -q 'OBJC_CLASS_\$_RNS'; then
  echo 'error: Native fallback unexpectedly references Kotlin classes.' >&2
  exit 1
fi

# Compile the actual RNTester XCTest source, then run the same tests on both paths.
for mode in native kmp; do
  bundle="$test_root/Multipart-$mode.xctest"
  mkdir -p "$bundle"
  use_kmp=0
  if [[ "$mode" == kmp ]]; then use_kmp=1; fi
  xcrun clang "${flags[@]}" -DRCT_USE_KMP="$use_kmp" -bundle \
    -F "$developer/Library/Frameworks" -framework XCTest \
    -Wl,-rpath,"$developer/Library/Frameworks" \
    "$adapter" "$repo_root/packages/rn-tester/RNTesterUnitTests/RCTMultipartStreamReaderTests.m" \
    -framework Foundation -framework QuartzCore -framework ReactNativeShared -o "$bundle/MultipartTests"
  /usr/libexec/PlistBuddy -c Clear "$bundle/Info.plist" >/dev/null
  /usr/libexec/PlistBuddy -c 'Add :CFBundleExecutable string MultipartTests' "$bundle/Info.plist"
  /usr/libexec/PlistBuddy -c 'Add :CFBundleIdentifier string com.facebook.react.MultipartTests' "$bundle/Info.plist"
  /usr/libexec/PlistBuddy -c 'Add :CFBundlePackageType string BNDL' "$bundle/Info.plist"
done

xcrun clang "${flags[@]}" "$shared_root/tests/AppleMultipartParity.m" \
  "$test_root/adapter.o" "$test_root/baseline.o" \
  -framework Foundation -framework QuartzCore -framework ReactNativeShared -o "$test_root/AppleMultipartParity"

# Catalyst keeps the Foundation implementation, including when opt-in is set.
mac_sdk_root="$(xcrun --sdk macosx --show-sdk-path)"
xcrun clang -fobjc-arc -DRCT_USE_KMP=1 \
  -target "$architecture-apple-ios15.1-macabi" -isysroot "$mac_sdk_root" \
  -isystem "$mac_sdk_root/System/iOSSupport/usr/include" \
  -iframework "$mac_sdk_root/System/iOSSupport/System/Library/Frameworks" \
  -fsyntax-only "$adapter"

if [[ "${RCT_KMP_BUILD_ONLY:-0}" == "1" ]]; then exit 0; fi
simulator="${RCT_KMP_SIMULATOR_UDID:-}"
if [[ -z "$simulator" ]]; then
  simulator="$(xcrun simctl list devices available -j | python3 -c '
import json, sys
for runtime, entries in json.load(sys.stdin)["devices"].items():
    if ".iOS-" in runtime and entries:
        print(entries[0]["udid"])
        break
')"
fi
if [[ -z "$simulator" ]]; then
  echo 'error: Install an iOS Simulator runtime before running multipart tests.' >&2
  exit 1
fi
for mode in native kmp; do
  xcrun simctl spawn --standalone "$simulator" "$developer/Library/Xcode/Agents/xctest" \
    "$test_root/Multipart-$mode.xctest"
done
xcrun simctl spawn --standalone "$simulator" "$test_root/AppleMultipartParity"
if [[ "${RCT_KMP_BENCHMARK:-0}" == "1" ]]; then
  xcrun simctl spawn --standalone "$simulator" "$test_root/AppleMultipartParity" --benchmark
fi
