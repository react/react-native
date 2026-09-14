#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -euo pipefail

shared_root="$(cd "$(dirname "$0")/.." && pwd)"
react_native_root="$(cd "$shared_root/.." && pwd)"
test_root="${RCT_KMP_TEST_OUTPUT_DIR:-$shared_root/build/apple-gradient-test}"
architecture="$(uname -m)"
sdk_root="$(xcrun --sdk iphonesimulator --show-sdk-path)"
mkdir -p "$test_root/include/React"

# Build and stage through the same helper that the CocoaPods build phase uses.
PLATFORM_NAME=iphonesimulator ARCHS="$architecture" CONFIGURATION=Debug \
  PODS_CONFIGURATION_BUILD_DIR="$test_root" "$shared_root/scripts/build-apple-framework.sh"

for header in "$react_native_root"/React/Base/*.h; do
  ln -sf "$header" "$test_root/include/React/$(basename "$header")"
done
ln -sf "$react_native_root/Libraries/NativeAnimation/RCTAnimationUtils.h" "$test_root/include/React/RCTAnimationUtils.h"
ln -sf "$react_native_root/React/Fabric/Utils/RCTGradientUtils.h" "$test_root/include/React/RCTGradientUtils.h"

# Use the real inline color conversion without pulling unrelated renderer/Folly
# headers into this standalone test. Fail if its declaration can no longer be extracted.
python3 - "$react_native_root/React/Fabric/RCTConversions.h" "$test_root/include/React/RCTConversions.h" <<'PY'
import pathlib
import re
import sys

source = pathlib.Path(sys.argv[1]).read_text()
helpers = re.findall(
    r"(?m)^inline UIColor \*_Nullable RCTUIColorFromSharedColor\([^\n]*\)\n\{[^{}]*\n\}", source
)
if len(helpers) != 1:
    sys.exit("error: RCTUIColorFromSharedColor changed; update the standalone parity header extraction.")
pathlib.Path(sys.argv[2]).write_text(
    "#import <react/renderer/graphics/Color.h>\n"
    "#import <react/renderer/graphics/RCTPlatformColorUtils.h>\n" + helpers[0] + "\n"
)
PY

graphics="$react_native_root/ReactCommon/react/renderer/graphics"
ios_graphics="$graphics/platform/ios/react/renderer/graphics"
flags=(
  -std=c++20 -fobjc-arc -DREACT_NATIVE_PRODUCTION -DRCTLOG_ENABLED=0 -include memory -include vector
  -target "$architecture-apple-ios15.1-simulator" -isysroot "$sdk_root"
  -I "$test_root/include" -I "$react_native_root/ReactCommon" -I "$graphics/platform/ios"
  -F "$test_root/ReactNativeSharedKMP"
)
if [[ "${RCT_KMP_BUILD_TYPE:-Debug}" == "Release" ]]; then
  flags+=(-O2)
fi
adapter="$react_native_root/React/Fabric/Utils/RCTGradientUtils.mm"
xcrun clang++ "${flags[@]}" -DRCT_USE_KMP=1 -c "$adapter" -o "$test_root/adapter.o"
xcrun clang++ "${flags[@]}" -DRCT_USE_KMP=0 -DRCTGradientUtils=RCTGradientUtilsBaseline \
  -c "$adapter" -o "$test_root/baseline.o"
native_sources=(
  "$react_native_root/Libraries/NativeAnimation/RCTAnimationUtils.mm"
  "$graphics/Color.cpp" "$graphics/ColorComponents.cpp"
  "$ios_graphics/HostPlatformColor.mm" "$ios_graphics/RCTPlatformColorUtils.mm"
  "$react_native_root/ReactCommon/react/utils/ManagedObjectWrapper.mm"
)
native_objects=()
for source in "${native_sources[@]}"; do
  object="$test_root/$(basename "$source").o"
  xcrun clang++ "${flags[@]}" -x objective-c++ -c "$source" -o "$object"
  native_objects+=("$object")
done
frameworks=(-framework Foundation -framework UIKit -framework QuartzCore -framework CoreGraphics)
xcrun clang++ "${flags[@]}" "$shared_root/tests/AppleGradientParity.mm" \
  "$test_root/adapter.o" "$test_root/baseline.o" "${native_objects[@]}" \
  -framework ReactNativeShared "${frameworks[@]}" \
  -o "$test_root/AppleGradientParity"

# Exercise the dynamic RCTFabric linkage model too: Kotlin is linked into this
# library only, and the caller links the library without another Kotlin runtime.
xcrun clang++ "${flags[@]}" -dynamiclib "$test_root/adapter.o" "${native_objects[@]}" \
  -framework ReactNativeShared "${frameworks[@]}" \
  -Wl,-install_name,@rpath/libKMPGradientAdapter.dylib -o "$test_root/libKMPGradientAdapter.dylib"
xcrun clang++ "${flags[@]}" "$shared_root/tests/AppleGradientParity.mm" "$test_root/baseline.o" \
  -L "$test_root" -lKMPGradientAdapter "${frameworks[@]}" -Wl,-rpath,"$test_root" \
  -o "$test_root/AppleGradientParityDynamic"

# Catalyst must compile the original path even when the pilot flag is defined,
# without a framework header search path or a nonexistent Catalyst K/N slice.
mac_sdk_root="$(xcrun --sdk macosx --show-sdk-path)"
xcrun clang++ -std=c++20 -fobjc-arc -DREACT_NATIVE_PRODUCTION -DRCT_USE_KMP=1 \
  -target "$architecture-apple-ios15.1-macabi" -isysroot "$mac_sdk_root" \
  -isystem "$mac_sdk_root/System/iOSSupport/usr/include" \
  -iframework "$mac_sdk_root/System/iOSSupport/System/Library/Frameworks" \
  -include memory -include vector -I "$test_root/include" \
  -I "$react_native_root/ReactCommon" -I "$graphics/platform/ios" -fsyntax-only "$adapter"

if [[ "${RCT_KMP_BUILD_ONLY:-0}" == "1" ]]; then
  echo "Apple gradient harnesses compiled; execution was not requested: $test_root"
  exit 0
fi

simulator="${RCT_KMP_SIMULATOR_UDID:-}"
if [[ -z "$simulator" ]]; then
  simulator="$(xcrun simctl list devices available -j | python3 -c '
import json, sys
devices = json.load(sys.stdin)["devices"]
for runtime, entries in devices.items():
    if ".iOS-" in runtime and entries:
        print(entries[0]["udid"])
        break
')"
fi
if [[ -z "$simulator" ]]; then
  echo 'error: Install an iOS Simulator runtime in Xcode before running the Apple gradient parity test.' >&2
  exit 1
fi
# Standalone spawn runs the executable without booting or modifying the simulator.
xcrun simctl spawn --standalone "$simulator" "$test_root/AppleGradientParity"
xcrun simctl spawn --standalone "$simulator" "$test_root/AppleGradientParityDynamic"
