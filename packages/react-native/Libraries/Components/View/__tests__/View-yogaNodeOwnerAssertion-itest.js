/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {useState} from 'react';
import {TextInput, View} from 'react-native';

const VIEWPORT_WIDTH = 390;
const VIEWPORT_HEIGHT = 844;

// State setters captured during render so the test can drive the two-step repro
// from outside the component. In RNTesterPlayground these are wired to two
// buttons ("Step 1: resize container" / "Step 2: restyle input"); here we call
// them directly, each inside its own `runTask` so every step is a full commit
// plus Yoga layout pass.
let triggerResize: () => void = () => {};
let triggerRestyle: () => void = () => {};

function Repro(): React.MixedElement {
  const [tall, setTall] = useState(false);
  const [highlighted, setHighlighted] = useState(false);

  triggerResize = () => setTall(v => !v);
  triggerRestyle = () => setHighlighted(v => !v);

  return (
    <View style={{flex: 1}}>
      {/* Step 1 changes the height of this wrapper. The row's own size is
          content-determined and does not change. */}
      <View style={{height: tall ? 400 : 300, justifyContent: 'center'}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {/* The centered wrapper + its `display: none` child are the nodes
              whose Yoga ownership leaks across generations. */}
          <View style={{justifyContent: 'center'}}>
            <View style={{display: 'none'}} />
          </View>
          <TextInput
            style={[
              {borderWidth: 1, minWidth: 120},
              highlighted && {borderColor: 'red'},
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// Repro for (New Architecture, debug build):
//
//   Assertion failed: (YGNodeGetOwner(childYogaNode) == &yogaNode_),
//   function layout, file YogaLayoutableShadowNode.cpp, line 709
//
// Mechanism:
//
// 1. Step 1 resizes the container wrapping the row. The row's content-determined
//    size does not change, so Yoga re-MEASURES the row subtree with new
//    constraints (a measure-only pass: `zeroOutLayoutRecursively` wipes the
//    `display: none` child and sets `hasNewLayout` on it) but restores the row's
//    final layout from cache. RN's metrics traversal never visits the centered
//    wrapper, so the `hasNewLayout` flag on the hidden child is never consumed --
//    it leaks across the commit.
//
// 2. Step 2 changes only the TextInput's props. Fabric clones the row with a new
//    children list; `adoptYogaChild` clones the untouched centered wrapper via
//    `clone({})`, which SHARES the hidden child's yoga node (stale
//    `hasNewLayout`, owner = previous generation's wrapper). During layout the
//    wrapper is a clean cache hit, so `cloneChildrenIfNeeded()` never repairs
//    ownership -- yet `calculateLayoutInternal` still flags the wrapper with
//    `hasNewLayout`. RN's traversal then descends into the wrapper, finds the
//    shared hidden child flagged but owned by the old generation, and trips the
//    assert.
//
// The KeyboardAvoidingView + focus/typing path reproduces the same sequence
// organically (keyboard resize = step 1, restyle-on-change = step 2). If Yoga
// aborts, `runTask` re-throws the native error synchronously and this test fails.
test('does not trip the Yoga node owner assertion after resize then restyle', () => {
  const root = Fantom.createRoot({
    viewportWidth: VIEWPORT_WIDTH,
    viewportHeight: VIEWPORT_HEIGHT,
  });

  // Initial commit + layout.
  Fantom.runTask(() => {
    root.render(<Repro />);
  });

  // Step 1: resize container -> measure-only pass leaks `hasNewLayout` on the
  // hidden child.
  Fantom.runTask(() => {
    triggerResize();
  });

  // Step 2: restyle input -> clones the row, shares the hidden child's yoga node
  // with stale ownership, and (when the bug is present) trips the assert during
  // the layout pass.
  Fantom.runTask(() => {
    triggerRestyle();
  });

  // Reaching this point means Yoga did not abort during the second layout pass.
  expect(root.getRenderedOutput().toJSX()).not.toBe(null);

  root.destroy();
});
