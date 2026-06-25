/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {PlatformTestHarness} from '../PlatformTest/RNTesterPlatformTestTypes';
import type {PointerEvent, ViewProps} from 'react-native';

import * as React from 'react';
import {useMemo} from 'react';
import {View} from 'react-native';

// These props are not in the specification but are present in the WPT so we keep them
// but marked as skipped so we don't prioritize them
const SKIPPED_PROPS = ['fromElement', 'toElement'];

// Check for conformance to PointerEvent interface
// TA: 1.1, 1.2, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13
// Adapted from https://github.com/web-platform-tests/wpt/blob/6c26371ea1c144dd612864a278e88b6ba2f3d883/pointerevents/pointerevent_support.js#L15
export function check_PointerEvent(
  harness: PlatformTestHarness,
  event: PointerEvent,
  eventType: string,
  {
    expectedPointerType,
    testNamePrefix,
  }: {expectedPointerType?: string, testNamePrefix?: string},
) {
  const {nativeEvent} = event;

  if (testNamePrefix == null) {
    testNamePrefix = '';
  }

  // Use expectedPointerType if set otherwise just use the incoming event pointerType in the test name.
  var pointerTestName =
    testNamePrefix +
    ' ' +
    (expectedPointerType == null
      ? nativeEvent.pointerType
      : expectedPointerType) +
    ' ' +
    eventType;

  if (expectedPointerType != null) {
    harness.test(({assert_equals}) => {
      assert_equals(
        nativeEvent.pointerType,
        expectedPointerType,
        'pointerType should be the one specified in the test page.',
      );
    }, pointerTestName + ' event pointerType is correct.');
  }

  // TODO: Ensure event is a pointer event

  // Check attributes for conformance to WebIDL:
  // * attribute exists
  // * has proper type
  // * if the attribute is "readonly", it cannot be changed
  // TA: 1.1, 1.2
  const idl_type_check = {
    long: function (v: any) {
      return typeof v === 'number' && Math.round(v) === v;
    },
    float: function (v: any) {
      return typeof v === 'number';
    },
    string: function (v: any) {
      return typeof v === 'string';
    },
    boolean: function (v: any) {
      return typeof v === 'boolean';
    },
    object: function (v: any) {
      return typeof v === 'object';
    },
  };

  [
    ['readonly', 'long', 'pointerId'],
    ['readonly', 'float', 'width'],
    ['readonly', 'float', 'height'],
    ['readonly', 'float', 'pressure'],
    ['readonly', 'long', 'tiltX'],
    ['readonly', 'long', 'tiltY'],
    ['readonly', 'string', 'pointerType'],
    ['readonly', 'boolean', 'isPrimary'],
    ['readonly', 'long', 'detail', 0],
    ['readonly', 'object', 'fromElement', null],
    ['readonly', 'object', 'toElement', null],
  ].forEach(attr => {
    // const readonly = attr[0];
    const type = attr[1];
    const name = attr[2];
    const value = attr[3];

    const skip = SKIPPED_PROPS.includes(name);

    // existence check
    harness.test(
      ({assert_true}) => {
        assert_true(
          name in nativeEvent,
          name + ' attribute in ' + eventType + ' event',
        );
      },
      pointerTestName + '.' + name + ' attribute exists',
      {skip},
    );

    // readonly check
    // TODO

    // type check
    harness.test(
      ({assert_true}) => {
        assert_true(
          // $FlowFixMe[invalid-computed-prop]
          // $FlowFixMe[prop-missing]
          idl_type_check[type](nativeEvent[name]),
          name + ' attribute of type ' + type,
        );
      },
      pointerTestName +
        '.' +
        name +
        ' IDL type ' +
        type +
        ' (JS type was ' +
        // $FlowFixMe[prop-missing]
        typeof nativeEvent[name] +
        ')',
      {skip},
    );

    // value check if defined
    if (value !== undefined) {
      harness.test(
        ({assert_equals}) => {
          // $FlowFixMe[prop-missing]
          assert_equals(nativeEvent[name], value, name + ' attribute value');
        },
        pointerTestName + '.' + name + ' value is ' + String(value) + '.',
        {skip},
      );
    }
  });

  // Check the pressure value
  // TA: 1.6, 1.7, 1.8
  harness.test(
    ({assert_greater_than_equal, assert_less_than_equal, assert_equals}) => {
      // TA: 1.6
      assert_greater_than_equal(
        nativeEvent.pressure,
        0,
        'pressure is greater than or equal to 0',
      );
      assert_less_than_equal(
        nativeEvent.pressure,
        1,
        'pressure is less than or equal to 1',
      );

      if (nativeEvent.buttons === 0) {
        assert_equals(
          nativeEvent.pressure,
          0,
          'pressure is 0 for mouse with no buttons pressed',
        );
      }

      // TA: 1.7, 1.8
      if (nativeEvent.pointerType === 'mouse') {
        if (nativeEvent.buttons !== 0) {
          assert_equals(
            nativeEvent.pressure,
            0.5,
            'pressure is 0.5 for mouse with a button pressed',
          );
        }
      }
    },
    pointerTestName + '.pressure value is valid',
  );

  // Check mouse-specific properties
  if (nativeEvent.pointerType === 'mouse') {
    // TA: 1.9, 1.10, 1.13
    harness.test(({assert_equals, assert_true}) => {
      assert_equals(nativeEvent.width, 1, 'width of mouse should be 1');
      assert_equals(nativeEvent.height, 1, 'height of mouse should be 1');
      assert_equals(nativeEvent.tiltX, 0, eventType + '.tiltX is 0 for mouse');
      assert_equals(nativeEvent.tiltY, 0, eventType + '.tiltY is 0 for mouse');
      assert_true(
        nativeEvent.isPrimary,
        eventType + '.isPrimary is true for mouse',
      );
    }, pointerTestName + ' properties for pointerType = mouse');
    // Check properties for pointers other than mouse
  }
}

/**
 * Helper hook to allow you to easily listen to multiple
 * view events with the same handler
 */
export function useTestEventHandler(
  eventNames: ReadonlyArray<string>,
  handler: (event: any, eventName: string) => void,
): ViewProps {
  const eventProps: any = useMemo(() => {
    const handlerFactory = (eventName: string) => (event: any) =>
      handler(event, eventName);
    const props: {[string]: (event: any) => void} = {};
    for (const eventName of eventNames) {
      const eventPropName =
        'on' + eventName[0].toUpperCase() + eventName.slice(1);
      props[eventPropName] = handlerFactory(eventName.toLowerCase());
    }
    return props;
  }, [eventNames, handler]);
  return eventProps;
}

type EventName = 'onClick' | 'onPointerDown' | 'onPointerUp';

export type EventOccurrence = {
  id: string,
  eventName: EventName,
};

export function mkEvent(id: string, eventName: EventName): EventOccurrence {
  return {
    id,
    eventName,
  };
}

export type EventTrackerProps = Readonly<{
  eventsRef?: {current: Array<EventOccurrence>},
  onAnyEvent?: (EventOccurrence, PointerEvent) => void,
  eventsToTrack: Array<EventName>,
  id: string,
  ...ViewProps,
}>;

type HandlerFunction = PointerEvent => void;

export function EventTracker(props: EventTrackerProps): React.MixedElement {
  const {eventsToTrack, eventsRef, id, style, onAnyEvent, ...viewProps} = props;
  const handlerProps = useMemo(() => {
    const handlers: {
      onClick?: HandlerFunction,
      onPointerDown?: HandlerFunction,
      onPointerUp?: HandlerFunction,
    } = {};
    for (const eventName of eventsToTrack) {
      handlers[eventName] = (e: PointerEvent) => {
        const occurrence = {id, eventName};
        eventsRef?.current.push(occurrence);
        onAnyEvent?.(occurrence, e);
      };
    }
    return handlers;
  }, [eventsToTrack, id, eventsRef, onAnyEvent]);

  return (
    <View {...handlerProps} {...viewProps} style={props.style} id={props.id}>
      {props.children}
    </View>
  );
}
