#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Checks that `npx react-native spm deinit` left an iOS app with only its
# CocoaPods files. It checks only what deinit removes; `pod install` restores
# the CocoaPods references, so they are not checked here.
#
# It assumes the app had no Swift packages before `spm add`: any
# packageReferences or packageProductDependencies left after deinit fail the
# check. Do not use it on an app that already has Swift packages.
#
# Usage:
#   assert-spm-deinit.sh record <ios-dir>
#     Run before `spm add`. Prints PODFILE_SHA256 and GITIGNORE_SHA256, and
#     appends them to $GITHUB_ENV when it is set.
#   assert-spm-deinit.sh check <ios-dir> <name.xcodeproj> <podfile-sha256> <gitignore-sha256|absent>
#     Run after `spm deinit`, with the values that record printed.

usage() {
  echo "Usage: $0 record <ios-dir>"
  echo "       $0 check <ios-dir> <name.xcodeproj> <podfile-sha256> <gitignore-sha256|absent>"
  exit 2
}

sha256_or_absent() {
  if [ -f "$1" ]; then
    shasum -a 256 "$1" | cut -d ' ' -f 1
  else
    echo absent
  fi
}

record() {
  local ios_dir=$1
  if [ ! -f "$ios_dir/Podfile" ]; then
    echo "::error::$ios_dir/Podfile is missing. Record the checksums while the app is still on CocoaPods."
    exit 1
  fi

  local values
  values="PODFILE_SHA256=$(sha256_or_absent "$ios_dir/Podfile")
GITIGNORE_SHA256=$(sha256_or_absent "$ios_dir/.gitignore")"
  echo "$values"
  if [ -n "$GITHUB_ENV" ]; then
    echo "$values" >> "$GITHUB_ENV"
  fi
}

check() {
  local ios_dir=$1
  local xcodeproj="$ios_dir/$2"
  local expected_podfile_sha256=$3
  local expected_gitignore_sha256=$4
  local pbxproj="$xcodeproj/project.pbxproj"
  local failed=0

  fail() {
    echo "::error::$1"
    failed=1
  }

  local actual_podfile_sha256
  actual_podfile_sha256=$(sha256_or_absent "$ios_dir/Podfile")
  if [ "$actual_podfile_sha256" != "$expected_podfile_sha256" ]; then
    fail "Podfile changed: sha256 is '$actual_podfile_sha256', expected '$expected_podfile_sha256'."
  fi

  local actual_gitignore_sha256
  actual_gitignore_sha256=$(sha256_or_absent "$ios_dir/.gitignore")
  if [ "$actual_gitignore_sha256" != "$expected_gitignore_sha256" ]; then
    fail ".gitignore changed: sha256 is '$actual_gitignore_sha256', expected '$expected_gitignore_sha256'."
  fi

  if [ -e "$xcodeproj/.spm-injected.json" ]; then
    fail "$xcodeproj/.spm-injected.json is still there."
  fi

  if [ -e "$ios_dir/ReactNativeSPM" ]; then
    fail "$ios_dir/ReactNativeSPM is still there."
  fi

  if [ ! -f "$pbxproj" ]; then
    fail "$pbxproj is missing."
  else
    local injected
    for injected in \
      XCLocalSwiftPackageReference \
      XCSwiftPackageProductDependency \
      packageReferences \
      packageProductDependencies \
      ReactNativeSPM \
      "Sync SPM Autolinking" \
      "Embed React Native Flavored Frameworks"; do
      if grep -qF "$injected" "$pbxproj"; then
        fail "$pbxproj still contains '$injected'."
      fi
    done
  fi

  local scheme
  for scheme in "$xcodeproj"/xcshareddata/xcschemes/*.xcscheme; do
    if [ -f "$scheme" ] && grep -qF 'title = "Sync SPM Autolinking"' "$scheme"; then
      fail "$scheme still has the Sync SPM Autolinking pre-action."
    fi
  done

  if [ $failed -ne 0 ]; then
    exit 1
  fi
  echo "spm deinit removed every SwiftPM change."
}

case "$1" in
  record)
    [ $# -eq 2 ] || usage
    record "$2"
    ;;
  check)
    [ $# -eq 5 ] || usage
    check "$2" "$3" "$4" "$5"
    ;;
  *)
    usage
    ;;
esac
