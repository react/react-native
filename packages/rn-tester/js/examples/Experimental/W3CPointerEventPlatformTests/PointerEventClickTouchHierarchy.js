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
import type {EventOccurrence} from './PointerEventSupport';

import RNTesterPlatformTest from '../PlatformTest/RNTesterPlatformTest';
import {EventTracker} from './PointerEventSupport';
import {mkEvent} from './PointerEventSupport';
import * as React from 'react';
import {useRef} from 'react';
import {StyleSheet, View} from 'react-native';

const eventsToTrack = ['onClick', 'onPointerDown', 'onPointerUp'];

function PointerEventClickTouchHierarchyTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const eventsInOrder = useRef<Array<EventOccurrence>>([]);

  const testPointerClick = harness.useAsyncTest(
    'click event received in hierarchy',
  );

  const checkResults = () => {
    testPointerClick.step(({assert_equals}) => {
      const eventsReceived = eventsInOrder.current;
      assert_equals(
        eventsReceived.length,
        14,
        'received the expected number of events',
      );
      const childToParentEvents = eventsReceived.slice(0, 4);
      const parentToChildEvents = eventsReceived.slice(4, 8);
      const childOnlyEvents = eventsReceived.slice(8);
      assert_equals(
        JSON.stringify(childToParentEvents),
        JSON.stringify([
          mkEvent('child', 'onPointerDown'),
          mkEvent('parent', 'onPointerDown'),
          mkEvent('parent', 'onPointerUp'),
          mkEvent('parent', 'onClick'),
        ]),
        'correct events when moving child -> parent',
      );
      assert_equals(
        JSON.stringify(parentToChildEvents),
        JSON.stringify([
          mkEvent('parent', 'onPointerDown'),
          mkEvent('child', 'onPointerUp'),
          mkEvent('parent', 'onPointerUp'),
          mkEvent('parent', 'onClick'),
        ]),
        'correct events when moving parent -> child',
      );
      assert_equals(
        JSON.stringify(childOnlyEvents),
        JSON.stringify([
          mkEvent('child', 'onPointerDown'),
          mkEvent('parent', 'onPointerDown'),
          mkEvent('child', 'onPointerUp'),
          mkEvent('parent', 'onPointerUp'),
          mkEvent('child', 'onClick'),
          mkEvent('parent', 'onClick'),
        ]),
        'correct events when clicking on child',
      );
    });
    testPointerClick.done();
  };

  return (
    <View>
      <EventTracker
        id="parent"
        eventsRef={eventsInOrder}
        /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        eventsToTrack={eventsToTrack}
        style={styles.targetParent}>
        <EventTracker
          id="child"
          eventsRef={eventsInOrder}
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          eventsToTrack={eventsToTrack}
          style={styles.target}
        />
      </EventTracker>
      <View style={styles.checkResults} onClick={checkResults} />
    </View>
  );
}

const styles = StyleSheet.create({
  targetParent: {
    backgroundColor: 'black',
    height: 64,
    width: '100%',
  },
  target: {
    backgroundColor: 'blue',
    height: 64,
    width: 64,
  },
  checkResults: {
    backgroundColor: 'green',
    height: 64,
    width: 64,
  },
});

type Props = Readonly<{}>;
export default function PointerEventClickTouchHierarchy(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventClickTouchHierarchyTestCase}
      description="This test checks if the click event triggers properly in a hierarchy."
      instructions={[
        'Start a touch on the blue rectangle',
        'Move your finger over the black rectangle',
        'Release the touch',
        'Start a new touch on the black rectangle',
        'Move your finger over the blue rectangle',
        'Release the touch',
        'Start a new touch on the blue rectangle',
        'Release the touch (still on blue rectangle)',
        'Tap the green rectangle to check results',
      ]}
      title="Click hierarchy test"
    />
  );
}
