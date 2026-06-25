/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventOccurrence} from './PointerEventSupport';
import type {PointerEvent} from 'react-native';

import {EventTracker} from './PointerEventSupport';
import * as React from 'react';
import {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

const eventsToTrack = ['onClick'];

export default component PointerEventAccessibility() {
  const [eventsSeen, setEventsSeen] = useState<Array<EventOccurrence>>([]);

  const onAnyEvent = (occurrence: EventOccurrence, event: PointerEvent) =>
    setEventsSeen(evs => evs.concat([occurrence]));

  return (
    <View style={styles.topLevel}>
      <View style={styles.clickableContainer}>
        <EventTracker
          id="pointer-parent"
          /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
           * https://fburl.com/workplace/6291gfvu */
          eventsToTrack={eventsToTrack}
          style={styles.targetParent}
          onAnyEvent={onAnyEvent}
          focusable={true}>
          <EventTracker
            id="pointer-child"
            /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
             * https://fburl.com/workplace/6291gfvu */
            eventsToTrack={eventsToTrack}
            onAnyEvent={onAnyEvent}
            style={styles.target}
            focusable={true}
          />
        </EventTracker>
        <Pressable
          onPress={() =>
            setEventsSeen(evs =>
              evs.concat({eventName: 'onClick', id: 'pressable-parent'}),
            )
          }>
          <View style={styles.targetParent}>
            <Pressable
              focusable={true}
              onPress={() =>
                setEventsSeen(evs =>
                  evs.concat({eventName: 'onClick', id: 'pressable-child'}),
                )
              }>
              <View style={styles.targetPressable} />
            </Pressable>
          </View>
        </Pressable>
      </View>
      <Pressable onPress={() => setEventsSeen([])}>
        <Text key={0} style={styles.reset}>
          Reset events
        </Text>
      </Pressable>
      <ScrollView style={styles.eventsLog}>
        {eventsSeen.map((occurrence, ii) => (
          <Text key={`${ii}-${occurrence.id}-${occurrence.eventName}`}>
            {occurrence.id} {occurrence.eventName}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topLevel: {
    display: 'flex',
  },
  targetParent: {
    backgroundColor: 'red',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 128,
    width: 128,
  },
  eventsLog: {
    height: 300,
  },
  clickableContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
  },
  target: {
    backgroundColor: 'blue',
    height: 64,
    width: 64,
  },
  targetPressable: {
    backgroundColor: 'yellow',
    height: 64,
    width: 64,
  },
  reset: {
    margin: 10,
    fontSize: 30,
    borderColor: 'red',
    borderWidth: 1,
    textAlign: 'center',
  },
});
