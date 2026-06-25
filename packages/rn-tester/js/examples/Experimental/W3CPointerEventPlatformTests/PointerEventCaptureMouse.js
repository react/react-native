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
import type {ElementRef} from 'react';
import type {PointerEvent} from 'react-native';

import RNTesterPlatformTest from '../PlatformTest/RNTesterPlatformTest';
import * as React from 'react';
import {useCallback, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';

// adapted from https://github.com/web-platform-tests/wpt/blob/master/pointerevents/pointerevent_capture_mouse.html
function PointerEventCaptureMouseTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const target0Ref = useRef<ElementRef<typeof View> | null>(null);
  const target1Ref = useRef<ElementRef<typeof View> | null>(null);

  const isPointerCaptureRef = useRef(false);
  const pointermoveNoCaptureGot0Ref = useRef(false);
  const pointermoveCaptureGot0Ref = useRef(false);
  const pointermoveNoCaptureGot1Ref = useRef(false);
  const ownEventForTheCapturedTargetGotRef = useRef(false);

  const testGotPointerCapture = harness.useAsyncTest(
    'gotpointercapture event received"',
  );
  const testLostPointerCapture = harness.useAsyncTest(
    'lostpointercapture event received"',
  );

  const handleCaptureButtonDown = useCallback((evt: PointerEvent) => {
    const target0 = target0Ref.current;
    if (target0 != null && isPointerCaptureRef.current === false) {
      isPointerCaptureRef.current = true;
      try {
        // $FlowFixMe[prop-missing]
        target0.setPointerCapture(evt.nativeEvent.pointerId);
      } catch {}
    }
  }, []);

  const handleTarget0GotPointerCapture = useCallback(
    (evt: PointerEvent) => {
      testGotPointerCapture.done();
    },
    [testGotPointerCapture],
  );

  const handleTarget0LostPointerCapture = useCallback(
    (evt: PointerEvent) => {
      testLostPointerCapture.done();
      isPointerCaptureRef.current = false;
    },
    [testLostPointerCapture],
  );

  const testPointerMove0 = harness.useAsyncTest(
    'pointerover event for black rectangle received',
  );
  const testPointerMove1 = harness.useAsyncTest(
    'pointerover event for purple rectangle received',
  );

  const handleTarget0PointerMove = useCallback(
    (evt: PointerEvent) => {
      const target0 = target0Ref.current;
      if (!pointermoveNoCaptureGot0Ref.current) {
        testPointerMove0.done();
        pointermoveNoCaptureGot0Ref.current = true;
      }
      if (isPointerCaptureRef.current && target0 != null) {
        const {clientX, clientY} = evt.nativeEvent;
        const {left, right, top, bottom} =
          // $FlowFixMe[prop-missing]
          target0.getBoundingClientRect();

        if (!pointermoveCaptureGot0Ref.current) {
          harness.test(
            ({assert_equals}) => {
              assert_equals(
                evt.nativeEvent.relatedTarget,
                null,
                'relatedTarget is null when the capture is set',
              );
            },
            'relatedTarget is null when the capture is set.',
            {skip: true},
          );
          harness.test(({assert_true}) => {
            assert_true(
              clientX < left ||
                clientX > right ||
                clientY < top ||
                clientY > bottom,
              'pointermove received for captured element while out of it',
            );
          }, 'pointermove received for captured element while out of it');
          pointermoveCaptureGot0Ref.current = true;
        }
        if (
          clientX > left &&
          clientX < right &&
          clientY > top &&
          clientY < bottom &&
          !ownEventForTheCapturedTargetGotRef.current
        ) {
          harness.test(({assert_true}) => {
            assert_true(
              true,
              'pointermove received for captured element while inside of it',
            );
          }, 'pointermove received for captured element while inside of it');
          ownEventForTheCapturedTargetGotRef.current = true;
        }
      }
    },
    [harness, testPointerMove0],
  );

  const handleTarget1PointerMove = useCallback(
    (evt: PointerEvent) => {
      harness.test(({assert_equals}) => {
        assert_equals(
          isPointerCaptureRef.current,
          false,
          "pointermove shouldn't trigger for this target when capture is enabled",
        );
      }, "pointermove shouldn't trigger for the purple rectangle while the black rectangle has capture");

      if (!pointermoveNoCaptureGot1Ref.current) {
        testPointerMove1.done();
        pointermoveNoCaptureGot1Ref.current = true;
      }
    },
    [harness, testPointerMove1],
  );

  return (
    <View style={styles.container}>
      <View
        ref={target0Ref}
        onGotPointerCapture={handleTarget0GotPointerCapture}
        onLostPointerCapture={handleTarget0LostPointerCapture}
        onPointerMove={handleTarget0PointerMove}
        style={styles.target0}
      />
      <View
        ref={target1Ref}
        style={styles.target1}
        onPointerMove={handleTarget1PointerMove}
      />
      <View
        onPointerDown={handleCaptureButtonDown}
        style={styles.captureButton}>
        <Text>Set Capture</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  captureButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'lightblue',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  container: {},
  target0: {
    backgroundColor: 'black',
    padding: 32,
    marginBottom: 16,
  },
  target1: {
    backgroundColor: 'purple',
    padding: 32,
    marginBottom: 16,
  },
});

type Props = Readonly<{}>;
export default function PointerEventCaptureMouse(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventCaptureMouseTestCase}
      description="This test checks if setCapture/releaseCapture functions works properly."
      instructions={[
        'Move your mouse over the black rectangle. pointermove event should be logged in the black rectangle',
        'Move your mouse over the purple rectangle. pointerover event should be logged in the purple rectangle',
        'Press and hold left mouse button over "Set Capture" button. "gotpointercapture" should be logged in the black rectangle',
        'Move your mouse anywhere. pointermove should be logged in the black rectangle',
        'Move your mouse over the purple rectangle. Nothig should happen',
        'Move your mouse over the black rectangle. pointermove should be logged in the black rectangle',
        'Release left mouse button. "lostpointercapture" should be logged in the black rectangle',
      ]}
      title="Pointer Events capture test"
    />
  );
}
