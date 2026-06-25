/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import ToggleNativeDriver from './utils/ToggleNativeDriver';
import * as React from 'react';
import {useLayoutEffect, useRef, useState} from 'react';
import {
  Animated,
  Button,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

component TextBox(children: React.Node) {
  // Prevent touch from being hijacked by Text
  return (
    <View pointerEvents="none">
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

component AnimatedEventExample(
  containerPageXY: Readonly<{x: number, y: number}>,
  useNativeDriver: boolean,
) {
  const boxRef = useRef<?React.ElementRef<typeof Animated.View>>();

  // $FlowFixMe[react-rule-unsafe-ref]
  const pointerPageXY = useRef(
    new Animated.ValueXY(
      {
        x: containerPageXY.x,
        y: containerPageXY.y,
      },
      {useNativeDriver},
    ),
  ).current;

  // $FlowFixMe[react-rule-unsafe-ref]
  const dragStartOffsetXY = useRef(
    new Animated.ValueXY({x: 0, y: 0}, {useNativeDriver}),
  ).current;

  // We'll no longer have to subtract containerPageXY.x/y from offset, if we can animate left/top props natively
  // TODO: T222117268 Adopt fabric driven c++ native animated in RNTester
  const finalOffsetX = Animated.subtract(
    Animated.subtract(pointerPageXY.x, dragStartOffsetXY.x),
    containerPageXY.x,
  );
  const finalOffsetY = Animated.subtract(
    Animated.subtract(pointerPageXY.y, dragStartOffsetXY.y),
    containerPageXY.y,
  );

  const syncAnimationToHostView = () => {
    boxRef.current?.setNativeProps({
      transform: [
        {translateX: finalOffsetX.__getValue()},
        {translateY: finalOffsetY.__getValue()},
      ],
    });
  };

  return (
    <Animated.View
      ref={boxRef}
      onTouchMove={Animated.event(
        [
          {
            nativeEvent: {
              pageX: pointerPageXY.x,
              pageY: pointerPageXY.y,
            },
          },
        ],
        {useNativeDriver},
      )}
      onTouchStart={Animated.event(
        [
          {
            nativeEvent: {
              pageX: pointerPageXY.x,
              pageY: pointerPageXY.y,
              locationX: dragStartOffsetXY.x,
              locationY: dragStartOffsetXY.y,
            },
          },
        ],
        {useNativeDriver},
      )}
      onTouchEnd={() => {
        // Animated change sometimes doesn't commit to Fabric, and box will jump back to offset before animation
        // This is to make sure that finalOffsetX/Y are synced to native host view
        // TODO: T222117268 Adopt fabric driven c++ native animated in RNTester
        syncAnimationToHostView();
      }}
      style={[
        styles.box,
        {
          backgroundColor: useNativeDriver ? 'orange' : 'violet',
          transform: [
            {
              translateX: finalOffsetX,
            },
            {
              translateY: finalOffsetY,
            },
          ],
        },
      ]}>
      <TextBox>Use {useNativeDriver ? 'Native' : 'JS'} Animated.event</TextBox>
    </Animated.View>
  );
}

component PanResponderExample(useNativeDriver: boolean) {
  // $FlowFixMe[react-rule-unsafe-ref]
  const finalOffsetXY = useRef(
    new Animated.ValueXY({x: 0, y: 0}, {useNativeDriver}),
  ).current;
  // $FlowFixMe[react-rule-unsafe-ref]
  const dragStartOffsetXY = useRef({x: 0, y: 0}).current;
  // $FlowFixMe[react-rule-unsafe-ref]
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (pressEvent, gestureState) => {
        dragStartOffsetXY.x = finalOffsetXY.x.__getValue();
        dragStartOffsetXY.y = finalOffsetXY.y.__getValue();
        return true;
      },
      onPanResponderMove: (pressEvent, gestureState) => {
        if (gestureState.dx !== 0) {
          finalOffsetXY.x.setValue(dragStartOffsetXY.x + gestureState.dx);
        }

        if (gestureState.dy !== 0) {
          finalOffsetXY.y.setValue(dragStartOffsetXY.y + gestureState.dy);
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.box,
        {
          backgroundColor: useNativeDriver ? 'pink' : 'cyan',
          transform: [
            {
              translateX: finalOffsetXY.x,
            },
            {
              translateY: finalOffsetXY.y,
            },
          ],
        },
      ]}>
      <TextBox>
        Use PanResponder{' '}
        {`+ ${useNativeDriver ? 'Native Animated value' : 'JS Animated value'}`}
      </TextBox>
    </Animated.View>
  );
}

component PanGestureExample() {
  const [busy, setBusy] = useState(false);
  const [useNativeDriver, setUseNativeDriver] = useState(false);

  const containerRef = useRef<?React.ElementRef<typeof View>>();
  const [containerPageXY, setContainerPageXY] =
    useState<?{x: number, y: number}>(null);

  useLayoutEffect(() => {
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setContainerPageXY({x: pageX, y: pageY});
    });
  }, []);

  function sleep(t: number) {
    setBusy(true);
    setTimeout(() => {
      const start = Date.now();
      while (Date.now() - start < t) {
        // sleeping
      }
      setBusy(false);
    }, 1000);
  }

  return (
    <View style={styles.container}>
      <ToggleNativeDriver
        value={useNativeDriver}
        onValueChange={setUseNativeDriver}
      />
      <Button
        title={busy ? 'js thread blocked...' : 'Block js thread for 5s'}
        onPress={() => {
          sleep(5000);
        }}
      />
      <View style={styles.examplesContainer} ref={containerRef}>
        {containerPageXY != null ? (
          <AnimatedEventExample
            useNativeDriver={useNativeDriver}
            containerPageXY={containerPageXY}
          />
        ) : null}
        <PanResponderExample useNativeDriver={useNativeDriver} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  examplesContainer: {
    flex: 1,
  },
  box: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  text: {
    pointerEvents: 'none',
  },
});

export default {
  title: 'Pan Gesture',
  name: 'panGesture',
  description: 'Animations driven by pan gesture.',
  render: () => <PanGestureExample />,
} as RNTesterModuleExample;
