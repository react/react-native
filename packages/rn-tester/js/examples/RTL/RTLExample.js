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

import RNTexterText from '../../components/RNTesterText';
import * as React from 'react';
import {
  Alert,
  Animated,
  Button,
  I18nManager,
  Image,
  PixelRatio,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type RTLToggleState = {isRTL: boolean, ...};

type AnimationState = {
  toggleStatus: any,
  linear: Object,
  windowWidth: number,
  ...
};

const SCALE = PixelRatio.get();
const IMAGE_DIMENSION = 100 * SCALE;
const IMAGE_SIZE = [IMAGE_DIMENSION, IMAGE_DIMENSION];

const IS_RTL = I18nManager.isRTL;

function ListItem(props: {imageSource: number}) {
  return (
    <View style={styles.row}>
      <View style={styles.column1}>
        <Image source={props.imageSource} style={styles.icon} />
      </View>
      <View style={styles.column2}>
        <View style={styles.textBox}>
          <RNTexterText>Text Text Text</RNTexterText>
        </View>
      </View>
      <View style={styles.column3}>
        <View style={styles.smallButton}>
          <Text style={styles.fontSizeSmall}>Button</Text>
        </View>
      </View>
    </View>
  );
}

const TextAlignmentExample = withRTLState(({isRTL, setRTL, ...props}) => {
  return (
    <View>
      <RTLToggler setRTL={setRTL} isRTL={isRTL} />
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <View style={directionStyle(isRTL)}>
        <RNTexterText style={props.style}>
          Left-to-Right language without text alignment.
        </RNTexterText>
        <RNTexterText style={props.style}>
          {'\u0645\u0646 \u0627\u0644\u064A\u0645\u064A\u0646 ' +
            '\u0625\u0644\u0649 \u0627\u0644\u064A\u0633\u0627\u0631 ' +
            '\u0627\u0644\u0644\u063A\u0629 \u062F\u0648\u0646 ' +
            '\u0645\u062D\u0627\u0630\u0627\u0629 \u0627\u0644\u0646\u0635'}
        </RNTexterText>
        <RNTexterText style={props.style}>
          {'\u05DE\u05D9\u05DE\u05D9\u05DF \u05DC\u05E9\u05DE\u05D0\u05DC ' +
            '\u05D4\u05E9\u05E4\u05D4 \u05D1\u05DC\u05D9 ' +
            '\u05D9\u05D9\u05E9\u05D5\u05E8 \u05D8\u05E7\u05E1\u05D8'}
        </RNTexterText>
      </View>
    </View>
  );
});

const TextInputExample = withRTLState(({isRTL, setRTL, ...props}) => {
  return (
    <View>
      <RTLToggler setRTL={setRTL} isRTL={isRTL} />
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <View style={directionStyle(isRTL)}>
        <RNTexterText style={props.style}>LRT or RTL TextInput.</RNTexterText>
        <TextInput style={props.style} />
      </View>
    </View>
  );
});

const IconsExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <View>
      <RTLToggler setRTL={setRTL} isRTL={isRTL} />
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <View style={[styles.flexDirectionRow, directionStyle(isRTL)]}>
        <View>
          <Image
            source={require('../../assets/like.png')}
            style={styles.image}
          />
          <RNTexterText style={styles.fontSizeExtraSmall}>
            Without directional meaning
          </RNTexterText>
        </View>
        <View style={styles.rightAlignStyle}>
          <Image
            source={require('../../assets/poke.png')}
            style={[styles.image, styles.withRTLStyle]}
          />
          <RNTexterText style={styles.fontSizeExtraSmall}>
            With directional meaning
          </RNTexterText>
        </View>
      </View>
    </View>
  );
});

function AnimationBlock(props: {
  imgStyle: {transform: Array<{scaleX: number} | {translateX: any}>},
  onPress: (e: any) => void,
}) {
  return (
    <View style={styles.block}>
      <TouchableWithoutFeedback onPress={props.onPress}>
        <Animated.Image
          style={[styles.img, props.imgStyle]}
          source={require('../../assets/poke.png')}
        />
      </TouchableWithoutFeedback>
    </View>
  );
}

type RTLSwitcherComponentState = {
  isRTL: boolean,
};

function withRTLState(
  Component: ({
    isRTL: boolean,
    setRTL: (isRTL: boolean) => void,
    style?: any,
  }) => React.Node,
) {
  return class extends React.Component<
    {style?: any},
    RTLSwitcherComponentState,
  > {
    /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
     * Flow's LTI update could not be added via codemod */
    constructor(...args) {
      super(...args);
      this.state = {
        isRTL: IS_RTL,
      };
    }

    // $FlowFixMe[missing-local-annot]
    render() {
      const setRTL = (isRTL: boolean) => this.setState({isRTL: isRTL});
      return (
        <Component isRTL={this.state.isRTL} setRTL={setRTL} {...this.props} />
      );
    }
  };
}

const RTLToggler = ({
  isRTL,
  setRTL,
}:
  | {isRTL: any, setRTL: any}
  | {isRTL: boolean, setRTL: (isRTL: boolean) => void}) => {
  if (Platform.OS === 'android') {
    return <Text style={styles.rtlToggler}>{isRTL ? 'RTL' : 'LTR'}</Text>;
  }

  const toggleRTL = () => setRTL(!isRTL);
  return (
    <Button
      onPress={toggleRTL}
      title={isRTL ? 'RTL' : 'LTR'}
      color="gray"
      accessibilityLabel="Change layout direction"
    />
  );
};

class RTLToggleExample extends React.Component<any, RTLToggleState> {
  constructor(props: Object) {
    super(props);

    this.state = {
      isRTL: IS_RTL,
    };
  }

  render(): React.Node {
    return (
      <View>
        <View style={styles.directionBox}>
          <Text style={styles.directionText}>
            {this.state.isRTL ? 'Right-to-Left' : 'Left-to-Right'}
          </Text>
        </View>
        <View style={styles.flexDirectionRow}>
          <RNTexterText style={styles.switchRowTextView}>forceRTL</RNTexterText>
          <View style={styles.switchRowSwitchView}>
            <Switch
              onValueChange={this._onDirectionChange}
              style={styles.rightAlignStyle}
              value={this.state.isRTL}
            />
          </View>
        </View>
      </View>
    );
  }

  _onDirectionChange = () => {
    I18nManager.forceRTL(!this.state.isRTL);
    this.setState({isRTL: !this.state.isRTL});
    Alert.alert(
      'Reload this page',
      'Please reload this page to change the UI direction! ' +
        'All examples in this app will be affected. ' +
        'Check them out to see what they look like in RTL layout.',
    );
  };
}

const SimpleListItemExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <View>
      <RTLToggler setRTL={setRTL} isRTL={isRTL} />
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <View style={[styles.list, directionStyle(isRTL)]}>
        <ListItem imageSource={require('../../assets/like.png')} />
        <ListItem imageSource={require('../../assets/poke.png')} />
      </View>
    </View>
  );
});

const AnimationContainer = withRTLState(({isRTL, setRTL}) => {
  return <AnimationExample isRTL={isRTL} setRTL={setRTL} />;
});

class AnimationExample extends React.Component<any, AnimationState> {
  constructor(props: Object) {
    super(props);

    this.state = {
      toggleStatus: {},
      linear: new Animated.Value(0),
      windowWidth: 0,
    };
  }

  render(): React.Node {
    return (
      <View>
        <RTLToggler setRTL={this.props.setRTL} isRTL={this.props.isRTL} />
        <View style={styles.view} onLayout={this._onLayout}>
          <AnimationBlock
            onPress={this._linearTap}
            imgStyle={{
              transform: [
                {translateX: this.state.linear},
                {scaleX: this.props.isRTL ? -1 : 1},
              ],
            }}
          />
        </View>
      </View>
    );
  }

  _onLayout = (e: Object) => {
    this.setState({
      windowWidth: e.nativeEvent.layout.width,
    });
  };

  _linearTap = (e: Object) => {
    this.setState({
      toggleStatus: {
        ...this.state.toggleStatus,
        [e]: !this.state.toggleStatus[e],
      },
    });
    const offset = IMAGE_SIZE[0] / SCALE / 2 + 10;
    const toMaxDistance =
      (this.props.isRTL ? -1 : 1) * (this.state.windowWidth / 2 - offset);
    Animated.timing(this.state.linear, {
      toValue: this.state.toggleStatus[e] ? toMaxDistance : 0,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  };
}

const PaddingExample = withRTLState(({isRTL, setRTL}) => {
  const color = 'teal';

  return (
    <View>
      <RNTexterText style={styles.bold}>Styles</RNTexterText>
      <RNTexterText>paddingStart: 50,</RNTexterText>
      <RNTexterText>paddingEnd: 10</RNTexterText>
      <Text />
      <RNTexterText style={styles.bold}>Demo: </RNTexterText>
      <RNTexterText>The {color} is padding.</RNTexterText>
      <View
        style={{
          backgroundColor: color,
          paddingStart: 50,
          paddingEnd: 10,
          borderWidth: 1,
          borderColor: color,
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            paddingTop: 5,
            paddingBottom: 5,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: 'gray',
          }}>
          <RTLToggler setRTL={setRTL} isRTL={isRTL} />
        </View>
      </View>
    </View>
  );
});

const MarginExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <View>
      <RNTexterText style={styles.bold}>Styles</RNTexterText>
      <RNTexterText>marginStart: 50,</RNTexterText>
      <RNTexterText>marginEnd: 10</RNTexterText>
      <Text />
      <RNTexterText style={styles.bold}>Demo: </RNTexterText>
      <RNTexterText>The green is margin.</RNTexterText>
      <View
        style={{
          backgroundColor: 'green',
          borderWidth: 1,
          borderColor: 'green',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            paddingTop: 5,
            paddingBottom: 5,
            marginStart: 50,
            marginEnd: 10,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: 'gray',
          }}>
          <RTLToggler setRTL={setRTL} isRTL={isRTL} />
        </View>
      </View>
    </View>
  );
});

const PositionExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <View>
      <RNTexterText style={styles.bold}>Styles</RNTexterText>
      <RNTexterText>start: 50</RNTexterText>
      <Text />
      <RNTexterText style={styles.bold}>Demo: </RNTexterText>
      <RNTexterText>The orange is position.</RNTexterText>
      <View
        style={{
          backgroundColor: 'orange',
          borderWidth: 1,
          borderColor: 'orange',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            start: 50,
            borderColor: 'gray',
          }}>
          <RTLToggler setRTL={setRTL} isRTL={isRTL} />
        </View>
      </View>
      <Text />
      <RNTexterText style={styles.bold}>Styles</RNTexterText>
      <RNTexterText>end: 50</RNTexterText>
      <Text />
      <RNTexterText style={styles.bold}>Demo: </RNTexterText>
      <RNTexterText>The orange is position.</RNTexterText>
      <View
        style={{
          backgroundColor: 'orange',
          borderWidth: 1,
          borderColor: 'orange',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            end: 50,
            borderColor: 'gray',
          }}>
          <RTLToggler setRTL={setRTL} isRTL={isRTL} />
        </View>
      </View>
    </View>
  );
});

const BorderWidthExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <View>
      <RNTexterText style={styles.bold}>Styles</RNTexterText>
      <RNTexterText>borderStartWidth: 10,</RNTexterText>
      <RNTexterText>borderEndWidth: 50</RNTexterText>
      <Text />
      <RNTexterText style={styles.bold}>Demo: </RNTexterText>
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <View style={directionStyle(isRTL)}>
        <View
          style={{
            borderStartWidth: 10,
            borderEndWidth: 50,
          }}>
          <View>
            <RTLToggler setRTL={setRTL} isRTL={isRTL} />
          </View>
        </View>
      </View>
    </View>
  );
});

const BorderColorExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <View>
      <RNTexterText style={styles.bold}>Styles</RNTexterText>
      <RNTexterText>borderStartColor: 'red',</RNTexterText>
      <RNTexterText>borderEndColor: 'green',</RNTexterText>
      <Text />
      <RNTexterText style={styles.bold}>Demo: </RNTexterText>
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <View style={directionStyle(isRTL)}>
        <View
          style={{
            borderStartColor: 'red',
            borderEndColor: 'green',
            borderLeftWidth: 20,
            borderRightWidth: 20,
            padding: 10,
          }}>
          <View>
            <RTLToggler setRTL={setRTL} isRTL={isRTL} />
          </View>
        </View>
      </View>
    </View>
  );
});

const BorderRadiiExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <View>
      <RNTexterText style={styles.bold}>Styles</RNTexterText>
      <RNTexterText>borderTopStartRadius: 10,</RNTexterText>
      <RNTexterText>borderTopEndRadius: 20,</RNTexterText>
      <RNTexterText>borderBottomStartRadius: 30,</RNTexterText>
      <RNTexterText>borderBottomEndRadius: 40</RNTexterText>
      <Text />
      <RNTexterText style={styles.bold}>Demo: </RNTexterText>
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <View style={directionStyle(isRTL)}>
        <View
          style={{
            borderWidth: 10,
            borderTopStartRadius: 10,
            borderTopEndRadius: 20,
            borderBottomStartRadius: 30,
            borderBottomEndRadius: 40,
            padding: 10,
          }}>
          <View>
            <RTLToggler setRTL={setRTL} isRTL={isRTL} />
          </View>
        </View>
      </View>
    </View>
  );
});

const LogicalBorderRadiiExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <View>
      <RNTexterText style={styles.bold}>Styles</RNTexterText>
      <RNTexterText>borderStartStartRadius: 10,</RNTexterText>
      <RNTexterText>borderStartEndRadius: 20,</RNTexterText>
      <RNTexterText>borderEndStartRadius: 30,</RNTexterText>
      <RNTexterText>borderEndEndRadius: 40</RNTexterText>
      <Text />
      <RNTexterText style={styles.bold}>Demo: </RNTexterText>
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <View style={directionStyle(isRTL)}>
        <View
          style={{
            borderWidth: 10,
            borderStartStartRadius: 10,
            borderStartEndRadius: 20,
            borderEndStartRadius: 30,
            borderEndEndRadius: 40,
            padding: 10,
          }}>
          <View>
            <RTLToggler setRTL={setRTL} isRTL={isRTL} />
          </View>
        </View>
      </View>
    </View>
  );
});

const BorderExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <View>
      <RNTexterText style={styles.bold}>Styles</RNTexterText>
      <RNTexterText>borderStartColor: 'red',</RNTexterText>
      <RNTexterText>borderEndColor: 'green',</RNTexterText>
      <RNTexterText>borderStartWidth: 10,</RNTexterText>
      <RNTexterText>borderEndWidth: 50,</RNTexterText>
      <RNTexterText>borderTopStartRadius: 10,</RNTexterText>
      <RNTexterText>borderTopEndRadius: 20,</RNTexterText>
      <RNTexterText>borderBottomStartRadius: 30,</RNTexterText>
      <RNTexterText>borderBottomEndRadius: 40</RNTexterText>
      <Text />
      <RNTexterText style={styles.bold}>Demo: </RNTexterText>
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <View style={directionStyle(isRTL)}>
        <View
          style={{
            borderStartColor: 'red',
            borderEndColor: 'green',
            borderStartWidth: 10,
            borderEndWidth: 50,
            borderTopStartRadius: 10,
            borderTopEndRadius: 20,
            borderBottomStartRadius: 30,
            borderBottomEndRadius: 40,
            padding: 10,
          }}>
          <View>
            <RTLToggler setRTL={setRTL} isRTL={isRTL} />
          </View>
        </View>
      </View>
    </View>
  );
});

const directionStyle = (isRTL: boolean) =>
  Platform.OS !== 'android' ? {direction: isRTL ? 'rtl' : 'ltr'} : null;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e9eaed',
    paddingTop: 15,
  },
  directionBox: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderWidth: 0.5,
    borderColor: 'black',
    marginBottom: 15,
  },
  directionText: {
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  switchRowTextView: {
    flex: 1,
    marginBottom: 5,
    marginTop: 5,
    textAlign: 'center',
  },
  switchRowSwitchView: {
    flex: 3,
  },
  rightAlignStyle: {
    right: 10,
    position: 'absolute',
  },
  list: {
    height: 120,
    marginBottom: 5,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  row: {
    height: 60,
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  column1: {
    width: 60,
  },
  column2: {
    flex: 2.5,
    padding: 6,
  },
  column3: {
    flex: 1.5,
  },
  icon: {
    width: 48,
    height: 48,
    margin: 6,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  withRTLStyle: {
    transform: [{scaleX: IS_RTL ? -1 : 1}],
  },
  image: {
    left: 30,
    width: 48,
    height: 48,
  },
  img: {
    width: IMAGE_SIZE[0] / SCALE,
    height: IMAGE_SIZE[1] / SCALE,
  },
  view: {
    flex: 1,
  },
  block: {
    padding: 10,
    alignItems: 'center',
  },
  smallButton: {
    top: 18,
    borderRadius: 5,
    height: 24,
    width: 64,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeSmall: {
    fontSize: 10,
  },
  fontSizeExtraSmall: {
    fontSize: 8,
  },
  textAlignLeft: {
    textAlign: 'left',
  },
  textAlignRight: {
    textAlign: 'right',
  },
  textBox: {
    width: 28,
  },
  flexDirectionRow: {
    flexDirection: 'row',
  },
  bold: {
    fontWeight: 'bold',
  },
  rtlToggler: {
    color: 'gray',
    padding: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});

exports.title = 'RTLExample';
exports.category = 'UI';
exports.description = 'Examples to show how to apply components to RTL layout.';
exports.examples = [
  {
    title: 'Current Layout Direction',
    render: function (): React.MixedElement {
      return <RTLToggleExample />;
    },
  },
  {
    title: 'A Simple List Item Layout',
    render: function (): React.MixedElement {
      return <SimpleListItemExample />;
    },
  },
  {
    title: 'Default Text Alignment',
    description: ('In iOS, it depends on active language. ' +
      'In Android, it depends on the text content.') as string,
    render: function (): React.MixedElement {
      return <TextAlignmentExample style={styles.fontSizeSmall} />;
    },
  },
  {
    title: "Using textAlign: 'left'",
    description: ('In iOS/Android, text alignment flips regardless of ' +
      'languages or text content.') as string,
    render: function (): React.MixedElement {
      return (
        <TextAlignmentExample
          style={[styles.fontSizeSmall, styles.textAlignLeft]}
        />
      );
    },
  },
  {
    title: "Using textAlign: 'right'",
    description: ('In iOS/Android, text alignment flips regardless of ' +
      'languages or text content.') as string,
    render: function (): React.MixedElement {
      return (
        <TextAlignmentExample
          style={[styles.fontSizeSmall, styles.textAlignRight]}
        />
      );
    },
  },
  {
    title: "Using textAlign: 'right' for TextInput",
    description: 'Flip TextInput direction to RTL' as string,
    render: function (): React.MixedElement {
      return <TextInputExample style={[styles.textAlignRight]} />;
    },
  },
  {
    title: 'Working With Icons',
    render: function (): React.MixedElement {
      return <IconsExample />;
    },
  },
  {
    title: 'Controlling Animation',
    description: 'Animation direction according to layout',
    render: function (): React.MixedElement {
      return <AnimationContainer />;
    },
  },
  {
    title: 'Padding Start/End',
    render: function (): React.MixedElement {
      return <PaddingExample />;
    },
  },
  {
    title: 'Margin Start/End',
    render: function (): React.MixedElement {
      return <MarginExample />;
    },
  },
  {
    title: 'Position Start/End',
    render: function (): React.MixedElement {
      return <PositionExample />;
    },
  },
  {
    title: 'Border Width Start/End',
    render: function (): React.MixedElement {
      return <BorderWidthExample />;
    },
  },
  {
    title: 'Border Color Start/End',
    render: function (): React.MixedElement {
      return <BorderColorExample />;
    },
  },
  {
    title: 'Border Radii Start/End',
    render: function (): React.MixedElement {
      return <BorderRadiiExample />;
    },
  },
  {
    title: 'Logical Border Radii Start/End',
    render: function (): React.MixedElement {
      return <LogicalBorderRadiiExample />;
    },
  },
  {
    title: 'Border',
    render: function (): React.MixedElement {
      return <BorderExample />;
    },
  },
] as Array<RNTesterModuleExample>;
