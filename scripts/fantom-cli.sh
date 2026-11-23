#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

case "${1:-}" in
  -h|--help)
    cat <<'EOF'
Usage: yarn fantom-cli [options] [script.js]

Run JavaScript with Hermes inside the Fantom runtime.
With no arguments, start an interactive REPL.

Options:
  -h, --help          Show this help and exit.
  -e, --eval <code>   Evaluate JavaScript and exit.

Examples:
  yarn fantom-cli
  yarn fantom-cli -e 'console.log(1 + 1)'
  yarn fantom-cli path/to/script.js

Script paths must be inside the React Native repository.
The REPL provides React, ReactNative, and Fantom as globals. Use Ctrl-D to exit.
EOF
    exit 0
    ;;
esac

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
