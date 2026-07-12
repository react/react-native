#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

if [[ -f "BUCK" && -z "$FANTOM_FORCE_OSS_BUILD" ]]; then
  export JS_DIR='..'
else
  if [[ ! -f "private/react-native-fantom/build/tester/fantom_tester" ]]; then
    yarn workspace @react-native/fantom build
  fi
  export FANTOM_FORCE_OSS_BUILD=1
fi

# Match the heap headroom used by `fantom.sh` for the in-process Metro server.
export NODE_OPTIONS='--max-old-space-size=16384'

node private/react-native-fantom/repl/index.js "$@"
