#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

GITHUB_OWNER=-facebook
GITHUB_REPO=-react-native
export GITHUB_OWNER
export GITHUB_REPO

if [ -x "$(command -v shellcheck)" ]; then
  IFS=$'\n'

  find . \
    -type f \
    -not -path "*node_modules*" \
    -not -path "*third-party*" \
    -not -path "*vendor*" \
    -name '*.sh' \
    -exec sh -c 'shellcheck "$1"' -- {} \;

else
  echo 'shellcheck is not installed. See https://github.com/facebook/react-native/wiki/Development-Dependencies#shellcheck for instructions.'
  exit 1
fi
