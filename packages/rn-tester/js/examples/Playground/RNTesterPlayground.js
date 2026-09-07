/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {View} from 'react-native';

/**
 * Reproducer for #58367 — do NOT merge, reproducer only.
 *
 * Renders nothing but an empty View: the framework itself keeps the
 * main-thread Choreographer armed at ~60 doFrames/s while this screen is
 * foreground-idle, with zero frames rendered. Verified on API 28/29/36.
 *
 * To observe on any Android device/emulator with RNTester running this
 * playground:
 *
 *   adb shell atrace -t 10 -b 32768 view input -z -o /data/local/tmp/idle.atrace.gz
 *   adb pull /data/local/tmp/idle.atrace.gz .
 *   # decompress, then: grep "Choreographer#doFrame" idle.text | wc -l
 *   # -> ~600 sections for the app pid in 10 idle seconds, each containing
 *    only an empty "animation" stage (no layout, no draw)
 *
 *   adb shell dumpsys gfxinfo <rn_tester_pkg> reset && sleep 10 \
 *     && adb shell dumpsys gfxinfo <rn_tester_pkg> | grep "Total frames rendered"
 *   # -> 0 (the loop renders nothing)
 *
 * Control: a plain native Activity rendering an empty View receives 0
 * doFrames at idle.
 */
function Playground() {
  return <View style={{flex: 1, backgroundColor: '#000000'}} />;
}

export default ({
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
}: RNTesterModuleExample);
