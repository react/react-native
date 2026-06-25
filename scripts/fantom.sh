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

# The Fantom Jest process hosts a single shared Metro server. Each test
# triggers a fresh Metro bundle build whose dependency graph (transformed
# modules, source maps, inverse-deps, file-watcher subscription) lives in
# memory until the per-test DELETE evicts it. With the maxWorkers cap in
# jest.config.js (~16 in-flight bundles at peak), 16 GB gives ~40% heap
# headroom over the observed steady state of ~6 GB.
export NODE_OPTIONS='--max-old-space-size=16384'

# Parse arguments to extract custom flags
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --benchmarks) export FANTOM_RUN_BENCHMARKS=1 ;;
    *) ARGS+=("$arg") ;;
  esac
done

if [[ -n "$FANTOM_RUN_BENCHMARKS" ]]; then
  ARGS+=("--runInBand")
fi

yarn jest --config private/react-native-fantom/config/jest.config.js "${ARGS[@]}"
