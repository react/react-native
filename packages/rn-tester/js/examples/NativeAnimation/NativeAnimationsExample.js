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
import type AnimatedValue from 'react-native/Libraries/Animated/nodes/AnimatedValue';

import RNTesterSettingSwitchRow from '../../components/RNTesterSettingSwitchRow';
import RNTesterText from '../../components/RNTesterText';
import useJsStalls from '../../utils/useJsStalls';
import * as React from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

class Tester extends React.Component<$FlowFixMe, $FlowFixMe> {
  state: any | {js: AnimatedValue, native: AnimatedValue} = {
    native: new Animated.Value(0),
    js: new Animated.Value(0),
  };

  current = 0;

  onPress = () => {
    const animConfig =
      this.current && this.props.reverseConfig
        ? this.props.reverseConfig
        : this.props.config;
    this.current = this.current ? 0 : 1;
    const config: Object = {
      ...animConfig,
      toValue: this.current,
    };

    Animated[this.props.type](this.state.native, {
      ...config,
      useNativeDriver: true,
    }).start();
    Animated[this.props.type](this.state.js, {
      ...config,
      useNativeDriver: false,
    }).start();
  };

  render(): React.Node {
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View>
          <View>
            <RNTesterText>Native:</RNTesterText>
          </View>
          <View style={styles.row}>
            {this.props.children(this.state.native)}
          </View>
          <View>
            <RNTesterText>JavaScript{':'}</RNTesterText>
          </View>
          <View style={styles.row}>{this.props.children(this.state.js)}</View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

class ValueListenerExample extends React.Component<{...}, $FlowFixMe> {
  state: any | {anim: AnimatedValue, progress: number} = {
    anim: new Animated.Value(0),
    progress: 0,
  };
  _current = 0;

  componentDidMount() {
    this.state.anim.addListener(e => this.setState({progress: e.value}));
  }

  componentWillUnmount() {
    this.state.anim.removeAllListeners();
  }

  _onPress = () => {
    this._current = this._current ? 0 : 1;
    const config = {
      duration: 1000,
      toValue: this._current,
    };

    Animated.timing(this.state.anim, {
      ...config,
      useNativeDriver: true,
    }).start();
  };

  render(): React.Node {
    return (
      <TouchableWithoutFeedback onPress={this._onPress}>
        <View>
          <View style={styles.row}>
            <Animated.View
              style={[
                styles.block,
                {
                  opacity: this.state.anim,
                },
              ]}
            />
          </View>
          <RNTesterText>Value: {this.state.progress}</RNTesterText>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

class LoopExample extends React.Component<{...}, $FlowFixMe> {
  state: any | {value: AnimatedValue} = {
    value: new Animated.Value(0),
  };

  componentDidMount() {
    Animated.loop(
      Animated.timing(this.state.value, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      }),
    ).start();
  }

  render(): React.Node {
    return (
      <View style={styles.row}>
        <Animated.View
          style={[
            styles.block,
            {
              opacity: this.state.value.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              }),
            },
          ]}
        />
      </View>
    );
  }
}

const InternalSettings = () => {
  const {
    state,
    onDisableForceJsStalls,
    onEnableForceJsStalls,
    onEnableJsStallsTracking,
    onDisableJsStallsTracking,
  } = useJsStalls();

  const {stallIntervalId, filteredStall, busyTime, tracking} = state;

  return (
    <View>
      <RNTesterSettingSwitchRow
        active={stallIntervalId != null}
        label="Force JS Stalls"
        onEnable={onEnableForceJsStalls}
        onDisable={onDisableForceJsStalls}
      />

      <RNTesterSettingSwitchRow
        active={tracking}
        label="Track JS Stalls"
        onEnable={onEnableJsStallsTracking}
        onDisable={onDisableJsStallsTracking}
      />

      {tracking && (
        <RNTesterText>
          {`JS Stall filtered: ${Math.round(filteredStall)}, `}
          {`last: ${busyTime !== null ? busyTime.toFixed(8) : '<none>'}`}
        </RNTesterText>
      )}
    </View>
  );
};

class EventExample extends React.Component<{...}, $FlowFixMe> {
  state: any | {anim: AnimatedValue} = {
    anim: new Animated.Value(0),
  };

  render(): React.Node {
    return (
      <View>
        <Animated.View
          style={[
            styles.block,
            {
              transform: [
                {
                  rotate: this.state.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '1deg'],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.ScrollView
          horizontal
          style={{height: 100, marginTop: 16}}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: this.state.anim}}}],
            {useNativeDriver: true},
          )}>
          <View
            style={{
              width: 600,
              backgroundColor: '#eee',
              justifyContent: 'center',
              paddingLeft: 100,
            }}>
            <RNTesterText style={{color: 'black'}}>
              Scroll me sideways!
            </RNTesterText>
          </View>
        </Animated.ScrollView>
      </View>
    );
  }
}

class TrackingExample extends React.Component<$FlowFixMe, $FlowFixMe> {
  state:
    | any
    | {
        js: AnimatedValue,
        native: AnimatedValue,
        toJS: AnimatedValue,
        toNative: AnimatedValue,
      } = {
    native: new Animated.Value(0),
    toNative: new Animated.Value(0),
    js: new Animated.Value(0),
    toJS: new Animated.Value(0),
  };

  componentDidMount() {
    // we configure spring to take a bit of time to settle so that the user
    // have time to click many times and see "toValue" getting updated and
    const longSettlingSpring = {
      tension: 20,
      friction: 0.5,
    };
    Animated.spring(this.state.native, {
      ...longSettlingSpring,
      toValue: this.state.toNative,
      useNativeDriver: true,
    }).start();
    Animated.spring(this.state.js, {
      ...longSettlingSpring,
      toValue: this.state.toJS,
      useNativeDriver: false,
    }).start();
  }

  onPress = () => {
    // select next value to be tracked by random
    const nextValue = Math.random() * 200;
    this.state.toNative.setValue(nextValue);
    this.state.toJS.setValue(nextValue);
  };

  renderBlock = (
    anim: any | AnimatedValue,
    dest: any | AnimatedValue,
  ): Array<React.Node> => [
    <Animated.View
      key="line"
      style={[styles.line, {transform: [{translateX: dest}]}]}
    />,
    <Animated.View
      key="block"
      style={[styles.block, {transform: [{translateX: anim}]}]}
    />,
  ];

  render(): React.Node {
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View>
          <View>
            <RNTesterText>Native:</RNTesterText>
          </View>
          <View style={styles.row}>
            {this.renderBlock(this.state.native, this.state.toNative)}
          </View>
          <View>
            <RNTesterText>JavaScript{':'}</RNTesterText>
          </View>
          <View style={styles.row}>
            {this.renderBlock(this.state.js, this.state.toJS)}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    padding: 10,
    zIndex: 1,
  },
  block: {
    width: 50,
    height: 50,
    backgroundColor: 'blue',
  },
  line: {
    position: 'absolute',
    left: 35,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'red',
  },
});

exports.framework = 'React';
exports.title = 'Native Animated Example';
exports.category = 'UI';
exports.description = 'Test out Native Animations';

exports.examples = [
  {
    title: 'Multistage With Multiply and rotation',
    render: function (): React.Node {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 50, 0],
                      }),
                    },
                    {
                      rotate: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['0deg', '90deg', '0deg'],
                      }),
                    },
                  ],
                  opacity: Animated.multiply(
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.25, 1],
                    }),
                  ),
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Multistage With Multiply',
    render: function (): React.Node {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 50, 0],
                      }),
                    },
                  ],
                  opacity: Animated.multiply(
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.25, 1],
                    }),
                  ),
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Multistage With Subtract',
    render: function (): React.Node {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 50, 0],
                      }),
                    },
                  ],
                  opacity: Animated.subtract(
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1],
                    }),
                    anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.5, 0],
                    }),
                  ),
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Scale interpolation with clamping',
    render: function (): React.Node {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 0.5],
                        outputRange: [1, 1.4],
                        extrapolateRight: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Opacity with delay',
    render: function (): React.Node {
      return (
        <Tester type="timing" config={{duration: 1000, delay: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  opacity: anim,
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Rotate interpolation',
    render: function (): React.Node {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      rotate: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '90deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'translateX => Animated.spring (bounciness/speed)',
    render: function (): React.Node {
      return (
        <Tester type="spring" config={{bounciness: 0}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 100],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'translateX => Animated.spring (stiffness/damping/mass)',
    render: function (): React.Node {
      return (
        <Tester type="spring" config={{stiffness: 1000, damping: 500, mass: 3}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 100],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'translateX => Animated.decay',
    render: function (): React.Node {
      return (
        <Tester
          type="decay"
          config={{velocity: 0.5}}
          reverseConfig={{velocity: -0.5}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim,
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Animated value listener',
    render: function (): React.Node {
      return <ValueListenerExample />;
    },
  },
  {
    title: 'Animated loop',
    render: function (): React.Node {
      return <LoopExample />;
    },
  },
  {
    title: 'Animated events',
    render: function (): React.Node {
      return <EventExample />;
    },
  },
  {
    title: 'Animated Tracking - tap me many times',
    render: function (): React.Node {
      return <TrackingExample />;
    },
  },
  {
    title: 'Internal Settings',
    render: function (): React.Node {
      return <InternalSettings />;
    },
  },
] as Array<RNTesterModuleExample>;
