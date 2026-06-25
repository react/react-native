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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

type ExampleViewSpec = {
  key: number,
};

type AddRemoveExampleState = {
  views: Array<ExampleViewSpec>,
  nextKey: number,
};

function shuffleArray(array: Array<ExampleViewSpec>) {
  var currentIndex: number = array.length,
    temporaryValue: ExampleViewSpec,
    randomIndex: number;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

class AddRemoveExample extends React.Component<{...}, AddRemoveExampleState> {
  state: AddRemoveExampleState = {
    views: [],
    nextKey: 1,
  };

  configureNextAnimation() {
    LayoutAnimation.configureNext(
      {
        duration: 1000,
        create: {type: 'easeInEaseOut', property: 'opacity'},
        update: {type: 'easeInEaseOut', property: 'opacity'},
        delete: {type: 'easeInEaseOut', property: 'opacity'},
      },
      args => console.log('AddRemoveExample completed', args),
    );
  }

  _onPressAddViewAnimated = () => {
    this.configureNextAnimation();
    this._onPressAddView();
  };

  _onPressRemoveViewAnimated = () => {
    this.configureNextAnimation();
    this._onPressRemoveView();
  };

  _onPressReorderViewsAnimated = () => {
    this.configureNextAnimation();
    this._onPressReorderViews();
  };

  _onPressAddView = () => {
    this.setState(state => ({
      views: [...state.views, {key: state.nextKey}],
      nextKey: state.nextKey + 1,
    }));
  };

  _onPressRemoveView = () => {
    this.setState(state => ({views: state.views.slice(0, -1)}));
  };

  _onPressReorderViews = () => {
    this.setState(state => ({views: shuffleArray(state.views)}));
  };

  render(): React.Node {
    const views = this.state.views.map(({key}) => (
      <View
        key={key}
        style={styles.view}
        onLayout={evt => console.log('Box onLayout')}>
        <RNTesterText>{key}</RNTesterText>
      </View>
    ));
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._onPressAddViewAnimated}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>Add view</RNTesterText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={this._onPressRemoveViewAnimated}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>Remove view</RNTesterText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={this._onPressReorderViewsAnimated}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>Reorder Views</RNTesterText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={this._onPressAddView}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              Add view (no animation)
            </RNTesterText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={this._onPressRemoveView}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              Remove view (no animation)
            </RNTesterText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={this._onPressReorderViews}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              Reorder Views (no animation)
            </RNTesterText>
          </View>
        </TouchableOpacity>
        <View style={styles.viewContainer}>{views}</View>
      </View>
    );
  }
}

type ReparentingExampleState = {
  hasBorder: boolean,
};

class ReparentingExample extends React.Component<
  {...},
  ReparentingExampleState,
> {
  state: ReparentingExampleState = {
    hasBorder: false,
  };

  _onPressToggleAnimated = () => {
    LayoutAnimation.configureNext(
      {
        duration: 300,
        create: {type: 'easeInEaseOut', property: 'opacity', duration: 1000},
        update: {type: 'easeInEaseOut', property: 'opacity'},
        delete: {type: 'easeInEaseOut', property: 'opacity', duration: 1000},
      },
      args => console.log('ReparentingExample completed', args),
    );
    this._onPressToggle();
  };

  _onPressToggle = () => {
    this.setState(state => ({hasBorder: !state.hasBorder}));
  };

  render(): React.Node {
    const parentStyle = this.state.hasBorder
      ? {borderWidth: 5, borderColor: 'red'}
      : {};

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._onPressToggleAnimated}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>Toggle</RNTesterText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={this._onPressToggle}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              Toggle (no animation)
            </RNTesterText>
          </View>
        </TouchableOpacity>
        <View style={parentStyle}>
          <GreenSquare />
        </View>
      </View>
    );
  }
}

const GreenSquare = () => (
  <View style={styles.greenSquare}>
    <RNTesterText style={styles.squareText}>Green square</RNTesterText>
  </View>
);

const BlueSquare = () => (
  <View style={styles.blueSquare}>
    <RNTesterText style={styles.squareText}>Blue square</RNTesterText>
  </View>
);

type CrossFadeExampleState = {
  toggled: boolean,
};

class CrossFadeExample extends React.Component<{...}, CrossFadeExampleState> {
  state: CrossFadeExampleState = {
    toggled: false,
  };

  _onPressToggle = () => {
    LayoutAnimation.easeInEaseOut(args =>
      console.log('CrossFadeExample completed', args),
    );
    this.setState(state => ({toggled: !state.toggled}));
  };

  render(): React.Node {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._onPressToggle}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>Toggle</RNTesterText>
          </View>
        </TouchableOpacity>
        <View style={styles.viewContainer}>
          {this.state.toggled ? <GreenSquare /> : <BlueSquare />}
        </View>
      </View>
    );
  }
}

type LayoutUpdateExampleState = {
  width: number,
  height: number,
};

class LayoutUpdateExample extends React.Component<
  {...},
  LayoutUpdateExampleState,
> {
  state: LayoutUpdateExampleState = {
    width: 200,
    height: 100,
  };

  timeout: TimeoutID | null = null;

  componentWillUnmount() {
    this._clearTimeout();
  }

  _clearTimeout = () => {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  };

  _onPressToggle = () => {
    this._clearTimeout();
    this.setState({width: 150});

    LayoutAnimation.configureNext(
      {
        duration: 1000,
        update: {
          type: LayoutAnimation.Types.linear,
        },
      },
      args => console.log('LayoutUpdateExample completed', args),
    );

    this.timeout = setTimeout(() => this.setState({width: 100}), 500);
  };

  render(): React.Node {
    const {width, height} = this.state;

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._onPressToggle}>
          <View style={styles.button}>
            <RNTesterText style={styles.buttonText}>
              Make box square
            </RNTesterText>
          </View>
        </TouchableOpacity>
        <View style={[styles.view, {width, height}]}>
          <RNTesterText style={styles.squareText}>
            {width}x{height}
          </RNTesterText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    padding: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: 'black',
  },
  viewContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  view: {
    height: 54,
    width: 54,
    backgroundColor: 'red',
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenSquare: {
    width: 150,
    height: 150,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueSquare: {
    width: 150,
    height: 150,
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareText: {
    color: '#fff',
  },
});

exports.title = 'Layout Animation';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/layoutanimation';
exports.description = 'Layout animation';
exports.examples = [
  {
    title: 'Add and remove views',
    render(): React.MixedElement {
      return <AddRemoveExample />;
    },
  },
  {
    title: 'Animate Reparenting Update',
    render(): React.MixedElement {
      return <ReparentingExample />;
    },
  },
  {
    title: 'Cross fade views',
    render(): React.MixedElement {
      return <CrossFadeExample />;
    },
  },
  {
    title: 'Layout update during animation',
    render(): React.MixedElement {
      return <LayoutUpdateExample />;
    },
  },
] as Array<RNTesterModuleExample>;
