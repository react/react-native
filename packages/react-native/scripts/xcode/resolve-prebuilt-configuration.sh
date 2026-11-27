#!/bin/sh
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Resolve Debug vs Release for prebuilt iOS tarball swap script phases
# (hermes-engine, React-Core-prebuilt, ReactNativeDependencies).
#
# Prefer Xcode / CocoaPods configuration signals over grepping
# GCC_PREPROCESSOR_DEFINITIONS for DEBUG=1 alone. That def is often missing
# on hermes-engine under static CocoaPods, which incorrectly kept Release
# hermesvm while React-hermes compiled with HERMES_ENABLE_DEBUGGER=1
# (undefined facebook::hermes::cdp::CDPDebugAPI::* at link).
# See https://github.com/facebook/react-native/issues/59116
#
# Usage (source from a podspec script phase after with-environment.sh):
#   . "$REACT_NATIVE_PATH/scripts/xcode/resolve-prebuilt-configuration.sh"
#   # sets CONFIG to "Debug" or "Release"
#
# Usage (CLI / unit tests):
#   ./resolve-prebuilt-configuration.sh   # prints Debug|Release

CONFIG="Release"
if [ "${CONFIGURATION:-}" = "Debug" ] || \
   [ "${POD_CONFIGURATION_DEBUG:-}" = "YES" ] || \
   echo "${GCC_PREPROCESSOR_DEFINITIONS:-}" | grep -q "DEBUG=1"; then
  CONFIG="Debug"
fi

# When executed directly (not sourced), print CONFIG for tests/CLI.
# When sourced, $0 is typically the parent shell, so we only export CONFIG.
case "${0##*/}" in
  resolve-prebuilt-configuration.sh)
    printf '%s\n' "$CONFIG"
    ;;
esac
