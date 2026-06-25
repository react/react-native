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
import {useCallback, useRef} from 'react';
import {StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  target: {
    backgroundColor: 'black',
    padding: 32,
  },
});

// adapted from https://github.com/web-platform-tests/wpt/blob/master/pointerevents/pointerevent_pointermove_on_chorded_mouse_button.html
function PointerEventPointerMoveOnChordedMouseButtonTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const test_pointermove = harness.useAsyncTest(
    'pointermove events received for button state changes',
  );

  const stepRef = useRef(0);
  const firstButtonRef = useRef(0);

  // When a pointer changes button state and the circumstances produce no other pointer event, the pointermove event must be dispatched.
  // 5.2.6

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      test_pointermove.step(({assert_equals}) => {
        assert_equals(
          stepRef.current,
          0,
          'There must not be more than one pointer down event.',
        );
      });
      if (stepRef.current === 0) {
        stepRef.current = 1;
        firstButtonRef.current = event.nativeEvent.buttons;
      }
    },
    [test_pointermove],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (stepRef.current === 1 && event.nativeEvent.button !== -1) {
        // second button pressed
        test_pointermove.step(({assert_not_equals, assert_true}) => {
          assert_not_equals(
            event.nativeEvent.buttons,
            firstButtonRef.current,
            'The pointermove event must be triggered by pressing a second button.',
          );
          assert_true(
            // eslint-disable-next-line no-bitwise
            (event.nativeEvent.buttons & firstButtonRef.current) !== 0,
            'The first button must still be reported pressed.',
          );
        });
        stepRef.current = 2;
      } else if (stepRef.current === 2 && event.nativeEvent.button !== -1) {
        // second button released
        test_pointermove.step(({assert_equals}) => {
          assert_equals(
            event.nativeEvent.buttons,
            firstButtonRef.current,
            'The pointermove event must be triggered by releasing the second button.',
          );
        });
        stepRef.current = 3;
      }
    },
    [test_pointermove],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      test_pointermove.step(({assert_equals}) => {
        assert_equals(
          stepRef.current,
          3,
          'The pointerup event must be triggered after pressing and releasing the second button.',
        );
        assert_equals(
          event.nativeEvent.buttons,
          0,
          'The pointerup event must be triggered by releasing the last pressed button.',
        );
      });
      test_pointermove.done();
    },
    [test_pointermove],
  );

  return (
    <View
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={styles.target}
    />
  );
}

type Props = Readonly<{}>;
export default function PointerEventPointerMoveOnChordedMouseButton(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventPointerMoveOnChordedMouseButtonTestCase}
      description="This test checks if pointermove event are triggered by button state changes"
      instructions={[
        'Put your mouse over the black rectangle',
        'Press the left mouse button and hold it',
        'Press the middle mouse button',
        'Release the middle mouse button',
        'Release the left mouse button to complete the test',
      ]}
      title="PointerEvents pointermove on button state changes"
    />
  );
}
