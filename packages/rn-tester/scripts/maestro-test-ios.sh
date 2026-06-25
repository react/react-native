#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

UDID=$(xcrun simctl list devices booted -j | jq -r '[.devices[]] | add | first | .udid')
maestro --udid="$UDID" test --exclude-tags android-only .maestro/ -e APP_ID=com.meta.RNTester.localDevelopment
