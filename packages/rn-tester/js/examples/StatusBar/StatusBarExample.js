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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {
  Modal,
  StatusBar,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';

const colors = ['#ff0000', '#00ff00', '#0000ff', 'rgba(0, 0, 0, 0.4)'];

const barStyles = ['default', 'auto', 'light-content', 'dark-content'];

const showHideTransitions = ['fade', 'slide'];

function getValue<T>(values: Array<T>, index: number): T {
  return values[index % values.length];
}

class StatusBarHiddenExample extends React.Component<{...}, $FlowFixMe> {
  state:
    | $FlowFixMe
    | {animated: boolean, hidden: boolean, showHideTransition: string} = {
    animated: true,
    hidden: false,
    showHideTransition: getValue(showHideTransitions, 0),
  };

  _showHideTransitionIndex = 0;

  _onChangeAnimated = () => {
    this.setState({animated: !this.state.animated});
  };

  _onChangeHidden = () => {
    this.setState({hidden: !this.state.hidden});
  };

  _onChangeTransition = () => {
    this._showHideTransitionIndex++;
    this.setState({
      showHideTransition: getValue(
        showHideTransitions,
        this._showHideTransitionIndex,
      ),
    });
  };

  render(): React.Node {
    return (
      <View>
        <StatusBar
          hidden={this.state.hidden}
          // $FlowFixMe[incompatible-type]
          showHideTransition={this.state.showHideTransition}
          animated={this.state.animated}
        />
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeHidden}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              hidden: {this.state.hidden ? 'true' : 'false'}
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeAnimated}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              animated (ios only): {this.state.animated ? 'true' : 'false'}
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeTransition}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              showHideTransition (ios only): '
              {getValue(showHideTransitions, this._showHideTransitionIndex)}'
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <ModalExample />
      </View>
    );
  }
}

class StatusBarStyleExample extends React.Component<{...}, $FlowFixMe> {
  _barStyleIndex = 0;

  _onChangeBarStyle = () => {
    this._barStyleIndex++;
    this.setState({barStyle: getValue(barStyles, this._barStyleIndex)});
  };

  _onChangeAnimated = () => {
    this.setState({animated: !this.state.animated});
  };

  state: $FlowFixMe | {animated: boolean, barStyle: string} = {
    animated: true,
    barStyle: getValue(barStyles, this._barStyleIndex),
  };

  render(): React.Node {
    return (
      <View>
        <StatusBar
          animated={this.state.animated}
          // $FlowFixMe[incompatible-type]
          barStyle={this.state.barStyle}
        />
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeBarStyle}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              style: '{getValue(barStyles, this._barStyleIndex)}'
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <View style={styles.wrapper}>
          <RNTesterText>
            (default is dark for iOS, light for Android)
          </RNTesterText>
        </View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeAnimated}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              animated (ios only): {this.state.animated ? 'true' : 'false'}
            </RNTesterText>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class StatusBarBackgroundColorExample extends React.Component<
  {...},
  $FlowFixMe,
> {
  state: $FlowFixMe | {animated: boolean, backgroundColor: string} = {
    animated: true,
    backgroundColor: getValue(colors, 0),
  };

  _colorIndex = 0;

  _onChangeBackgroundColor = () => {
    this._colorIndex++;
    this.setState({backgroundColor: getValue(colors, this._colorIndex)});
  };

  _onChangeAnimated = () => {
    this.setState({animated: !this.state.animated});
  };

  render(): React.Node {
    return (
      <View>
        <StatusBar
          backgroundColor={this.state.backgroundColor}
          animated={this.state.animated}
        />
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeBackgroundColor}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              backgroundColor: '{getValue(colors, this._colorIndex)}'
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeAnimated}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              animated: {this.state.animated ? 'true' : 'false'}
            </RNTesterText>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class StatusBarTranslucentExample extends React.Component<{...}, $FlowFixMe> {
  state: $FlowFixMe | {translucent: boolean} = {
    translucent: false,
  };

  _onChangeTranslucent = () => {
    this.setState({
      translucent: !this.state.translucent,
    });
  };

  render(): React.Node {
    return (
      <View>
        <StatusBar translucent={this.state.translucent} />
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeTranslucent}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              translucent: {this.state.translucent ? 'true' : 'false'}
            </RNTesterText>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class StatusBarStaticIOSExample extends React.Component<{...}> {
  render(): React.Node {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setHidden(true, 'slide');
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setHidden(true, 'slide')
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setHidden(false, 'fade');
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setHidden(false, 'fade')
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBarStyle('default', true);
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setBarStyle('default', true)
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <View style={styles.wrapper}>
          <RNTesterText>
            (default is dark for iOS, light for Android)
          </RNTesterText>
        </View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBarStyle('light-content', true);
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setBarStyle('light-content', true)
            </RNTesterText>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class StatusBarStaticAndroidExample extends React.Component<{...}> {
  render(): React.Node {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setHidden(true);
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setHidden(true)
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setHidden(false);
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setHidden(false)
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBarStyle('light-content');
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setBarStyle('light-content')
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBarStyle('dark-content');
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setBarStyle('dark-content')
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBarStyle('default');
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setBarStyle('default')
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <View style={styles.wrapper}>
          <RNTesterText>
            (default is dark for iOS, light for Android)
          </RNTesterText>
        </View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBackgroundColor('#ff00ff', true);
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setBackgroundColor('#ff00ff', true)
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setBackgroundColor('#00ff00', true);
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setBackgroundColor('#00ff00', true)
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setTranslucent(true);
            StatusBar.setBackgroundColor('rgba(0, 0, 0, 0.4)', true);
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setTranslucent(true) and setBackgroundColor('rgba(0, 0, 0, 0.4)',
              true)
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={() => {
            StatusBar.setTranslucent(false);
            StatusBar.setBackgroundColor('black', true);
          }}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              setTranslucent(false) and setBackgroundColor('black', true)
            </RNTesterText>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

class ModalExample extends React.Component<{...}, $FlowFixMe> {
  state: $FlowFixMe | {modalVisible: boolean} = {
    modalVisible: false,
  };

  _onChangeModalVisible = () => {
    this.setState({modalVisible: !this.state.modalVisible});
  };

  render(): React.Node {
    return (
      <View>
        <TouchableHighlight
          style={styles.wrapper}
          onPress={this._onChangeModalVisible}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              modal visible: {this.state.hidden ? 'true' : 'false'}
            </RNTesterText>
          </View>
        </TouchableHighlight>
        <Modal
          visible={this.state.modalVisible}
          transparent={true}
          onRequestClose={this._onChangeModalVisible}>
          <View style={[styles.container]}>
            <View style={[styles.innerContainer]}>
              <RNTesterText style={styles.modalText}>
                This modal was presented!
              </RNTesterText>
              <TouchableHighlight
                onPress={this._onChangeModalVisible}
                style={styles.modalButton}>
                <View style={styles.button}>
                  <RNTesterText style={styles.buttonText}>Close</RNTesterText>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

exports.framework = 'React';
exports.title = 'StatusBar';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/statusbar';
exports.description = 'Component for controlling the status bar';
exports.examples = [
  {
    title: 'StatusBar hidden',
    render(): React.Node {
      return <StatusBarHiddenExample />;
    },
  },
  {
    title: 'StatusBar style',
    render(): React.Node {
      return <StatusBarStyleExample />;
    },
  },
  {
    title: 'StatusBar background color',
    render(): React.Node {
      return <StatusBarBackgroundColorExample />;
    },
    platform: 'android',
  },
  {
    title: 'StatusBar translucent',
    render(): React.Node {
      return <StatusBarTranslucentExample />;
    },
    platform: 'android',
  },
  {
    title: 'StatusBar static API',
    render(): React.Node {
      return <StatusBarStaticIOSExample />;
    },
    platform: 'ios',
  },
  {
    title: 'StatusBar static API',
    render(): React.Node {
      return <StatusBarStaticAndroidExample />;
    },
    platform: 'android',
  },
  {
    title: 'StatusBar dimensions',
    render(): React.Node {
      return (
        <View>
          <RNTesterText>
            Height (Android only): {StatusBar.currentHeight} pts
          </RNTesterText>
        </View>
      );
    },
    platform: 'android',
  },
] as Array<RNTesterModuleExample>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5fcff',
  },
  innerContainer: {
    borderRadius: 10,
    alignItems: 'center',
  },
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  buttonText: {
    color: 'black',
  },
  modalButton: {
    marginTop: 10,
  },
  modalText: {
    color: 'black',
  },
});
