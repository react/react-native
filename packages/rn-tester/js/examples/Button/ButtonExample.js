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

const {RNTesterThemeContext} = require('../../components/RNTesterTheme');
const React = require('react');
const {Alert, Button, StyleSheet, View} = require('react-native');

function onButtonPress(buttonName: string) {
  Alert.alert(`Your application has been ${buttonName}!`);
}

exports.displayName = 'ButtonExample';
exports.framework = 'React';
exports.category = 'UI';
exports.title = 'Button';
exports.documentationURL = 'https://reactnative.dev/docs/button';
exports.description = 'Simple React Native button component.';

exports.examples = [
  {
    title: 'Button with default styling',
    name: 'default-styling',
    render: function (): React.Node {
      return (
        <Button
          onPress={() => onButtonPress('submitted')}
          testID="button_default_styling"
          title="Submit Application"
          accessibilityLabel="Press to submit your application!"
        />
      );
    },
  },
  {
    title: 'Button with color="red"',
    name: 'color-red',
    description:
      ('Note: On iOS, the color prop controls the color of the text. On ' +
        'Android, the color adjusts the background color of the button.') as string,
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                onPress={() => onButtonPress('cancelled')}
                testID="cancel_button"
                color={theme.SystemRedColor}
                title="Cancel Application"
                accessibilityLabel="Press to cancel your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Two Buttons with Flexbox layout',
    name: 'two-buttons-flexbox',
    description:
      ('Two buttons wrapped inside view with justifyContent: spaceBetween,' +
        'This layout strategy lets the title define the width of the button') as string,
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <View style={styles.container}>
                <Button
                  onPress={() => onButtonPress('cancelled')}
                  testID="two_cancel_button"
                  color={theme.SystemRedColor}
                  title="Cancel"
                  accessibilityLabel="Press to cancel your application!"
                />
                <Button
                  onPress={() => onButtonPress('submitted')}
                  testID="two_submit_button"
                  color={theme.SystemGreenColor}
                  title="Submit"
                  accessibilityLabel="Press to submit your application!"
                />
              </View>
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Three Buttons with Flexbox layout',
    name: 'three-buttons-flexbox',
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <View style={styles.container}>
                <Button
                  onPress={() => onButtonPress('cancelled')}
                  testID="three_cancel_button"
                  color={theme.SystemRedColor}
                  title="Cancel"
                  accessibilityLabel="Press to cancel your application!"
                />
                <Button
                  onPress={() => onButtonPress('saved')}
                  testID="three_save_button"
                  color={theme.LinkColor}
                  title="Save For Later"
                  accessibilityLabel="Press to save your application!"
                />
                <Button
                  onPress={() => onButtonPress('submitted')}
                  testID="three_submit_button"
                  color={theme.SystemGreenColor}
                  title="Submit"
                  accessibilityLabel="Press to submit your application!"
                />
              </View>
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Button with disabled={true}',
    name: 'disabled',
    description:
      'By passing disabled={true} all interactions for the button are disabled.',
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                disabled
                onPress={() => onButtonPress('submitted')}
                color={theme.LinkColor}
                testID="disabled_button"
                title="Submit Application"
                accessibilityLabel="Press to submit your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Button with accessibilityLabel="label"',
    description: ('Note: This prop changes the text that a screen ' +
      'reader announces (there are no visual differences).') as string,
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                onPress={() => onButtonPress('submitted')}
                testID="accessibilityLabel_button"
                color={theme.LinkColor}
                title="Submit Application"
                accessibilityLabel="Press to submit your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Button with aria-label="label"',
    description: ('Note: This prop changes the text that a screen ' +
      'reader announces (there are no visual differences).') as string,
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                onPress={() => onButtonPress('submitted')}
                testID="aria_label_button"
                color={theme.LinkColor}
                title="Submit Application"
                aria-label="Press to submit your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Button with accessibilityState={{disabled: true}}',
    description:
      ('Note: This prop will announce on TalkBack that the button is disabled. ' +
        'The "disabled" prop has higher precedence on the state of the component') as string,
    render: function (): React.Node {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <Button
                accessibilityState={{disabled: true}}
                onPress={() => onButtonPress('submitted')}
                testID="accessibilityState_button"
                color={theme.LinkColor}
                title="Submit Application"
                accessibilityLabel="Press to submit your application!"
              />
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
] as Array<RNTesterModuleExample>;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
