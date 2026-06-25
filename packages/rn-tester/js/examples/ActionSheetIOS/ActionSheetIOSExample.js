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
import type {HostInstance} from 'react-native';

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import {createRef} from 'react';

const ScreenshotManager = require('../../../NativeModuleExample/NativeScreenshotManager');
const React = require('react');
const {
  ActionSheetIOS,
  Alert,
  StyleSheet,
  Text,
  View,
  findNodeHandle,
} = require('react-native');

const BUTTONS = ['Option 0', 'Option 1', 'Option 2', 'Delete', 'Cancel'];
const DESTRUCTIVE_INDEX = 3;
const CANCEL_INDEX = 4;
const DISABLED_BUTTON_INDICES = [1, 2];

type Props = Readonly<{}>;
type State = {clicked: string};
class ActionSheetExample extends React.Component<Props, State> {
  state: State = {
    clicked: 'none',
  };

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <Text
              onPress={this.showActionSheet}
              style={[style.button, {color: theme.SecondaryLabelColor}]}>
              Click to show the ActionSheet
            </Text>
            <Text style={{color: theme.SecondaryLabelColor}}>
              Clicked button: {this.state.clicked}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
      },
      buttonIndex => {
        this.setState({clicked: BUTTONS[buttonIndex]});
      },
    );
  };
}

class ActionSheetTintExample extends React.Component<$FlowFixMe, $FlowFixMe> {
  state: any | {clicked: string} = {
    clicked: 'none',
  };

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <Text
              onPress={this.showActionSheet}
              style={[style.button, {color: theme.SecondaryLabelColor}]}>
              Click to show the ActionSheet
            </Text>
            <Text style={{color: theme.SecondaryLabelColor}}>
              Clicked button: {this.state.clicked}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        tintColor: 'green',
      },
      buttonIndex => {
        this.setState({clicked: BUTTONS[buttonIndex]});
      },
    );
  };
}

class ActionSheetCancelButtonTintExample extends React.Component<
  $FlowFixMe,
  $FlowFixMe,
> {
  state: any | {clicked: string} = {
    clicked: 'none',
  };

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <Text
              onPress={this.showActionSheet}
              style={[style.button, {color: theme.SecondaryLabelColor}]}>
              Click to show the ActionSheet
            </Text>
            <Text style={{color: theme.SecondaryLabelColor}}>
              Clicked button: {this.state.clicked}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        tintColor: 'green',
        cancelButtonTintColor: 'brown',
      },
      buttonIndex => {
        this.setState({clicked: BUTTONS[buttonIndex]});
      },
    );
  };
}

class ActionSheetDisabledButtonTintExample extends React.Component<
  $FlowFixMe,
  $FlowFixMe,
> {
  state: any | {clicked: string} = {
    clicked: 'none',
  };

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <Text
              onPress={this.showActionSheet}
              style={[style.button, {color: theme.SecondaryLabelColor}]}>
              Click to show the ActionSheet
            </Text>
            <Text style={{color: theme.SecondaryLabelColor}}>
              Clicked button: {this.state.clicked}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        disabledButtonIndices: DISABLED_BUTTON_INDICES,
        tintColor: 'black',
        disabledButtonTintColor: 'gray',
      },
      buttonIndex => {
        this.setState({clicked: BUTTONS[buttonIndex]});
      },
    );
  };
}

class ActionSheetAnchorExample extends React.Component<$FlowFixMe, $FlowFixMe> {
  state: any | {clicked: string} = {
    clicked: 'none',
  };

  anchorRef: {current: null | HostInstance} = createRef();

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <View style={style.anchorRow}>
              <Text style={[style.button, {color: theme.SecondaryLabelColor}]}>
                Click there to show the ActionSheet ->
              </Text>
              <Text
                onPress={this.showActionSheet}
                style={[style.button, {color: theme.SecondaryLabelColor}]}
                ref={this.anchorRef}>
                HERE
              </Text>
            </View>
            <Text style={{color: theme.SecondaryLabelColor}}>
              Clicked button: {this.state.clicked}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        anchor: this.anchorRef.current
          ? findNodeHandle<$FlowFixMe>(this.anchorRef.current)
          : undefined,
      },
      buttonIndex => {
        this.setState({clicked: BUTTONS[buttonIndex]});
      },
    );
  };
}

class ActionSheetDisabledExample extends React.Component<Props, State> {
  state: State = {
    clicked: 'none',
  };

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <Text
              onPress={this.showActionSheet}
              style={[style.button, {color: theme.SecondaryLabelColor}]}>
              Click to show the ActionSheet
            </Text>
            <Text style={{color: theme.SecondaryLabelColor}}>
              Clicked button: {this.state.clicked}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        disabledButtonIndices: DISABLED_BUTTON_INDICES,
      },
      buttonIndex => {
        this.setState({clicked: BUTTONS[buttonIndex]});
      },
    );
  };
}

class ActionSheetDismissExample extends React.Component<{...}> {
  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <Text
              onPress={this.showAndDismissActionSheet}
              style={[style.button, {color: theme.SecondaryLabelColor}]}>
              Click to show and automatically dismiss the ActionSheet after 3
              seconds
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showAndDismissActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
      },
      () => {},
    );

    setTimeout(() => {
      ActionSheetIOS.dismissActionSheet();
    }, 3000);
  };
}

class ShareActionSheetExample extends React.Component<$FlowFixMe, $FlowFixMe> {
  state: any | {text: string} = {
    text: '',
  };

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <Text
              onPress={this.showShareActionSheet}
              style={[style.button, {color: theme.SecondaryLabelColor}]}>
              Click to show the Share ActionSheet
            </Text>
            <Text style={{color: theme.SecondaryLabelColor}}>
              {this.state.text}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showShareActionSheet = () => {
    ActionSheetIOS.showShareActionSheetWithOptions(
      {
        url: this.props.url,
        message: 'message to go with the shared url',
        subject: 'a subject to go in the email heading',
        excludedActivityTypes: ['com.apple.UIKit.activity.PostToTwitter'],
      },
      error => Alert.alert('Error', error?.message),
      (completed, method) => {
        let text;
        if (completed) {
          text = `Shared via ${method ?? 'unknown'}`;
        } else {
          text = "You didn't share";
        }
        this.setState({text});
      },
    );
  };
}

class ShareScreenshotExample extends React.Component<$FlowFixMe, $FlowFixMe> {
  state: any | {text: string} = {
    text: '',
  };

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <Text
              onPress={this.showShareActionSheet}
              style={[style.button, {color: theme.SecondaryLabelColor}]}>
              Click to show the Share ActionSheet
            </Text>
            <Text style={{color: theme.SecondaryLabelColor}}>
              {this.state.text}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showShareActionSheet = () => {
    // Take the snapshot (returns a temp file uri)
    ScreenshotManager.takeScreenshot('window')
      .then(uri => {
        // Share image data
        ActionSheetIOS.showShareActionSheetWithOptions(
          {
            url: uri,
            excludedActivityTypes: ['com.apple.UIKit.activity.PostToTwitter'],
          },
          error => Alert.alert('Error', error?.message),
          (completed, method) => {
            let text;
            if (completed) {
              text = `Shared via ${method ?? 'unknown'}`;
            } else {
              text = "You didn't share";
            }
            this.setState({text});
          },
        );
      })
      .catch(error => Alert.alert('Error', error));
  };
}

class ShareScreenshotAnchorExample extends React.Component<
  $FlowFixMe,
  $FlowFixMe,
> {
  state: any | {text: string} = {
    text: '',
  };

  anchorRef: {current: null | HostInstance} = createRef();

  render(): React.Node {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => (
          <View>
            <View style={style.anchorRow}>
              <Text style={[style.button, {color: theme.SecondaryLabelColor}]}>
                Click to show the Share ActionSheet ->
              </Text>
              <Text
                onPress={this.showShareActionSheet}
                style={[style.button, {color: theme.SecondaryLabelColor}]}
                ref={this.anchorRef}>
                HERE
              </Text>
            </View>
            <Text style={{color: theme.SecondaryLabelColor}}>
              {this.state.text}
            </Text>
          </View>
        )}
      </RNTesterThemeContext.Consumer>
    );
  }

  showShareActionSheet = () => {
    // Take the snapshot (returns a temp file uri)
    ScreenshotManager.takeScreenshot('window')
      .then(uri => {
        // Share image data
        ActionSheetIOS.showShareActionSheetWithOptions(
          {
            url: uri,
            excludedActivityTypes: ['com.apple.UIKit.activity.PostToTwitter'],
            anchor: this.anchorRef.current
              ? findNodeHandle<$FlowFixMe>(this.anchorRef.current)
              : undefined,
          },
          error => Alert.alert('Error', error?.message),
          (completed, method) => {
            let text;
            if (completed) {
              text = `Shared via ${method ?? 'unknown'}`;
            } else {
              text = "You didn't share";
            }
            this.setState({text});
          },
        );
      })
      .catch(error => Alert.alert('Error', error));
  };
}

const style = StyleSheet.create({
  button: {
    marginBottom: 10,
    fontWeight: '500',
  },
  anchorRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

exports.title = 'ActionSheetIOS';
exports.category = 'iOS';
exports.description = "Interface to show iOS' action sheets";
exports.examples = [
  {
    title: 'Show Action Sheet',
    render(): React.MixedElement {
      return <ActionSheetExample />;
    },
  },
  {
    title: 'Show Action Sheet with tinted buttons',
    render(): React.MixedElement {
      return <ActionSheetTintExample />;
    },
  },
  {
    title: 'Show Action Sheet with cancel tinted button',
    render(): React.MixedElement {
      return <ActionSheetCancelButtonTintExample />;
    },
  },
  {
    title: 'Show Action Sheet with disabled tinted button',
    render(): React.MixedElement {
      return <ActionSheetDisabledButtonTintExample />;
    },
  },
  {
    title: 'Show Action Sheet with anchor',
    render(): React.MixedElement {
      return <ActionSheetAnchorExample />;
    },
  },
  {
    title: 'Show Action Sheet with disabled buttons',
    render(): React.MixedElement {
      return <ActionSheetDisabledExample />;
    },
  },
  {
    title: 'Show Action Sheet and automatically dismiss it',
    render(): React.MixedElement {
      return <ActionSheetDismissExample />;
    },
  },
  {
    title: 'Show Share Action Sheet',
    render(): React.MixedElement {
      return <ShareActionSheetExample url="https://code.facebook.com" />;
    },
  },
  {
    title: 'Share Local Image',
    render(): React.MixedElement {
      return <ShareActionSheetExample url="bunny.png" />;
    },
  },
  {
    title: 'Share Screenshot',
    render(): React.MixedElement {
      return <ShareScreenshotExample />;
    },
  },
  {
    title: 'Share from Anchor',
    render(): React.MixedElement {
      return <ShareScreenshotAnchorExample />;
    },
  },
] as Array<RNTesterModuleExample>;
