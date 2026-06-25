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
import type {HostInstance, LayoutRectangle, PointerEvent} from 'react-native';

import RNTesterPlatformTest from '../PlatformTest/RNTesterPlatformTest';
import {check_PointerEvent, useTestEventHandler} from './PointerEventSupport';
import * as React from 'react';
import {useCallback, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';

const eventList = [
  'pointerOver',
  'pointerEnter',
  'pointerMove',
  'pointerDown',
  'pointerUp',
  'pointerOut',
  'pointerLeave',
];

function PointerEventAttributesHoverablePointersTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const detected_pointertypesRef = useRef({} as {[string]: boolean});
  const detected_eventTypesRef = useRef({} as {[string]: boolean});
  const expectedPointerIdRef = useRef(NaN);

  const [square1Visible, setSquare1Visible] = useState(true);
  const [square2Visible, setSquare2Visible] = useState(false);

  // Adapted from https://github.com/web-platform-tests/wpt/blob/6c26371ea1c144dd612864a278e88b6ba2f3d883/pointerevents/pointerevent_attributes_hoverable_pointers.html#L29
  const checkPointerEventAttributes = useCallback(
    (
      event: PointerEvent,
      eventType: string,
      targetLayout: LayoutRectangle,
      testNamePrefix: string,
      expectedPointerType: string,
    ) => {
      const detected_pointertypes = detected_pointertypesRef.current;
      const detected_eventTypes = detected_eventTypesRef.current;
      const expectedPointerId = expectedPointerIdRef.current;

      if (detected_eventTypes[eventType]) {
        return;
      }
      const expectedEventType =
        eventList[Object.keys(detected_eventTypes).length].toLowerCase();
      detected_eventTypes[eventType] = true;
      const pointerTestName =
        testNamePrefix + ' ' + expectedPointerType + ' ' + expectedEventType;

      detected_pointertypes[event.nativeEvent.pointerType] = true;
      harness.test(
        ({assert_equals}) => {
          assert_equals(
            eventType,
            expectedEventType,
            'Event.type should be ' + expectedEventType,
          );
        },
        pointerTestName + "'s type should be " + expectedEventType,
      );

      // Test button and buttons
      if (eventType === 'pointerdown') {
        harness.test(({assert_equals}) => {
          assert_equals(event.nativeEvent.button, 0, 'Button attribute is 0');
        }, pointerTestName + "'s button attribute is 0 when left mouse button is pressed.");
        harness.test(({assert_equals}) => {
          assert_equals(event.nativeEvent.buttons, 1, 'Buttons attribute is 1');
        }, pointerTestName + "'s buttons attribute is 1 when left mouse button is pressed.");
      } else if (eventType === 'pointerup') {
        harness.test(({assert_equals}) => {
          assert_equals(event.nativeEvent.button, 0, 'Button attribute is 0');
        }, pointerTestName + "'s button attribute is 0 when left mouse button is just released.");
        harness.test(({assert_equals}) => {
          assert_equals(event.nativeEvent.buttons, 0, 'Buttons attribute is 0');
        }, pointerTestName + "'s buttons attribute is 0 when left mouse button is just released.");
      } else {
        harness.test(({assert_equals}) => {
          assert_equals(event.nativeEvent.button, -1, 'Button attribute is -1');
        }, pointerTestName + "'s button is -1 when mouse buttons are in released state.");
        harness.test(({assert_equals}) => {
          assert_equals(event.nativeEvent.buttons, 0, 'Buttons attribute is 0');
        }, pointerTestName + "'s buttons is 0 when mouse buttons are in released state.");
      }

      const left = targetLayout.x;
      const top = targetLayout.y;
      const right = targetLayout.x + targetLayout.width;
      const bottom = targetLayout.y + targetLayout.height;

      // Test clientX and clientY
      if (eventType !== 'pointerout' && eventType !== 'pointerleave') {
        harness.test(({assert_greater_than_equal, assert_less_than_equal}) => {
          assert_greater_than_equal(
            event.nativeEvent.clientX,
            left,
            'clientX should be greater or equal than left of the box',
          );
          assert_greater_than_equal(
            event.nativeEvent.clientY,
            top,
            'clientY should be greater or equal than top of the box',
          );
          assert_less_than_equal(
            event.nativeEvent.clientX,
            right,
            'clientX should be less or equal than right of the box',
          );
          assert_less_than_equal(
            event.nativeEvent.clientY,
            bottom,
            'clientY should be less or equal than bottom of the box',
          );
        }, pointerTestName + "'s ClientX and ClientY attributes are correct.");
      } else {
        harness.test(({assert_true}) => {
          assert_true(
            event.nativeEvent.clientX < left ||
              event.nativeEvent.clientX >= right ||
              event.nativeEvent.clientY < top ||
              event.nativeEvent.clientY >= bottom,
            'ClientX/Y should be out of the boundaries of the box',
          );
        }, pointerTestName + "'s ClientX and ClientY attributes are correct.");
      }

      check_PointerEvent(harness, event, eventType, {
        testNamePrefix,
      });

      // Test isPrimary value
      harness.test(({assert_equals}) => {
        assert_equals(
          event.nativeEvent.isPrimary,
          true,
          'isPrimary should be true',
        );
      }, pointerTestName + '.isPrimary attribute is correct.');

      // Test pointerId value
      if (isNaN(expectedPointerId)) {
        expectedPointerIdRef.current = event.nativeEvent.pointerId;
      } else {
        harness.test(({assert_equals}) => {
          assert_equals(
            event.nativeEvent.pointerId,
            expectedPointerId,
            'pointerId should remain the same for the same active pointer',
          );
        }, pointerTestName + '.pointerId should be the same as previous pointer events for this active pointer.');
      }
    },
    [harness],
  );

  const square1Ref = useRef<?HostInstance>();
  const square1Handlers = useTestEventHandler(eventList, (event, eventType) => {
    if (!square1Visible) {
      return;
    }

    const square1Elem = square1Ref.current;
    if (square1Elem != null) {
      square1Elem.measure((x, y, width, height, pageX, pageY) => {
        checkPointerEventAttributes(
          event,
          eventType,
          {x: pageX, y: pageY, width, height},
          '',
          'mouse',
        );
        if (
          Object.keys(detected_eventTypesRef.current).length ===
          eventList.length
        ) {
          setSquare1Visible(false);
          detected_eventTypesRef.current = {} as {[string]: boolean};
          setSquare2Visible(true);
          expectedPointerIdRef.current = NaN;
        }
      });
    }
  });

  const square2Ref = useRef<?HostInstance>();
  const square2Handlers = useTestEventHandler(eventList, (event, eventType) => {
    const square2Elem = square2Ref.current;
    if (square2Elem != null) {
      square2Elem.measure((x, y, width, height, pageX, pageY) => {
        checkPointerEventAttributes(
          event,
          eventType,
          {x: pageX, y: pageY, width, height},
          'Inner frame ',
          'mouse',
        );
        if (
          Object.keys(detected_eventTypesRef.current).length ===
          eventList.length
        ) {
          setSquare2Visible(false);
          // TODO: Mark test as done
        }
      });
    }
  });

  return (
    <View style={styles.root}>
      <View style={styles.squareContainer}>
        {square1Visible && (
          <View ref={square1Ref} style={styles.square1} {...square1Handlers} />
        )}
      </View>
      <View style={styles.squareContainer}>
        {square2Visible && (
          <View ref={square2Ref} style={styles.square2} {...square2Handlers} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'center',
  },
  square1: {
    width: 40,
    height: 40,
    backgroundColor: 'black',
  },
  square2: {
    width: 40,
    height: 40,
    backgroundColor: 'red',
  },
  squareContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type Props = Readonly<{}>;
export default function PointerEventAttributesHoverablePointers(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventAttributesHoverablePointersTestCase}
      description="This test checks the properties of hoverable pointer events. If you are using hoverable pen don't leave the range of digitizer while doing the instructions."
      instructions={[
        'Move your pointer over the black square and click on it.',
        'Then move it off the black square so that it disappears.',
        'When red square appears move your pointer over the red square and click on it.',
        'Then move it off the red square.',
      ]}
      title="Pointer Events hoverable pointer attributes test"
    />
  );
}
