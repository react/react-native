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

import RNTesterBlock from '../../components/RNTesterBlock';
import RNTesterPage from '../../components/RNTesterPage';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Alert, StyleSheet, TouchableWithoutFeedback, View} from 'react-native';

const importantForAccessibilityValues = [
  'auto',
  'yes',
  'no',
  'no-hide-descendants',
] as const;

type AccessibilityAndroidExampleState = {
  count: number,
  backgroundImportantForAcc: number,
  forgroundImportantForAcc: number,
};

class AccessibilityAndroidExample extends React.Component<
  {},
  AccessibilityAndroidExampleState,
> {
  state: AccessibilityAndroidExampleState = {
    count: 0,
    backgroundImportantForAcc: 0,
    forgroundImportantForAcc: 0,
  };

  _addOne = () => {
    this.setState({
      count: ++this.state.count,
    });
  };

  _changeBackgroundImportantForAcc = () => {
    this.setState({
      backgroundImportantForAcc: (this.state.backgroundImportantForAcc + 1) % 4,
    });
  };

  _changeForgroundImportantForAcc = () => {
    this.setState({
      forgroundImportantForAcc: (this.state.forgroundImportantForAcc + 1) % 4,
    });
  };

  render(): React.Node {
    return (
      <RNTesterPage title={'Accessibility Android APIs'}>
        <RNTesterBlock title="Ellipsized Accessible Links">
          <RNTesterText numberOfLines={3}>
            <RNTesterText>
              Bacon {this.state.count} Ipsum{'\n'}
            </RNTesterText>
            <RNTesterText>Dolor sit amet{'\n'}</RNTesterText>
            <RNTesterText>Eggsecetur{'\n'}</RNTesterText>
            <RNTesterText>{'\n'}</RNTesterText>
            <RNTesterText accessibilityRole="link" onPress={this._addOne}>
              http://github.com
            </RNTesterText>
          </RNTesterText>
        </RNTesterBlock>

        <RNTesterBlock title="LiveRegion">
          <TouchableWithoutFeedback onPress={this._addOne}>
            <View style={styles.embedded}>
              <RNTesterText style={styles.buttonText}>Click me</RNTesterText>
            </View>
          </TouchableWithoutFeedback>
          <View accessibilityLiveRegion="polite">
            <RNTesterText>Clicked {this.state.count} times</RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Overlapping views and importantForAccessibility property">
          <View style={styles.container}>
            <TouchableWithoutFeedback
              accessible={true}
              accessibilityLabel="First layout"
              importantForAccessibility={
                importantForAccessibilityValues[
                  this.state.backgroundImportantForAcc
                ]
              }>
              <View accessible={true} style={styles.touchableContainer}>
                <RNTesterText style={{fontSize: 25}}>Hello</RNTesterText>
              </View>
            </TouchableWithoutFeedback>
            <View
              style={{
                position: 'absolute',
                left: 10,
                top: 25,
                right: 10,
                height: 110,
                backgroundColor: 'yellow',
                opacity: 0.5,
              }}
              accessible={true}
              accessibilityLabel="Second layout"
              importantForAccessibility={
                importantForAccessibilityValues[
                  this.state.forgroundImportantForAcc
                ]
              }>
              <View accessible={true}>
                <RNTesterText style={{fontSize: 20}}>world</RNTesterText>
              </View>
            </View>
          </View>
          <TouchableWithoutFeedback
            onPress={this._changeBackgroundImportantForAcc}>
            <View style={styles.embedded}>
              <RNTesterText style={styles.buttonText}>
                Change importantForAccessibility for background layout.
              </RNTesterText>
            </View>
          </TouchableWithoutFeedback>
          <View accessible={true}>
            <RNTesterText>
              Background layout importantForAccessibility
            </RNTesterText>
            <RNTesterText>
              {
                importantForAccessibilityValues[
                  this.state.backgroundImportantForAcc
                ]
              }
            </RNTesterText>
          </View>
          <TouchableWithoutFeedback
            onPress={this._changeForgroundImportantForAcc}>
            <View style={styles.embedded}>
              <RNTesterText style={styles.buttonText}>
                Change importantForAccessibility for forground layout.
              </RNTesterText>
            </View>
          </TouchableWithoutFeedback>
          <View accessible={true}>
            <RNTesterText>
              Forground layout importantForAccessibility
            </RNTesterText>
            <RNTesterText>
              {
                importantForAccessibilityValues[
                  this.state.forgroundImportantForAcc
                ]
              }
            </RNTesterText>
          </View>
        </RNTesterBlock>
        <RNTesterBlock title="Links">
          <RNTesterText style={styles.paragraph}>
            In the following example, the words "test", "inline links", "another
            link", and "link that spans multiple lines because the text is so
            long", should each be independently focusable elements, announced as
            their content followed by ", Link".
          </RNTesterText>
          <RNTesterText style={styles.paragraph}>
            They should be focused in order from top to bottom *after* the
            contents of the entire paragraph.
          </RNTesterText>
          <RNTesterText style={styles.paragraph}>
            Focusing on the paragraph itself should also announce that there are
            "links available", and opening Talkback's links menu should show
            these same links.
          </RNTesterText>
          <RNTesterText style={styles.paragraph}>
            Clicking on each link, or selecting the link From Talkback's links
            menu should trigger an alert.
          </RNTesterText>
          <RNTesterText style={styles.paragraph}>
            The links that wraps to multiple lines will intentionally only draw
            a focus outline around the first line, but using the "explore by
            touch" tap-and-drag gesture should move focus to this link even if
            the second line is touched.
          </RNTesterText>
          <RNTesterText style={styles.paragraph}>
            Using the "Explore by touch" gesture and touching an area that is
            *not* a link should move focus to the entire paragraph.
          </RNTesterText>
          <RNTesterText style={styles.exampleTitle}>Example</RNTesterText>
          <RNTesterText style={styles.paragraph} accessible={true}>
            This is a{' '}
            <RNTesterText
              style={styles.link}
              accessibilityRole="link"
              onPress={() => {
                Alert.alert('pressed test');
              }}>
              test
            </RNTesterText>{' '}
            of{' '}
            <RNTesterText
              style={styles.link}
              accessibilityRole="link"
              onPress={() => {
                Alert.alert('pressed Inline Links');
              }}>
              inline links
            </RNTesterText>{' '}
            in React Native. Here's{' '}
            <RNTesterText
              style={styles.link}
              accessibilityRole="link"
              onPress={() => {
                Alert.alert('pressed another link');
              }}>
              another link
            </RNTesterText>
            . Here is a{' '}
            <RNTesterText
              style={styles.link}
              accessibilityRole="link"
              onPress={() => {
                Alert.alert('pressed long link');
              }}>
              link that spans multiple lines because the text is so long.
            </RNTesterText>
            This sentence has no links in it.
          </RNTesterText>
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}

const styles = StyleSheet.create({
  buttonText: {
    color: 'black',
  },
  touchableContainer: {
    position: 'absolute',
    left: 10,
    top: 10,
    right: 10,
    height: 100,
    backgroundColor: 'green',
  },
  embedded: {
    backgroundColor: 'yellow',
    padding: 10,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    height: 150,
  },
  paragraph: {
    paddingBottom: 10,
  },
  link: {
    color: 'blue',
    fontWeight: 'bold',
  },
  exampleTitle: {
    fontWeight: 'bold',
    fontSize: 20,
  },
});

exports.title = 'AccessibilityAndroid';
exports.description = 'Android specific Accessibility APIs.';
exports.examples = [
  {
    title: 'Accessibility elements',
    render(): React.MixedElement {
      return <AccessibilityAndroidExample />;
    },
  },
] as Array<RNTesterModuleExample>;
