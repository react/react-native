/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Reproducer for https://github.com/react/react-native/issues/58445
// (and the counter half, https://github.com/react/react/issues/37571).
//
// After a two-finger gesture on ONE view where the fingers land in separate
// events and are lifted together, ResponderEventPlugin's trackedTouchCount is
// left above zero. From then on every keystroke runs a selectionChange
// responder walk, TextInput claims it unconditionally and becomes the JS
// responder with no finger down, and the next tap on a Pressable outside the
// input is dropped. The tap after it works, because the dropped tap's own end
// released the responder.
//
// Physical device required: on the iOS Simulator an Option-pinch lands both
// fingers in ONE event, which does not trigger the drift.

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

// Shadow of ResponderEventPlugin.trackedTouchCount with its exact rule:
// +1 per touch-start EVENT, -1 per touch-end/cancel EVENT (not per touch).
let shadow = 0;

function Playground() {
  const [, force] = React.useState(0);
  const [presses, setPresses] = React.useState(0);
  const [lastWalk, setLastWalk] = React.useState<?string>(null);
  const [log, setLog] = React.useState<Array<string>>([]);
  const push = (line: string) =>
    setLog(prev => [...prev.slice(-11), line]);

  return (
    <View
      style={styles.root}
      // Every touch on this screen passes the capture phase here.
      onStartShouldSetResponderCapture={e => {
        shadow += 1;
        push(`START  shadow=${shadow} n=${e.nativeEvent.touches.length}`);
        force(x => x + 1);
        return false;
      }}
      onTouchEnd={e => {
        if (shadow >= 0) shadow -= 1;
        push(`END    shadow=${shadow} n=${e.nativeEvent.touches.length}`);
        force(x => x + 1);
      }}
      onTouchCancel={e => {
        if (shadow >= 0) shadow -= 1;
        push(`CANCEL shadow=${shadow} n=${e.nativeEvent.touches.length}`);
        force(x => x + 1);
      }}
      // The selectionChange responder walk only runs while the plugin's
      // trackedTouchCount is above zero. Seeing it here with zero active
      // touches is the defect made visible.
      onSelectionChangeShouldSetResponderCapture={e => {
        // $FlowFixMe[prop-missing] touchHistory is attached by the plugin
        const active = e.touchHistory?.numberActiveTouches ?? -1;
        setLastWalk(`selectionChange walk with ${active} active touches`);
        return false;
      }}>
      <RNTesterText style={styles.h}>
        Dead first tap after typing (#58445 / #37571)
      </RNTesterText>
      <RNTesterText>
        1. Put two fingers on the blue box one after the other (a fraction of
        a second apart), then lift BOTH at the same time.{'\n'}
        2. Tap the input and type one character.{'\n'}
        3. Tap "Press me" once.{'\n'}
        Expected: the counter goes up. Actual: nothing; a second tap works.
        {'\n'}
        Control: repeat, but lift the fingers ONE AT A TIME — the first tap
        works.
      </RNTesterText>

      <View style={styles.box}>
        <View pointerEvents="none" style={styles.caption}>
          <Text style={styles.captionText}>
            Two fingers here, land separately, lift together
          </Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Tap here, then type one character"
      />

      <Pressable
        style={styles.button}
        onPress={() => setPresses(p => p + 1)}>
        <Text style={styles.buttonText}>Press me ({presses})</Text>
      </Pressable>

      <RNTesterText style={shadow > 0 ? styles.bad : styles.ok}>
        shadow of trackedTouchCount: {shadow} (should be 0 with no finger down)
      </RNTesterText>
      <RNTesterText
        style={
          lastWalk != null && lastWalk.includes('with 0 ') ? styles.bad : styles.ok
        }>
        {lastWalk ?? 'no selectionChange responder walk yet'}
      </RNTesterText>

      <View style={styles.log}>
        {log.map((l, i) => (
          <Text key={i} style={styles.mono}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, padding: 10},
  h: {fontSize: 16, fontWeight: '600', marginBottom: 6},
  box: {
    height: 160,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    marginVertical: 10,
  },
  caption: {position: 'absolute', left: 10, top: 8},
  captionText: {fontSize: 12, color: '#334'},
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {color: 'white', fontWeight: '600'},
  ok: {color: '#15803d'},
  bad: {color: '#b91c1c', fontWeight: '600'},
  log: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  mono: {fontFamily: 'Menlo', fontSize: 11, color: '#9ef'},
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Reproducer for react-native#58445 / react#37571.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
