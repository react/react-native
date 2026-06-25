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

const {RNTesterThemeContext} = require('../../components/RNTesterTheme');
const React = require('react');
const {Alert, Text, View} = require('react-native');

type Props = Readonly<{}>;
class AccessibilityIOSExample extends React.Component<Props> {
  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <>
            <View
              onAccessibilityAction={event => {
                if (event.nativeEvent.actionName === 'activate') {
                  Alert.alert('Alert', 'onAccessibilityTap success');
                }
              }}
              accessible={true}
              accessibilityActions={[{name: 'activate'}]}>
              <Text style={{color: theme.SecondaryLabelColor}}>
                Accessibility normal tap example
              </Text>
            </View>
            <View
              onAccessibilityAction={event => {
                if (event.nativeEvent.actionName === 'magicTap') {
                  Alert.alert('Alert', 'onMagicTap success');
                }
              }}
              accessible={true}
              accessibilityActions={[{name: 'magicTap'}]}>
              <Text style={{color: theme.SecondaryLabelColor}}>
                Accessibility magic tap example
              </Text>
            </View>
            <View
              onAccessibilityAction={event => {
                if (event.nativeEvent.actionName === 'escape') {
                  Alert.alert('onAccessibilityEscape success');
                }
              }}
              accessible={true}
              accessibilityActions={[{name: 'escape'}]}>
              <Text style={{color: theme.SecondaryLabelColor}}>
                Accessibility escape example
              </Text>
            </View>
            <View accessibilityElementsHidden={true}>
              <Text style={{color: theme.SecondaryLabelColor}}>
                This view's children are hidden from the accessibility tree
              </Text>
            </View>
            <View accessible={true} accessibilityLanguage="it-IT">
              <Text style={{color: theme.SecondaryLabelColor}}>
                This view's language should be `it-IT`
              </Text>
            </View>
          </>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }
}

exports.title = 'AccessibilityIOS';
exports.description = 'iOS specific Accessibility APIs';
exports.examples = [
  {
    title: 'iOS Accessibility elements',
    render(): React.MixedElement {
      return <AccessibilityIOSExample />;
    },
  },
] as Array<RNTesterModuleExample>;
