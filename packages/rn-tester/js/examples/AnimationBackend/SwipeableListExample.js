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

import * as React from 'react';
import {useCallback, useMemo, useRef} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useAnimatedValue,
} from 'react-native';
import {allowStyleProp} from 'react-native/Libraries/Animated/NativeAnimatedAllowlist';

allowStyleProp('height');

const windowDimensions = Dimensions.get('window');
const BUTTON_WIDTH = 80;
const MAX_TRANSLATE = -BUTTON_WIDTH;

type Data = {
  id: string,
  title: string,
};

const initialData: ReadonlyArray<Data> = [
  {id: '1', title: 'Kate Bell'},
  {id: '2', title: 'John Appleseed'},
  {id: '3', title: 'Mark Zuckerberg'},
  {id: '4', title: 'Iron Man'},
  {id: '5', title: 'Captain America'},
  {id: '6', title: 'Batman'},
  {id: '7', title: 'Matt Smith'},
];

const springConfig = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  useNativeDriver: true,
};

const timingConfig = {
  duration: 400,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  useNativeDriver: true,
};

function SwipeableListExample(): React.Node {
  const [data, setData] = React.useState<ReadonlyArray<Data>>(initialData);

  const handleRemove = useCallback((id: string) => {
    setData(currentData => currentData.filter(item => item.id !== id));
    Alert.alert('Removed');
  }, []);

  return (
    <View style={styles.container}>
      {data.map(item => (
        <ListItem
          key={item.id}
          item={item}
          onRemove={() => handleRemove(item.id)}
        />
      ))}
    </View>
  );
}

type ListItemProps = {
  item: Data,
  onRemove: () => void,
};

function ListItem({item, onRemove}: ListItemProps): React.Node {
  const isRemoving = useRef(false);
  const translateX = useAnimatedValue(0);
  const removalOffset = useAnimatedValue(0); // Separate value for removal animation
  const height = useAnimatedValue(78);
  const opacity = useAnimatedValue(1);

  const clampedTranslateX = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [MAX_TRANSLATE, 0],
        outputRange: [MAX_TRANSLATE, 0],
        extrapolate: 'clamp',
      }),
    [translateX],
  );

  // Combine clamped pan position with removal offset
  const finalTranslateX = useMemo(
    () => Animated.add(clampedTranslateX, removalOffset),
    [clampedTranslateX, removalOffset],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10;
        },
        onPanResponderGrant: () => {
          translateX.extractOffset();
        },
        onPanResponderMove: Animated.event([null, {dx: translateX}], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => {
          translateX.flattenOffset();

          const shouldOpen = gestureState.vx < -0.05;
          const targetValue = shouldOpen ? MAX_TRANSLATE : 0;

          Animated.spring(translateX, {
            toValue: targetValue,
            velocity: gestureState.vx,
            ...springConfig,
          }).start();
        },
      }),
    [translateX],
  );

  const handleRemove = useCallback(() => {
    if (isRemoving.current) {
      return;
    }
    isRemoving.current = true;

    // Animate removal offset separately - this bypasses the clamp
    Animated.parallel([
      Animated.timing(height, {
        toValue: 0,
        ...timingConfig,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        ...timingConfig,
      }),
      Animated.timing(removalOffset, {
        toValue: -windowDimensions.width - MAX_TRANSLATE,
        ...timingConfig,
      }),
    ]).start(() => {
      onRemove();
    });
  }, [height, opacity, removalOffset, onRemove]);

  const animatedStyle = useMemo(
    () => ({
      height,
      opacity,
      transform: [{translateX: finalTranslateX}],
    }),
    [height, opacity, finalTranslateX],
  );

  const removeButton = useMemo(
    () => ({
      title: 'Delete',
      backgroundColor: 'red',
      color: 'white',
      onPress: handleRemove,
    }),
    [handleRemove],
  );

  return (
    <View style={styles.item}>
      <Animated.View
        nativeID={`bb-${item.id}`}
        style={animatedStyle}
        {...panResponder.panHandlers}>
        <ListItemContent item={item} />
        <View style={styles.buttonsContainer}>
          <Button item={removeButton} />
        </View>
      </Animated.View>
    </View>
  );
}

type ButtonData = {
  title: string,
  backgroundColor: string,
  color: string,
  onPress: () => void,
};

function Button({item}: {item: ButtonData}): React.Node {
  return (
    <View style={[styles.button, {backgroundColor: item.backgroundColor}]}>
      <TouchableOpacity onPress={item.onPress} style={styles.buttonInner}>
        <Text style={{color: item.color}}>{item.title}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ListItemContent({item}: {item: Data}): React.Node {
  return (
    <View style={styles.itemContainer}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.title[0]}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    justifyContent: 'center',
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: 'white',
  },
  title: {
    fontSize: 18,
    marginLeft: 16,
  },
  button: {
    width: windowDimensions.width,
    paddingRight: windowDimensions.width - BUTTON_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: BUTTON_WIDTH,
  },
  buttonsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: windowDimensions.width,
    width: windowDimensions.width,
  },
});

export default {
  title: 'Swipeable List',
  name: 'swipeableList',
  description: 'A swipeable list with width animation',
  render: (): React.Node => <SwipeableListExample />,
} as RNTesterModuleExample;
