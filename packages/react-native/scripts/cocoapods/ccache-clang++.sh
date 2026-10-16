#!/bin/sh
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Xcode gives a compiler launcher none of the build settings, so `pod install`
# copies this script next to a generated environment file and points CC/LD at
# the copy.
. "$(dirname "$0")/ccache-launcher.env"

# Provide our config file if none is already provided
export CCACHE_CONFIGPATH="${CCACHE_CONFIGPATH:-$REACT_NATIVE_CCACHE_CONFIGPATH}"

exec "$REACT_NATIVE_CCACHE_BINARY" clang++ "$@"
