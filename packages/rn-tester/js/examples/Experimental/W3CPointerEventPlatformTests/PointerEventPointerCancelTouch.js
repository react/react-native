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
import {check_PointerEvent} from './PointerEventSupport';
import * as React from 'react';
import {useCallback, useRef} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

// adapted from https://github.com/web-platform-tests/wpt/blob/master/pointerevents/pointerevent_pointercancel_touch.html
function PointerEventPointerCancelTouchTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const testPointerEvent = harness.useAsyncTest('pointercancel event received');

  const pointerDownEventRef = useRef<PointerEvent | null>(null);
  const pointerCancelEventRef = useRef<PointerEvent | null>(null);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    event.persist();
    pointerDownEventRef.current = event;
  }, []);

  const handlePointerCancel = useCallback(
    (event: PointerEvent) => {
      event.persist();
      pointerCancelEventRef.current = event;

      testPointerEvent.step(({assert_equals, assert_not_equals}) => {
        const pointerDownEvent = pointerDownEventRef.current;
        assert_not_equals(pointerDownEvent, null, 'pointerdown was received: ');
        if (pointerDownEvent != null) {
          assert_equals(
            event.nativeEvent.pointerId,
            pointerDownEvent.nativeEvent.pointerId,
            'pointerId should be the same for pointerdown and pointercancel',
          );
          assert_equals(
            event.nativeEvent.pointerType,
            pointerDownEvent.nativeEvent.pointerType,
            'pointerType should be the same for pointerdown and pointercancel',
          );
          assert_equals(
            event.nativeEvent.isPrimary,
            pointerDownEvent.nativeEvent.isPrimary,
            'isPrimary should be the same for pointerdown and pointercancel',
          );
        }
      });

      check_PointerEvent(harness, event, 'pointerCancel', {});

      testPointerEvent.step(({assert_equals}) => {
        assert_equals(event.nativeEvent.x, 0, 'pointercancel.x must be zero');
        assert_equals(event.nativeEvent.y, 0, 'pointercancel.y must be zero');
        assert_equals(
          event.nativeEvent.clientX,
          0,
          'pointercancel.clientX must be zero',
        );
        assert_equals(
          event.nativeEvent.clientY,
          0,
          'pointercancel.clientY must be zero',
        );
      });
    },
    [harness, testPointerEvent],
  );

  const handlePointerOut = useCallback(
    (event: PointerEvent) => {
      testPointerEvent.step(({assert_equals, assert_not_equals}) => {
        const pointerCancelEvent = pointerCancelEventRef.current;
        assert_not_equals(
          pointerCancelEvent,
          null,
          'pointercancel was received: ',
        );
        if (pointerCancelEvent != null) {
          assert_equals(
            event.nativeEvent.pointerId,
            pointerCancelEvent.nativeEvent.pointerId,
            'pointerId should be the same for pointerout and pointercancel',
          );
          assert_equals(
            event.nativeEvent.pointerType,
            pointerCancelEvent.nativeEvent.pointerType,
            'pointerType should be the same for pointerout and pointercancel',
          );
          assert_equals(
            event.nativeEvent.isPrimary,
            pointerCancelEvent.nativeEvent.isPrimary,
            'isPrimary should be the same for pointerout and pointercancel',
          );
        }
      });
    },
    [testPointerEvent],
  );

  const handlePointerLeave = useCallback(
    (event: PointerEvent) => {
      testPointerEvent.step(({assert_equals, assert_not_equals}) => {
        const pointerCancelEvent = pointerCancelEventRef.current;
        assert_not_equals(
          pointerCancelEvent,
          null,
          'pointercancel was received: ',
        );
        if (pointerCancelEvent != null) {
          assert_equals(
            event.nativeEvent.pointerId,
            pointerCancelEvent.nativeEvent.pointerId,
            'pointerId should be the same for pointerleave and pointercancel',
          );
          assert_equals(
            event.nativeEvent.pointerType,
            pointerCancelEvent.nativeEvent.pointerType,
            'pointerType should be the same for pointerleave and pointercancel',
          );
          assert_equals(
            event.nativeEvent.isPrimary,
            pointerCancelEvent.nativeEvent.isPrimary,
            'isPrimary should be the same for pointerleave and pointercancel',
          );
        }
      });
      testPointerEvent.done();
    },
    [testPointerEvent],
  );

  return (
    <ScrollView style={styles.scrollContainer}>
      <View
        onPointerDown={handlePointerDown}
        onPointerCancel={handlePointerCancel}
        onPointerOut={handlePointerOut}
        onPointerLeave={handlePointerLeave}
        style={styles.target}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {width: '100%', height: 100},
  target: {
    backgroundColor: 'black',
    padding: 32,
    height: 200,
  },
});

type Props = Readonly<{}>;
export default function PoitnerEventPointerCancelTouch(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventPointerCancelTouchTestCase}
      description="This test checks if pointercancel event triggers."
      title="Pointer Events pointercancel Tests"
      instructions={[
        'Start touch over the black rectangle.',
        'Then move your finger to scroll the page.',
      ]}
    />
  );
}
