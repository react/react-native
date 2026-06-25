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
    width: 200,
    height: 120,
    backgroundColor: 'blue',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  b: {
    height: 60,
    width: 100,
    backgroundColor: 'green',
  },
  c: {
    height: 120,
    width: 200,
    backgroundColor: 'yellow',
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
  {type: 'pointerEnter', target: 'a'},
  {type: 'pointerMove', target: 'a', optional: true},
  {type: 'pointerOut', target: 'a'},
  {type: 'pointerOver', target: 'b'},
  {type: 'pointerEnter', target: 'b'},
  {type: 'pointerMove', target: 'b', optional: true},
  {type: 'pointerOut', target: 'b'},
  {type: 'pointerLeave', target: 'b'},
  {type: 'pointerOver', target: 'a'},
  {type: 'pointerMove', target: 'a', optional: true},
  {type: 'pointerOut', target: 'a'},
  {type: 'pointerLeave', target: 'a'},
  {type: 'pointerOver', target: 'c'},
  {type: 'pointerEnter', target: 'c'},
  {type: 'pointerMove', target: 'c', optional: true},
  {type: 'pointerOut', target: 'c'},
  {type: 'pointerLeave', target: 'c'},
];

const targetNames = ['a', 'b', 'c'];

// adapted from https://github.com/web-platform-tests/wpt/blob/master/uievents/order-of-events/mouse-events/mousemove-between.html
function PointerEventPointerMoveBetweenTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const pointermove_between = harness.useAsyncTest(
    'Pointermove events between elements should fire in the correct order.',
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
      if (eventTarget === 'c' && eventType === 'pointerLeave') {
        pointermove_between.step(({assert_true}) => {
          assert_true(
            eventRecorder.checkRecords(expected),
            'Expected events to occur in the correct order',
          );
        });
        pointermove_between.done();
      }
    },
    [eventRecorder, pointermove_between],
  );

  const eventProps = useRecorderTestEventHandlers(
    eventRecorder,
    targetNames,
    eventHandler,
  );

  return (
    <>
      <View {...eventProps.a} style={styles.a}>
        <View {...eventProps.b} style={styles.b} />
      </View>
      <View {...eventProps.c} style={styles.c} />
    </>
  );
}

type Props = Readonly<{}>;
export default function PointerEventPointerMoveBetween(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventPointerMoveBetweenTestCase}
      description=""
      instructions={[
        'Move your cursor over the blue element, later over the green one, later back to the blue one.',
        'Move the mosue from the blue element to the yellow one, later to the white background.',
      ]}
      title="Pointermove handling between elements"
    />
  );
}
