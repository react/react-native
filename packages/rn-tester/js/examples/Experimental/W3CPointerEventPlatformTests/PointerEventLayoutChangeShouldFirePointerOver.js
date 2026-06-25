/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PlatformTestComponentBaseProps} from '../PlatformTest/RNTesterPlatformTestTypes';
import type {PointerEvent} from 'react-native';

import RNTesterPlatformTest from '../PlatformTest/RNTesterPlatformTest';
import * as React from 'react';
import {useCallback, useMemo, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  spacer: {
    width: 100,
    height: 100,
  },
  red: {
    backgroundColor: 'red',
    position: 'absolute',
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    zIndex: 0,
  },
  blue: {
    backgroundColor: 'blue',
    position: 'absolute',
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    zIndex: 1,
  },
});

// adapted from https://github.com/web-platform-tests/wpt/blob/master/uievents/mouse/layout_change_should_fire_mouseover.html
function PointerEventLayoutShouldFirePointerOverTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const testMouseOver = harness.useAsyncTest(
    'Tests that the pointerover event is fired and the element has a hover effect when the element underneath the mouse cursor is changed.',
  );

  const [showBlue, setShowBlue] = useState(false);

  const eventListRef = useRef<Array<string>>([]);

  const checkEventSequence = useCallback(() => {
    testMouseOver.step(({assert_equals}) => {
      const result = eventListRef.current.join(',');
      assert_equals(
        result,
        'pointerover,pointerenter',
        'The only events recorded should be pointerover and pointerenter (in that order)',
      );
    });
    testMouseOver.done();
  }, [testMouseOver]);

  const redClickHandler = useCallback(() => {
    setShowBlue(true);
    setTimeout(() => {
      checkEventSequence();
    }, 2500);
  }, [checkEventSequence]);

  const createBlueHoverEventHandler = useCallback(
    (eventType: string) => (event: PointerEvent) => {
      eventListRef.current.push(eventType);
      testMouseOver.step(({assert_equals}) => {
        if (eventType === 'pointerenter') {
          checkEventSequence();
        }
      });
    },
    [checkEventSequence, testMouseOver],
  );

  const blueEventHandlers = useMemo(
    () => ({
      onPointerOver: createBlueHoverEventHandler('pointerover'),
      onPointerMove: createBlueHoverEventHandler('pointermove'),
      onPointerEnter: createBlueHoverEventHandler('pointerenter'),
      onPointerLeave: createBlueHoverEventHandler('pointerleave'),
    }),
    [createBlueHoverEventHandler],
  );

  return (
    <>
      <View style={styles.spacer} />
      <View onPointerUp={redClickHandler} style={styles.red} />
      {showBlue && <View {...blueEventHandlers} style={styles.blue} />}
    </>
  );
}

type Props = Readonly<{}>;
export default function PointerEventLayoutShouldFirePointerOver(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventLayoutShouldFirePointerOverTestCase}
      description="Tests that the pointerover event is fired and the element has a hover effect when the element underneath the mouse cursor is changed."
      instructions={[
        'Put your mouse over the red rectangle',
        'Click the primary mouse button',
      ]}
      title="Pointerover/enter is sent on layout change"
    />
  );
}
