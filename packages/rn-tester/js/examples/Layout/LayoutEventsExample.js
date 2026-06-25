/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {
  ViewLayout,
  ViewLayoutEvent,
} from 'react-native/Libraries/Components/View/ViewPropTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Image, LayoutAnimation, StyleSheet, View} from 'react-native';

type Props = Readonly<{}>;
type State = {
  containerStyle?: {width: number},
  extraText?: string,
  imageLayout?: ViewLayout,
  textLayout?: ViewLayout,
  viewLayout?: ViewLayout,
  viewStyle: {margin: number},
  ...
};

class LayoutEventExample extends React.Component<Props, State> {
  state: State = {
    viewStyle: {
      margin: 20,
    },
  };

  animateViewLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring, () => {
      console.log('layout animation done.');
      this.addWrapText();
    });
    this.setState({
      viewStyle: {
        margin: this.state.viewStyle.margin > 20 ? 20 : 60,
      },
    });
  };

  addWrapText = () => {
    this.setState(
      {extraText: '  And a bunch more text to wrap around a few lines.'},
      this.changeContainer,
    );
  };

  changeContainer = () => {
    this.setState({containerStyle: {width: 280}});
  };

  onViewLayout = (e: ViewLayoutEvent) => {
    console.log('received view layout event\n', e.nativeEvent);
    this.setState({viewLayout: e.nativeEvent.layout});
  };

  onTextLayout = (e: ViewLayoutEvent) => {
    console.log('received text layout event\n', e.nativeEvent);
    this.setState({textLayout: e.nativeEvent.layout});
  };

  onImageLayout = (e: ViewLayoutEvent) => {
    console.log('received image layout event\n', e.nativeEvent);
    this.setState({imageLayout: e.nativeEvent.layout});
  };

  render(): React.Node {
    const viewStyle = [styles.view, this.state.viewStyle];
    const textLayout = this.state.textLayout || {width: '?', height: '?'};
    const imageLayout = this.state.imageLayout || {x: '?', y: '?'};
    return (
      <View style={this.state.containerStyle}>
        <RNTesterText>
          layout events are called on mount and whenever layout is recalculated.
          Note that the layout event will typically be received{' '}
          <RNTesterText style={styles.italicText}>before</RNTesterText> the
          layout has updated on screen, especially when using layout animations.
          {'  '}
          <RNTesterText
            style={styles.pressText}
            onPress={this.animateViewLayout}>
            Press here to change layout.
          </RNTesterText>
        </RNTesterText>
        <View onLayout={this.onViewLayout} style={viewStyle}>
          <Image
            onLayout={this.onImageLayout}
            style={styles.image}
            source={{
              uri: 'https://www.facebook.com/favicon.ico',
            }}
          />
          <RNTesterText>
            ViewLayout:{' '}
            {
              /* $FlowFixMe[incompatible-type] (>=0.95.0 site=react_native_fb)
               * This comment suppresses an error found when Flow v0.95 was
               * deployed. To see the error, delete this comment and run Flow.
               */
              // $FlowFixMe[unsafe-addition]
              JSON.stringify(this.state.viewLayout, null, '  ') + '\n\n'
            }
          </RNTesterText>
          <RNTesterText onLayout={this.onTextLayout} style={styles.text}>
            A simple piece of text.{this.state.extraText}
          </RNTesterText>
          <RNTesterText>
            {'\n'}
            Text w/h: {textLayout.width}/{textLayout.height + '\n'}
            Image x/y: {imageLayout.x}/{imageLayout.y}
          </RNTesterText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  view: {
    padding: 12,
    borderColor: 'black',
    borderWidth: 0.5,
    backgroundColor: 'transparent',
  },
  text: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(0, 0, 255, 0.2)',
    borderWidth: 0.5,
  },
  image: {
    width: 50,
    height: 50,
    marginBottom: 10,
    alignSelf: 'center',
  },
  pressText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
});

exports.title = 'Layout Events';
exports.category = 'UI';
exports.description = ('Examples that show how Layout events can be used to ' +
  'measure view size and position.') as string;
exports.examples = [
  {
    title: 'LayoutEventExample',
    render: function (): React.MixedElement {
      return <LayoutEventExample />;
    },
  },
] as Array<RNTesterModuleExample>;
