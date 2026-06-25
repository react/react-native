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

import type {RNTesterModule} from '../../types/RNTesterTypes';

import hotdog from '../../assets/hotdog.jpg';
import RNTesterText from '../../components/RNTesterText';
import TextLegend from '../../components/TextLegend';
import TextAdjustsDynamicLayoutExample from './TextAdjustsDynamicLayoutExample';
import TextSharedExamples from './TextSharedExamples';

const TextInlineView = require('../../components/TextInlineView');
const React = require('react');
const {
  Image,
  LayoutAnimation,
  StyleSheet,
  Text,
  TextInput,
  View,
} = require('react-native');

class Entity extends React.Component<{children: React.Node}> {
  render(): React.Node {
    return (
      <Text style={{fontWeight: 'bold', color: '#527fe4'}}>
        {this.props.children}
      </Text>
    );
  }
}
class AttributeToggler extends React.Component<{...}, $FlowFixMe> {
  state: {fontSize: number, fontWeight: 'bold' | 'normal'} = {
    fontWeight: 'bold',
    fontSize: 15,
  };

  toggleWeight = () => {
    this.setState({
      fontWeight: this.state.fontWeight === 'bold' ? 'normal' : 'bold',
    });
  };

  increaseSize = () => {
    this.setState({
      fontSize: this.state.fontSize + 1,
    });
  };

  render(): React.Node {
    const curStyle = {
      fontWeight: this.state.fontWeight,
      fontSize: this.state.fontSize,
    };
    return (
      <View testID="text-with-toggle-attributes">
        <RNTesterText style={curStyle}>
          Tap the controls below to change attributes.
        </RNTesterText>
        <RNTesterText>
          <RNTesterText>
            See how it will even work on{' '}
            <RNTesterText style={curStyle}>
              this nested RNTesterText
            </RNTesterText>
          </RNTesterText>
        </RNTesterText>
        <RNTesterText>
          <RNTesterText onPress={this.toggleWeight} testID="toggle-weight">
            Toggle Weight
          </RNTesterText>
        </RNTesterText>
        <RNTesterText onPress={this.increaseSize} testID="increase-size">
          Increase Size
        </RNTesterText>
      </View>
    );
  }
}

type AdjustingFontSizeProps = Readonly<{}>;

type AdjustingFontSizeState = {
  dynamicText: string,
  shouldRender: boolean,
};

class AdjustingFontSize extends React.Component<
  AdjustingFontSizeProps,
  AdjustingFontSizeState,
> {
  state: AdjustingFontSizeState = {
    dynamicText: '',
    shouldRender: true,
  };

  reset = () => {
    LayoutAnimation.easeInEaseOut();
    this.setState({
      shouldRender: false,
    });
    setTimeout(() => {
      LayoutAnimation.easeInEaseOut();
      this.setState({
        dynamicText: '',
        shouldRender: true,
      });
    }, 300);
  };

  addText = () => {
    this.setState({
      dynamicText:
        this.state.dynamicText +
        (Math.floor((Math.random() * 10) % 2) ? ' foo' : ' bar'),
    });
  };

  removeText = () => {
    this.setState({
      dynamicText: this.state.dynamicText.slice(
        0,
        this.state.dynamicText.length - 4,
      ),
    });
  };

  render(): React.Node {
    if (!this.state.shouldRender) {
      return <View />;
    }
    return (
      <View>
        <RNTesterText
          ellipsizeMode="tail"
          numberOfLines={1}
          style={{fontSize: 36, marginVertical: 6}}>
          Truncated text is baaaaad.
        </RNTesterText>
        <RNTesterText
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          style={{fontSize: 40, marginVertical: 6}}>
          Shrinking to fit available space is much better!
        </RNTesterText>

        <RNTesterText
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{fontSize: 30, marginVertical: 6}}>
          {'Add text to me to watch me shrink!' + ' ' + this.state.dynamicText}
        </RNTesterText>

        <RNTesterText
          adjustsFontSizeToFit={true}
          numberOfLines={4}
          android_hyphenationFrequency="normal"
          style={{fontSize: 20, marginVertical: 6}}>
          {'Multiline text component shrinking is supported, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' +
            ' ' +
            this.state.dynamicText}
        </RNTesterText>

        <RNTesterText
          adjustsFontSizeToFit={true}
          style={{fontSize: 20, marginVertical: 6, maxHeight: 50}}>
          {'Text limited by height, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' +
            ' ' +
            this.state.dynamicText}
        </RNTesterText>

        <RNTesterText
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{marginVertical: 6}}>
          <RNTesterText style={{fontSize: 14}}>
            {'Differently sized nested elements will shrink together. '}
          </RNTesterText>
          <RNTesterText style={{fontSize: 20}}>
            {'LARGE TEXT! ' + this.state.dynamicText}
          </RNTesterText>
        </RNTesterText>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 5,
            marginVertical: 6,
          }}>
          <RNTesterText
            style={{backgroundColor: '#ffaaaa'}}
            onPress={this.reset}>
            Reset
          </RNTesterText>
          <RNTesterText
            style={{backgroundColor: '#aaaaff'}}
            onPress={this.removeText}>
            Remove Text
          </RNTesterText>
          <RNTesterText
            style={{backgroundColor: '#aaffaa'}}
            onPress={this.addText}>
            Add Text
          </RNTesterText>
        </View>
      </View>
    );
  }
}

function TextLinkifyExample(props: {}): React.Node {
  return (
    <>
      <RNTesterText dataDetectorType="phoneNumber">
        Phone number: 123-123-1234
      </RNTesterText>
      <RNTesterText dataDetectorType="link">
        Link: https://www.facebook.com
      </RNTesterText>
      <RNTesterText dataDetectorType="email">
        Email: employee@facebook.com
      </RNTesterText>
      <RNTesterText dataDetectorType="none">
        Phone number: 123-123-1234 Link: https://www.facebook.com Email:
        employee@facebook.com
      </RNTesterText>
      <RNTesterText dataDetectorType="all">
        Phone number: 123-123-1234 Link: https://www.facebook.com Email:
        employee@facebook.com
      </RNTesterText>
    </>
  );
}

function TextTransformExample(props: {}): React.Node {
  return (
    <>
      <RNTesterText style={{textTransform: 'uppercase'}}>
        This text should be uppercased.
      </RNTesterText>
      <RNTesterText style={{textTransform: 'lowercase'}}>
        This TEXT SHOULD be lowercased.
      </RNTesterText>
      <RNTesterText style={{textTransform: 'capitalize'}}>
        This text should be CAPITALIZED.
      </RNTesterText>
      <RNTesterText>
        Capitalize a date:
        <RNTesterText style={{textTransform: 'capitalize'}}>
          the 9th of november, 1998
        </RNTesterText>
      </RNTesterText>
      <RNTesterText>
        Capitalize a 2 digit date:
        <RNTesterText style={{textTransform: 'capitalize'}}>
          the 25th of december
        </RNTesterText>
      </RNTesterText>
      <RNTesterText style={{textTransform: 'capitalize'}}>
        Mixed:{' '}
        <RNTesterText style={{textTransform: 'uppercase'}}>
          uppercase{' '}
        </RNTesterText>
        <RNTesterText style={{textTransform: 'lowercase'}}>
          LoWeRcAsE{' '}
        </RNTesterText>
        <RNTesterText style={{textTransform: 'capitalize'}}>
          capitalize each word
        </RNTesterText>
      </RNTesterText>
      <RNTesterText>
        Should be "ABC":
        <RNTesterText style={{textTransform: 'uppercase'}}>
          a<RNTesterText>b</RNTesterText>c
        </RNTesterText>
      </RNTesterText>
      <RNTesterText>
        Should be "AbC":
        <RNTesterText style={{textTransform: 'uppercase'}}>
          a<RNTesterText style={{textTransform: 'none'}}>b</RNTesterText>c
        </RNTesterText>
      </RNTesterText>
      <RNTesterText style={{textTransform: 'none'}}>
        {
          '.aa\tbb\t\tcc  dd EE \r\nZZ I like to eat apples. \n中文éé 我喜欢吃苹果。awdawd   '
        }
      </RNTesterText>
      <RNTesterText style={{textTransform: 'uppercase'}}>
        {
          '.aa\tbb\t\tcc  dd EE \r\nZZ I like to eat apples. \n中文éé 我喜欢吃苹果。awdawd   '
        }
      </RNTesterText>
      <RNTesterText style={{textTransform: 'lowercase'}}>
        {
          '.aa\tbb\t\tcc  dd EE \r\nZZ I like to eat apples. \n中文éé 我喜欢吃苹果。awdawd   '
        }
      </RNTesterText>
      <RNTesterText style={{textTransform: 'capitalize'}}>
        {
          '.aa\tbb\t\tcc  dd EE \r\nZZ I like to eat apples. \n中文éé 我喜欢吃苹果。awdawd   '
        }
      </RNTesterText>
      <RNTesterText
        style={{
          textTransform: 'uppercase',
          fontSize: 16,
          color: 'turquoise',
          backgroundColor: 'blue',
          lineHeight: 32,
          letterSpacing: 2,
          alignSelf: 'flex-start',
        }}>
        Works with other text styles
      </RNTesterText>
    </>
  );
}

function IncludeFontPaddingExample(props: {}): React.Node {
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: 10,
        }}>
        <View style={{alignItems: 'center'}}>
          <RNTesterText style={styles.includeFontPaddingText}>Ey</RNTesterText>
          <RNTesterText>Default</RNTesterText>
        </View>
        <View style={{alignItems: 'center'}}>
          <RNTesterText
            style={[
              styles.includeFontPaddingText,
              {includeFontPadding: false, marginLeft: 10},
            ]}>
            Ey
          </RNTesterText>
          <RNTesterText>includeFontPadding: false</RNTesterText>
        </View>
      </View>
      <RNTesterText>
        By default Android will put extra space above text to allow for
        upper-case accents or other ascenders. With some fonts, this can make
        text look slightly misaligned when centered vertically.
      </RNTesterText>
    </>
  );
}

function FontVariantsExample(props: {}): React.Node {
  return (
    <View testID="text-font-variants">
      <RNTesterText style={{fontVariant: ['small-caps']}}>
        Small Caps{'\n'}
      </RNTesterText>
      <RNTesterText
        style={{
          fontFamily: 'Roboto',
          fontVariant: ['oldstyle-nums'],
        }}>
        Old Style nums 0123456789{'\n'}
      </RNTesterText>
      <RNTesterText
        style={{
          fontFamily: 'Roboto',
          fontVariant: ['lining-nums'],
        }}>
        Lining nums 0123456789{'\n'}
      </RNTesterText>
      <RNTesterText style={{fontVariant: ['tabular-nums']}}>
        Tabular nums{'\n'}
        1111{'\n'}
        2222{'\n'}
      </RNTesterText>
      <RNTesterText style={{fontVariant: ['proportional-nums']}}>
        Proportional nums{'\n'}
        1111{'\n'}
        2222{'\n'}
      </RNTesterText>
      <RNTesterText style={{fontFamily: 'FiraCode'}}>
        Non-Stylistic & and $
      </RNTesterText>
      <RNTesterText
        style={{
          fontFamily: 'FiraCode',
          fontVariant: ['stylistic-three', 'stylistic-four'],
        }}>
        Stylistic & and $
      </RNTesterText>
    </View>
  );
}

function EllipsizeModeExample(props: {}): React.Node {
  return (
    <View testID="text-ellipsize-mode">
      <RNTesterText numberOfLines={1} style={styles.wrappedText}>
        This very long text should be truncated with dots in the end.
      </RNTesterText>
      <RNTesterText
        ellipsizeMode="middle"
        numberOfLines={1}
        style={styles.wrappedText}>
        RNTesterText very long text should be truncated with dots in the middle.
      </RNTesterText>
      <RNTesterText
        ellipsizeMode="head"
        numberOfLines={1}
        style={styles.wrappedText}>
        This very long text should be truncated with dots in the beginning.
      </RNTesterText>
      <RNTesterText
        ellipsizeMode="clip"
        numberOfLines={1}
        style={styles.wrappedText}>
        This very long text should be clipped and this will not be visible.
      </RNTesterText>
    </View>
  );
}

function FontFamilyExample(props: {}): React.Node {
  return (
    <View testID="text-font-family">
      <RNTesterText style={{fontFamily: 'sans-serif'}}>Sans-Serif</RNTesterText>
      <RNTesterText style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}>
        Sans-Serif Bold
      </RNTesterText>
      <RNTesterText style={{fontFamily: 'serif'}}>Serif</RNTesterText>
      <RNTesterText style={{fontFamily: 'serif', fontWeight: 'bold'}}>
        Serif Bold
      </RNTesterText>
      <RNTesterText style={{fontFamily: 'monospace'}}>Monospace</RNTesterText>
      <RNTesterText style={{fontFamily: 'monospace', fontWeight: 'bold'}}>
        Monospace Bold (After 5.0)
      </RNTesterText>
      <RNTesterText style={{fontFamily: 'Unknown Font Family'}}>
        Unknown Font Family
      </RNTesterText>
    </View>
  );
}

function TextShadowExample(props: {}): React.Node {
  return (
    <View testID="text-text-shadow">
      <RNTesterText
        style={{
          fontSize: 20,
          textShadowOffset: {width: 2, height: 2},
          textShadowRadius: 1,
          textShadowColor: '#00cccc',
        }}>
        Demo text shadow
      </RNTesterText>
    </View>
  );
}

function AllowFontScalingExample(props: {}): React.Node {
  return (
    <>
      <RNTesterText>
        By default, text will respect Text Size accessibility setting on
        Android. It means that all font sizes will be increased or decreased
        depending on the value of the Text Size setting in the OS's Settings
        app.
      </RNTesterText>
      <RNTesterText style={{marginTop: 10}}>
        You can disable scaling for your Text component by passing {'"'}
        allowFontScaling={'{'}false{'}"'} prop.
      </RNTesterText>
      <RNTesterText
        allowFontScaling={false}
        style={{marginTop: 20, fontSize: 15}}>
        This text will not scale.{' '}
        <RNTesterText style={{fontSize: 15}}>
          This text also won't scale because it inherits "allowFontScaling" from
          its parent.
        </RNTesterText>
      </RNTesterText>
    </>
  );
}

function MaxFontSizeMultiplierExample(props: {}): React.Node {
  return (
    <View testID={'max-font-size-multiplier'}>
      <Text>
        When allowFontScaling is enabled, you can use the maxFontSizeMultiplier
        prop to set an upper limit on how much the font size will be scaled.
      </Text>
      <Text
        allowFontScaling={true}
        maxFontSizeMultiplier={1}
        style={{marginTop: 10}}>
        This text will not scale up (max 1x)
      </Text>
      <Text allowFontScaling={true} maxFontSizeMultiplier={1.5}>
        This text will scale up (max 1.5x)
      </Text>
      <Text allowFontScaling={true} maxFontSizeMultiplier={1}>
        <Text>Inherit max (max 1x)</Text>
      </Text>
      <Text allowFontScaling={true} maxFontSizeMultiplier={1}>
        <Text maxFontSizeMultiplier={1.5}>
          Override inherited max (max 1.5x)
        </Text>
      </Text>
      <Text allowFontScaling={true} maxFontSizeMultiplier={1}>
        <Text maxFontSizeMultiplier={0}>Ignore inherited max (no max)</Text>
      </Text>
    </View>
  );
}

function NumberOfLinesExample(props: {}): React.Node {
  return (
    <View testID="number-of-lines">
      <RNTesterText numberOfLines={1} style={styles.wrappedText}>
        Maximum of one line no matter now much I write here. If I keep writing
        it{"'"}ll just truncate after one line
      </RNTesterText>
      <RNTesterText
        style={[{fontSize: 31}, styles.wrappedText]}
        numberOfLines={1}>
        Maximum of one line no matter now much I write here. If I keep writing
        it{"'"}ll just truncate after one line
      </RNTesterText>
      <RNTesterText
        numberOfLines={2}
        style={[{marginTop: 20}, styles.wrappedText]}>
        RNTesterText of two lines no matter now much I write here. If I keep
        writing it{"'"}ll just truncate after two lines
      </RNTesterText>
      <RNTesterText numberOfLines={1} style={{marginTop: 20}}>
        The hotdog should be truncated. The hotdog should be truncated. The
        hotdog should be truncated. The hotdog should be truncated. The hotdog
        should be truncated. The hotdog should be truncated. The hotdog should
        be truncated. The hotdog should be truncated. The hotdog should be
        truncated. The hotdog should be truncated.
        <Image source={hotdog} style={{height: 12}} />
      </RNTesterText>
      <RNTesterText style={[{marginTop: 20}, styles.wrappedText]}>
        No maximum lines specified no matter now much I write here. If I keep
        writing it{"'"}ll just keep going and going
      </RNTesterText>
    </View>
  );
}

function HyphenationExample(props: {}): React.Node {
  return (
    <>
      <RNTesterText
        android_hyphenationFrequency="normal"
        style={styles.wrappedText}>
        <RNTesterText style={{color: 'red'}}>Normal: </RNTesterText>
        WillHaveAHyphenWhenBreakingForNewLine
      </RNTesterText>
      <RNTesterText
        android_hyphenationFrequency="none"
        style={styles.wrappedText}>
        <RNTesterText style={{color: 'red'}}>None: </RNTesterText>
        WillNotHaveAHyphenWhenBreakingForNewLine
      </RNTesterText>
      <RNTesterText
        android_hyphenationFrequency="full"
        style={styles.wrappedText}>
        <RNTesterText style={{color: 'red'}}>Full: </RNTesterText>
        WillHaveAHyphenWhenBreakingForNewLine
      </RNTesterText>
    </>
  );
}

function FontWeightExample(props: {}): React.Node {
  return (
    <View testID="text-font-weight">
      <RNTesterText style={{fontWeight: 'bold'}}>
        Move fast and be bold
      </RNTesterText>
      <RNTesterText style={{fontWeight: 'normal'}}>
        Move fast and be normal
      </RNTesterText>
      <RNTesterText style={{fontWeight: '900'}}>FONT WEIGHT 900</RNTesterText>
      <RNTesterText style={{fontWeight: '800'}}>FONT WEIGHT 800</RNTesterText>
      <RNTesterText style={{fontWeight: '700'}}>FONT WEIGHT 700</RNTesterText>
      <RNTesterText style={{fontWeight: '600'}}>FONT WEIGHT 600</RNTesterText>
      <RNTesterText style={{fontWeight: '500'}}>FONT WEIGHT 500</RNTesterText>
      <RNTesterText style={{fontWeight: '400'}}>FONT WEIGHT 400</RNTesterText>
      <RNTesterText style={{fontWeight: '300'}}>FONT WEIGHT 300</RNTesterText>
      <RNTesterText style={{fontWeight: '200'}}>FONT WEIGHT 200</RNTesterText>
      <RNTesterText style={{fontWeight: '100'}}>FONT WEIGHT 100</RNTesterText>
      <RNTesterText style={{fontWeight: 900}}>FONT WEIGHT 900</RNTesterText>
      <RNTesterText style={{fontWeight: 800}}>FONT WEIGHT 800</RNTesterText>
      <RNTesterText style={{fontWeight: 700}}>FONT WEIGHT 700</RNTesterText>
      <RNTesterText style={{fontWeight: 600}}>FONT WEIGHT 600</RNTesterText>
      <RNTesterText style={{fontWeight: 500}}>FONT WEIGHT 500</RNTesterText>
      <RNTesterText style={{fontWeight: 400}}>FONT WEIGHT 400</RNTesterText>
      <RNTesterText style={{fontWeight: 300}}>FONT WEIGHT 300</RNTesterText>
      <RNTesterText style={{fontWeight: 200}}>FONT WEIGHT 200</RNTesterText>
      <RNTesterText style={{fontWeight: 100}}>FONT WEIGHT 100</RNTesterText>
    </View>
  );
}

function BackgroundColorExample(props: {}): React.Node {
  return (
    <View testID="text-bg-color-attr">
      <RNTesterText style={{backgroundColor: '#ffaaaa'}}>
        Red background,
        <RNTesterText style={{backgroundColor: '#aaaaff'}}>
          {' '}
          blue background,
          <RNTesterText>
            {' '}
            inherited blue background,
            <RNTesterText style={{backgroundColor: '#aaffaa'}}>
              {' '}
              nested green background.
            </RNTesterText>
          </RNTesterText>
        </RNTesterText>
      </RNTesterText>
      <RNTesterText style={{backgroundColor: 'rgba(100, 100, 100, 0.3)'}}>
        Same alpha as background,
        <RNTesterText>
          Inherited alpha from background,
          <RNTesterText style={{backgroundColor: 'rgba(100, 100, 100, 0.3)'}}>
            Reapply alpha
          </RNTesterText>
        </RNTesterText>
      </RNTesterText>
    </View>
  );
}

function ContainerBackgroundColorExample(props: {}): React.Node {
  return (
    <>
      <View style={{flexDirection: 'row', height: 85}}>
        <View style={{backgroundColor: '#ffaaaa', width: 150}} />
        <View style={{backgroundColor: '#aaaaff', width: 150}} />
      </View>
      <RNTesterText style={[styles.backgroundColorText, {top: -80}]}>
        Default containerBackgroundColor (inherited) + backgroundColor wash
      </RNTesterText>
      <RNTesterText
        style={[
          styles.backgroundColorText,
          {top: -70, backgroundColor: 'transparent'},
        ]}>
        {"containerBackgroundColor: 'transparent' + backgroundColor wash"}
      </RNTesterText>
    </>
  );
}

function TextDecorationExample(props: {}): React.Node {
  return (
    <View testID="text-text-decoration">
      <RNTesterText
        style={{textDecorationLine: 'underline', textDecorationStyle: 'solid'}}>
        Solid underline
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'underline',
          textDecorationStyle: 'double',
          textDecorationColor: 'red',
        }}>
        Double underline (red)
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'underline',
          textDecorationStyle: 'dashed',
          textDecorationColor: '#9CDC60',
        }}>
        Dashed underline (green)
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'underline',
          textDecorationStyle: 'dotted',
          textDecorationColor: 'blue',
        }}>
        Dotted underline (blue)
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'underline',
          textDecorationStyle: 'wavy',
          textDecorationColor: 'red',
        }}>
        Wavy underline (red)
      </RNTesterText>
      <RNTesterText style={{textDecorationLine: 'none'}}>
        None textDecoration
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'line-through',
          textDecorationStyle: 'solid',
        }}>
        Solid line-through
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'line-through',
          textDecorationStyle: 'double',
          textDecorationColor: 'red',
        }}>
        Double line-through (red)
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'line-through',
          textDecorationStyle: 'dashed',
          textDecorationColor: '#9CDC60',
        }}>
        Dashed line-through (green)
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'line-through',
          textDecorationStyle: 'dotted',
          textDecorationColor: 'blue',
        }}>
        Dotted line-through (blue)
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'line-through',
          textDecorationStyle: 'wavy',
          textDecorationColor: 'red',
        }}>
        Wavy line-through (red)
      </RNTesterText>
      <RNTesterText
        style={{
          textDecorationLine: 'underline line-through',
          textDecorationStyle: 'wavy',
        }}>
        Both underline and line-through (wavy)
      </RNTesterText>
      <RNTesterText>
        Mixed text with{' '}
        <RNTesterText style={{textDecorationLine: 'underline'}}>
          underline
        </RNTesterText>{' '}
        and{' '}
        <RNTesterText style={{textDecorationLine: 'line-through'}}>
          line-through
        </RNTesterText>{' '}
        text nodes
      </RNTesterText>
      <RNTesterText>
        Unstyled text{' '}
        <RNTesterText
          style={{
            textDecorationLine: 'line-through',
            textDecorationStyle: 'wavy',
            textDecorationColor: 'red',
          }}>
          with wavy strike-through that wraps across multiple lines to verify
          continuity
        </RNTesterText>{' '}
        normal text
      </RNTesterText>
    </View>
  );
}

function NestedExample(props: {}): React.Node {
  return (
    <View testID="text-test-nested">
      <RNTesterText onPress={() => console.log('1st')}>
        (Normal text,
        <Text style={{color: 'red', fontWeight: 'bold'}}>
          (R)red
          <Text style={{color: 'green', fontWeight: 'normal'}}>
            (G)green
            <Text style={{color: 'blue', fontWeight: 'bold'}}>
              (B)blue
              <Text style={{color: 'cyan', fontWeight: 'normal'}}>
                (C)cyan
                <Text style={{color: 'magenta', fontWeight: 'bold'}}>
                  (M)magenta
                  <Text style={{color: 'yellow', fontWeight: 'normal'}}>
                    (Y)yellow
                    <Text style={{color: 'black', fontWeight: 'bold'}}>
                      (K)black
                    </Text>
                  </Text>
                </Text>
              </Text>
            </Text>
          </Text>
        </Text>
        <Text style={{fontWeight: 'bold'}} onPress={() => console.log('2nd')}>
          (and bold
          <Text
            style={{fontStyle: 'italic', fontSize: 11, color: '#527fe4'}}
            onPress={() => console.log('3rd')}>
            (and tiny bold italic blue
            <Text
              style={{fontWeight: 'normal', fontStyle: 'normal'}}
              onPress={() => console.log('4th')}>
              (and tiny normal blue)
            </Text>
            )
          </Text>
          )
        </Text>
        )
      </RNTesterText>
      <RNTesterText
        style={{fontFamily: 'serif'}}
        onPress={() => console.log('1st')}>
        (Serif
        <RNTesterText
          style={{fontStyle: 'italic', fontWeight: 'bold'}}
          onPress={() => console.log('2nd')}>
          (Serif Bold Italic
          <RNTesterText
            style={{
              fontFamily: 'monospace',
              fontStyle: 'normal',
              fontWeight: 'normal',
            }}
            onPress={() => console.log('3rd')}>
            (Monospace Normal
            <RNTesterText
              style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}
              onPress={() => console.log('4th')}>
              (Sans-Serif Bold
              <RNTesterText
                style={{fontWeight: 'normal'}}
                onPress={() => console.log('5th')}>
                (and Sans-Serif Normal)
              </RNTesterText>
              )
            </RNTesterText>
            )
          </RNTesterText>
          )
        </RNTesterText>
        )
      </RNTesterText>
      <RNTesterText style={{fontSize: 12}}>
        <Entity>Entity Name</Entity>
      </RNTesterText>
      <RNTesterText style={{fontSize: 8}}>
        Nested text with size 8,{' '}
        <RNTesterText style={{fontSize: 23}}>size 23, </RNTesterText>
        and size 8 again
      </RNTesterText>
      <Text style={{color: 'red'}}>
        Nested text with red color,{' '}
        <Text style={{color: 'blue'}}>blue color, </Text>
        and red color again
      </Text>
      <RNTesterText style={{opacity: 0.7}}>
        (opacity
        <RNTesterText>
          (is inherited
          <RNTesterText style={{opacity: 0.7}}>
            (and accumulated
            <RNTesterText style={{opacity: 0.5, backgroundColor: '#ffaaaa'}}>
              (and also applies to the background)
            </RNTesterText>
            )
          </RNTesterText>
          )
        </RNTesterText>
        )
      </RNTesterText>
    </View>
  );
}

function TextAlignExample(props: {}): React.Node {
  return (
    <View testID="text-align-example">
      <RNTesterText>auto (default) - english LTR</RNTesterText>
      <RNTesterText>أحب اللغة العربية auto (default) - arabic RTL</RNTesterText>
      <RNTesterText style={{textAlign: 'left'}}>
        left left left left left left left left left left left left left left
        left
      </RNTesterText>
      <RNTesterText style={{textAlign: 'center'}}>
        center center center center center center center center center center
        center
      </RNTesterText>
      <RNTesterText style={{textAlign: 'right'}}>
        right right right right right right right right right right right right
        right
      </RNTesterText>
      <RNTesterText style={{textAlign: 'justify'}}>
        justify (works when api level >= 26 otherwise fallbacks to "left"): this
        text component{"'"}s contents are laid out with "textAlign: justify" and
        as you can see all of the lines except the last one span the available
        width of the parent container.
      </RNTesterText>
    </View>
  );
}

function UnicodeExample(props: {}): React.Node {
  return (
    <>
      <View>
        <View style={{flexDirection: 'row'}}>
          <RNTesterText style={{backgroundColor: 'red'}}>
            星际争霸是世界上最好的游戏。
          </RNTesterText>
        </View>
        <View>
          <RNTesterText style={{backgroundColor: 'red'}}>
            星际争霸是世界上最好的游戏。
          </RNTesterText>
        </View>
        <View style={{alignItems: 'center'}}>
          <RNTesterText style={{backgroundColor: 'red'}}>
            星际争霸是世界上最好的游戏。
          </RNTesterText>
        </View>
        <View>
          <RNTesterText style={{backgroundColor: 'red'}}>
            星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。
          </RNTesterText>
        </View>
      </View>
    </>
  );
}

function AndroidMaterialDesignFonts(props: {}): React.Node {
  return (
    <>
      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        <View style={{flex: 1}}>
          <RNTesterText style={{fontFamily: 'sans-serif'}}>
            Roboto Regular
          </RNTesterText>
          <RNTesterText style={{fontFamily: 'sans-serif', fontStyle: 'italic'}}>
            Roboto Italic
          </RNTesterText>
          <RNTesterText style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}>
            Roboto Bold
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'sans-serif',
              fontStyle: 'italic',
              fontWeight: 'bold',
            }}>
            Roboto Bold Italic
          </RNTesterText>
          <RNTesterText style={{fontFamily: 'sans-serif-light'}}>
            Roboto Light
          </RNTesterText>
          <RNTesterText
            style={{fontFamily: 'sans-serif-light', fontStyle: 'italic'}}>
            Roboto Light Italic
          </RNTesterText>
          <RNTesterText style={{fontFamily: 'sans-serif-thin'}}>
            Roboto Thin (After 4.2)
          </RNTesterText>
          <RNTesterText
            style={{fontFamily: 'sans-serif-thin', fontStyle: 'italic'}}>
            Roboto Thin Italic (After 4.2)
          </RNTesterText>
          <RNTesterText style={{fontFamily: 'sans-serif-condensed'}}>
            Roboto Condensed
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'sans-serif-condensed',
              fontStyle: 'italic',
            }}>
            Roboto Condensed Italic
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'sans-serif-condensed',
              fontWeight: 'bold',
            }}>
            Roboto Condensed Bold
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'sans-serif-condensed',
              fontStyle: 'italic',
              fontWeight: 'bold',
            }}>
            Roboto Condensed Bold Italic
          </RNTesterText>
          <RNTesterText style={{fontFamily: 'sans-serif-medium'}}>
            Roboto Medium (After 5.0)
          </RNTesterText>
          <RNTesterText
            style={{fontFamily: 'sans-serif-medium', fontStyle: 'italic'}}>
            Roboto Medium Italic (After 5.0)
          </RNTesterText>
        </View>
      </View>
    </>
  );
}

function CustomFontsExample(props: {}): React.Node {
  return (
    <>
      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        <View style={{flex: 1}}>
          <RNTesterText style={{fontFamily: 'notoserif'}}>
            NotoSerif Regular
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'notoserif',
              fontStyle: 'italic',
              fontWeight: 'bold',
            }}>
            NotoSerif Bold Italic
          </RNTesterText>
          <RNTesterText style={{fontFamily: 'notoserif', fontStyle: 'italic'}}>
            NotoSerif Italic (Missing Font file)
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'Rubik',
              fontWeight: 'normal',
            }}>
            Rubik Regular
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'Rubik',
              fontWeight: '300',
            }}>
            Rubik Light
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'Rubik',
              fontWeight: '700',
            }}>
            Rubik Bold
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'Rubik',
              fontWeight: '500',
            }}>
            Rubik Medium
          </RNTesterText>
          <RNTesterText
            style={{
              fontFamily: 'Rubik',
              fontStyle: 'italic',
              fontWeight: '500',
            }}>
            Rubik Medium Italic
          </RNTesterText>
        </View>
      </View>
    </>
  );
}

function LineHeightExample(props: {}): React.Node {
  return (
    <>
      <RNTesterText
        style={[
          {
            fontSize: 16,
            lineHeight: 35,
            borderColor: 'black',
            borderWidth: 1,
            marginBottom: 5,
          },
          styles.wrappedText,
        ]}
        testID="line-height-greater-than-font-size">
        Holisticly formulate inexpensive ideas before best-of-breed benefits.{' '}
        <RNTesterText style={{fontSize: 20}}>Continually</RNTesterText> expedite
        magnetic potentialities rather than client-focused interfaces.
      </RNTesterText>
      <RNTesterText
        style={[
          {
            fontSize: 16,
            lineHeight: 8,
            borderColor: 'black',
            borderWidth: 1,
            marginBottom: 5,
          },
          styles.wrappedText,
        ]}
        testID="line-height-less-than-font-size">
        Holisticly formulate inexpensive ideas before best-of-breed benefits.{' '}
        <RNTesterText style={{fontSize: 20}}>Continually</RNTesterText> expedite
        magnetic potentialities rather than client-focused interfaces.
      </RNTesterText>
      <RNTesterText
        style={[
          {
            fontSize: 24,
            lineHeight: 24,
            borderColor: 'black',
            borderWidth: 1,
          },
          styles.wrappedText,
        ]}
        testID="line-height-matches-font-size-descenders">
        gjpqy
      </RNTesterText>
      <RNTesterText
        style={[
          {
            fontSize: 24,
            lineHeight: 8,
            borderColor: 'black',
            borderWidth: 1,
          },
          styles.wrappedText,
        ]}
        testID="line-height-single-line-less-than-font-size">
        Holisticly formulate
      </RNTesterText>
      <RNTesterText
        style={[
          {
            fontSize: 16,
            lineHeight: 20,
            borderColor: 'black',
            borderWidth: 1,
          },
          styles.wrappedText,
        ]}
        testID="line-height-single-line-greater-than-font-size">
        Holisticly formulate
      </RNTesterText>
    </>
  );
}

function LetterSpacingExample(props: {}): React.Node {
  return (
    <>
      <View testID="text-letter-spacing">
        <RNTesterText style={{letterSpacing: 0}}>
          letterSpacing = 0
        </RNTesterText>
        <RNTesterText style={{letterSpacing: 2, marginTop: 5}}>
          letterSpacing = 2
        </RNTesterText>
        <RNTesterText style={{letterSpacing: 9, marginTop: 5}}>
          letterSpacing = 9
        </RNTesterText>
        <View style={{flexDirection: 'row'}}>
          <RNTesterText
            style={{
              fontSize: 12,
              letterSpacing: 2,
              backgroundColor: 'fuchsia',
              marginTop: 5,
            }}>
            With size and background color
          </RNTesterText>
        </View>
        <RNTesterText style={{letterSpacing: -1, marginTop: 5}}>
          letterSpacing = -1
        </RNTesterText>
        <RNTesterText
          style={{
            letterSpacing: 3,
            backgroundColor: '#dddddd',
            marginTop: 5,
          }}>
          [letterSpacing = 3]
          <RNTesterText style={{letterSpacing: 0, backgroundColor: '#bbbbbb'}}>
            [Nested letterSpacing = 0]
          </RNTesterText>
          <RNTesterText style={{letterSpacing: 6, backgroundColor: '#eeeeee'}}>
            [Nested letterSpacing = 6]
          </RNTesterText>
        </RNTesterText>
      </View>
    </>
  );
}

function TextBaseLineLayoutExample(props: {}): React.Node {
  const texts = [];
  for (let i = 9; i >= 0; i--) {
    texts.push(
      <RNTesterText
        key={i}
        style={{fontSize: 8 + i * 5, maxWidth: 20, backgroundColor: '#eee'}}>
        {i}
      </RNTesterText>,
    );
  }

  const marker = (
    <View style={{width: 20, height: 20, backgroundColor: 'gray'}} />
  );
  const subtitleStyle = {fontSize: 16, marginTop: 8, fontWeight: 'bold'};

  return (
    <View>
      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <RNTesterText style={subtitleStyle}>{'Nested <Text/>s:'}</RNTesterText>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        <RNTesterText>{texts}</RNTesterText>
        {marker}
      </View>

      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <RNTesterText style={subtitleStyle}>
        {'Array of <Text/>s in <View>:'}
      </RNTesterText>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        {texts}
        {marker}
      </View>

      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <RNTesterText style={subtitleStyle}>
        {'Interleaving <View> and <Text>:'}
      </RNTesterText>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        <RNTesterText selectable={true}>
          Some text.
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              backgroundColor: '#eee',
            }}>
            {marker}
            <RNTesterText>Text inside View.</RNTesterText>
            {marker}
          </View>
        </RNTesterText>
        {marker}
      </View>

      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <RNTesterText style={subtitleStyle}>
        {'Multi-line interleaved <View> and <Text>:'}
      </RNTesterText>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        <RNTesterText selectable={true}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris
          venenatis,{' '}
          <View
            style={{
              backgroundColor: 'yellow',
            }}>
            <RNTesterText>mauris eu commodo maximus</RNTesterText>
          </View>{' '}
          , ante arcu vestibulum ligula, et scelerisque diam.
        </RNTesterText>
      </View>

      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <RNTesterText style={subtitleStyle}>
        {'Multi-line <Text> alignment'}
      </RNTesterText>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        <View style={{width: 50, height: 50, backgroundColor: 'gray'}} />
        <View style={{width: 125, backgroundColor: '#eee'}}>
          <RNTesterText style={{fontSize: 15}}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </RNTesterText>
        </View>
        <View style={{width: 125, backgroundColor: '#eee'}}>
          <RNTesterText style={{fontSize: 10}}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </RNTesterText>
        </View>
      </View>

      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <RNTesterText style={subtitleStyle}>{'<TextInput/>:'}</RNTesterText>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        <TextInput style={{margin: 0, padding: 0}}>{texts}</TextInput>
        {marker}
      </View>

      {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */}
      <RNTesterText style={subtitleStyle}>
        {'<TextInput multiline/>:'}
      </RNTesterText>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        <TextInput multiline={true} style={{margin: 0, padding: 0}}>
          {texts}
        </TextInput>
        {marker}
      </View>
    </View>
  );
}

const examples = [
  {
    title: 'Background Color and Border Width',
    name: 'background-border-width',
    render(): React.Node {
      return (
        <View testID="background-border-width">
          <RNTesterText
            style={{
              backgroundColor: '#F000F0',
              padding: 10,
            }}>
            Text with background color only
          </RNTesterText>
          <RNTesterText
            style={{
              backgroundColor: '#F000F0',
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
            }}>
            Text with background color and uniform borderRadii
          </RNTesterText>
          <RNTesterText
            style={{
              backgroundColor: '#F000F0',
              borderTopRightRadius: 10,
              borderTopLeftRadius: 20,
              borderBottomRightRadius: 20,
              borderBottomLeftRadius: 10,
              padding: 10,
              marginTop: 10,
            }}>
            Text with background color and non-uniform borders
          </RNTesterText>
          <RNTesterText
            style={{
              borderWidth: 1,
              borderColor: 'red',
              borderTopRightRadius: 10,
              borderTopLeftRadius: 20,
              borderBottomRightRadius: 20,
              borderBottomLeftRadius: 10,
              padding: 10,
              marginTop: 10,
            }}>
            Text with borderWidth
          </RNTesterText>
          <RNTesterText
            style={{
              backgroundColor: '#00AA00',
              borderWidth: 2,
              borderColor: 'blue',
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
            }}>
            Text with background AND borderWidth
          </RNTesterText>
        </View>
      );
    },
  },
  {
    title: 'Dynamic Font Size Adjustment',
    name: 'ajustingFontSize',
    render(): React.Node {
      return <AdjustingFontSize />;
    },
  },
  {
    title: 'Font Size Adjustment with Dynamic Layout',
    name: 'textAdjustsDynamicLayout',
    render(): React.Node {
      return <TextAdjustsDynamicLayoutExample />;
    },
  },
  {
    title: 'Wrap',
    name: 'wrap',
    render(): React.Node {
      return (
        <RNTesterText testID="text-wrap" style={styles.wrappedText}>
          The text should wrap if it goes on multiple lines. See, this is going
          to the next line.
        </RNTesterText>
      );
    },
  },
  {
    title: 'Hyphenation',
    name: 'hyphenation',
    render(): React.Node {
      return <HyphenationExample />;
    },
  },
  {
    title: 'Padding',
    name: 'padding',
    render(): React.Node {
      return (
        <RNTesterText testID="text-padding" style={{padding: 10}}>
          This text is indented by 10px padding on all sides.
        </RNTesterText>
      );
    },
  },
  {
    title: 'Text metrics legend',
    name: 'textMetricLegend',
    render(): React.Node {
      return <TextLegend />;
    },
  },
  {
    title: 'Font Family',
    name: 'fontFamily',
    render(): React.Node {
      return <FontFamilyExample />;
    },
  },
  {
    title: 'Android Material Design Fonts',
    name: 'androidMaterialDesignFonts',
    render(): React.Node {
      return <AndroidMaterialDesignFonts />;
    },
  },
  {
    title: 'Custom Fonts',
    name: 'customFonts',
    render(): React.Node {
      return <CustomFontsExample />;
    },
  },
  {
    title: 'Font Size',
    name: 'fontSize',
    render(): React.Node {
      return (
        <View testID="text-font-size">
          <RNTesterText style={{fontSize: 23}}>Size 23</RNTesterText>
          <RNTesterText style={{fontSize: 8}}>Size 8</RNTesterText>
        </View>
      );
    },
  },
  {
    title: 'Color',
    name: 'color',
    render(): React.Node {
      return (
        <View testID="text-test-color">
          <Text style={{color: 'red'}}>Red color</Text>
          <Text style={{color: 'blue'}}>Blue color</Text>
        </View>
      );
    },
  },
  {
    title: 'Font Weight',
    name: 'fontWeight',
    render(): React.Node {
      return <FontWeightExample />;
    },
  },
  {
    title: 'Font Style',
    name: 'fontStyle',
    render(): React.Node {
      return (
        <View testID="text-font-style">
          <RNTesterText style={{fontStyle: 'italic'}}>
            Move fast and be italic
          </RNTesterText>
          <RNTesterText style={{fontStyle: 'normal'}}>
            Move fast and be normal
          </RNTesterText>
          <RNTesterText style={{fontStyle: 'italic'}}>
            Move fast and be italic, but just be longer so that you don't fit on
            a single line and make sure text is not truncated.
          </RNTesterText>
        </View>
      );
    },
  },
  {
    title: 'Font Style and Weight',
    name: 'fontStyleAndWeight',
    render(): React.Node {
      return (
        <RNTesterText style={{fontStyle: 'italic', fontWeight: 'bold'}}>
          Move fast and be both bold and italic
        </RNTesterText>
      );
    },
  },
  {
    title: 'Text Decoration',
    name: 'textDecoration',
    render(): React.Node {
      return <TextDecorationExample />;
    },
  },
  {
    title: 'Nested',
    name: 'nested',
    render(): React.Node {
      return <NestedExample />;
    },
  },
  {
    title: 'Text Align',
    name: 'textAlign',
    render(): React.Node {
      return <TextAlignExample />;
    },
  },
  {
    title: 'Unicode',
    name: 'unicode',
    render(): React.Node {
      return <UnicodeExample />;
    },
  },
  {
    title: 'Spaces',
    name: 'spaces',
    render(): React.Node {
      return (
        <RNTesterText testID="text-spaces">
          A {'generated'} {'string'} and some &nbsp;&nbsp;&nbsp; spaces
        </RNTesterText>
      );
    },
  },
  {
    title: 'Line Height',
    name: 'lineHeight',
    render(): React.Node {
      return <LineHeightExample />;
    },
  },
  {
    title: 'Letter Spacing',
    name: 'letterSpacing',
    render(): React.Node {
      return <LetterSpacingExample />;
    },
  },
  {
    title: 'Toggling Attributes',
    name: 'togglingAttributes',
    render: AttributeToggler,
  },
  {
    title: 'backgroundColor attribute',
    name: 'backgroundColorAttr',
    render(): React.Node {
      return <BackgroundColorExample />;
    },
  },
  {
    title: 'containerBackgroundColor attribute',
    name: 'containerBackgroundColorAttribute',
    render(): React.Node {
      return <ContainerBackgroundColorExample />;
    },
  },
  {
    title: 'numberOfLines attribute',
    name: 'numberOfLines',
    render(): React.Node {
      return <NumberOfLinesExample />;
    },
  },
  {
    title: 'allowFontScaling attribute',
    name: 'allowFontScaling',
    render(): React.Node {
      return <AllowFontScalingExample />;
    },
  },
  {
    title: 'maxFontSizeMultiplier attribute',
    name: 'maxFontSizeMultiplier',
    render(): React.Node {
      return <MaxFontSizeMultiplierExample />;
    },
  },
  {
    title: 'selectable attribute',
    name: 'selectable',
    render(): React.Node {
      return (
        <RNTesterText selectable>
          This text is selectable if you click-and-hold, and will offer the
          native Android selection menus.
        </RNTesterText>
      );
    },
  },
  {
    title: 'selectionColor attribute',
    name: 'selectionColor',
    render(): React.Node {
      return (
        <RNTesterText selectable selectionColor="orange">
          This text will have a orange highlight on selection.
        </RNTesterText>
      );
    },
  },
  {
    title: 'Inline views',
    name: 'inlineViewsBasic',
    render(): React.Node {
      return <TextInlineView.Basic />;
    },
  },
  {
    title: 'Inline views with multiple nested texts',
    name: 'inlineViewsMultiple',
    render(): React.Node {
      return <TextInlineView.NestedTexts />;
    },
  },
  {
    title: 'Inline image/view clipped by <Text>',
    name: 'inlineViewsClipped',
    render(): React.Node {
      return <TextInlineView.ClippedByText />;
    },
  },
  {
    title: 'Relayout inline image',
    name: 'relayoutInlineImage',
    render(): React.Node {
      return <TextInlineView.ChangeImageSize />;
    },
  },
  {
    title: 'Relayout inline view',
    name: 'relayoutInlineView',
    render(): React.Node {
      return <TextInlineView.ChangeViewSize />;
    },
  },
  {
    title: 'Relayout nested inline view',
    name: 'relayoutNestedInlineView',
    render(): React.Node {
      return <TextInlineView.ChangeInnerViewSize />;
    },
  },
  {
    title: 'Text shadow',
    name: 'textShadow',
    render(): React.Node {
      return <TextShadowExample />;
    },
  },
  {
    title: 'Ellipsize mode',
    name: 'ellipsizeMode',
    render(): React.Node {
      return <EllipsizeModeExample />;
    },
  },
  {
    title: 'Font variants',
    name: 'fontVariants',
    render(): React.Node {
      return <FontVariantsExample />;
    },
  },
  {
    title: 'Include Font Padding',
    name: 'includeFontPadding',
    render(): React.Node {
      return <IncludeFontPaddingExample />;
    },
  },
  {
    title: 'Text Transform',
    name: 'textTransform',
    render(): React.Node {
      return <TextTransformExample />;
    },
  },
  {
    title: 'Substring Emoji (should only see "test")',
    name: 'substringEmoji',
    render(): React.Node {
      return <RNTesterText>{'test🙃'.substring(0, 5)}</RNTesterText>;
    },
  },

  {
    title: 'Text linkify',
    name: 'textLinkify',
    render(): React.Node {
      return <TextLinkifyExample />;
    },
  },
  {
    title: "Text `alignItems: 'baseline'` style",
    name: 'alignItemsBaseline',
    render(): React.Node {
      return <TextBaseLineLayoutExample />;
    },
  },
  {
    title: 'Selectable Text',
    name: 'selectableText',
    render(): React.Node {
      return (
        <View>
          <RNTesterText style={{userSelect: 'auto'}}>
            Text element is selectable
          </RNTesterText>
        </View>
      );
    },
  },
  {
    title: 'Text alignment',
    name: 'textAlignment',
    render(): React.Node {
      return (
        <View>
          <RNTesterText
            style={{textAlignVertical: 'top', borderWidth: 1, height: 75}}>
            Text element aligned to the top via textAlignVertical
          </RNTesterText>
          <RNTesterText
            style={{verticalAlign: 'top', borderWidth: 1, height: 75}}>
            Text element aligned to the top via verticalAlign
          </RNTesterText>
          <RNTesterText
            style={{textAlignVertical: 'center', borderWidth: 1, height: 75}}>
            Text element aligned to the middle via textAlignVertical
          </RNTesterText>
          <RNTesterText
            style={{verticalAlign: 'middle', borderWidth: 1, height: 75}}>
            Text element aligned to the middle via verticalAlign
          </RNTesterText>
        </View>
      );
    },
  },
  {
    title: 'Clipping',
    name: 'clipping',
    render: function (): React.Node {
      return (
        <View>
          <RNTesterText
            testID="text-clipping"
            style={{
              borderRadius: 50,
              padding: 0,
              borderColor: 'red',
              borderWidth: 5,
              overflow: 'hidden',
              fontSize: 16,
            }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </RNTesterText>
        </View>
      );
    },
  },
  {
    title: 'Box Shadow',
    name: 'boxShadow',
    render: function (): React.Node {
      return (
        <View>
          <RNTesterText
            testID="text-box-shadow"
            style={{
              borderRadius: 10,
              boxShadow: '0 0 10px red',
            }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </RNTesterText>
        </View>
      );
    },
  },
  {
    title: 'Disabled',
    name: 'disabled',
    render: function (): React.Node {
      return (
        <View>
          <RNTesterText testID="text-disabled" disabled={true}>
            This text has its corresponding text view in the disabled state for
            testing purposes.
          </RNTesterText>
        </View>
      );
    },
  },
  ...TextSharedExamples,
];

const styles = StyleSheet.create({
  backgroundColorText: {
    left: 5,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
  },
  includeFontPaddingText: {
    fontSize: 120,
    fontFamily: 'sans-serif',
    backgroundColor: '#EEEEEE',
    color: '#000000',
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
  wrappedText: {
    maxWidth: 300,
  },
});

module.exports = {
  title: 'Text',
  documentationURL: 'https://reactnative.dev/docs/text',
  category: 'Basic',
  description: 'Base component for rendering styled text.',
  displayName: 'TextExample',
  examples,
} as RNTesterModule;
