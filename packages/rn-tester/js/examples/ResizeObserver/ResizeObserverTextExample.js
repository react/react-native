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
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type ColorValue,
  type LayoutChangeEvent,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

export const name = 'ResizeObserverText';
export const title = 'Text sizing';
export const description =
  'Port of the MDN resize-observer-text example: heading and paragraph font ' +
  'sizes are derived from the observed element content-box inline size.';
export const scrollable = false;

// https://mdn.github.io/dom-examples/resize-observer/resize-observer-text.html
const REM = 16;
const MIN_WIDTH = 300;
const MAX_WIDTH = 1300;
const INITIAL_WIDTH = 600;
const HEADING_DIVISOR = 200;
const PARAGRAPH_DIVISOR = 600;
const BOX_PADDING = 20;
const BOX_BORDER = 4;
const BOX_HORIZONTAL_CHROME = (BOX_PADDING + BOX_BORDER) * 2;

// MDN uses Helvetica Neue. System UI fonts (SF on iOS, Roboto on Android) are
// optically sized, so glyph advances do not scale linearly with fontSize and
// wrap points drift even when font ∝ width. Prefer fonts without an optical
// size axis: Helvetica Neue on iOS, monospace on Android.
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica Neue',
  android: 'monospace',
  default: 'monospace',
});

function fontSizesForInlineSize(inlineSize: number): {
  headingSize: number,
  paragraphSize: number,
} {
  return {
    headingSize: Math.max(1.5, inlineSize / HEADING_DIVISOR) * REM,
    paragraphSize: Math.max(1, inlineSize / PARAGRAPH_DIVISOR) * REM,
  };
}

export function render(): React.Node {
  return <ResizeObserverTextExample />;
}

function ResizeObserverTextExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);
  const boxRef = useRef<?ElementRef<typeof View>>(null);
  const observerRef = useRef<?ResizeObserver>(null);
  const scrollRef = useRef<?ElementRef<typeof ScrollView>>(null);
  const widthRef = useRef(INITIAL_WIDTH);
  const observerEnabledRef = useRef(true);
  const viewportWidthRef = useRef(0);

  const initialFonts = fontSizesForInlineSize(INITIAL_WIDTH);
  const [width, setWidth] = useState(INITIAL_WIDTH);
  const [observerEnabled, setObserverEnabled] = useState(true);
  const [headingSize, setHeadingSize] = useState(initialFonts.headingSize);
  const [paragraphSize, setParagraphSize] = useState(
    initialFonts.paragraphSize,
  );

  observerEnabledRef.current = observerEnabled;
  widthRef.current = width;

  const applyInlineSize = useCallback((inlineSize: number) => {
    const fonts = fontSizesForInlineSize(inlineSize);
    setHeadingSize(fonts.headingSize);
    setParagraphSize(fonts.paragraphSize);
  }, []);

  // Apply width and fonts together. Web ResizeObserver runs before paint; RN's
  // callback is async, so a width-only update would flicker the previous font.
  const applyWidth = useCallback(
    (next: number) => {
      const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, next));
      widthRef.current = clamped;
      setWidth(clamped);
      if (observerEnabledRef.current) {
        applyInlineSize(clamped);
      }
    },
    [applyInlineSize],
  );

  const centerBoxInViewport = useCallback((boxWidth: number) => {
    const viewportWidth = viewportWidthRef.current;
    const scrollView = scrollRef.current;
    if (viewportWidth <= 0 || scrollView == null) {
      return;
    }
    const contentWidth = boxWidth + BOX_HORIZONTAL_CHROME;
    const offset = Math.max(0, (contentWidth - viewportWidth) / 2);
    scrollView.scrollTo({x: offset, y: 0, animated: false});
  }, []);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (box == null) {
      return;
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        applyInlineSize(entry.contentBoxSize[0].inlineSize);
      }
    });
    observerRef.current = observer;
    // $FlowFixMe[incompatible-type]
    observer.observe(box);
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [applyInlineSize]);

  useLayoutEffect(() => {
    centerBoxInViewport(width);
  }, [width, centerBoxInViewport]);

  const onObserverEnabledChange = useCallback(
    (enabled: boolean) => {
      setObserverEnabled(enabled);
      const observer = observerRef.current;
      const box = boxRef.current;
      if (observer == null || box == null) {
        return;
      }
      if (enabled) {
        // $FlowFixMe[incompatible-type]
        observer.observe(box);
        applyInlineSize(widthRef.current);
      } else {
        // $FlowFixMe[incompatible-type]
        observer.unobserve(box);
      }
    },
    [applyInlineSize],
  );

  const onStageLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportWidthRef.current = event.nativeEvent.layout.width;
      centerBoxInViewport(widthRef.current);
    },
    [centerBoxInViewport],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal={true}
        style={styles.stage}
        contentContainerStyle={styles.stageContent}
        showsHorizontalScrollIndicator={true}
        onLayout={onStageLayout}>
        <View
          ref={boxRef}
          style={[styles.box, {width, borderColor: theme.LabelColor}]}>
          <Text
            style={[
              styles.heading,
              {fontSize: headingSize, color: theme.LabelColor},
            ]}>
            So what happened?
          </Text>
          <Text
            style={[
              styles.paragraph,
              {
                fontSize: paragraphSize,
                lineHeight: paragraphSize * 1.5,
                color: theme.LabelColor,
              },
            ]}>
            And remember, don't do anything that affects anything, unless it
            turns out you were supposed to, in which case, for the love of God,
            don't not do it! Ow, my spirit! I don't want to be rescued. You guys
            aren't Santa! You're not even robots. I've got to find a way to
            escape the horrible ravages of youth. Suddenly, I'm going to the
            bathroom like clockwork, every three hours. And those jerks at
            Social Security stopped sending me checks. Now 'I' have to pay
            'them'!
          </Text>
        </View>
      </ScrollView>

      <View style={styles.controls}>
        <View style={styles.formRow}>
          <Text style={[styles.label, {color: theme.LabelColor}]}>
            Observer enabled
          </Text>
          <Switch
            value={observerEnabled}
            onValueChange={onObserverEnabledChange}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={[styles.label, {color: theme.LabelColor}]}>
            Adjust width
          </Text>
          <WidthSlider
            value={width}
            minValue={MIN_WIDTH}
            maxValue={MAX_WIDTH}
            onValueChange={applyWidth}
            trackColor={theme.OpaqueSeparatorColor}
            thumbColor={theme.SecondaryLabelColor}
          />
        </View>
      </View>
    </View>
  );
}

function WidthSlider(props: {
  value: number,
  minValue: number,
  maxValue: number,
  onValueChange: (value: number) => void,
  trackColor: ColorValue,
  thumbColor: ColorValue,
}): React.Node {
  const {value, minValue, maxValue, onValueChange, trackColor, thumbColor} =
    props;
  const valueRef = useRef(value);
  const startValueRef = useRef(value);
  const trackWidthRef = useRef(0);
  valueRef.current = value;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startValueRef.current = valueRef.current;
        },
        onPanResponderMove: (_event, gesture) => {
          const trackWidth = trackWidthRef.current;
          if (trackWidth <= 0) {
            return;
          }
          const span = maxValue - minValue;
          const next = Math.round(
            startValueRef.current + (gesture.dx / trackWidth) * span,
          );
          onValueChange(Math.max(minValue, Math.min(maxValue, next)));
        },
      }),
    [maxValue, minValue, onValueChange],
  );

  const ratio = (value - minValue) / (maxValue - minValue);

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{min: minValue, max: maxValue, now: value}}
      style={styles.track}
      onLayout={event => {
        trackWidthRef.current = event.nativeEvent.layout.width;
      }}
      {...panResponder.panHandlers}>
      <View
        style={[
          styles.trackFill,
          {width: `${ratio * 100}%`, backgroundColor: trackColor},
        ]}
      />
      <View
        style={[
          styles.thumb,
          {left: `${ratio * 100}%`, backgroundColor: thumbColor},
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    rowGap: 16,
  },
  stage: {
    flex: 1,
  },
  stageContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    // content-box so style width matches contentBoxSize.inlineSize (CSS default).
    boxSizing: 'content-box',
    minWidth: MIN_WIDTH,
    padding: BOX_PADDING,
    borderWidth: BOX_BORDER,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  heading: {
    margin: 0,
    fontWeight: 'bold',
    fontFamily: FONT_FAMILY,
    // Extra Android font padding does not scale with fontSize and skews wrap.
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  paragraph: {
    marginTop: 8,
    fontFamily: FONT_FAMILY,
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  controls: {
    rowGap: 8,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
  track: {
    width: 160,
    height: 44,
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -14,
  },
});
