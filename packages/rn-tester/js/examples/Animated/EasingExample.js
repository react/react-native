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

import RNTConfigurationBlock from '../../components/RNTConfigurationBlock';
import RNTesterButton from '../../components/RNTesterButton';
import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import ToggleNativeDriver from './utils/ToggleNativeDriver';
import * as React from 'react';
import {useContext, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  SectionList,
  StyleSheet,
  Text,
  View,
  useAnimatedValue,
} from 'react-native';

type EasingListItem = {
  title: string,
  easing: (value: number) => number,
};

const easingSections = [
  {
    title: 'Predefined animations',
    data: [
      {title: 'Bounce', easing: Easing.bounce},
      {title: 'Ease', easing: Easing.ease},
      {title: 'Elastic', easing: Easing.elastic(4)},
    ],
  },
  {
    title: 'Standard functions',
    data: [
      {title: 'Linear', easing: Easing.linear},
      {title: 'Quad', easing: Easing.quad},
      {title: 'Cubic', easing: Easing.cubic},
    ],
  },
  {
    title: 'Additional functions',
    data: [
      {
        title: 'Bezier',
        easing: Easing.bezier(0, 2, 1, -1),
      },
      {title: 'Circle', easing: Easing.circle},
      {title: 'Sin', easing: Easing.sin},
      {title: 'Exp', easing: Easing.exp},
    ],
  },
  {
    title: 'Combinations',
    data: [
      {
        title: 'In + Bounce',
        easing: Easing.in(Easing.bounce),
      },
      {
        title: 'Out + Exp',
        easing: Easing.out(Easing.exp),
      },
      {
        title: 'InOut + Elastic',
        easing: Easing.inOut(Easing.elastic(1)),
      },
    ],
  },
];

component EasingItem(item: EasingListItem, useNativeDriver: boolean) {
  const opacityAndScale = useAnimatedValue(1);
  const animation = useRef(
    Animated.timing(opacityAndScale, {
      toValue: 1,
      duration: 1200,
      easing: item.easing,
      useNativeDriver,
    }),
  );

  const animatedStyles = [
    styles.box,
    {
      opacity: opacityAndScale,
      transform: [{scale: opacityAndScale}],
    },
  ];

  const theme = useContext(RNTesterThemeContext);

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemMeta}>
        <Text style={[styles.itemTitle, {color: theme.SecondaryLabelColor}]}>
          {item.title}
        </Text>
        <RNTesterButton
          onPress={() => {
            opacityAndScale.setValue(0);
            animation.current.start();
          }}>
          Animate
        </RNTesterButton>
      </View>
      <View style={styles.boxContainer}>
        <Animated.View style={animatedStyles} />
      </View>
    </View>
  );
}

component EasingExample() {
  const [useNativeDriver, setUseNativeDriver] = useState(false);

  return (
    <>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={setUseNativeDriver}
        />
      </RNTConfigurationBlock>
      <SectionList
        sections={easingSections}
        renderItem={info => {
          const item: EasingListItem = info.item;

          return (
            <EasingItem
              key={`${item.title}${useNativeDriver ? 'native' : 'non-native'}`}
              item={item}
              useNativeDriver={useNativeDriver}
            />
          );
        }}
        renderSectionHeader={({section: {title}}) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
      />
    </>
  );
}

const boxSize = 50;
const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f4f4f4',
    color: '#999',
    fontSize: 12,
  },
  itemContainer: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMeta: {
    flex: 1,
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '300',
  },
  boxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: boxSize,
    width: boxSize * 2,
  },
  box: {
    borderRadius: 4,
    backgroundColor: '#61dafb',
    width: boxSize,
    height: boxSize,
  },
});

export default {
  title: 'Easing',
  name: 'easing',
  description:
    'The Easing module implements common easing functions. This module is used by Animated.timing() to convey physically believable motion in animations.',
  render: () => <EasingExample />,
} as RNTesterModuleExample;
