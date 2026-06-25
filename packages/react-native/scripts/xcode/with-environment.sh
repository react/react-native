#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script is used to source in Xcode the environment settings required to run properly.
# The script first sources the base `.xcode.env` file.
# Then it sources the `.xcode.env.local` file if present, to override some local config
# Finally, it will execute the command passed i input if any.
#
# USAGE:
# ./with-environment.sh command

# Start with a default
NODE_BINARY=$(command -v node || echo "")
export NODE_BINARY

# Override the default with the global environment
# Use PODFILE_DIR (set by react_native_post_install) to locate .xcode.env.
# PODS_ROOT/.. does not work when Pods/ is a symlink.
if [ -n "$PODFILE_DIR" ]; then
    ENV_PATH="$PODFILE_DIR/.xcode.env"
else
    ENV_PATH="$PODS_ROOT/../.xcode.env"
fi
if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
fi

# Override the global with the local environment
LOCAL_ENV_PATH="${ENV_PATH}.local"
if [ -f "$LOCAL_ENV_PATH" ]; then
    source "$LOCAL_ENV_PATH"
fi

# Check whether NODE_BINARY has been properly set, otherwise help the users with a meaningful error.
if [ -n "$NODE_BINARY" ]; then
    echo "Node found at: ${NODE_BINARY}"
else
    echo '[Warning] You need to configure your node path in the `".xcode.env" file` environment. ' \
       'You can set it up quickly by running: ' \
       '`echo export NODE_BINARY=$(command -v node) > .xcode.env` ' \
       'in the ios folder. This is needed by React Native to work correctly. ' \
       'We fallback to the DEPRECATED behavior of finding `node`. This will be REMOVED in a future version. ' \
       'You can read more about this here: https://reactnative.dev/docs/environment-setup#optional-configuring-your-environment' >&2
    source "${REACT_NATIVE_PATH}/scripts/find-node-for-xcode.sh"
fi

# Execute argument, if present
if [ -n "$1" ]; then
  "$1"
fi
