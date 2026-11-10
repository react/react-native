#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Builds the Node-API example addon into the app's Frameworks folder, from an
# Xcode build phase. It's loaded at runtime with `dlopen` from
# react-native/node-api, so the app doesn't link it.

set -euo pipefail

NAME=nodeapiexample
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/$NAME.framework"
WORK_DIR="$DERIVED_FILE_DIR/$NAME"

# TODO: Link a node-api framework once Hermes ships it, instead of hermesvm.
if [ -n "${PODS_ROOT:-}" ]; then
  NODE_API_HEADERS="$PODS_ROOT/Headers/Public/hermes-engine/hermes/napi"
else
  # SwiftPM: the Hermes artifacts React Native was prebuilt with.
  NODE_API_HEADERS="$SOURCE_DIR/../../react-native/.build/artifacts/hermes/destroot/include/hermes/napi"
fi

eval "SEARCH_PATHS=($FRAMEWORK_SEARCH_PATHS)"
FRAMEWORK_FLAGS=()
for path in "${SEARCH_PATHS[@]}"; do
  FRAMEWORK_FLAGS+=(-F "$path")
done

mkdir -p "$WORK_DIR" "$FRAMEWORK"
SLICES=()
for arch in $ARCHS; do
  xcrun clang \
    -target "$arch-apple-ios$IPHONEOS_DEPLOYMENT_TARGET${LLVM_TARGET_TRIPLE_SUFFIX:-}" \
    -isysroot "$SDKROOT" \
    -dynamiclib \
    -install_name "@rpath/$NAME.framework/$NAME" \
    -Wall -Werror \
    -I "$NODE_API_HEADERS" \
    "${FRAMEWORK_FLAGS[@]}" \
    -framework hermesvm \
    -o "$WORK_DIR/$NAME-$arch" \
    "$SOURCE_DIR/addon.c"
  SLICES+=("$WORK_DIR/$NAME-$arch")
done
xcrun lipo -create "${SLICES[@]}" -output "$FRAMEWORK/$NAME"

rm -f "$FRAMEWORK/Info.plist"
/usr/libexec/PlistBuddy \
  -c "Add :CFBundleExecutable string $NAME" \
  -c "Add :CFBundleIdentifier string com.facebook.react.$NAME" \
  -c "Add :CFBundlePackageType string FMWK" \
  -c "Add :CFBundleVersion string 1" \
  -c "Add :MinimumOSVersion string $IPHONEOS_DEPLOYMENT_TARGET" \
  "$FRAMEWORK/Info.plist" >/dev/null

codesign --force --sign "${EXPANDED_CODE_SIGN_IDENTITY:--}" "$FRAMEWORK"
