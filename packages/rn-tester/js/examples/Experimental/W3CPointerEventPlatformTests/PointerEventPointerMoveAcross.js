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

import RNTesterPlatformTest from '../PlatformTest/RNTesterPlatformTest';
import RNTesterPlatformTestEventRecorder, {
  useRecorderTestEventHandlers,
} from '../PlatformTest/RNTesterPlatformTestEventRecorder';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  a: {
    backgroundColor: 'red',
    height: 120,
    width: 200,
  },
  b: {
    marginLeft: 50,
    height: 120,
    width: 200,
    backgroundColor: 'green',
  },
  c: {
    height: 120,
    width: 200,
    backgroundColor: 'yellow',
    marginVertical: 10,
    marginLeft: 50,
  },
  a1: {
    backgroundColor: 'blue',
    height: 120,
    width: 200,
  },
  b1: {
    padding: 1,
    marginLeft: 50,
    height: 120,
    width: 200,
    backgroundColor: 'green',
  },
  c1: {
    height: 120,
    width: 200,
    backgroundColor: 'black',
    marginLeft: 50,
  },
});

const relevantEvents = [
  'pointerMove',
  'pointerOver',
  'pointerEnter',
  'pointerOut',
  'pointerLeave',
];

const expected: Array<{optional?: boolean, target: string, type: string}> = [
  {type: 'pointerOver', target: 'a'},
  {type: 'pointerEnter', target: 'c'},
  {type: 'pointerEnter', target: 'b'},
  {type: 'pointerEnter', target: 'a'},
  {type: 'pointerMove', target: 'a', optional: true},
  {type: 'pointerOut', target: 'a'},
  {type: 'pointerLeave', target: 'a'},
  {type: 'pointerLeave', target: 'b'},
  {type: 'pointerOver', target: 'c'},
  {type: 'pointerMove', target: 'c', optional: true},
  {type: 'pointerOut', target: 'c'},
  {type: 'pointerLeave', target: 'c'},
  {type: 'pointerOver', target: 'a1'},
  {type: 'pointerEnter', target: 'c1'},
  {type: 'pointerEnter', target: 'b1'},
  {type: 'pointerEnter', target: 'a1'},
  {type: 'pointerMove', target: 'a1', optional: true},
  {type: 'pointerOut', target: 'a1'},
  {type: 'pointerLeave', target: 'a1'},
  {type: 'pointerLeave', target: 'b1'},
  {type: 'pointerOver', target: 'c1'},
  {type: 'pointerMove', target: 'c1', optional: true},
  {type: 'pointerOut', target: 'c1'},
  {type: 'pointerLeave', target: 'c1'},
];

const targetNames = ['a', 'b', 'c', 'a1', 'b1', 'c1'];

// adapted from https://github.com/web-platform-tests/wpt/blob/master/uievents/order-of-events/mouse-events/mousemove-across.html
function PointerEventPointerMoveAcrossTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const pointermove_across = harness.useAsyncTest(
    'Pointermove events across elements should fire in the correct order.',
  );

  const [eventRecorder] = useState(
    () =>
      new RNTesterPlatformTestEventRecorder({
        mergeEventTypes: ['pointerMove'],
        relevantEvents,
      }),
  );

  const eventHandler = useCallback(
    (event: PointerEvent, eventType: string, eventTarget: string) => {
      event.stopPropagation();
      if (eventTarget === 'c1' && eventType === 'pointerLeave') {
        pointermove_across.step(({assert_true}) => {
          assert_true(
            eventRecorder.checkRecords(expected),
            'Expected events to occur in the correct order',
          );
        });
        pointermove_across.done();
      }
    },
    [eventRecorder, pointermove_across],
  );

  const eventProps = useRecorderTestEventHandlers(
    eventRecorder,
    targetNames,
    eventHandler,
  );

  return (
    <>
      <View {...eventProps.c} style={styles.c}>
        <View {...eventProps.b} style={styles.b}>
          <View {...eventProps.a} style={styles.a} />
        </View>
      </View>
      <View {...eventProps.c1} style={styles.c1}>
        <View {...eventProps.b1} style={styles.b1}>
          <View {...eventProps.a1} style={styles.a1} />
        </View>
      </View>
    </>
  );
}

type Props = Readonly<{}>;
export default function PointerEventPointerMoveAcross(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventPointerMoveAcrossTestCase}
      description=""
      instructions={[
        'Move your mouse across the yellow/red <div> element quickly from right to left',
        'Move your mouse across the black/blue <div> element quickly from right to left',
        'If the test fails, redo it again and move faster on the black/blue <div> element next time.',
      ]}
      title="Pointermove handling across elements"
    />
  );
}
