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
import type {ListRenderItemInfo} from 'react-native';

import * as React from 'react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

module.exports = {
  displayName: 'SwipeableCardExample',
  framework: 'React',
  title: 'SwipeableCard',
  category: 'Basic',
  description:
    'Example of a swipeable card with scrollable content to test PanResponder and JSResponderHandler interaction.',
  examples: [
    {
      title: 'SwipeableCardExample',
      description:
        ('This example creates a swipeable card using PanResponder. ' +
          'Under the hood, JSResponderHandler should prevent scroll when the card is being swiped.') as string,
      render: function (): React.Node {
        return <SwipeableCardExample />;
      },
    },
  ] as Array<RNTesterModuleExample>,
};

function SwipeableCardExample() {
  const cardColors = ['red', 'blue', 'pink', 'aquamarine'];
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextIndex = currentIndex + 1;

  const isFirstCardOnTop = currentIndex % 2 !== 0;

  const incrementCurrent = () => setCurrentIndex(currentIndex + 1);

  const getCardColor = (index: number) => cardColors[index % cardColors.length];

  /*
   * The cards try to reuse the views. Instead of always rebuilding the current card on top
   * the order is configured by zIndex. This way, the native side reuses the same views for bottom
   * and top after swiping out.
   */
  return (
    <>
      <SwipeableCard
        zIndex={isFirstCardOnTop ? 2 : 1}
        color={
          isFirstCardOnTop
            ? getCardColor(currentIndex)
            : getCardColor(nextIndex)
        }
        onSwipedOut={incrementCurrent}
      />
      <SwipeableCard
        zIndex={isFirstCardOnTop ? 1 : 2}
        color={
          isFirstCardOnTop
            ? getCardColor(nextIndex)
            : getCardColor(currentIndex)
        }
        onSwipedOut={incrementCurrent}
      />
    </>
  );
}

function SwipeableCard(props: {
  zIndex: number,
  color: string,
  onSwipedOut: () => void,
}) {
  const movementX = useMemo(() => new Animated.Value(0), []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (e, gestureState) => {
          const {dx} = gestureState;
          return Math.abs(dx) > 5;
        },
        onPanResponderMove: Animated.event([null, {dx: movementX}], {
          useNativeDriver: false,
        }),
        onPanResponderEnd: (e, gestureState) => {
          const {dx} = gestureState;
          if (Math.abs(dx) > 120) {
            Animated.timing(movementX, {
              toValue: dx > 0 ? 1000 : -1000,
              useNativeDriver: true,
            }).start(props.onSwipedOut);
          } else {
            Animated.timing(movementX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [movementX, props.onSwipedOut],
  );

  const {width} = useWindowDimensions();
  const rotation = movementX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-5deg', '0deg', '5deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={StyleSheet.compose(styles.container, {zIndex: props.zIndex})}>
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{translateX: movementX}, {rotateZ: rotation}],
          flex: 1,
        }}>
        <Card color={props.color} />
      </Animated.View>
    </View>
  );
}

const cardData = Array(5);

function Card(props: {color: string}) {
  const renderItem = ({item, index}: ListRenderItemInfo<$FlowFixMe>) => (
    <CardSection color={props.color} index={index} />
  );

  const separatorComponent = () => <View style={styles.separator} />;

  const listRef = useRef<?FlatList<unknown>>();

  useEffect(() => {
    listRef.current?.scrollToOffset({offset: 0, animated: false});
  }, [props.color]);

  return (
    <View style={styles.card}>
      <FlatList
        style={{flex: 1}}
        data={cardData}
        renderItem={renderItem}
        ItemSeparatorComponent={separatorComponent}
        ref={listRef}
      />
    </View>
  );
}

function CardSection(props: {index: number, color: string}) {
  return (
    <View
      style={StyleSheet.compose(styles.sectionBg, {
        backgroundColor: props.color,
      })}>
      <Text style={styles.sectionText}>Section #{props.index}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    padding: 10,
    paddingTop: 30,
  },
  card: {
    flex: 1,
    margin: 5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'lightgray',
  },
  separator: {
    width: '100%',
    height: 2,
    backgroundColor: 'white',
  },
  sectionBg: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
