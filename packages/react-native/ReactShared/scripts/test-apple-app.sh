#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -euo pipefail

platform="${1:-simulator}"
case "$platform" in
  simulator|device|catalyst) ;;
  *) echo 'usage: test-apple-app.sh [simulator|device|catalyst] [--prepare-only]' >&2; exit 1 ;;
esac
if [[ $# -gt 2 || ( $# -eq 2 && "$2" != --prepare-only ) ]]; then
  echo 'error: The only optional second argument is --prepare-only.' >&2
  exit 1
fi

shared_root="$(cd "$(dirname "$0")/.." && pwd)"
repo_root="$(cd "$shared_root/../../.." && pwd)"
original="$repo_root/packages/rn-tester"
if [[ ! -f "$original/Podfile" ]]; then
  echo 'error: This application test requires a React Native repository checkout with RNTester.' >&2
  exit 1
fi
output="${RCT_KMP_APP_OUTPUT_DIR:-$shared_root/build/apple-app-$platform-${USE_FRAMEWORKS:-libraries}}"
mkdir -p "$output"
output="$(cd "$output" && pwd)"
if [[ -e "$output/DerivedData" || -e "$output/Tests.xcresult" ]]; then
  echo 'error: Choose a fresh RCT_KMP_APP_OUTPUT_DIR; existing products must not count as this run.' >&2
  exit 1
fi
# A sibling preserves RNTester's relative references to the other packages.
fixture="$(mktemp -d "$repo_root/packages/.rn-tester-kmp.XXXXXX")"
simulator=""
metro_pid=""
websocket_pid=""
cleanup() {
  result=$?
  trap - EXIT ERR
  set +e
  for pid in "$metro_pid" "$websocket_pid"; do
    if [[ -n "$pid" ]]; then kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; fi
  done
  if [[ -n "$simulator" ]]; then
    xcrun simctl shutdown "$simulator" >/dev/null 2>&1
    xcrun simctl delete "$simulator" >/dev/null 2>&1
  fi
  # Keep the generated configuration for diagnosis, without leaving a second app project.
  cp "$fixture/Podfile" "$output/Podfile" 2>/dev/null
  cp "$fixture/Podfile.lock" "$output/Podfile.lock" 2>/dev/null
  cp "$fixture/package.json" "$output/package.json" 2>/dev/null
  cp "$fixture/RNTesterPods.xcodeproj/project.pbxproj" "$output/project.pbxproj" 2>/dev/null
  rm -rf "$fixture"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'echo "error: RNTester validation failed; logs: $output" >&2' ERR

rsync -a --exclude Pods --exclude build --exclude node_modules --exclude .xcode.env.local \
  "$original/" "$fixture/"
if [[ -d "$original/node_modules" ]]; then
  ln -s "$original/node_modules" "$fixture/node_modules"
fi
# The source dependency graph can differ from the normally prebuilt Podfile.lock.
rm -f "$fixture/Podfile.lock"
python3 - "$fixture/Podfile" "$platform" <<'PY'
import pathlib
import json
import sys

podfile = pathlib.Path(sys.argv[1])
# The copy must not introduce a duplicate workspace package when Metro follows
# node_modules symlinks while bundling the original or copied app.
package_path = podfile.parent / 'package.json'
package = json.loads(package_path.read_text())
package['name'] = '@react-native/tester-kmp-' + podfile.parent.name.rsplit('.', 1)[1].lower()
package_path.write_text(json.dumps(package, indent=2) + '\n')
source = podfile.read_text()
if sys.argv[2] == 'catalyst':
    setting = ':mac_catalyst_enabled => false'
    if source.count(setting) != 1:
        sys.exit('error: RNTester Catalyst setting changed; update the fixture.')
    source = source.replace(setting, ':mac_catalyst_enabled => true')
podfile.write_text(source)
PY
if [[ "${2:-}" == --prepare-only ]]; then
  echo "RNTester $platform fixture prepared successfully; no dependencies, builds or tests were run."
  exit 0
fi

export RCT_USE_KMP=1 RCT_USE_PREBUILT_RNCORE=0 RCT_USE_RN_DEP=0
export RCT_NO_LAUNCH_PACKAGER=1
export NODE_BINARY="$(command -v node)"
# Use the same bundle for the repository check and the copied app's Podfile.
export BUNDLE_GEMFILE="${BUNDLE_GEMFILE:-$repo_root/Gemfile}"
cd "$repo_root"
bundle check > "$output/bundle-check.log" 2>&1
if [[ "$platform" == catalyst ]]; then
  # Xcode selects destinations before applying command-line build settings.
  # Enable Catalyst in the copied application project as well as in its pods.
  bundle exec ruby - "$fixture/RNTesterPods.xcodeproj" <<'RUBY'
require 'xcodeproj'
project = Xcodeproj::Project.open(ARGV.fetch(0))
project.targets.each do |target|
  target.build_configurations.each do |configuration|
    configuration.build_settings['SUPPORTS_MACCATALYST'] = 'YES'
  end
end
project.save
RUBY
fi
yarn --cwd packages/react-native-codegen build > "$output/codegen.log" 2>&1
cd "$fixture"
bundle exec pod install > "$output/pod-install.log" 2>&1

build=(xcodebuild -workspace "$fixture/RNTesterPods.xcworkspace" -scheme RNTester
  -derivedDataPath "$output/DerivedData" -jobs "${RCT_KMP_APP_JOBS:-4}" CODE_SIGNING_ALLOWED=NO)
if [[ "$platform" == simulator ]]; then
  # Own the servers and simulator so cleanup never stops a developer's processes.
  for port in 8081 5555; do
    if lsof -n -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "error: Port $port is in use; stop its server before running the application test." >&2
      exit 1
    fi
  done
  cd "$original"
  "$repo_root/node_modules/.bin/react-native" start --max-workers 2 > "$output/metro.log" 2>&1 &
  metro_pid=$!
  node IntegrationTests/websocket_integration_test_server.js > "$output/websocket.log" 2>&1 &
  websocket_pid=$!
  ready=0
  for ((attempt=0; attempt<60; attempt++)); do
    if curl --silent --fail --max-time 1 http://localhost:8081/status | grep -q 'packager-status:running' && \
        curl --silent --max-time 1 http://localhost:5555 | grep -q 'Upgrade Required'; then ready=1; break; fi
    sleep 1
  done
  if [[ "$ready" != 1 ]]; then echo 'error: Test servers did not become ready.' >&2; exit 1; fi
  curl --silent --show-error --fail \
    'http://localhost:8081/js/RNTesterApp.bundle?platform=ios&dev=true' -o "$output/RNTesterApp.bundle"
  xcrun simctl list -j > "$output/simulators.json"
  read -r device_type runtime < <(python3 - "$output/simulators.json" <<'PY'
import json
import sys

state = json.load(open(sys.argv[1]))
runtimes = [item for item in state['runtimes'] if item.get('isAvailable') and '.iOS-' in item['identifier']]
if not runtimes:
    sys.exit('error: Install an iOS Simulator runtime before running application tests.')
for runtime in sorted(runtimes, key=lambda item: tuple(map(int, item['version'].split('.'))), reverse=True):
    devices = [item for item in state['devices'].get(runtime['identifier'], [])
               if item.get('isAvailable') and item['name'].startswith('iPhone') and item.get('deviceTypeIdentifier')]
    if devices:
        print(devices[0]['deviceTypeIdentifier'], runtime['identifier'])
        break
else:
    sys.exit('error: Create an available iPhone simulator in Xcode before running application tests.')
PY
)
  simulator="$(xcrun simctl create 'React Native KMP application test' "$device_type" "$runtime")"
  xcrun simctl boot "$simulator"
  xcrun simctl bootstatus "$simulator" -b
  "${build[@]}" test -configuration Debug -sdk iphonesimulator \
    -destination "platform=iOS Simulator,id=$simulator" -parallel-testing-enabled NO \
    -resultBundlePath "$output/Tests.xcresult" > "$output/xcodebuild.log" 2>&1
  xcrun xcresulttool get test-results summary --path "$output/Tests.xcresult" > "$output/test-summary.json"
  python3 - "$output/test-summary.json" <<'PY'
import json
import sys

summary = json.load(open(sys.argv[1]))
if summary.get('failedTests', 0) or not summary.get('passedTests', 0):
    sys.exit('error: RNTester must execute passing tests; an empty test run is not validation.')
PY
  # The existing test plan enables sanitizers, so Xcode may add a Variant-ASan-UBSan directory.
  product="$(python3 - "$output/DerivedData/Build/Products" <<'PY'
import pathlib
import sys

apps = list(pathlib.Path(sys.argv[1]).glob('**/Debug-iphonesimulator/RNTester.app'))
if len(apps) != 1:
    sys.exit(f'error: Expected one tested RNTester.app, found {apps}; use a fresh output directory.')
print(apps[0])
PY
)"
  identifier=$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$product/Info.plist")
  xcrun simctl install "$simulator" "$product"
  xcrun simctl launch --terminate-running-process "$simulator" "$identifier" > "$output/app-launch.log" 2>&1
elif [[ "$platform" == device ]]; then
  "${build[@]}" build -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
    > "$output/xcodebuild.log" 2>&1
else
  "${build[@]}" build -configuration Debug -destination 'generic/platform=macOS,variant=Mac Catalyst' \
    SUPPORTS_MACCATALYST=YES > "$output/xcodebuild.log" 2>&1
fi

# Check the actual object compiled by the pod target: just finding Kotlin in the
# app would not prove that each adapter selected the shared implementation.
python3 - "$output/DerivedData" "$platform" "$output/shared-adapter-symbols.txt" <<'PY'
import pathlib
import subprocess
import sys

expected_kmp = sys.argv[2] != 'catalyst'
reports = []
for filename, classes in (
    ('RCTGradientUtils.o', ('RNSGradientStops',)),
    ('RCTEnhancedScrollView.o', ('RNSScrollSnapOffsets',)),
    ('RCTMultipartStreamReader.o', ('RNSMultipartFraming', 'RNSMultipartHeaders')),
):
    objects = list(pathlib.Path(sys.argv[1]).rglob(filename))
    if not objects:
        sys.exit(f'error: RNTester did not compile {filename} from source.')
    symbols = [subprocess.check_output(['xcrun', 'nm', '-u', str(item)], text=True) for item in objects]
    reports.extend([filename, *symbols])
    for class_name in classes:
        if any((f'OBJC_CLASS_$_{class_name}' in item) != expected_kmp for item in symbols):
            sys.exit(f'error: {filename} selected an unexpected implementation for {class_name}.')
pathlib.Path(sys.argv[3]).write_text('\n'.join(reports))
PY
if [[ "$platform" == simulator ]]; then
  # Hosted test bundles must resolve Kotlin classes through their app, even when
  # their Podfile target independently declares the same pods. Standalone tests
  # run in a different process and may link their own runtime.
  python3 - "$product" "$output/shared-runtime-ownership.json" <<'PY'
import json
import pathlib
import plistlib
import subprocess
import sys

app = pathlib.Path(sys.argv[1])
def executable(bundle):
    with (bundle / 'Info.plist').open('rb') as info:
        return bundle / plistlib.load(info)['CFBundleExecutable']

def owns_runtime(binary):
    symbols = subprocess.check_output(['xcrun', 'nm', '-gU', str(binary)], text=True)
    return any(line.endswith(' _OBJC_CLASS_$_RNSBase') for line in symbols.splitlines())

main = executable(app)
candidates = [main, app / (main.name + '.debug.dylib')]
candidates.extend(executable(bundle) for bundle in (app / 'Frameworks').glob('*.framework'))
owners = [binary for binary in candidates if binary.exists() and owns_runtime(binary)]
if len(owners) != 1:
    sys.exit(f'error: Expected one shared runtime owner in RNTester, found {owners}')
owner = owners[0]
hosted = []
for bundle in (app / 'PlugIns').glob('*.xctest'):
    if owns_runtime(executable(bundle)):
        sys.exit(f'error: Hosted test bundle duplicates the app shared runtime: {bundle}')
    # CocoaPods may also package an identical dynamic framework for XCTest.
    for framework in (bundle / 'Frameworks').glob('*.framework'):
        copy = executable(framework)
        if owns_runtime(copy) and (framework.name != owner.parent.name or copy.read_bytes() != owner.read_bytes()):
            sys.exit(f'error: Hosted test bundle has a different shared runtime framework: {copy}')
    hosted.append(str(bundle.relative_to(app)))
pathlib.Path(sys.argv[2]).write_text(json.dumps({
    'runtimeOwner': str(owner.relative_to(app)),
    'hostedBundlesWithoutOwnRuntime': hosted,
}, indent=2) + '\n')
PY
  echo "RNTester tests and simulator launch passed (${USE_FRAMEWORKS:-static libraries}); reports: $output"
else
  echo "RNTester $platform unsigned build passed; no device tests were run. Reports: $output"
fi
