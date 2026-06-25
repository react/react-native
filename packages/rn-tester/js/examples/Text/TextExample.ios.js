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

import type {RNTesterModule} from '../../types/RNTesterTypes';

import hotdog from '../../assets/hotdog.jpg';
import RNTesterText from '../../components/RNTesterText';
import TextLegend from '../../components/TextLegend';
import TextSharedExamples from './TextSharedExamples';

const TextInlineView = require('../../components/TextInlineView');
const React = require('react');
const {
  Button,
  Image,
  LayoutAnimation,
  Platform,
  Text,
  TextInput,
  View,
} = require('react-native');

type TextAlignExampleRTLState = {
  isRTL: boolean,
};

class TextAlignRTLExample extends React.Component<
  {},
  TextAlignExampleRTLState,
> {
  constructor(...args: Array<any>) {
    super(...args);

    this.state = {
      isRTL: false,
    };
  }

  render(): React.Node {
    const {isRTL} = this.state;
    const toggleRTL = () => this.setState({isRTL: !isRTL});
    return (
      <View
        style={{direction: isRTL ? 'rtl' : 'ltr'}}
        testID="text-align-example">
        <Text>auto (default) - english LTR</Text>
        <Text>
          {'\u0623\u062D\u0628 \u0627\u0644\u0644\u063A\u0629 ' +
            '\u0627\u0644\u0639\u0631\u0628\u064A\u0629 auto (default) - arabic RTL'}
        </Text>
        <Text style={{textAlign: 'left'}}>
          left left left left left left left left left left left left left left
          left
        </Text>
        <Text style={{textAlign: 'center'}}>
          center center center center center center center center center center
          center
        </Text>
        <Text style={{textAlign: 'right'}}>
          right right right right right right right right right right right
          right right
        </Text>
        <Text style={{textAlign: 'justify'}}>
          justify: this text component{"'"}s contents are laid out with
          "textAlign: justify" and as you can see all of the lines except the
          last one span the available width of the parent container.
        </Text>
        <Button
          onPress={toggleRTL}
          title={`Switch to ${isRTL ? 'LTR' : 'RTL'}`}
        />
      </View>
    );
  }
}

class Entity extends React.Component<$FlowFixMe> {
  render(): React.Node {
    return (
      <Text style={{fontWeight: '500', color: '#527fe4'}}>
        {this.props.children}
      </Text>
    );
  }
}

class AttributeToggler extends React.Component<{...}, $FlowFixMe> {
  state: any | {fontSize: number, fontWeight: string} = {
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
        {/* $FlowFixMe[incompatible-type] */}
        <Text style={curStyle}>
          Tap the controls below to change attributes.
        </Text>
        <Text>
          <Text>
            See how it will even work on {/* $FlowFixMe[incompatible-type] */}
            <Text style={curStyle}>this nested text</Text>
          </Text>
        </Text>
        <Text
          style={{backgroundColor: '#ffaaaa', marginTop: 5}}
          onPress={this.toggleWeight}
          testID="toggle-weight">
          Toggle Weight
        </Text>
        <Text
          style={{backgroundColor: '#aaaaff', marginTop: 5}}
          onPress={this.increaseSize}
          testID="increase-size">
          Increase Size
        </Text>
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
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={{fontSize: 36, marginVertical: 6}}>
          Truncated text is baaaaad.
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          style={{fontSize: 40, marginVertical: 6}}>
          Shrinking to fit available space is much better!
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{fontSize: 30, marginVertical: 6}}>
          {'Add text to me to watch me shrink!' + ' ' + this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={4}
          style={{fontSize: 20, marginVertical: 6}}>
          {'Multiline text component shrinking is supported, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' +
            ' ' +
            this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          style={{fontSize: 20, marginVertical: 6, maxHeight: 50}}>
          {'Text limited by height, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' +
            ' ' +
            this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{marginVertical: 6}}>
          <Text style={{fontSize: 14}}>
            {'Differently sized nested elements will shrink together. '}
          </Text>
          <Text style={{fontSize: 20}}>
            {'LARGE TEXT! ' + this.state.dynamicText}
          </Text>
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 5,
            marginVertical: 6,
          }}>
          <Text style={{backgroundColor: '#ffaaaa'}} onPress={this.reset}>
            Reset
          </Text>
          <Text style={{backgroundColor: '#aaaaff'}} onPress={this.removeText}>
            Remove Text
          </Text>
          <Text style={{backgroundColor: '#aaffaa'}} onPress={this.addText}>
            Add Text
          </Text>
        </View>
      </View>
    );
  }
}

class TextBaseLineLayoutExample extends React.Component<{}, unknown> {
  render(): React.Node {
    const texts = [];
    for (let i = 9; i >= 0; i--) {
      texts.push(
        <Text key={i} style={{fontSize: 8 + i * 5, backgroundColor: '#eee'}}>
          {i}
        </Text>,
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
        <Text style={subtitleStyle}>{'Nested <Text/>s:'}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          {marker}
          <Text>{texts}</Text>
          {marker}
        </View>

        {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */}
        <Text style={subtitleStyle}>{'Array of <Text/>s in <View>:'}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          {marker}
          {texts}
          {marker}
        </View>

        {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */}
        <Text style={subtitleStyle}>{'Interleaving <View> and <Text>:'}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          {marker}
          <Text selectable={true}>
            Some text.
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                backgroundColor: '#eee',
              }}>
              {marker}
              <Text>Text inside View.</Text>
              {marker}
            </View>
          </Text>
          {marker}
        </View>

        {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */}
        <Text style={subtitleStyle}>
          {'Multi-line interleaved <View> and <Text>:'}
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          <Text selectable={true}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris
            venenatis,{' '}
            <View
              style={{
                backgroundColor: 'yellow',
              }}>
              <Text>mauris eu commodo maximus</Text>
            </View>{' '}
            , ante arcu vestibulum ligula, et scelerisque diam.
          </Text>
        </View>

        {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */}
        <Text style={subtitleStyle}>{'Multi-line <Text> alignment'}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          <View style={{width: 50, height: 50, backgroundColor: 'gray'}} />
          <View style={{width: 125, backgroundColor: '#eee'}}>
            <Text style={{fontSize: 15}}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
          </View>
          <View style={{width: 125, backgroundColor: '#eee'}}>
            <Text style={{fontSize: 10}}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
          </View>
        </View>

        {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */}
        <Text style={subtitleStyle}>{'<TextInput/>:'}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          {marker}
          <TextInput style={{margin: 0, padding: 0}}>{texts}</TextInput>
          {marker}
        </View>

        {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */}
        <Text style={subtitleStyle}>{'<TextInput multiline/>:'}</Text>
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
}

class TextRenderInfoExample extends React.Component<
  {},
  {
    fontSize: number,
    numberOfTextBlocks: number,
    textMetrics: Readonly<{
      ascender: number,
      capHeight: number,
      descender: number,
      height: number,
      text?: string,
      width: number,
      x: number,
      xHeight: number,
      y: number,
    }>,
  },
> {
  state: {
    fontSize: number,
    numberOfTextBlocks: number,
    textMetrics: Readonly<{
      ascender: number,
      capHeight: number,
      descender: number,
      height: number,
      text?: string,
      width: number,
      x: number,
      xHeight: number,
      y: number,
    }>,
  } = {
    textMetrics: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      capHeight: 0,
      descender: 0,
      ascender: 0,
      xHeight: 0,
    },
    numberOfTextBlocks: 1,
    fontSize: 14,
  };

  render(): React.Node {
    const topOfBox =
      this.state.textMetrics.y +
      this.state.textMetrics.height -
      (this.state.textMetrics.descender + this.state.textMetrics.capHeight);
    return (
      <View>
        <View>
          <View
            style={{
              position: 'absolute',
              left: this.state.textMetrics.x + this.state.textMetrics.width,
              top: topOfBox,
              width: 5,
              height: Math.ceil(
                this.state.textMetrics.capHeight -
                  this.state.textMetrics.xHeight,
              ),
              backgroundColor: 'red',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: this.state.textMetrics.x + this.state.textMetrics.width,
              top:
                topOfBox +
                (this.state.textMetrics.capHeight -
                  this.state.textMetrics.xHeight),
              width: 5,
              height: Math.ceil(this.state.textMetrics.xHeight),
              backgroundColor: 'green',
            }}
          />
          <Text
            style={{fontSize: this.state.fontSize}}
            onTextLayout={event => {
              const {lines} = event.nativeEvent;
              if (lines.length > 0) {
                this.setState({textMetrics: lines[lines.length - 1]});
              }
            }}>
            {new Array<string>(this.state.numberOfTextBlocks)
              .fill('A tiny block of text.')
              .join(' ')}
          </Text>
        </View>
        <Text
          onPress={() =>
            this.setState({
              numberOfTextBlocks: this.state.numberOfTextBlocks + 1,
            })
          }>
          More text
        </Text>
        <Text
          onPress={() => this.setState({fontSize: this.state.fontSize + 1})}>
          Increase size
        </Text>
        <Text
          onPress={() => this.setState({fontSize: this.state.fontSize - 1})}>
          Decrease size
        </Text>
      </View>
    );
  }
}

class TextWithCapBaseBox extends React.Component<
  {children: string, style?: any},
  {
    textMetrics: Readonly<{
      ascender: number,
      capHeight: number,
      descender: number,
      height: number,
      text?: string,
      width: number,
      x: number,
      xHeight: number,
      y: number,
    }>,
  },
> {
  state: {
    textMetrics: Readonly<{
      ascender: number,
      capHeight: number,
      descender: number,
      height: number,
      text?: string,
      width: number,
      x: number,
      xHeight: number,
      y: number,
    }>,
  } = {
    textMetrics: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      capHeight: 0,
      descender: 0,
      ascender: 0,
      xHeight: 0,
    },
  };
  render(): React.Node {
    return (
      <Text
        onTextLayout={event => {
          const {lines} = event.nativeEvent;
          if (lines.length > 0) {
            this.setState({textMetrics: lines[0]});
          }
        }}
        style={[
          {
            marginTop: Math.ceil(
              -(
                this.state.textMetrics.ascender -
                this.state.textMetrics.capHeight
              ),
            ),
            marginBottom: Math.ceil(-this.state.textMetrics.descender),
          },
          this.props.style,
        ]}>
        {this.props.children}
      </Text>
    );
  }
}

const examples = [
  {
    title: 'iOS System Font Families (iOS only)',
    name: 'iOSSystemFontFamilies',
    description:
      'Shows system font families including system-ui/ui-sans-serif, ui-serif, ui-monospace, and ui-rounded' as string,
    render: function (): React.Node {
      const baseTextStyle = {fontSize: 20};
      return (
        <View testID={'ios-font-families'} style={{gap: 10}}>
          <Text style={{...baseTextStyle, fontFamily: 'system-ui'}}>
            system-ui (same as ui-sans-serif)
          </Text>
          <Text style={{...baseTextStyle, fontFamily: 'ui-sans-serif'}}>
            ui-sans-serif (same as system-ui)
          </Text>
          <Text style={{...baseTextStyle, fontFamily: 'ui-serif'}}>
            ui-serif
          </Text>
          <Text style={{...baseTextStyle, fontFamily: 'ui-monospace'}}>
            ui-monospace
          </Text>
          <Text style={{...baseTextStyle, fontFamily: 'ui-rounded'}}>
            ui-rounded
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Wrap',
    name: 'wrap',
    render: function (): React.Node {
      return (
        <Text testID="text-wrap">
          The text should wrap if it goes on multiple lines. See, this is going
          to the next line.
        </Text>
      );
    },
  },
  {
    title: "Substring Emoji (should only see 'test')",
    name: 'substringEmoji',
    render: function (): React.Node {
      return (
        <Text testID="text-substring-emoji">{'test🙃'.substring(0, 5)}</Text>
      );
    },
  },
  {
    title: 'Transparent Background Color',
    name: 'transparentBackgroundColor',
    render: function (): React.Node {
      return (
        <Text
          testID="text-transparent-bg"
          style={{backgroundColor: '#00000020', padding: 10}}>
          Text in a gray box!
          <Text style={{backgroundColor: 'red'}}>
            Another text in a (inline) red box (which is inside the gray box).
          </Text>
        </Text>
      );
    },
  },
  {
    title: 'Background Color and Border Width',
    name: 'background-border-width',
    render: function (): React.Node {
      return (
        <View testID="background-border-width">
          <Text
            style={{
              backgroundColor: '#F000F0',
              padding: 10,
            }}>
            Text with background color only
          </Text>
          <Text
            style={{
              backgroundColor: '#F000F0',
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
            }}>
            Text with background color and uniform borderRadii
          </Text>
          <Text
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
          </Text>
          <Text
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
          </Text>
          <Text
            style={{
              backgroundColor: '#00AA00',
              borderWidth: 2,
              borderColor: 'blue',
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
            }}>
            Text with background AND borderWidth
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Text metrics',
    render: function (): React.Node {
      return <TextRenderInfoExample />;
    },
  },
  {
    title: 'Text metrics legend',
    render: (): React.Node => <TextLegend />,
  },
  {
    title: 'Baseline capheight box',
    render: (): React.Node => (
      <View style={{backgroundColor: 'red'}}>
        <TextWithCapBaseBox>Some example text.</TextWithCapBaseBox>
      </View>
    ),
  },
  {
    title: 'Padding',
    name: 'padding',
    render: function (): React.Node {
      return (
        <Text testID="text-padding" style={{padding: 10}}>
          This text is indented by 10px padding on all sides.
        </Text>
      );
    },
  },
  {
    title: 'Font Family',
    name: 'fontFamily',
    render: function (): React.Node {
      return (
        <View testID="text-font-family">
          <Text style={{fontFamily: Platform.isTV ? 'Times' : 'Cochin'}}>
            Cochin
          </Text>
          <Text
            style={{
              fontFamily: Platform.isTV ? 'Times' : 'Cochin',
              fontWeight: 'bold',
            }}>
            Cochin bold
          </Text>
          <Text style={{fontFamily: 'Helvetica'}}>Helvetica</Text>
          <Text style={{fontFamily: 'Helvetica', fontWeight: 'bold'}}>
            Helvetica bold
          </Text>
          <Text style={{fontFamily: Platform.isTV ? 'Courier' : 'Verdana'}}>
            Verdana
          </Text>
          <Text
            style={{
              fontFamily: Platform.isTV ? 'Courier' : 'Verdana',
              fontWeight: 'bold',
            }}>
            Verdana bold
          </Text>
          <Text style={{fontFamily: 'SystemCondensed'}}>SystemCondensed</Text>
          <Text style={{fontFamily: 'Unknown Font Family'}}>
            Unknown Font Family
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Font Size',
    name: 'fontSize',
    render: function (): React.Node {
      return (
        <View testID="text-font-size">
          <Text style={{fontSize: 23}}>Size 23</Text>
          <Text style={{fontSize: 8}}>Size 8</Text>
        </View>
      );
    },
  },
  {
    title: 'Color',
    name: 'color',
    render: function (): React.Node {
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
    render: function (): React.Node {
      return (
        <View testID="text-font-weight">
          <Text style={{fontWeight: 'bold'}}>Move fast and be bold</Text>
          <Text style={{fontWeight: 'normal'}}>Move fast and be normal</Text>
          <Text style={{fontWeight: '900'}}>FONT WEIGHT 900</Text>
          <Text style={{fontWeight: '800'}}>FONT WEIGHT 800</Text>
          <Text style={{fontWeight: '700'}}>FONT WEIGHT 700</Text>
          <Text style={{fontWeight: '600'}}>FONT WEIGHT 600</Text>
          <Text style={{fontWeight: '500'}}>FONT WEIGHT 500</Text>
          <Text style={{fontWeight: '400'}}>FONT WEIGHT 400</Text>
          <Text style={{fontWeight: '300'}}>FONT WEIGHT 300</Text>
          <Text style={{fontWeight: '200'}}>FONT WEIGHT 200</Text>
          <Text style={{fontWeight: '100'}}>FONT WEIGHT 100</Text>
          <Text style={{fontWeight: 900}}>FONT WEIGHT 900</Text>
          <Text style={{fontWeight: 800}}>FONT WEIGHT 800</Text>
          <Text style={{fontWeight: 700}}>FONT WEIGHT 700</Text>
          <Text style={{fontWeight: 600}}>FONT WEIGHT 600</Text>
          <Text style={{fontWeight: 500}}>FONT WEIGHT 500</Text>
          <Text style={{fontWeight: 400}}>FONT WEIGHT 400</Text>
          <Text style={{fontWeight: 300}}>FONT WEIGHT 300</Text>
          <Text style={{fontWeight: 200}}>FONT WEIGHT 200</Text>
          <Text style={{fontWeight: 100}}>FONT WEIGHT 100</Text>
        </View>
      );
    },
  },
  {
    title: 'Font Style',
    name: 'fontStyle',
    render: function (): React.Node {
      return (
        <View testID="text-font-style">
          <Text style={{fontStyle: 'normal'}}>Normal text</Text>
          <Text style={{fontStyle: 'italic'}}>Italic text</Text>
        </View>
      );
    },
  },
  {
    title: 'Selectable',
    render: function (): React.Node {
      return (
        <View>
          <Text selectable={true}>
            This text is <Text style={{fontWeight: 'bold'}}>selectable</Text> if
            you click-and-hold.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Text Decoration',
    name: 'textDecoration',
    render: function (): React.Node {
      return (
        <View testID="text-text-decoration">
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'solid',
            }}>
            Solid underline
          </Text>
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'double',
              textDecorationColor: '#ff0000',
            }}>
            Double underline with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'dashed',
              textDecorationColor: '#9CDC40',
            }}>
            Dashed underline with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'dotted',
              textDecorationColor: 'blue',
            }}>
            Dotted underline with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'wavy',
              textDecorationColor: 'red',
            }}>
            Wavy underline (red)
          </Text>
          <Text style={{textDecorationLine: 'none'}}>None textDecoration</Text>
          <Text
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'solid',
            }}>
            Solid line-through
          </Text>
          <Text
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'double',
              textDecorationColor: '#ff0000',
            }}>
            Double line-through with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'dashed',
              textDecorationColor: '#9CDC40',
            }}>
            Dashed line-through with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'dotted',
              textDecorationColor: 'blue',
            }}>
            Dotted line-through with custom color
          </Text>
          <Text
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'wavy',
              textDecorationColor: 'red',
            }}>
            Wavy line-through (red)
          </Text>
          <Text
            style={{
              textDecorationLine: 'underline line-through',
              textDecorationStyle: 'wavy',
            }}>
            Both underline and line-through (wavy)
          </Text>
          <Text>
            Mixed text with{' '}
            <Text style={{textDecorationLine: 'underline'}}>underline</Text> and{' '}
            <Text style={{textDecorationLine: 'line-through'}}>
              line-through
            </Text>{' '}
            text nodes
          </Text>
          <Text>
            Unstyled text{' '}
            <Text
              style={{
                textDecorationLine: 'line-through',
                textDecorationStyle: 'wavy',
                textDecorationColor: 'red',
              }}>
              with wavy strike-through that wraps across multiple lines to
              verify continuity
            </Text>{' '}
            normal text
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Nested',
    name: 'nested',
    description: ('Nested text components will inherit the styles of their ' +
      'parents (only backgroundColor is inherited from non-Text parents).  ' +
      '<Text> only supports other <Text> and raw text (strings) as children.') as string,
    render: function (): React.Node {
      return (
        <View testID="text-test-nested">
          <Text>
            (Normal text,
            <Text style={{fontWeight: 'bold'}}>
              (and bold
              <Text style={{fontSize: 11, color: '#527fe4'}}>
                (and tiny inherited bold blue)
              </Text>
              )
            </Text>
            )
          </Text>
          <Text style={{opacity: 0.7}}>
            (opacity
            <Text>
              (is inherited
              <Text style={{opacity: 0.7}}>
                (and accumulated
                <Text style={{backgroundColor: '#ffaaaa'}}>
                  (and also applies to the background)
                </Text>
                )
              </Text>
              )
            </Text>
            )
          </Text>
          <Text style={{fontSize: 12}}>
            <Entity>Entity Name</Entity>
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Text Align',
    render: function (): React.Node {
      return (
        <View>
          <Text>auto (default) - english LTR</Text>
          <Text>
            {'\u0623\u062D\u0628 \u0627\u0644\u0644\u063A\u0629 ' +
              '\u0627\u0644\u0639\u0631\u0628\u064A\u0629 auto (default) - arabic ' +
              'RTL'}
          </Text>
          <Text style={{textAlign: 'left'}}>
            left left left left left left left left left left left left left
            left left
          </Text>
          <Text style={{textAlign: 'center'}}>
            center center center center center center center center center
            center center
          </Text>
          <Text style={{textAlign: 'right'}}>
            right right right right right right right right right right right
            right right
          </Text>
          <Text style={{textAlign: 'justify'}}>
            justify: this text component{"'"}s contents are laid out with
            "textAlign: justify" and as you can see all of the lines except the
            last one span the available width of the parent container.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Letter Spacing',
    name: 'letterSpacing',
    render: function (): React.Node {
      return (
        <View testID="text-letter-spacing">
          <Text style={{letterSpacing: 0}}>letterSpacing = 0</Text>
          <Text style={{letterSpacing: 2, marginTop: 5}}>
            letterSpacing = 2
          </Text>
          <Text style={{letterSpacing: 9, marginTop: 5}}>
            letterSpacing = 9
          </Text>
          <View style={{flexDirection: 'row'}}>
            <Text
              style={{
                fontSize: 12,
                letterSpacing: 2,
                backgroundColor: 'fuchsia',
                marginTop: 5,
              }}>
              With size and background color
            </Text>
          </View>
          <Text style={{letterSpacing: -1, marginTop: 5}}>
            letterSpacing = -1
          </Text>
          <Text
            style={{
              letterSpacing: 3,
              backgroundColor: '#dddddd',
              marginTop: 5,
            }}>
            [letterSpacing = 3]
            <Text style={{letterSpacing: 0, backgroundColor: '#bbbbbb'}}>
              [Nested letterSpacing = 0]
            </Text>
            <Text style={{letterSpacing: 6, backgroundColor: '#eeeeee'}}>
              [Nested letterSpacing = 6]
            </Text>
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Spaces',
    name: 'spaces',
    render: function (): React.Node {
      return (
        <Text testID="text-spaces">
          A {'generated'} {'string'} and some &nbsp;&nbsp;&nbsp; spaces
        </Text>
      );
    },
  },
  {
    title: 'Line Height',
    name: 'lineHeightIOS',
    render: function (): React.Node {
      return (
        <Text testID="text-line-height-ios">
          <Text style={{lineHeight: 35}}>
            A lot of space between the lines of this long passage that should
            wrap once.
          </Text>
        </Text>
      );
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
    description: 'backgroundColor is inherited from all types of views.',
    render: function (): React.Node {
      return (
        <Text testID="text-bg-color-attr" style={{backgroundColor: 'yellow'}}>
          Yellow container background,
          <Text style={{backgroundColor: '#ffaaaa'}}>
            {' '}
            red background,
            <Text style={{backgroundColor: '#aaaaff'}}>
              {' '}
              blue background,
              <Text>
                {' '}
                inherited blue background,
                <Text style={{backgroundColor: '#aaffaa'}}>
                  {' '}
                  nested green background.
                </Text>
              </Text>
            </Text>
          </Text>
        </Text>
      );
    },
  },
  {
    title: 'numberOfLines attribute',
    name: 'numberOfLines',
    render: function (): React.Node {
      return (
        <View testID="number-of-lines">
          <Text numberOfLines={1}>
            Maximum of one line, no matter how much I write here. If I keep
            writing, it{"'"}ll just truncate after one line.
          </Text>
          <Text numberOfLines={2} style={{marginTop: 20}}>
            Maximum of two lines, no matter how much I write here. If I keep
            writing, it{"'"}ll just truncate after two lines.
          </Text>
          <Text numberOfLines={1} style={{marginTop: 20}}>
            The hotdog should be truncated. The hotdog should be truncated. The
            hotdog should be truncated. The hotdog should be truncated. The
            hotdog should be truncated. The hotdog should be truncated. The
            hotdog should be truncated. The hotdog should be truncated. The
            hotdog should be truncated. The hotdog should be truncated.
            <Image source={hotdog} style={{height: 12}} />
          </Text>
          <Text style={{marginTop: 20}}>
            No maximum lines specified, no matter how much I write here. If I
            keep writing, it{"'"}ll just keep going and going.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Text highlighting (tap the link to see highlight)',
    render: function (): React.Node {
      return (
        <View>
          <Text>
            Lorem ipsum dolor sit amet,{' '}
            <Text
              suppressHighlighting={false}
              style={{
                backgroundColor: 'white',
                textDecorationLine: 'underline',
                color: 'blue',
              }}
              onPress={() => null}>
              consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
              labore et dolore magna aliqua. Ut enim ad minim veniam, quis
              nostrud
            </Text>{' '}
            exercitation ullamco laboris nisi ut aliquip ex ea commodo
            consequat.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'allowFontScaling attribute',
    render: function (): React.Node {
      return (
        <View>
          <Text>
            By default, text will respect Text Size accessibility setting on
            iOS. It means that all font sizes will be increased or decreased
            depending on the value of Text Size setting in{' '}
            <Text style={{fontWeight: 'bold'}}>
              Settings.app - Display & Brightness - Text Size
            </Text>
          </Text>
          <Text style={{marginTop: 10}}>
            You can disable scaling for your Text component by passing {'"'}
            allowFontScaling={'{'}false{'}"'} prop.
          </Text>
          <Text allowFontScaling={false} style={{marginTop: 20, fontSize: 15}}>
            This text will not scale.{' '}
            <Text style={{fontSize: 15}}>
              This text also won't scale because it inherits "allowFontScaling"
              from its parent.
            </Text>
          </Text>
        </View>
      );
    },
  },
  {
    title: 'maxFontSizeMultiplier attribute',
    name: 'maxFontSizeMultiplier',
    render(): React.Node {
      return (
        <View testID={'max-font-size-multiplier'}>
          <Text>
            When allowFontScaling is enabled, you can use the
            maxFontSizeMultiplier prop to set an upper limit on how much the
            font size will be scaled.
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
          <Text
            allowFontScaling={true}
            style={{fontSize: 22}}
            dynamicTypeRamp="title2">
            This text will scale with 'title2' dynamic type ramp (no max)
          </Text>
          <Text
            allowFontScaling={true}
            style={{fontSize: 22}}
            dynamicTypeRamp="title2"
            maxFontSizeMultiplier={1.2}>
            This text will scale with 'title2' dynamic type ramp (max 1.2x)
          </Text>
          <Text
            allowFontScaling={true}
            style={{fontSize: 22}}
            dynamicTypeRamp="title2"
            maxFontSizeMultiplier={1}>
            This text uses 'title2' dynamic type ramp but will not scale up (max
            1x)
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Inline views',
    render: (): React.Node => <TextInlineView.Basic />,
  },
  {
    title: 'Inline image/view clipped by <Text>',
    render: (): React.Node => <TextInlineView.ClippedByText />,
  },
  {
    title: 'Relayout inline image',
    render: (): React.Node => <TextInlineView.ChangeImageSize />,
  },
  {
    title: 'Relayout inline view',
    render: (): React.Node => <TextInlineView.ChangeViewSize />,
  },
  {
    title: 'Relayout nested inline view',
    render: (): React.Node => <TextInlineView.ChangeInnerViewSize />,
  },
  {
    title: 'Text shadow',
    name: 'textShadow',
    render: function (): React.Node {
      return (
        <View testID="text-text-shadow">
          <Text
            style={{
              fontSize: 20,
              textShadowOffset: {width: 2, height: 2},
              textShadowRadius: 1,
              textShadowColor: '#00cccc',
            }}>
            Demo text shadow
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Ellipsize mode',
    name: 'ellipsizeMode',
    render: function (): React.Node {
      return (
        <View testID="text-ellipsize-mode">
          <Text numberOfLines={1}>
            This very long text should be truncated with dots in the end.
          </Text>
          <Text ellipsizeMode="middle" numberOfLines={1}>
            This very long text should be truncated with dots in the middle.
          </Text>
          <Text ellipsizeMode="head" numberOfLines={1}>
            This very long text should be truncated with dots in the beginning.
          </Text>
          <Text ellipsizeMode="clip" numberOfLines={1}>
            This very looooooooooooooooooooooooooooong text should be clipped.
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Font variants',
    name: 'fontVariants',
    render: function (): React.Node {
      return (
        <View testID="text-font-variants">
          <Text style={{fontVariant: ['small-caps']}}>Small Caps{'\n'}</Text>
          <Text
            style={{
              fontFamily: Platform.isTV ? 'Times' : 'Hoefler Text',
              fontVariant: ['oldstyle-nums'],
            }}>
            Old Style nums 0123456789{'\n'}
          </Text>
          <Text
            style={{
              fontFamily: Platform.isTV ? 'Times' : 'Hoefler Text',
              fontVariant: ['lining-nums'],
            }}>
            Lining nums 0123456789{'\n'}
          </Text>
          <Text style={{fontVariant: ['tabular-nums']}}>
            Tabular nums{'\n'}
            1111{'\n'}
            2222{'\n'}
          </Text>
          <Text style={{fontVariant: ['proportional-nums']}}>
            Proportional nums{'\n'}
            1111{'\n'}
            2222{'\n'}
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Nested content',
    render: function (): React.Node {
      // iOS-only because it relies on inline views being able to size to content.
      // Android's implementation requires that a width and height be specified
      // on the inline view.
      return (
        <Text>
          This text has a view
          <View style={{borderColor: 'red', borderWidth: 1}}>
            <Text style={{borderColor: 'blue', borderWidth: 1}}>which has</Text>
            <Text style={{borderColor: 'green', borderWidth: 1}}>
              another text inside.
            </Text>
            <Text style={{borderColor: 'yellow', borderWidth: 1}}>
              And moreover, it has another view
              <View style={{borderColor: 'red', borderWidth: 1}}>
                <Text style={{borderColor: 'blue', borderWidth: 1}}>
                  with another text inside!
                </Text>
              </View>
            </Text>
          </View>
          Because we need to go deeper.
        </Text>
      );
    },
  },
  {
    title: 'Dynamic Font Size Adjustment',
    render: function (): React.MixedElement {
      return <AdjustingFontSize />;
    },
  },
  {
    title: 'Text Align with RTL',
    name: 'textAlign',
    render: function (): React.Node {
      return <TextAlignRTLExample />;
    },
  },
  {
    title: "Text `alignItems: 'baseline'` style",
    render: function (): React.Node {
      return <TextBaseLineLayoutExample />;
    },
  },
  {
    title: 'Transform',
    name: 'textTransform',
    render: function (): React.Node {
      return (
        <View testID="text-transform">
          <Text style={{textTransform: 'uppercase'}}>
            This text should be uppercased.
          </Text>
          <Text style={{textTransform: 'lowercase'}}>
            This TEXT SHOULD be lowercased.
          </Text>
          <Text style={{textTransform: 'capitalize'}}>
            This text should be CAPITALIZED.
          </Text>
          <Text>
            Capitalize a date:
            <Text style={{textTransform: 'capitalize'}}>
              the 9th of november, 1998
            </Text>
          </Text>
          <Text>
            Capitalize a 2 digit date:
            <Text style={{textTransform: 'capitalize'}}>
              the 25th of december
            </Text>
          </Text>
          <Text style={{textTransform: 'capitalize'}}>
            Mixed: <Text style={{textTransform: 'uppercase'}}>uppercase </Text>
            <Text style={{textTransform: 'lowercase'}}>LoWeRcAsE </Text>
            <Text style={{textTransform: 'capitalize'}}>
              capitalize each word
            </Text>
          </Text>
          <Text>
            Should be "ABC":
            <Text style={{textTransform: 'uppercase'}}>
              a<Text>b</Text>c
            </Text>
          </Text>
          <Text>
            Should be "AbC":
            <Text style={{textTransform: 'uppercase'}}>
              a<Text style={{textTransform: 'none'}}>b</Text>c
            </Text>
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Selectable Text',
    render: function (): React.Node {
      return (
        <View>
          <Text style={{userSelect: 'auto'}}>Text element is selectable</Text>
        </View>
      );
    },
  },
  {
    title: 'Line Break Strategy',
    name: 'lineBreakStrategy',
    render: function (): React.Node {
      const lineBreakStrategy = [
        'none',
        'standard',
        'hangul-word',
        'push-out',
      ] as const;
      const textByCode = {
        en: 'lineBreakStrategy lineBreakStrategy lineBreakStrategy lineBreakStrategy',
        ko: '한글개행 한글개행 한글개행 한글개행 한글개행 한글개행 한글개행 한글개행',
        ja: 'かいぎょう かいぎょう かいぎょう かいぎょう かいぎょう かいぎょう',
        cn: '改行 改行 改行 改行 改行 改行 改行 改行 改行 改行 改行 改行',
      };

      return (
        <View testID="text-line-break-strategy">
          {lineBreakStrategy.map(strategy => {
            return (
              <View key={strategy} style={{marginBottom: 12}}>
                <Text
                  style={{
                    backgroundColor: 'lightgrey',
                  }}>{`Strategy: ${strategy}`}</Text>
                {Object.keys(textByCode).map(code => {
                  return (
                    <View key={code}>
                      <Text style={{fontWeight: 'bold'}}>{`[${code}]`}</Text>
                      <RNTesterText lineBreakStrategyIOS={strategy}>
                        {textByCode[code]}
                      </RNTesterText>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      );
    },
  },
  {
    title: 'Dynamic Type (iOS only)',
    render: function (): React.Node {
      const boldStyle = {fontWeight: 'bold'};
      const boxStyle = {
        borderWidth: 1,
        padding: 8,
        margin: 8,
      };
      return (
        <View style={{marginTop: 10, marginBottom: 10}}>
          <Text>
            Adjust text size in Accessibility settings and watch how the font
            sizes change relative to each other.
          </Text>
          <View style={boxStyle}>
            {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
             * https://fburl.com/workplace/6291gfvu */}
            <Text style={boldStyle}>With `dynamicTypeRamp`:</Text>
            <Text style={{fontSize: 34}} dynamicTypeRamp="largeTitle">
              Large Title
            </Text>
            <Text style={{fontSize: 28}} dynamicTypeRamp="title1">
              Title
            </Text>
            <Text style={{fontSize: 22}} dynamicTypeRamp="title2">
              Title 2
            </Text>
            <Text style={{fontSize: 20}} dynamicTypeRamp="title3">
              Title 3
            </Text>
            <Text style={{fontSize: 17}} dynamicTypeRamp="headline">
              Headline
            </Text>
            <Text style={{fontSize: 17}} dynamicTypeRamp="body">
              Body
            </Text>
            <Text style={{fontSize: 16}} dynamicTypeRamp="callout">
              Callout
            </Text>
            <Text style={{fontSize: 15}} dynamicTypeRamp="subheadline">
              Subheadline
            </Text>
            <Text style={{fontSize: 13}} dynamicTypeRamp="footnote">
              Footnote
            </Text>
            <Text style={{fontSize: 12}} dynamicTypeRamp="caption1">
              Caption
            </Text>
            <Text style={{fontSize: 11}} dynamicTypeRamp="caption2">
              Caption 2
            </Text>
          </View>
          <View style={boxStyle}>
            {/* $FlowFixMe[incompatible-type] Natural Inference rollout. See
             * https://fburl.com/workplace/6291gfvu */}
            <Text style={boldStyle}>Without `dynamicTypeRamp`:</Text>
            <Text style={{fontSize: 34}}>Large Title</Text>
            <Text style={{fontSize: 28}}>Title</Text>
            <Text style={{fontSize: 22}}>Title 2</Text>
            <Text style={{fontSize: 20}}>Title 3</Text>
            <Text style={{fontSize: 17}}>Headline</Text>
            <Text style={{fontSize: 17}}>Body</Text>
            <Text style={{fontSize: 16}}>Callout</Text>
            <Text style={{fontSize: 15}}>Subheadline</Text>
            <Text style={{fontSize: 13}}>Footnote</Text>
            <Text style={{fontSize: 12}}>Caption</Text>
            <Text style={{fontSize: 11}}>Caption 2</Text>
          </View>
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
          <Text
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
          </Text>
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
          <Text
            testID="text-box-shadow"
            style={{
              borderRadius: 10,
              boxShadow: '0 0 10px red',
            }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
        </View>
      );
    },
  },
  ...TextSharedExamples,
];

module.exports = {
  title: 'Text',
  documentationURL: 'https://reactnative.dev/docs/text',
  category: 'Basic',
  description: 'Base component for rendering styled text.',
  displayName: 'TextExample',
  examples,
} as RNTesterModule;
