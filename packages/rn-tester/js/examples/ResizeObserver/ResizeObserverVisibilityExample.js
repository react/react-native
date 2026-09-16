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
import {
  type ElementRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';

export const name = 'ResizeObserverVisibility';
export const title = 'Visibility';
export const description =
  'Which visibility changes notify a ResizeObserver. Opacity is paint-only ' +
  'and does not notify; display:none and removal from the tree each deliver ' +
  'a final 0 × 0 entry.';
export const scrollable = true;

const LOG_LIMIT = 8;

type LogEntry = {id: number, text: string};

export function render(): React.Node {
  return <ResizeObserverVisibilityExample />;
}

function ResizeObserverVisibilityExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);
  const observerRef = useRef<?ResizeObserver>(null);
  const boxRef = useRef<?ElementRef<typeof View>>(null);
  const observedRef = useRef<?ElementRef<typeof View>>(null);
  const triggerRef = useRef<string>('observe');
  const nextLogIdRef = useRef(0);

  const [mounted, setMounted] = useState(true);
  const [faded, setFaded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [log, setLog] = useState<ReadonlyArray<LogEntry>>([]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(entries => {
      const trigger = triggerRef.current;
      const lines = entries.map(entry => {
        const [contentBox] = entry.contentBoxSize;
        return `${trigger} → ${contentBox.inlineSize.toFixed(0)} × ${contentBox.blockSize.toFixed(0)}`;
      });
      setLog(prev => {
        const appended = lines.map(text => {
          const id = nextLogIdRef.current;
          nextLogIdRef.current += 1;
          return {id, text};
        });
        return [...appended, ...prev].slice(0, LOG_LIMIT);
      });
    });
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, []);

  // Observe on mount. Do not unobserve on unmount so removal still delivers a
  // final 0 × 0. The previous host is cleaned up when a new target is mounted.
  useLayoutEffect(() => {
    const observer = observerRef.current;
    if (observer == null || !mounted) {
      return;
    }
    const box = boxRef.current;
    if (box == null) {
      return;
    }
    const previous = observedRef.current;
    if (previous != null && previous !== box) {
      // $FlowFixMe[incompatible-type]
      observer.unobserve(previous);
    }
    observedRef.current = box;
    // $FlowFixMe[incompatible-type]
    observer.observe(box);
  }, [mounted]);

  const withTrigger = useCallback((trigger: string, action: () => void) => {
    triggerRef.current = trigger;
    action();
  }, []);

  const resetVisualState = useCallback(() => {
    setFaded(false);
    setHidden(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {mounted ? (
          <View
            ref={boxRef}
            style={[
              styles.box,
              {
                opacity: faded ? 0.25 : 1,
                display: hidden ? 'none' : 'flex',
                borderColor: theme.LabelColor,
              },
            ]}
          />
        ) : (
          <Text
            style={[styles.placeholder, {color: theme.SecondaryLabelColor}]}>
            unmounted
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <ControlRow
          label="Hide (display:none)"
          hint="show notifies size · hide notifies 0 × 0"
          value={hidden}
          disabled={!mounted}
          onValueChange={value =>
            withTrigger('display', () => setHidden(value))
          }
        />
        <ControlRow
          label="Mounted"
          hint="mount notifies size · unmount notifies 0 × 0"
          value={mounted}
          onValueChange={value =>
            withTrigger(value ? 'mount' : 'unmount', () => {
              setMounted(value);
              if (value) {
                resetVisualState();
              }
            })
          }
        />
        <ControlRow
          label="Fade (opacity)"
          hint="paint-only — no notification"
          value={faded}
          disabled={!mounted || hidden}
          onValueChange={value => withTrigger('opacity', () => setFaded(value))}
        />
      </View>

      <View style={styles.readout}>
        <Text style={[styles.mono, {color: theme.SecondaryLabelColor}]}>
          notifications (newest first)
        </Text>
        {log.length === 0 ? (
          <Text style={[styles.mono, {color: theme.SecondaryLabelColor}]}>
            —
          </Text>
        ) : (
          log.map(entry => (
            <Text
              key={entry.id}
              style={[styles.mono, {color: theme.LabelColor}]}>
              {entry.text}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

function ControlRow(props: {
  label: string,
  hint: string,
  value: boolean,
  disabled?: boolean,
  onValueChange: (value: boolean) => void,
}): React.Node {
  const theme = useContext(RNTesterThemeContext);
  return (
    <View style={styles.formRow}>
      <View style={styles.labelBlock}>
        <Text style={[styles.label, {color: theme.LabelColor}]}>
          {props.label}
        </Text>
        <Text style={[styles.hint, {color: theme.SecondaryLabelColor}]}>
          {props.hint}
        </Text>
      </View>
      <Switch
        value={props.value}
        disabled={props.disabled === true}
        onValueChange={props.onValueChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    rowGap: 16,
  },
  stage: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: 160,
    height: 80,
    borderWidth: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  placeholder: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  controls: {
    rowGap: 8,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelBlock: {
    flex: 1,
    rowGap: 2,
  },
  label: {
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
  },
  readout: {
    rowGap: 4,
  },
  mono: {
    fontSize: 14,
    fontFamily: 'Courier',
    fontVariant: ['tabular-nums'],
  },
});
