#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -euo pipefail

mode="${1:-}"
case "$mode" in
  ''|--build-only|--package-only) ;;
  *) echo "Usage: $0 [--build-only|--package-only]" >&2; exit 1 ;;
esac
shared_root="$(cd "$(dirname "$0")/.." && pwd)"
build_type="${RCT_KMP_BUILD_TYPE:-Release}"
case "$build_type" in
  Debug) variant=debugFramework ;;
  Release) variant=releaseFramework ;;
  *) echo 'error: RCT_KMP_BUILD_TYPE must be Debug or Release.' >&2; exit 1 ;;
esac
output="${RCT_KMP_DISTRIBUTION_OUTPUT_DIR:-$shared_root/build/apple-distribution/$build_type}"
mkdir -p "$output"
output="$(cd "$output" && pwd)"
# A fresh fixture avoids stale architecture slices or outputs from another build.
fixture="$(mktemp -d "$output/consumer.XXXXXX")"
cp -R "$shared_root/tests/distribution/." "$fixture/"

if [[ "$mode" != --package-only ]]; then
  "$shared_root/gradlew" -p "$shared_root" --console=plain \
    "link${build_type}FrameworkIosArm64" \
    "link${build_type}FrameworkIosSimulatorArm64" \
    "link${build_type}FrameworkIosX64"
fi

device="$shared_root/build/bin/iosArm64/$variant/ReactNativeShared.framework"
sim_arm="$shared_root/build/bin/iosSimulatorArm64/$variant/ReactNativeShared.framework"
sim_intel="$shared_root/build/bin/iosX64/$variant/ReactNativeShared.framework"
for framework in "$device" "$sim_arm" "$sim_intel"; do
  test -f "$framework/ReactNativeShared"
  cmp "$device/Headers/ReactNativeShared.h" "$framework/Headers/ReactNativeShared.h"
done
ditto "$sim_arm" "$fixture/simulator/ReactNativeShared.framework"
xcrun lipo -create "$sim_arm/ReactNativeShared" "$sim_intel/ReactNativeShared" \
  -output "$fixture/simulator/ReactNativeShared.framework/ReactNativeShared"
xcodebuild -create-xcframework -framework "$device" \
  -framework "$fixture/simulator/ReactNativeShared.framework" \
  -output "$fixture/ReactNativeShared.xcframework" > "$fixture/package.log" 2>&1

# Include the matching Kotlin runtime's license bundle in any packaged experiment.
python3 - "$shared_root" "$fixture" "$mode" <<'PY'
import hashlib, json, os, pathlib, platform, plistlib, re, shutil, sys
root, fixture = map(pathlib.Path, sys.argv[1:3])
compiler = re.search(r'version "([^"]+)"', (root / 'build.gradle.kts').read_text())[1]
host = 'aarch64' if platform.machine() == 'arm64' else 'x86_64'
konan = pathlib.Path(os.environ.get('KONAN_DATA_DIR', pathlib.Path.home() / '.konan'))
native_home = pathlib.Path(os.environ.get('KONAN_HOME', konan / f'kotlin-native-prebuilt-macos-{host}-{compiler}'))
licenses = native_home / 'licenses'
if not (licenses / 'LICENSE.txt').is_file():
    sys.exit(f'error: Matching Kotlin {compiler} licenses missing at {licenses}; set KONAN_HOME.')
shutil.copytree(licenses, fixture / 'licenses' / 'kotlin')
shutil.copyfile(root.parent / 'LICENSE', fixture / 'licenses' / 'ReactNative-LICENSE')
xcf = fixture / 'ReactNativeShared.xcframework'
info = plistlib.loads((xcf / 'Info.plist').read_bytes())
slices = {(item['SupportedPlatform'], item.get('SupportedPlatformVariant', ''),
           tuple(sorted(item['SupportedArchitectures']))) for item in info['AvailableLibraries']}
expected = {('ios', '', ('arm64',)), ('ios', 'simulator', ('arm64', 'x86_64'))}
if slices != expected:
    sys.exit(f'error: Unexpected XCFramework slices: {slices}')
manifest = {
    'kotlinVersion': compiler,
    'reusedExistingFrameworks': sys.argv[3] == '--package-only',
    'files': {str(p.relative_to(fixture)): hashlib.sha256(p.read_bytes()).hexdigest()
              for p in sorted(xcf.rglob('*')) if p.is_file()},
    'scope': 'Isolated binary consumer; not the React Native core SwiftPM/prebuilt integration',
}
(fixture / 'distribution.json').write_text(json.dumps(manifest, indent=2) + '\n')
PY

if [[ "$mode" == --package-only ]]; then
  echo "XCFramework slices and licenses checked using existing frameworks; consumer build/execution pending: $fixture"
  exit 0
fi

(cd "$fixture" && swift package describe --type json) > "$fixture/package-description.json" 2> "$fixture/package-description.log"
for platform in 'iOS' 'iOS Simulator' 'macOS,variant=Mac Catalyst'; do
  name="${platform// /-}"
  (cd "$fixture" && xcodebuild -scheme KMPDistributionProbe \
    -destination "generic/platform=$platform" -derivedDataPath "$fixture/derived/$name" \
    -configuration "$build_type" CLANG_ENABLE_CODE_COVERAGE=NO CODE_SIGNING_ALLOWED=NO build) > "$fixture/$name.log" 2>&1
done
if [[ "$mode" != --build-only ]]; then
  simulator="${RCT_KMP_SIMULATOR_UDID:-}"
  if [[ -z "$simulator" ]]; then
    simulator="$(xcrun simctl list devices available -j | python3 -c '
import json, sys
for runtime, devices in json.load(sys.stdin)["devices"].items():
    if ".iOS-" in runtime and devices:
        print(devices[0]["udid"])
        break
')"
  fi
  : "${simulator:?Install an iOS simulator runtime or set RCT_KMP_SIMULATOR_UDID}"
  (cd "$fixture" && xcodebuild -scheme KMPDistributionProbe \
    -destination "id=$simulator" -derivedDataPath "$fixture/derived/iOS-Simulator" \
    -configuration "$build_type" -resultBundlePath "$fixture/consumer.xcresult" \
    -enableCodeCoverage NO CODE_SIGNING_ALLOWED=NO test) > "$fixture/consumer-test.log" 2>&1
  xcrun xcresulttool get test-results summary --path "$fixture/consumer.xcresult" > "$fixture/test-summary.json"
  python3 - "$fixture/test-summary.json" <<'PY'
import json
import sys

summary = json.load(open(sys.argv[1]))
if summary.get('failedTests', 0) or not summary.get('passedTests', 0):
    sys.exit('error: The distribution consumer must execute passing tests.')
PY
fi
echo "Apple distribution checks completed ($mode): $fixture"
