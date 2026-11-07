#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -euo pipefail

# Run pod install first, with RCT_USE_PREBUILT_RNCORE=0 for source headers or
# RCT_USE_PREBUILT_RNCORE=1 for prebuilt headers (using artifacts built from the
# checkout under test, not an older release). The app's Swift sources must
# import React and React_RCTAppDelegate (as HelloWorld's SceneDelegate does).
# Usage: bash scripts/test-ios-swift-headers.sh [ios-directory] [scheme] [derived-data]
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIRECTORY="${1:-$REPO_ROOT/private/helloworld/ios}"
SCHEME="${2:-HelloWorld}"
DERIVED_DATA="${3:-$(mktemp -d "${TMPDIR:-/tmp}/rn-swift-headers.XXXXXX")}"

if [[ ! -d "$IOS_DIRECTORY/$SCHEME.xcworkspace" ]]; then
  echo "Missing $IOS_DIRECTORY/$SCHEME.xcworkspace; run pod install first." >&2
  exit 1
fi

# Use a fresh derived-data directory to avoid reusing a Clang module compiled
# without warnings-as-errors, or against a different version of the headers.
echo "Swift header import smoke build; derived data: $DERIVED_DATA"
xcodebuild \
  -workspace "$IOS_DIRECTORY/$SCHEME.xcworkspace" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$DERIVED_DATA" \
  CODE_SIGNING_ALLOWED=NO \
  SWIFT_TREAT_WARNINGS_AS_ERRORS=YES \
  build
