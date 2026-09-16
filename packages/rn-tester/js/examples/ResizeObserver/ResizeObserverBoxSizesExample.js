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
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Animated, Button, StyleSheet, Switch, Text, View} from 'react-native';

export const name = 'ResizeObserverBoxSizes';
export const title = 'Box sizes';
export const description =
  'A single entry reports border-box, content-box and ' +
  'device-pixel-content-box. Toggle padding and border to see them diverge; ' +
  'animate width to watch sizes update on each layout.';
export const scrollable = true;

const MIN_WIDTH = 80;
const MAX_WIDTH = 300;
const STEP = 40;
const INITIAL_WIDTH = 160;
const ANIMATED_WIDTH = 260;
const ANIMATION_MS = 1000;
const PADDING = 20;
const BORDER_WIDTH = 8;

type Size = {inlineSize: number, blockSize: number};
type Boxes = {
  contentRect: {x: number, y: number, width: number, height: number},
  contentBox: Size,
  borderBox: Size,
  devicePixelContentBox: Size,
};

export function render(): React.Node {
  return <ResizeObserverBoxSizesExample />;
}

function ResizeObserverBoxSizesExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);
  const boxRef = useRef<?ElementRef<typeof Animated.View>>(null);
  const widthAnim = useMemo(() => new Animated.Value(INITIAL_WIDTH), []);
  const [width, setWidth] = useState(INITIAL_WIDTH);
  const [padded, setPadded] = useState(false);
  const [bordered, setBordered] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [boxes, setBoxes] = useState<?Boxes>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (box == null) {
      return;
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const [contentBox] = entry.contentBoxSize;
        const [borderBox] = entry.borderBoxSize;
        const [devicePixelContentBox] =
          entry.devicePixelContentBoxSize ?? entry.contentBoxSize;
        setBoxes({
          contentRect: {
            x: entry.contentRect.x,
            y: entry.contentRect.y,
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          },
          contentBox: {
            inlineSize: contentBox.inlineSize,
            blockSize: contentBox.blockSize,
          },
          borderBox: {
            inlineSize: borderBox.inlineSize,
            blockSize: borderBox.blockSize,
          },
          devicePixelContentBox: {
            inlineSize: devicePixelContentBox.inlineSize,
            blockSize: devicePixelContentBox.blockSize,
          },
        });
      }
    });
    // $FlowFixMe[incompatible-type]
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Animate layout width (useNativeDriver: false) so ResizeObserver sees size
  // changes. Transform-only animation would not notify.
  useEffect(() => {
    if (!animating) {
      widthAnim.setValue(width);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(widthAnim, {
          toValue: ANIMATED_WIDTH,
          duration: ANIMATION_MS,
          useNativeDriver: false,
        }),
        Animated.timing(widthAnim, {
          toValue: INITIAL_WIDTH,
          duration: ANIMATION_MS,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      widthAnim.setValue(width);
    };
  }, [animating, width, widthAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Animated.View
          ref={boxRef}
          style={[
            styles.box,
            {
              width: widthAnim,
              padding: padded ? PADDING : 0,
              borderWidth: bordered ? BORDER_WIDTH : 0,
              borderColor: theme.LabelColor,
            },
          ]}
        />
      </View>

      <View style={styles.controls}>
        <View style={styles.buttonRow}>
          <Button
            title="Narrower"
            disabled={animating || width <= MIN_WIDTH}
            onPress={() => setWidth(w => Math.max(MIN_WIDTH, w - STEP))}
          />
          <Button
            title="Wider"
            disabled={animating || width >= MAX_WIDTH}
            onPress={() => setWidth(w => Math.min(MAX_WIDTH, w + STEP))}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={[styles.label, {color: theme.LabelColor}]}>Padding</Text>
          <Switch value={padded} onValueChange={setPadded} />
        </View>
        <View style={styles.formRow}>
          <Text style={[styles.label, {color: theme.LabelColor}]}>Border</Text>
          <Switch value={bordered} onValueChange={setBordered} />
        </View>
        <View style={styles.formRow}>
          <Text style={[styles.label, {color: theme.LabelColor}]}>Animate</Text>
          <Switch value={animating} onValueChange={setAnimating} />
        </View>
      </View>

      <SizeReadout boxes={boxes} />
    </View>
  );
}

function formatSize(size: Size): string {
  return `${size.inlineSize.toFixed(1)} × ${size.blockSize.toFixed(1)}`;
}

function SizeReadout(props: {boxes: ?Boxes}): React.Node {
  const theme = useContext(RNTesterThemeContext);
  const {boxes} = props;

  if (boxes == null) {
    return (
      <Text style={[styles.mono, {color: theme.SecondaryLabelColor}]}>
        waiting for first observation…
      </Text>
    );
  }

  return (
    <View style={styles.readout}>
      <ReadoutRow label="border-box" value={formatSize(boxes.borderBox)} />
      <ReadoutRow label="content-box" value={formatSize(boxes.contentBox)} />
      <ReadoutRow
        label="device-pixel-content-box"
        value={formatSize(boxes.devicePixelContentBox)}
      />
      <ReadoutRow
        label="contentRect"
        value={`x ${boxes.contentRect.x.toFixed(1)}, y ${boxes.contentRect.y.toFixed(1)}`}
        secondary={true}
      />
    </View>
  );
}

function ReadoutRow(props: {
  label: string,
  value: string,
  secondary?: boolean,
}): React.Node {
  const theme = useContext(RNTesterThemeContext);
  const color =
    props.secondary === true ? theme.SecondaryLabelColor : theme.LabelColor;
  return (
    <View style={styles.readoutRow}>
      <Text style={[styles.mono, styles.readoutLabel, {color}]}>
        {props.label}
      </Text>
      <Text style={[styles.mono, styles.readoutValue, {color}]}>
        {props.value}
      </Text>
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
    minHeight: 96,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  controls: {
    rowGap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 8,
    justifyContent: 'center',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
  readout: {
    rowGap: 6,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  readoutLabel: {
    flex: 1,
  },
  readoutValue: {
    flexShrink: 0,
    textAlign: 'right',
  },
  mono: {
    fontSize: 14,
    fontFamily: 'Courier',
    fontVariant: ['tabular-nums'],
  },
});
