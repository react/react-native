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
import type {PlatformTestContext} from '../PlatformTest/RNTesterPlatformTestTypes';
import type {PointerEvent} from 'react-native';

import RNTesterPlatformTest from '../PlatformTest/RNTesterPlatformTest';
import {check_PointerEvent} from './PointerEventSupport';
import * as React from 'react';
import {useCallback, useRef} from 'react';
import {StyleSheet, View} from 'react-native';

function checkClickEventProperties(
  assert_equals: PlatformTestContext['assert_equals'],
  event: PointerEvent,
) {
  assert_equals(event.nativeEvent.width, 1, 'default width is 1');
  assert_equals(event.nativeEvent.height, 1, 'default height is 1');
  assert_equals(event.nativeEvent.pressure, 0, 'default pressure is 0');
  assert_equals(
    event.nativeEvent.tangentialPressure,
    0,
    'default tangentialPressure is 0',
  );
  assert_equals(event.nativeEvent.tiltX, 0, 'default tiltX is 0');
  assert_equals(event.nativeEvent.tiltY, 0, 'default tiltY is 0');
  assert_equals(event.nativeEvent.twist, 0, 'default twist is 0');
}

function PointerEventClickTouchTestCase(props: PlatformTestComponentBaseProps) {
  const {harness} = props;

  const hasSeenPointerDown = useRef<boolean>(false);
  const hasSeenPointerUp = useRef<boolean>(false);
  const hasSeenClick = useRef<boolean>(false);

  const testPointerClick = harness.useAsyncTest('click event received');

  const handleClick = useCallback(
    (e: PointerEvent) => {
      if (hasSeenClick.current) {
        return;
      }
      hasSeenClick.current = true;
      testPointerClick.step(({assert_equals}) => {
        assert_equals(
          hasSeenPointerDown.current,
          true,
          'pointerdown was received',
        );
        assert_equals(hasSeenPointerUp.current, true, 'pointerup was received');
        checkClickEventProperties(assert_equals, e);
      });

      check_PointerEvent(harness, e, 'click', {});
      testPointerClick.done();
    },
    [harness, testPointerClick],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (hasSeenPointerDown.current) {
        return;
      }
      hasSeenPointerDown.current = true;
      testPointerClick.step(({assert_equals}) => {
        assert_equals(
          hasSeenPointerUp.current,
          false,
          'pointerup was not received',
        );
        assert_equals(hasSeenClick.current, false, 'click was not received');
      });
    },
    [testPointerClick],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (hasSeenPointerUp.current) {
        return;
      }
      hasSeenPointerUp.current = true;
      testPointerClick.step(({assert_equals}) => {
        assert_equals(
          hasSeenPointerDown.current,
          true,
          'pointerdown was received',
        );
        assert_equals(hasSeenClick.current, false, 'click was not received');
      });
    },
    [testPointerClick],
  );

  return (
    <View
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={styles.target}
    />
  );
}

const styles = StyleSheet.create({
  target: {
    backgroundColor: 'black',
    height: 64,
    width: '100%',
  },
});

type Props = Readonly<{}>;
export default function PointerEventClickTouch(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventClickTouchTestCase}
      description="This test checks if the click event triggers."
      instructions={['Click or tap on the black rectangle.']}
      title="Click test"
    />
  );
}
