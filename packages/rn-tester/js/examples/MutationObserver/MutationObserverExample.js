/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {type ElementRef, useContext, useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

export const name = 'MutationObserver Example';
export const title = name;
export const description =
  '- Tap on elements to append a child.\n- Long tap on elements to remove them.';

export function render(): React.Node {
  return <MutationObserverExample />;
}

const nextIdByPrefix: Map<string, number> = new Map();
function generateId(prefix: string): string {
  let nextId = nextIdByPrefix.get(prefix);
  if (nextId == null) {
    nextId = 1;
  }
  nextIdByPrefix.set(prefix, nextId + 1);
  return prefix + nextId;
}

const rootId = generateId('example-item-');

function useTemporaryValue<T>(duration: number = 2000): [?T, (?T) => void] {
  const [value, setValue] = useState<?T>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setValue(null);
    }, duration);
    return () => clearTimeout(timeoutId);
    // we need to set the timer every time the value changes
  }, [duration, value]);

  return [value, setValue];
}

component MutationObserverExample() {
  const parentViewRef = useRef<?ElementRef<typeof View>>(null);
  const [showExample, setShowExample] = useState(true);
  const theme = useContext(RNTesterThemeContext);
  const [message, setMessage] = useTemporaryValue<string>();

  useEffect(() => {
    const parentNode = parentViewRef.current;
    if (!parentNode) {
      return;
    }

    const mutationObserver = new MutationObserver(records => {
      const messages = [];
      records.forEach(record => {
        if (record.addedNodes.length > 0) {
          console.log(
            'MutationObserverExample: added nodes',
            nodeListToString(record.addedNodes),
          );
          messages.push(`Added nodes: ${nodeListToString(record.addedNodes)}`);
        }
        if (record.removedNodes.length > 0) {
          console.log(
            'MutationObserverExample: removed nodes',
            nodeListToString(record.removedNodes),
          );
          messages.push(
            `Removed nodes: ${nodeListToString(record.removedNodes)}`,
          );
        }
      });
      setMessage(messages.join(',\n'));
    });

    // $FlowExpectedError[incompatible-type]
    mutationObserver.observe(parentNode, {
      subtree: true,
      childList: true,
    });

    return () => {
      console.log('MutationObserverExample: disconnecting mutation observer');
      mutationObserver.disconnect();
      nextIdByPrefix.clear();
    };
  }, [setMessage]);

  const exampleId = showExample ? rootId : '';

  return (
    <>
      <ScrollView id="scroll-view">
        <View style={styles.parent} ref={parentViewRef} id="parent">
          {showExample ? (
            <ExampleItem
              label={exampleId}
              id={exampleId}
              onRemove={() => setShowExample(false)}
            />
          ) : null}
        </View>
      </ScrollView>
      <Text id="message" style={[styles.message, {color: theme.LabelColor}]}>
        {message}
      </Text>
    </>
  );
}

function ExampleItem(props: {
  id: string,
  label: string,
  onRemove?: () => void,
}): React.Node {
  const theme = useContext(RNTesterThemeContext);
  const [children, setChildren] = useState<ReadonlyArray<[string, React.Node]>>(
    [],
  );

  return (
    <View id={props.id}>
      <Pressable
        testID={'pressable-' + props.id}
        style={[styles.item]}
        onLongPress={() => {
          props.onRemove?.();
        }}
        onPress={() => {
          const id = generateId(props.label + '-');
          setChildren(prevChildren => [
            ...prevChildren,
            [
              id,
              <ExampleItem
                id={id}
                key={id}
                label={id}
                onRemove={() => {
                  setChildren(prevChildren2 =>
                    prevChildren2.filter(pair => pair[0] !== id),
                  );
                }}
              />,
            ],
          ]);
        }}>
        {props.label != null ? (
          <Text
            id={'text-' + props.id}
            style={[styles.label, {color: theme.LabelColor}]}>
            {props.label}
          </Text>
        ) : null}
        {children.map(([id, child]) => child)}
      </Pressable>
    </View>
  );
}

function nodeListToString(nodeList: NodeList<Node>): string {
  return [...nodeList]
    .map(node => (node instanceof Element && node.id) || '<unknown-node>')
    .join(', ');
}

const styles = StyleSheet.create({
  parent: {
    flex: 1,
    backgroundColor: 'white',
  },
  item: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    gap: 16,
    minHeight: 50,
    padding: 40,
  },
  label: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 10,
  },
  message: {
    padding: 10,
  },
});
