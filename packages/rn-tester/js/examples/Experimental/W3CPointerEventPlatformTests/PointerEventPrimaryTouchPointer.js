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
import {useTestEventHandler} from './PointerEventSupport';
import * as React from 'react';
import {useCallback, useMemo, useRef} from 'react';
import {StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
  },
  box: {
    width: 80,
    height: 80,
  },
});

const listenedEvents = ['pointerDown', 'pointerUp'];

const expectedOrder = [
  ['red', 'pointerDown', true],
  ['green', 'pointerDown', false],
  ['red', 'pointerUp', true],
  ['blue', 'pointerDown', true],
  ['green', 'pointerUp', false],
  ['blue', 'pointerUp', true],
];

function PointerEventPrimaryTouchPointerTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const detected_eventsRef = useRef({} as {[string]: boolean});

  const handleIncomingPointerEvent = useCallback(
    (boxLabel: string, eventType: string, isPrimary: boolean) => {
      const detected_events = detected_eventsRef.current;

      const pointerEventIdentifier = `${boxLabel}-${eventType}-${String(
        isPrimary,
      )}`;
      if (detected_events[pointerEventIdentifier]) {
        return;
      }

      const [expectedBoxLabel, expectedEventType, expectedIsPrimary] =
        expectedOrder[Object.keys(detected_events).length];
      detected_events[pointerEventIdentifier] = true;

      harness.test(
        ({assert_equals}) => {
          assert_equals(
            boxLabel,
            expectedBoxLabel,
            'event should be coming from the correct box',
          );
          assert_equals(
            eventType,
            expectedEventType.toLowerCase(),
            'event should have the right type',
          );
          assert_equals(
            isPrimary,
            expectedIsPrimary,
            'event should be correctly primary',
          );
        },
        `${expectedBoxLabel} box's ${expectedEventType} should${
          !expectedIsPrimary ? ' not' : ''
        } be marked as the primary pointer`,
      );
    },
    [harness],
  );

  const createBoxHandler = useCallback(
    (boxLabel: string) => (event: PointerEvent, eventName: string) => {
      if (
        Object.keys(detected_eventsRef.current).length < expectedOrder.length
      ) {
        handleIncomingPointerEvent(
          boxLabel,
          eventName,
          event.nativeEvent.isPrimary,
        );
      }
    },
    [handleIncomingPointerEvent],
  );

  const {handleBoxAEvent, handleBoxBEvent, handleBoxCEvent} = useMemo(
    () => ({
      handleBoxAEvent: createBoxHandler('red'),
      handleBoxBEvent: createBoxHandler('green'),
      handleBoxCEvent: createBoxHandler('blue'),
    }),
    [createBoxHandler],
  );

  const boxAHandlers = useTestEventHandler(listenedEvents, handleBoxAEvent);
  const boxBHandlers = useTestEventHandler(listenedEvents, handleBoxBEvent);
  const boxCHandlers = useTestEventHandler(listenedEvents, handleBoxCEvent);

  return (
    <View style={styles.root}>
      <View {...boxAHandlers} style={[styles.box, {backgroundColor: 'red'}]} />
      <View
        {...boxBHandlers}
        style={[styles.box, {backgroundColor: 'green'}]}
      />
      <View {...boxCHandlers} style={[styles.box, {backgroundColor: 'blue'}]} />
    </View>
  );
}

type Props = Readonly<{}>;
export default function PointerEventPrimaryTouchPointer(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventPrimaryTouchPointerTestCase}
      description="This test checks for the correct differentiation of a primary pointer in a multitouch scenario"
      instructions={[
        'Touch and hold your finger on the red box',
        'Take different finger and touch and hold the green box',
        'Lift your finger from the red box and place it on the blue box',
        'Lift your finger from the green box',
        'Lift your finger from the blue box',
      ]}
      title="Pointer Event primary touch pointer test"
    />
  );
}
