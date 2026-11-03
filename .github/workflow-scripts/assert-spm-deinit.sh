#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Checks that `npx react-native spm deinit` left an iOS app with only its
# CocoaPods files. It checks only what deinit removes; `pod install` restores
# the CocoaPods references, so they are not checked here.
#
# Usage: assert-spm-deinit.sh <ios-dir> <name.xcodeproj> <podfile-sha256> <gitignore-sha256|absent>

if [ $# -ne 4 ]; then
  echo "Usage: $0 <ios-dir> <name.xcodeproj> <podfile-sha256> <gitignore-sha256|absent>"
  exit 2
fi

IOS_DIR=$1
XCODEPROJ="$IOS_DIR/$2"
EXPECTED_PODFILE_SHA256=$3
EXPECTED_GITIGNORE_SHA256=$4
PBXPROJ="$XCODEPROJ/project.pbxproj"
FAILED=0

fail() {
  echo "::error::$1"
  FAILED=1
}

sha256_or_absent() {
  if [ -f "$1" ]; then
    shasum -a 256 "$1" | cut -d ' ' -f 1
  else
    echo absent
  fi
}

ACTUAL_PODFILE_SHA256=$(sha256_or_absent "$IOS_DIR/Podfile")
if [ "$ACTUAL_PODFILE_SHA256" != "$EXPECTED_PODFILE_SHA256" ]; then
  fail "Podfile changed: sha256 is '$ACTUAL_PODFILE_SHA256', expected '$EXPECTED_PODFILE_SHA256'."
fi

ACTUAL_GITIGNORE_SHA256=$(sha256_or_absent "$IOS_DIR/.gitignore")
if [ "$ACTUAL_GITIGNORE_SHA256" != "$EXPECTED_GITIGNORE_SHA256" ]; then
  fail ".gitignore changed: sha256 is '$ACTUAL_GITIGNORE_SHA256', expected '$EXPECTED_GITIGNORE_SHA256'."
fi

if [ -e "$XCODEPROJ/.spm-injected.json" ]; then
  fail "$XCODEPROJ/.spm-injected.json is still there."
fi

if [ -e "$IOS_DIR/ReactNativeSPM" ]; then
  fail "$IOS_DIR/ReactNativeSPM is still there."
fi

if [ ! -f "$PBXPROJ" ]; then
  fail "$PBXPROJ is missing."
else
  for INJECTED in \
    XCLocalSwiftPackageReference \
    XCSwiftPackageProductDependency \
    packageReferences \
    packageProductDependencies \
    ReactNativeSPM \
    "Sync SPM Autolinking" \
    "Embed React Native Flavored Frameworks"; do
    if grep -qF "$INJECTED" "$PBXPROJ"; then
      fail "$PBXPROJ still contains '$INJECTED'."
    fi
  done
fi

for SCHEME in "$XCODEPROJ"/xcshareddata/xcschemes/*.xcscheme; do
  if [ -f "$SCHEME" ] && grep -qF 'title = "Sync SPM Autolinking"' "$SCHEME"; then
    fail "$SCHEME still has the Sync SPM Autolinking pre-action."
  fi
done

if [ $FAILED -ne 0 ]; then
  exit 1
fi
echo "spm deinit removed every SwiftPM change."
