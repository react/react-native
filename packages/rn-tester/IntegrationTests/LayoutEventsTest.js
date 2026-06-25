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

import type {LayoutChangeEvent, LayoutRectangle} from 'react-native';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

const React = require('react');
const ReactNative = require('react-native');
const deepDiffer =
  require('react-native/Libraries/Utilities/differ/deepDiffer').default;

const {Image, LayoutAnimation, StyleSheet, Text, View} = ReactNative;
const {TestModule} = ReactNative.NativeModules;
function debug(...args: Array<void | LayoutRectangle | string>) {
  // console.log.apply(null, arguments);
}

type Props = Readonly<{}>;

type State = {
  didAnimation: boolean,
  extraText?: string,
  imageLayout?: LayoutRectangle,
  textLayout?: LayoutRectangle,
  viewLayout?: LayoutRectangle,
  viewStyle?: ViewStyleProp,
  containerStyle?: ViewStyleProp,
  ...
};

class LayoutEventsTest extends React.Component<Props, State> {
  _view: ?React.ElementRef<typeof View>;
  _img: ?React.ElementRef<typeof Image>;
  _txt: ?React.ElementRef<typeof Text>;

  state: State = {
    didAnimation: false,
  };

  animateViewLayout() {
    debug('animateViewLayout invoked');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring, () => {
      debug('animateViewLayout done');
      this.checkLayout(this.addWrapText);
    });
    this.setState({viewStyle: {margin: 60}});
  }

  addWrapText: () => void = () => {
    debug('addWrapText invoked');
    this.setState(
      {extraText: '  And a bunch more text to wrap around a few lines.'},
      () => this.checkLayout(this.changeContainer),
    );
  };

  changeContainer: () => void = () => {
    debug('changeContainer invoked');
    this.setState({containerStyle: {width: 280}}, () =>
      this.checkLayout(TestModule.markTestCompleted),
    );
  };

  checkLayout: (next?: ?() => void) => void = (next?: ?() => void) => {
    const view = this._view;
    const txt = this._txt;
    const img = this._img;

    if (view == null || txt == null || img == null) {
      return;
    }

    view.measure((x, y, width, height) => {
      this.compare(
        'view',
        {x, y, width, height},
        this.state.viewLayout || null,
      );
      if (typeof next === 'function') {
        next();
      } else if (!this.state.didAnimation) {
        // Trigger first state change after onLayout fires
        this.animateViewLayout();
        this.state.didAnimation = true;
      }
    });

    txt.measure((x, y, width, height) => {
      this.compare('txt', {x, y, width, height}, this.state.textLayout);
    });

    img.measure((x, y, width, height) => {
      this.compare('img', {x, y, width, height}, this.state.imageLayout);
    });
  };

  compare(
    node: string,
    measured: LayoutRectangle,
    onLayout?: ?LayoutRectangle,
  ): void {
    if (deepDiffer(measured, onLayout)) {
      const data = {measured, onLayout};
      throw new Error(
        node +
          ' onLayout mismatch with measure ' +
          JSON.stringify(data, null, '  '),
      );
    }
  }

  onViewLayout: (e: LayoutChangeEvent) => void = (e: LayoutChangeEvent) => {
    // $FlowFixMe[incompatible-type]
    debug('received view layout event\n', e.nativeEvent);
    this.setState({viewLayout: e.nativeEvent.layout}, this.checkLayout);
  };

  onTextLayout: (e: LayoutChangeEvent) => void = (e: LayoutChangeEvent) => {
    // $FlowFixMe[incompatible-type]
    debug('received text layout event\n', e.nativeEvent);
    this.setState({textLayout: e.nativeEvent.layout}, this.checkLayout);
  };

  onImageLayout: (e: LayoutChangeEvent) => void = (e: LayoutChangeEvent) => {
    // $FlowFixMe[incompatible-type]
    debug('received image layout event\n', e.nativeEvent);
    this.setState({imageLayout: e.nativeEvent.layout}, this.checkLayout);
  };

  render(): React.Node {
    const viewStyle = [styles.view, this.state.viewStyle];
    const textLayout = this.state.textLayout || {width: '?', height: '?'};
    const imageLayout = this.state.imageLayout || {x: '?', y: '?'};
    debug('viewLayout', this.state.viewLayout);
    return (
      <View style={[styles.container, this.state.containerStyle]}>
        <View
          ref={ref => {
            this._view = ref;
          }}
          onLayout={this.onViewLayout}
          style={viewStyle}>
          <Image
            ref={ref => {
              this._img = ref;
            }}
            onLayout={this.onImageLayout}
            style={styles.image}
            source={{uri: 'uie_thumb_big.png'}}
          />
          <Text
            ref={ref => {
              this._txt = ref;
            }}
            onLayout={this.onTextLayout}
            style={styles.text}>
            A simple piece of text.{this.state.extraText}
          </Text>
          <Text>
            {'\n'}
            Text w/h: {textLayout.width}/{textLayout.height + '\n'}
            Image x/y: {imageLayout.x}/{imageLayout.y}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 40,
  },
  view: {
    margin: 20,
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
});

LayoutEventsTest.displayName = 'LayoutEventsTest';
export default LayoutEventsTest;
