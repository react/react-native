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
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import RNTesterBlock from '../../components/RNTesterBlock';
import RNTesterPage from '../../components/RNTesterPage';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {StyleSheet, View} from 'react-native';

type CicleProps = Readonly<{
  backgroundColor?: string,
  size?: number,
}>;

function Circle({
  backgroundColor = '#527fe4',
  size = 20,
}: CicleProps): React.Node {
  return (
    <View
      style={{
        borderRadius: size / 2,
        backgroundColor: backgroundColor,
        width: size,
        height: size,
        margin: 1,
      }}
    />
  );
}

type CircleBlockProps = Readonly<{
  children: React.Node,
  style: ViewStyleProp,
}>;

function CircleBlock({children, style}: CircleBlockProps): React.Node {
  const circleStyle = {
    flexDirection: 'row',
    backgroundColor: '#f6f7f8',
    borderWidth: 0.5,
    borderColor: '#d6d7da',
    marginBottom: 2,
  };
  /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
   * https://fburl.com/workplace/6291gfvu */
  return <View style={[circleStyle, style]}>{children}</View>;
}

function LayoutExample(): React.Node {
  const fiveColoredCircles = [
    <Circle backgroundColor="#527fe4" key="blue" />,
    <Circle backgroundColor="#D443E3" key="violet" />,
    <Circle backgroundColor="#FF9049" key="orange" />,
    <Circle backgroundColor="#FFE649" key="yellow" />,
    <Circle backgroundColor="#7FE040" key="green" />,
  ];

  return (
    <RNTesterPage title={'Layout'}>
      <RNTesterBlock title="Flex Direction">
        <RNTesterText>row</RNTesterText>
        <CircleBlock style={{flexDirection: 'row'}}>
          {fiveColoredCircles}
        </CircleBlock>
        <RNTesterText>row-reverse</RNTesterText>
        <CircleBlock style={{flexDirection: 'row-reverse'}}>
          {fiveColoredCircles}
        </CircleBlock>
        <RNTesterText>column</RNTesterText>
        <CircleBlock style={{flexDirection: 'column'}}>
          {fiveColoredCircles}
        </CircleBlock>
        <RNTesterText>column-reverse</RNTesterText>
        <CircleBlock style={{flexDirection: 'column-reverse'}}>
          {fiveColoredCircles}
        </CircleBlock>
        <View
          style={[styles.overlay, {position: 'absolute', top: 15, left: 160}]}>
          <RNTesterText style={{color: 'black'}}>
            {'top: 15, left: 160'}
          </RNTesterText>
        </View>
      </RNTesterBlock>

      <RNTesterBlock title="Justify Content - Main Direction">
        <RNTesterText>flex-start</RNTesterText>
        <CircleBlock style={{justifyContent: 'flex-start'}}>
          {fiveColoredCircles}
        </CircleBlock>
        <RNTesterText>center</RNTesterText>
        <CircleBlock style={{justifyContent: 'center'}}>
          {fiveColoredCircles}
        </CircleBlock>
        <RNTesterText>flex-end</RNTesterText>
        <CircleBlock style={{justifyContent: 'flex-end'}}>
          {fiveColoredCircles}
        </CircleBlock>
        <RNTesterText>space-between</RNTesterText>
        <CircleBlock style={{justifyContent: 'space-between'}}>
          {fiveColoredCircles}
        </CircleBlock>
        <RNTesterText>space-around</RNTesterText>
        <CircleBlock style={{justifyContent: 'space-around'}}>
          {fiveColoredCircles}
        </CircleBlock>
      </RNTesterBlock>
      <RNTesterBlock title="Align Items - Other Direction">
        <RNTesterText>flex-start</RNTesterText>
        <CircleBlock style={{alignItems: 'flex-start', height: 30}}>
          <Circle size={15} />
          <Circle size={10} />
          <Circle size={20} />
          <Circle size={17} />
          <Circle size={12} />
          <Circle size={15} />
          <Circle size={10} />
          <Circle size={20} />
          <Circle size={17} />
          <Circle size={12} />
          <Circle size={15} />
          <Circle size={10} />
          <Circle size={20} />
          <Circle size={17} />
          <Circle size={12} />
          <Circle size={15} />
          <Circle size={8} />
        </CircleBlock>
        <RNTesterText>center</RNTesterText>
        <CircleBlock style={{alignItems: 'center', height: 30}}>
          <Circle size={15} />
          <Circle size={10} />
          <Circle size={20} />
          <Circle size={17} />
          <Circle size={12} />
          <Circle size={15} />
          <Circle size={10} />
          <Circle size={20} />
          <Circle size={17} />
          <Circle size={12} />
          <Circle size={15} />
          <Circle size={10} />
          <Circle size={20} />
          <Circle size={17} />
          <Circle size={12} />
          <Circle size={15} />
          <Circle size={8} />
        </CircleBlock>
        <RNTesterText>flex-end</RNTesterText>
        <CircleBlock style={{alignItems: 'flex-end', height: 30}}>
          <Circle size={15} />
          <Circle size={10} />
          <Circle size={20} />
          <Circle size={17} />
          <Circle size={12} />
          <Circle size={15} />
          <Circle size={10} />
          <Circle size={20} />
          <Circle size={17} />
          <Circle size={12} />
          <Circle size={15} />
          <Circle size={10} />
          <Circle size={20} />
          <Circle size={17} />
          <Circle size={12} />
          <Circle size={15} />
          <Circle size={8} />
        </CircleBlock>
      </RNTesterBlock>
      <RNTesterBlock title="Flex Wrap">
        <CircleBlock style={{flexWrap: 'wrap'}}>
          {'oooooooooooooooo'.split('').map((char, i) => (
            <Circle key={i} />
          ))}
        </CircleBlock>
      </RNTesterBlock>
    </RNTesterPage>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#aaccff',
    borderRadius: 10,
    borderWidth: 0.5,
    opacity: 0.5,
    padding: 5,
  },
});

exports.title = 'Layout - Flexbox';
exports.category = 'UI';
exports.description = 'Examples of using the flexbox API to layout views.';
exports.displayName = 'LayoutExample';
exports.examples = [
  {
    title: 'Simple layout using flexbox',
    render(): React.MixedElement {
      return <LayoutExample />;
    },
  },
] as Array<RNTesterModuleExample>;
