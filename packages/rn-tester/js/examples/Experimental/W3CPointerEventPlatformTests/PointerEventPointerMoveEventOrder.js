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
import RNTesterPlatformTestEventRecorder, {
  useRecorderTestEventHandlers,
} from '../PlatformTest/RNTesterPlatformTestEventRecorder';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  end: {
    backgroundColor: 'red',
    position: 'absolute',
    right: '15%',
    bottom: '15%',
    width: '50%',
    height: '50%',
    borderWidth: 1,
    borderColor: 'grey',
  },
  green: {
    backgroundColor: 'green',
  },
  start: {
    backgroundColor: 'red',
    position: 'absolute',
    left: '15%',
    top: '15%',
    width: '50%',
    height: '50%',
    borderWidth: 1,
    borderColor: 'grey',
  },
  testarea: {
    width: '80%',
    height: 250,
    borderWidth: 1,
    borderColor: 'grey',
  },
});

// adapted from https://github.com/web-platform-tests/wpt/blob/master/uievents/order-of-events/mouse-events/mouseevents-mousemove.htm
function PointerEventPointerMoveEventOrderTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;
  const pointer_test = harness.useAsyncTest('Pointermove events');

  const [eventRecorder] = useState(
    () =>
      new RNTesterPlatformTestEventRecorder({
        mergeEventTypes: ['pointerMove'],
        relevantEvents: ['pointerMove'],
      }),
  );

  const [startMoved, setStartMoved] = useState(false);
  const [endMoved, setEndMoved] = useState(false);

  const eventHandler = useCallback(
    (event: PointerEvent, eventType: string, eventTarget: string) => {
      event.stopPropagation();
      if (
        !startMoved &&
        eventType === 'pointerMove' &&
        eventTarget === 'start'
      ) {
        setStartMoved(true);
      }
      if (!endMoved && eventType === 'pointerMove' && eventTarget === 'end') {
        setEndMoved(true);
        const results = eventRecorder.getRecords();
        pointer_test.step(({assert_equals}) => {
          assert_equals(results.length, 2, 'Two pointermove events');
          if (results.length === 2) {
            assert_equals(
              results[0].type,
              'pointerMove',
              'First event is a pointermove event',
            );
            assert_equals(
              results[1].type,
              'pointerMove',
              'Second event is a pointermove event',
            );
            assert_equals(
              results[0].target,
              'start',
              'First event targeted #start',
            );
            assert_equals(
              results[1].target,
              'end',
              'Second event targeted #end',
            );
          }
        });
        pointer_test.done();
      }
    },
    [endMoved, eventRecorder, pointer_test, startMoved],
  );

  const eventProps = useRecorderTestEventHandlers(
    eventRecorder,
    ['start', 'end'],
    eventHandler,
  );

  return (
    <View style={styles.testarea}>
      <View
        {...eventProps.start}
        style={[styles.start, startMoved && styles.green]}
      />
      <View
        {...eventProps.end}
        style={[styles.end, endMoved && styles.green]}
      />
    </View>
  );
}

type Props = Readonly<{}>;
export default function PointerEventPointerMoveEventOrder(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventPointerMoveEventOrderTestCase}
      instructions={[
        'Move the pointer to the upper-left red box and then move it directly toward and into the lower-right red box.',
      ]}
      description="Verifies that pointermove events track the pointer position and transition from top-most visible element to top-most visible element, changing targets along the way."
      title="PointerEvent - pointermove event order"
    />
  );
}
