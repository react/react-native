/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {KeyEvent, NativeSyntheticEvent} from 'react-native';

import RNTesterButton from '../../components/RNTesterButton';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, TextInput, View} from 'react-native';

type KeyEventLog = {
  timeStamp: number,
  type: string,
  modifiers: string,
  ...KeyEvent,
};

function KeyEventExample(): React.Node {
  const [log, setLog] = useState<Array<KeyEventLog>>([]);
  const [viewFocused, setViewFocused] = useState(false);

  const clearLog = useCallback(() => {
    setLog([]);
  }, []);

  const appendLog = useCallback(
    (eventType: string, e: NativeSyntheticEvent<KeyEvent>) => {
      const nativeEvent = e.nativeEvent;
      const modifiers = [];
      if (nativeEvent.altKey) {
        modifiers.push('Alt');
      }
      if (nativeEvent.ctrlKey) {
        modifiers.push('Ctrl');
      }
      if (nativeEvent.metaKey) {
        modifiers.push('Meta');
      }
      if (nativeEvent.shiftKey) {
        modifiers.push('Shift');
      }

      const newEntry: KeyEventLog = {
        ...nativeEvent,
        timeStamp: e.timeStamp,
        type: eventType,
        modifiers: modifiers.length > 0 ? modifiers.join('+') : 'none',
      };

      const limit = 20;

      setLog(oldLog => {
        return [newEntry, ...oldLog.slice(0, limit - 1)];
      });
    },
    [],
  );

  return (
    <ScrollView>
      <View style={styles.container}>
        <RNTesterText style={styles.description}>
          Android keyboard events capture key presses from physical keyboards,
          remote controls, and game controllers. This example demonstrates
          onKeyDown and onKeyUp events.
        </RNTesterText>

        <RNTesterText style={styles.sectionTitle}>Focusable View</RNTesterText>
        <View
          focusable={true}
          style={[styles.focusableBox, viewFocused && styles.focusedBox]}
          onFocus={() => setViewFocused(true)}
          onBlur={() => setViewFocused(false)}
          onKeyDown={e => {
            appendLog('KeyDown - View', e);
          }}
          onKeyUp={e => {
            appendLog('KeyUp - View', e);
          }}>
          <RNTesterText style={styles.boxText}>Focus Me!</RNTesterText>
        </View>

        <RNTesterText style={styles.sectionTitle}>
          RNTesterTextInput
        </RNTesterText>
        <TextInput
          placeholder="Type here to test keyboard events"
          style={styles.textInput}
          onKeyDown={e => {
            appendLog('KeyDown - Input', e);
          }}
          onKeyUp={e => {
            appendLog('KeyUp - Input', e);
          }}
        />

        <RNTesterButton onPress={clearLog}>Clear Event Log</RNTesterButton>

        <RNTesterText style={styles.logTitle}>
          Event Log (Most Recent First):
        </RNTesterText>
        <View style={styles.logContainer}>
          {log.length === 0 ? (
            <RNTesterText style={styles.emptyLog}>
              No events yet. Focus a view and press keys.
            </RNTesterText>
          ) : (
            log.map((entry, index) => (
              <View key={`${entry.timeStamp}-${index}`} style={styles.logEntry}>
                <RNTesterText style={styles.logType}>{entry.type}</RNTesterText>
                <RNTesterText style={styles.logKey}>
                  Key: "{entry.key}" (code: {entry.code})
                </RNTesterText>
                {entry.modifiers !== 'none' && (
                  <RNTesterText style={styles.logModifiers}>
                    Modifiers: {entry.modifiers}
                  </RNTesterText>
                )}
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  info: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  focusedBox: {
    borderColor: '#f00',
  },
  focusableBox: {
    height: 60,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#999',
    borderRadius: 4,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    height: 44,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  logContainer: {
    borderRadius: 4,
    padding: 8,
    minHeight: 100,
    maxHeight: 300,
  },
  emptyLog: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  logEntry: {
    borderRadius: 3,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  logType: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  logKey: {
    fontSize: 12,

    marginBottom: 2,
  },
  logModifiers: {
    fontSize: 10,
    fontStyle: 'italic',
  },
});

export default {
  title: 'Key Events',
  description:
    'Examples demonstrating Android keyboard events including D-Pad navigation, media controls, TV remote keys, and physical keyboard input with modifier keys.',
  examples: [
    {
      title: 'KeyEvent Example',
      render: function (): React.Node {
        return <KeyEventExample />;
      },
    },
  ] as Array<RNTesterModuleExample>,
};
