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
import type {EventSubscription, GestureResponderEvent} from 'react-native';

import RNTesterBlock from '../../components/RNTesterBlock';
import RNTesterText from '../../components/RNTesterText';
import checkImageSource from './check.png';
import mixedCheckboxImageSource from './mixed.png';
import uncheckImageSource from './uncheck.png';
import * as React from 'react';
import {createRef, useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Alert,
  Button,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  sectionContainer: {
    rowGap: 20,
  },
  default: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    padding: 4,
  },
  touchable: {
    backgroundColor: 'blue',
    borderColor: 'red',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    borderStyle: 'solid',
  },
  image: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 10,
  },
  disabledImage: {
    width: 120,
    height: 120,
  },
  containerAlignCenter: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  button: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'blue',
  },
  smallRedSquare: {
    backgroundColor: 'red',
    height: 40,
    width: 40,
  },
  container: {
    flex: 1,
  },
  ImageBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 20,
    lineHeight: 84,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#000000c0',
  },
  scrollView: {
    height: 50,
  },
  boxSize: {
    width: 50,
    height: 50,
  },
  smallBoxSize: {
    width: 25,
    height: 25,
  },
  bigBoxSize: {
    width: 100,
    height: 100,
  },
  link: {
    color: 'blue',
  },
});

class AccessibilityExample extends React.Component<{}> {
  render(): React.Node {
    return (
      <View style={styles.sectionContainer}>
        <RNTesterBlock title="TextView without label">
          <RNTesterText>
            Text's accessibilityLabel is the raw text itself unless it is set
            explicitly.
          </RNTesterText>
        </RNTesterBlock>

        <RNTesterBlock title="TextView with label">
          <RNTesterText accessibilityLabel="I have label, so I read it instead of embedded text.">
            This text component's accessibilityLabel is set explicitly.
          </RNTesterText>
        </RNTesterBlock>

        <RNTesterBlock title="Nonaccessible view with TextViews">
          <View>
            <RNTesterText style={{color: 'green'}}>
              This is text one.
            </RNTesterText>
            <RNTesterText style={{color: 'blue'}}>
              This is text two.
            </RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible view with TextViews without label">
          <View accessible={true}>
            <RNTesterText style={{color: 'green'}}>
              This is text one.
            </RNTesterText>
            <RNTesterText style={{color: 'blue'}}>
              This is text two.
            </RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible view with TextViews with label">
          <View
            accessible={true}
            accessibilityLabel="I have label, so I read it instead of embedded text.">
            <RNTesterText style={{color: 'green'}}>
              This is text one.
            </RNTesterText>
            <RNTesterText style={{color: 'blue'}}>
              This is text two.
            </RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="View with hidden children from accessibility tree.">
          <View aria-hidden>
            <RNTesterText>
              This view's children are hidden from the accessibility tree
            </RNTesterText>
          </View>
        </RNTesterBlock>

        {/* Android screen readers will say the accessibility hint instead of the text
                   since the view doesn't have a label. */}
        <RNTesterBlock title="Accessible view with TextViews with hint">
          <View accessibilityHint="Accessibility hint." accessible={true}>
            <RNTesterText style={{color: 'green'}}>
              This is text one.
            </RNTesterText>
            <RNTesterText style={{color: 'blue'}}>
              This is text two.
            </RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible view TextViews with label and hint">
          <View
            accessibilityLabel="Accessibility label."
            accessibilityHint="Accessibility hint."
            accessible={true}>
            <RNTesterText style={{color: 'green'}}>
              This is text one.
            </RNTesterText>
            <RNTesterText style={{color: 'blue'}}>
              This is text two.
            </RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Text with accessibilityRole = header">
          <RNTesterText accessibilityRole="header">
            This is a title.
          </RNTesterText>
        </RNTesterBlock>

        <RNTesterBlock title="Text with role = heading">
          <RNTesterText role="heading">This is a title.</RNTesterText>
        </RNTesterBlock>

        <RNTesterBlock title="Touchable with accessibilityRole = link">
          <TouchableOpacity
            onPress={() => Alert.alert('Link has been clicked!')}
            accessibilityRole="link">
            <View>
              <RNTesterText>Click me</RNTesterText>
            </View>
          </TouchableOpacity>
        </RNTesterBlock>

        <RNTesterBlock title="Touchable with accessibilityRole = button">
          <TouchableOpacity
            onPress={() => Alert.alert('Button has been pressed!')}
            accessibilityRole="button">
            <RNTesterText>Click me</RNTesterText>
          </TouchableOpacity>
        </RNTesterBlock>

        <RNTesterBlock title="Disabled Touchable with role">
          <TouchableOpacity
            onPress={() => Alert.alert('Button has been pressed!')}
            accessibilityRole="button"
            accessibilityState={{disabled: true}}
            disabled={true}>
            <View>
              <RNTesterText>
                I am disabled. Clicking me will not trigger any action.
              </RNTesterText>
            </View>
          </TouchableOpacity>
        </RNTesterBlock>

        <RNTesterBlock title="Disabled TouchableOpacity">
          <TouchableOpacity
            onPress={() => Alert.alert('Disabled Button has been pressed!')}
            accessibilityLabel={'You are pressing Disabled TouchableOpacity'}
            accessibilityState={{disabled: true}}>
            <View>
              <RNTesterText>
                I am disabled. Clicking me will not trigger any action.
              </RNTesterText>
            </View>
          </TouchableOpacity>
        </RNTesterBlock>
        <RNTesterBlock title="View with multiple states">
          <View
            accessible={true}
            accessibilityState={{selected: true, disabled: true}}>
            <RNTesterText>This view is selected and disabled.</RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="View with label, hint, role, and state">
          <View
            accessible={true}
            accessibilityLabel="Accessibility label."
            accessibilityRole="button"
            accessibilityState={{selected: true}}
            accessibilityHint="Accessibility hint.">
            <RNTesterText>
              Accessible view with label, hint, role, and state
            </RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="View with label, hint, role, and state">
          <View
            accessible={true}
            accessibilityLabel="Accessibility label."
            accessibilityRole="button"
            aria-selected={true}
            accessibilityHint="Accessibility hint.">
            <RNTesterText>
              Accessible view with label, hint, role, and state
            </RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="TextInput with accessibilityLabelledBy attribute">
          <View>
            <RNTesterText nativeID="formLabel1">Mail Address</RNTesterText>
            <TextInput
              accessibilityLabel="input test1"
              accessibilityLabelledBy="formLabel1"
              style={styles.default}
            />
            <RNTesterText nativeID="formLabel2">First Name</RNTesterText>
            <TextInput
              accessibilityLabel="input test2"
              accessibilityLabelledBy={['formLabel2', 'formLabel3']}
              style={styles.default}
              value="Foo"
            />
          </View>
        </RNTesterBlock>
        <RNTesterBlock title="Switch with accessibilityLabelledBy attribute">
          <View>
            <RNTesterText nativeID="formLabel4">
              Enable Notifications
            </RNTesterText>
            <Switch
              value={true}
              accessibilityLabel="switch test1"
              accessibilityLabelledBy="formLabel4"
            />
          </View>
        </RNTesterBlock>
      </View>
    );
  }
}

class AutomaticContentGrouping extends React.Component<{}> {
  render(): React.Node {
    return (
      <View style={styles.sectionContainer}>
        <RNTesterBlock title="The parent and the children have a different role">
          <TouchableNativeFeedback accessible={true} accessibilityRole="button">
            <View accessible={false}>
              <RNTesterText accessibilityRole="image" accessible={false}>
                Text number 1 with a role
              </RNTesterText>
              <RNTesterText accessible={false}>Text number 2</RNTesterText>
            </View>
          </TouchableNativeFeedback>
        </RNTesterBlock>

        <RNTesterBlock title="The parent has the accessibilityActions cut, copy and paste">
          <TouchableNativeFeedback
            accessible={true}
            accessibilityActions={[
              {name: 'cut', label: 'cut label'},
              {name: 'copy', label: 'copy label'},
              {name: 'paste', label: 'paste label'},
            ]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'cut':
                  Alert.alert('Alert', 'cut action success');
                  break;
                case 'copy':
                  Alert.alert('Alert', 'copy action success');
                  break;
                case 'paste':
                  Alert.alert('Alert', 'paste action success');
                  break;
              }
            }}
            accessibilityRole="button">
            <View>
              <RNTesterText accessible={false}>Text number 1</RNTesterText>
              <RNTesterText accessible={false}>
                Text number 2
                <RNTesterText accessible={false}>Text number 3</RNTesterText>
              </RNTesterText>
            </View>
          </TouchableNativeFeedback>
        </RNTesterBlock>

        <RNTesterBlock title="Talkback only pulls the child's contentDescription or text but does not include the child's accessibilityState or accessibilityRole. TalkBack avoids announcements of conflicting states or roles (for example, 'button' and 'slider').">
          <View
            accessible={true}
            accessibilityRole="button"
            accessibilityState={{checked: true}}>
            <RNTesterText
              accessible={false}
              accessibilityState={{checked: true, disabled: false}}>
              Text number 1
            </RNTesterText>
            <RNTesterText
              style={styles.smallRedSquare}
              accessible={false}
              accessibilityState={{checked: false, disabled: true}}
              accessibilityLabel="This child Text does not have text, but has an accessibilityLabel and accessibilityState. The child accessibility state disabled is not announced."
              accessibilityRole="image"
            />
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="One of the children has accessibilityLabel, role, state, and accessibilityValue.">
          <View accessible={true} accessibilityRole="button">
            <View>
              <RNTesterText accessible={false}>Text number 1</RNTesterText>
              <TouchableNativeFeedback
                focusable={true}
                onPress={() => console.warn('onPress child')}
                accessible={false}
                accessibilityLabel="this is my label"
                accessibilityRole="image"
                accessibilityState={{disabled: true}}
                accessibilityValue={{
                  text: 'this is the accessibility value',
                }}>
                <RNTesterText accessible={false}>Text number 3</RNTesterText>
              </TouchableNativeFeedback>
            </View>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="The parent has a TextInput child component.">
          <TouchableNativeFeedback accessible={true} accessibilityRole="button">
            <TextInput
              value="this is the value"
              accessible={false}
              style={styles.default}
              placeholder="this is the placeholder"
            />
          </TouchableNativeFeedback>
        </RNTesterBlock>

        <RNTesterBlock title="The parents include three levels of nested Components.">
          <TouchableNativeFeedback accessible={true} accessibilityRole="button">
            <RNTesterText accessible={false}>
              Text number 2
              <RNTesterText accessible={false}>
                Text number 3
                <RNTesterText accessible={false}>Text number 4</RNTesterText>
              </RNTesterText>
            </RNTesterText>
          </TouchableNativeFeedback>
        </RNTesterBlock>

        <RNTesterBlock title="The child is not TextInput. The contentDescription is not empty and does not have node text.">
          <TouchableNativeFeedback
            onPress={() => console.warn('onPress child')}
            accessible={true}
            accessibilityRole="button">
            <View>
              <RNTesterText
                style={styles.smallRedSquare}
                accessibilityLabel="this is the child Text accessibilityLabel"
                accessible={false}
              />
            </View>
          </TouchableNativeFeedback>
        </RNTesterBlock>

        <RNTesterBlock title="One of the child has accessibilityHint (hasText triggers the announcement).">
          <View accessible={true} accessibilityRole="button">
            <RNTesterText
              style={styles.smallRedSquare}
              accessible={false}
              accessibilityHint="this child Text does not have text, but has hint and should be announced by TalkBack"
            />
          </View>
        </RNTesterBlock>
      </View>
    );
  }
}

class CheckboxExample extends React.Component<
  {},
  {
    checkboxState: boolean | 'mixed',
  },
> {
  state: {checkboxState: boolean | 'mixed'} = {
    checkboxState: true,
  };

  _onCheckboxPress = () => {
    let checkboxState: boolean | string = false;
    if (this.state.checkboxState === false) {
      checkboxState = 'mixed';
    } else if (this.state.checkboxState === 'mixed') {
      checkboxState = true;
    } else {
      checkboxState = false;
    }

    this.setState({
      checkboxState,
    });
  };

  render(): React.Node {
    return (
      <TouchableOpacity
        onPress={this._onCheckboxPress}
        accessibilityLabel="element 2"
        accessibilityRole="checkbox"
        accessibilityState={{checked: this.state.checkboxState}}
        accessibilityHint="click me to change state">
        <RNTesterText>Checkbox example</RNTesterText>
      </TouchableOpacity>
    );
  }
}

class SwitchExample extends React.Component<
  {},
  {
    switchState: boolean,
  },
> {
  state: {switchState: boolean} = {
    switchState: true,
  };

  _onSwitchToggle = () => {
    const switchState = !this.state.switchState;

    this.setState({
      switchState,
    });
  };

  render(): React.Node {
    return (
      <TouchableOpacity
        onPress={this._onSwitchToggle}
        accessibilityLabel="element 12"
        accessibilityRole="switch"
        accessibilityState={{checked: this.state.switchState}}
        accessible={true}>
        <RNTesterText>Switch example</RNTesterText>
      </TouchableOpacity>
    );
  }
}

class SelectionExample extends React.Component<
  {},
  {
    isSelected: boolean,
    isEnabled: boolean,
  },
> {
  constructor(props: {}) {
    super(props);
    this.selectableElement = createRef();
  }
  selectableElement: {
    current: React.ElementRef<typeof TouchableOpacity> | null,
  };

  state: {isEnabled: boolean, isSelected: boolean} = {
    isSelected: true,
    isEnabled: false,
  };

  render(): React.Node {
    const {isSelected, isEnabled} = this.state;
    let accessibilityHint = 'click me to select';
    if (isSelected) {
      accessibilityHint = 'click me to unselect';
    }
    if (!isEnabled) {
      accessibilityHint = 'use the button on the right to enable selection';
    }
    const buttonTitle = isEnabled ? 'Disable selection' : 'Enable selection';
    const touchableHint = ` (touching the TouchableOpacity will ${
      isSelected ? 'disable' : 'enable'
    } accessibilityState.selected)`;
    return (
      <View style={styles.containerAlignCenter}>
        <TouchableOpacity
          ref={this.selectableElement}
          accessible={true}
          onPress={() => {
            if (isEnabled) {
              this.setState({
                isSelected: !isSelected,
              });
            } else {
              console.warn('selection is disabled, please enable selection.');
            }
          }}
          accessibilityLabel="element 19"
          accessibilityState={{
            selected: isSelected,
            disabled: !isEnabled,
          }}
          style={styles.touchable}
          accessibilityHint={accessibilityHint}>
          <RNTesterText style={{color: 'white'}}>
            {`Selectable TouchableOpacity Example ${touchableHint}`}
          </RNTesterText>
        </TouchableOpacity>
        <TextInput
          accessibilityLabel="element 20"
          accessibilityState={{
            selected: isSelected,
          }}
          multiline={true}
          placeholder={`TextInput Example - ${
            isSelected ? 'enabled' : 'disabled'
          } selection`}
        />
        <Button
          onPress={() => {
            this.setState({
              isEnabled: !this.state.isEnabled,
            });
          }}
          title={buttonTitle}
        />
      </View>
    );
  }
}

class ExpandableElementExample extends React.Component<
  {},
  {
    expandState: boolean,
  },
> {
  state: {expandState: boolean} = {
    expandState: false,
  };

  _onElementPress = () => {
    const expandState = !this.state.expandState;

    this.setState({
      expandState,
    });
  };

  render(): React.Node {
    return (
      <TouchableOpacity
        onPress={this._onElementPress}
        accessibilityLabel="element 18"
        accessibilityState={{expanded: this.state.expandState}}
        accessibilityHint="click me to change state">
        <RNTesterText>Expandable element example</RNTesterText>
      </TouchableOpacity>
    );
  }
}

class NestedCheckBox extends React.Component<
  {},
  {
    checkbox1: boolean | 'mixed',
    checkbox2: boolean | 'mixed',
    checkbox3: boolean | 'mixed',
  },
> {
  state: {
    checkbox1: boolean | 'mixed',
    checkbox2: boolean | 'mixed',
    checkbox3: boolean | 'mixed',
  } = {
    checkbox1: false,
    checkbox2: false,
    checkbox3: false,
  };

  _onPress1 = () => {
    let checkbox1 = false;
    if (this.state.checkbox1 === false) {
      checkbox1 = true;
    } else if (this.state.checkbox1 === 'mixed') {
      checkbox1 = false;
    } else {
      checkbox1 = false;
    }
    setTimeout(() => {
      this.setState({
        checkbox1,
        checkbox2: checkbox1,
        checkbox3: checkbox1,
      });
    }, 2000);
  };

  _onPress2 = () => {
    const checkbox2 = !this.state.checkbox2;

    this.setState({
      checkbox2,
      checkbox1:
        checkbox2 && this.state.checkbox3
          ? true
          : checkbox2 || this.state.checkbox3
            ? 'mixed'
            : false,
    });
  };

  _onPress3 = () => {
    const checkbox3 = !this.state.checkbox3;

    this.setState({
      checkbox3,
      checkbox1:
        this.state.checkbox2 && checkbox3
          ? true
          : this.state.checkbox2 || checkbox3
            ? 'mixed'
            : false,
    });
  };

  render(): React.Node {
    return (
      <View>
        <TouchableOpacity
          style={{flex: 1, flexDirection: 'row'}}
          onPress={this._onPress1}
          accessibilityLabel="Meat"
          accessibilityHint="State changes in 2 seconds after clicking."
          accessibilityRole="checkbox"
          accessibilityState={{checked: this.state.checkbox1}}>
          <Image
            style={styles.image}
            source={
              this.state.checkbox1 === 'mixed'
                ? mixedCheckboxImageSource
                : this.state.checkbox1
                  ? checkImageSource
                  : uncheckImageSource
            }
          />
          <RNTesterText>Meat</RNTesterText>
        </TouchableOpacity>
        <TouchableOpacity
          style={{flex: 1, flexDirection: 'row'}}
          onPress={this._onPress2}
          accessibilityLabel="Beef"
          accessibilityRole="checkbox"
          accessibilityState={{checked: this.state.checkbox2}}>
          <Image
            style={styles.image}
            source={
              this.state.checkbox2 ? checkImageSource : uncheckImageSource
            }
          />
          <RNTesterText>Beef</RNTesterText>
        </TouchableOpacity>
        <TouchableOpacity
          style={{flex: 1, flexDirection: 'row'}}
          onPress={this._onPress3}
          accessibilityLabel="Bacon"
          accessibilityRole="checkbox"
          accessibilityState={{checked: this.state.checkbox3}}>
          <Image
            style={styles.image}
            source={
              this.state.checkbox3 ? checkImageSource : uncheckImageSource
            }
          />
          <RNTesterText>Bacon</RNTesterText>
        </TouchableOpacity>
      </View>
    );
  }
}

class AccessibilityRoleAndStateExample extends React.Component<{}> {
  render(): React.Node {
    const content = [
      <RNTesterText key={1}>This is some text</RNTesterText>,
      <RNTesterText key={2}>This is some text</RNTesterText>,
      <RNTesterText key={3}>This is some text</RNTesterText>,
      <RNTesterText key={4}>This is some text</RNTesterText>,
      <RNTesterText key={5}>This is some text</RNTesterText>,
      <RNTesterText key={6}>This is some text</RNTesterText>,
      <RNTesterText key={7}>This is some text</RNTesterText>,
    ];

    return (
      <View style={styles.sectionContainer}>
        <RNTesterBlock title="ScrollView with grid role">
          <ScrollView accessibilityRole="grid" style={styles.scrollView}>
            <RNTesterText>{content}</RNTesterText>
          </ScrollView>
        </RNTesterBlock>
        <RNTesterBlock title="ScrollView with scrollview role">
          <ScrollView accessibilityRole="scrollview" style={styles.scrollView}>
            <RNTesterText>{content}</RNTesterText>
          </ScrollView>
        </RNTesterBlock>
        <RNTesterBlock title="HorizontalScrollView with horizontalscrollview role">
          <ScrollView
            horizontal
            accessibilityRole="horizontalscrollview"
            style={styles.scrollView}>
            <RNTesterText>{content}</RNTesterText>
          </ScrollView>
        </RNTesterBlock>
        <RNTesterBlock title="accessibilityRole with View Component">
          <View>
            <View
              accessibilityLabel="element 1"
              accessibilityRole="alert"
              accessible={true}>
              <RNTesterText>Alert example</RNTesterText>
            </View>
            <CheckboxExample />
            <View
              accessibilityLabel="element 3"
              accessibilityRole="combobox"
              accessible={true}>
              <RNTesterText>Combobox example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 4"
              accessibilityRole="menu"
              accessible={true}>
              <RNTesterText>Menu example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 5"
              accessibilityRole="menubar"
              accessible={true}>
              <RNTesterText>Menu bar example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 6"
              accessibilityRole="menuitem"
              accessible={true}>
              <RNTesterText>Menu item example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 7"
              accessibilityRole="progressbar"
              accessible={true}>
              <RNTesterText>Progress bar example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 8"
              accessibilityRole="radio"
              accessible={true}>
              <RNTesterText>Radio button example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 9"
              accessibilityRole="radiogroup"
              accessible={true}>
              <RNTesterText>Radio group example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 10"
              accessibilityRole="scrollbar"
              accessible={true}>
              <RNTesterText>Scrollbar example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 11"
              accessibilityRole="spinbutton"
              accessible={true}>
              <RNTesterText>Spin button example</RNTesterText>
            </View>
            <SwitchExample />
            <View
              accessibilityLabel="element 13"
              accessibilityRole="tab"
              accessible={true}>
              <RNTesterText>Tab example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 14"
              accessibilityRole="tablist"
              accessible={true}>
              <RNTesterText>Tab list example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 15"
              accessibilityRole="timer"
              accessible={true}>
              <RNTesterText>Timer example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 16"
              accessibilityRole="toolbar"
              accessible={true}>
              <RNTesterText>Toolbar example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 17"
              accessibilityState={{busy: true}}
              accessible={true}>
              <RNTesterText>State busy example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 18"
              accessibilityRole="dropdownlist"
              accessible={true}>
              <RNTesterText>Drop Down List example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 19"
              accessibilityRole="pager"
              accessible={true}>
              <RNTesterText>Pager example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 20"
              accessibilityRole="togglebutton"
              accessible={true}>
              <RNTesterText>Toggle Button example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 21"
              accessibilityRole="viewgroup"
              accessible={true}>
              <RNTesterText>Viewgroup example</RNTesterText>
            </View>
            <View
              accessibilityLabel="element 22"
              accessibilityRole="webview"
              accessible={true}>
              <RNTesterText>Webview example</RNTesterText>
            </View>
            <ExpandableElementExample />
            <SelectionExample />
            <RNTesterText>
              Nested checkbox with delayed state change
            </RNTesterText>
            <NestedCheckBox />
          </View>
        </RNTesterBlock>
      </View>
    );
  }
}

class AccessibilityActionsExample extends React.Component<{}> {
  render(): React.Node {
    return (
      <View style={styles.sectionContainer}>
        <RNTesterBlock title="Non-touchable with activate action">
          <View
            accessible={true}
            accessibilityActions={[{name: 'activate'}]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'activate':
                  Alert.alert('Alert', 'View is clicked');
                  break;
              }
            }}>
            <RNTesterText>Click me</RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="View with multiple actions">
          <View
            accessible={true}
            accessibilityActions={[
              {name: 'cut', label: 'cut label'},
              {name: 'copy', label: 'copy label'},
              {name: 'paste', label: 'paste label'},
            ]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'cut':
                  Alert.alert('Alert', 'cut action success');
                  break;
                case 'copy':
                  Alert.alert('Alert', 'copy action success');
                  break;
                case 'paste':
                  Alert.alert('Alert', 'paste action success');
                  break;
              }
            }}>
            <RNTesterText>This view supports many actions.</RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Adjustable with increment/decrement actions">
          <View
            accessible={true}
            accessibilityRole="adjustable"
            accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'increment':
                  Alert.alert('Alert', 'increment action success');
                  break;
                case 'decrement':
                  Alert.alert('Alert', 'decrement action success');
                  break;
              }
            }}>
            <RNTesterText>Slider</RNTesterText>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="TouchableWithoutFeedback with custom accessibility actions">
          <TouchableWithoutFeedback
            accessible={true}
            accessibilityActions={[
              {name: 'cut', label: 'cut label'},
              {name: 'copy', label: 'copy label'},
              {name: 'paste', label: 'paste label'},
            ]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'cut':
                  Alert.alert('Alert', 'cut action success');
                  break;
                case 'copy':
                  Alert.alert('Alert', 'copy action success');
                  break;
                case 'paste':
                  Alert.alert('Alert', 'paste action success');
                  break;
              }
            }}
            onPress={() => Alert.alert('Button has been pressed!')}
            accessibilityRole="button">
            <View>
              <RNTesterText>Click me</RNTesterText>
            </View>
          </TouchableWithoutFeedback>
        </RNTesterBlock>

        <RNTesterBlock title="Button with accessibility actions">
          <Button
            accessible={true}
            accessibilityActions={[
              {name: 'activate', label: 'activate label'},
              {name: 'copy', label: 'copy label'},
            ]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'activate':
                  Alert.alert('Alert', 'Activate accessibility action');
                  break;
                case 'copy':
                  Alert.alert('Alert', 'copy action success');
                  break;
              }
            }}
            onPress={() => Alert.alert('Button has been pressed!')}
            title="Button with accessibility action"
          />
        </RNTesterBlock>

        <RNTesterBlock title="Text with custom accessibility actions">
          <RNTesterText
            accessible={true}
            accessibilityActions={[
              {name: 'activate', label: 'activate label'},
              {name: 'copy', label: 'copy label'},
            ]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'activate':
                  Alert.alert('Alert', 'Activate accessibility action');
                  break;
                case 'copy':
                  Alert.alert('Alert', 'copy action success');
                  break;
              }
            }}>
            Text
          </RNTesterText>
        </RNTesterBlock>
      </View>
    );
  }
}

type FakeSliderExampleState = {
  current: number,
  textualValue: 'center' | 'left' | 'right',
};
class FakeSliderExample extends React.Component<{}, FakeSliderExampleState> {
  state: FakeSliderExampleState = {
    current: 50,
    textualValue: 'center',
  };

  increment: () => void = () => {
    let newValue = this.state.current + 2;
    if (newValue > 100) {
      newValue = 100;
    }
    this.setState({
      current: newValue,
    });
  };

  decrement: () => void = () => {
    let newValue = this.state.current - 2;
    if (newValue < 0) {
      newValue = 0;
    }
    this.setState({
      current: newValue,
    });
  };

  render(): React.Node {
    return (
      <View>
        <View
          accessible={true}
          accessibilityLabel="Fake Slider"
          accessibilityRole="adjustable"
          accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
          onAccessibilityAction={event => {
            switch (event.nativeEvent.actionName) {
              case 'increment':
                this.increment();
                break;
              case 'decrement':
                this.decrement();
                break;
            }
          }}
          accessibilityValue={{
            min: 0,
            now: this.state.current,
            max: 100,
          }}>
          <RNTesterText>Fake Slider {this.state.current}</RNTesterText>
        </View>
        <TouchableWithoutFeedback
          accessible={true}
          accessibilityLabel="Equalizer"
          accessibilityRole="adjustable"
          accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
          onAccessibilityAction={event => {
            switch (event.nativeEvent.actionName) {
              case 'increment':
                if (this.state.textualValue === 'center') {
                  this.setState({textualValue: 'right'});
                } else if (this.state.textualValue === 'left') {
                  this.setState({textualValue: 'center'});
                }
                break;
              case 'decrement':
                if (this.state.textualValue === 'center') {
                  this.setState({textualValue: 'left'});
                } else if (this.state.textualValue === 'right') {
                  this.setState({textualValue: 'center'});
                }
                break;
            }
          }}
          accessibilityValue={{text: this.state.textualValue}}>
          <View>
            <RNTesterText>Equalizer {this.state.textualValue}</RNTesterText>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

class FakeSliderExampleForAccessibilityValue extends React.Component<
  {},
  FakeSliderExampleState,
> {
  state: FakeSliderExampleState = {
    current: 50,
    textualValue: 'center',
  };

  increment: () => void = () => {
    let newValue = this.state.current + 2;
    if (newValue > 100) {
      newValue = 100;
    }
    this.setState({
      current: newValue,
    });
  };

  decrement: () => void = () => {
    let newValue = this.state.current - 2;
    if (newValue < 0) {
      newValue = 0;
    }
    this.setState({
      current: newValue,
    });
  };

  render(): React.Node {
    return (
      <View>
        <View
          accessible={true}
          accessibilityLabel="Fake Slider"
          accessibilityRole="adjustable"
          accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
          onAccessibilityAction={event => {
            switch (event.nativeEvent.actionName) {
              case 'increment':
                this.increment();
                break;
              case 'decrement':
                this.decrement();
                break;
            }
          }}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuetext={'slider aria value text'}
          aria-valuenow={this.state.current}>
          <RNTesterText>Fake Slider {this.state.current}</RNTesterText>
        </View>
        <TouchableWithoutFeedback
          accessible={true}
          accessibilityLabel="Equalizer"
          accessibilityRole="adjustable"
          accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
          onAccessibilityAction={event => {
            switch (event.nativeEvent.actionName) {
              case 'increment':
                if (this.state.textualValue === 'center') {
                  this.setState({textualValue: 'right'});
                } else if (this.state.textualValue === 'left') {
                  this.setState({textualValue: 'center'});
                }
                break;
              case 'decrement':
                if (this.state.textualValue === 'center') {
                  this.setState({textualValue: 'left'});
                } else if (this.state.textualValue === 'right') {
                  this.setState({textualValue: 'center'});
                }
                break;
            }
          }}
          accessibilityValue={{text: this.state.textualValue}}>
          <View>
            <RNTesterText>Equalizer {this.state.textualValue}</RNTesterText>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

class AnnounceForAccessibility extends React.Component<{}> {
  _handleOnPress = (): TimeoutID =>
    setTimeout(
      () => AccessibilityInfo.announceForAccessibility('Announcement Test'),
      1000,
    );

  _handleOnPressQueued = (): TimeoutID =>
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'Queued Announcement Test',
          {queue: true},
        ),
      1000,
    );

  _handleOnPressQueueMultiple = () => {
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'First Queued Announcement Test',
          {queue: true},
        ),
      1000,
    );
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'Second Queued Announcement Test',
          {queue: true},
        ),
      1100,
    );
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'Third Queued Announcement Test',
          {queue: true},
        ),
      1200,
    );
  };

  _handleOnPressHighPriority = () => {
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'High Priority Announcement Test',
          {priority: 'high'},
        ),
      1000,
    );

    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibility(
          'Normal Priority Announcement',
        ),
      1100,
    );
  };

  _handleOnPressLowPriority = () => {
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'Low Priority Announcement Test',
          {priority: 'low'},
        ),
      1000,
    );

    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibility(
          'Normal Priority Announcement',
        ),
      1100,
    );
  };

  render(): React.Node {
    return Platform.OS === 'ios' ? (
      <View>
        <Button
          onPress={this._handleOnPress}
          title="Announce for Accessibility Immediately"
        />
        <Button
          onPress={this._handleOnPressQueued}
          title="Announce for Accessibility Queued"
        />
        <Button
          onPress={this._handleOnPressQueueMultiple}
          title="Announce for Accessibility Queue Multiple"
        />
        <Button
          onPress={this._handleOnPressHighPriority}
          title="Announce for Accessibility High Priority"
        />
        <Button
          onPress={this._handleOnPressLowPriority}
          title="Announce for Accessibility Low Priority"
        />
      </View>
    ) : (
      <View>
        <Button
          onPress={this._handleOnPress}
          title="Announce for Accessibility"
        />
      </View>
    );
  }
}

function SetAccessibilityFocusExample(props: {}): React.Node {
  const myRef = useRef<?React.ElementRef<typeof RNTesterText>>(null);

  const onPress = () => {
    if (myRef && myRef.current) {
      AccessibilityInfo.sendAccessibilityEvent(myRef.current, 'focus');
    }
  };

  return (
    <View>
      {/* $FlowFixMe[incompatible-type] */}
      <RNTesterText ref={myRef}>
        SetAccessibilityFocus on native element. This should get focus after
        clicking the button!
      </RNTesterText>
      <Button title={'Click'} onPress={onPress} />
    </View>
  );
}

class EnabledExamples extends React.Component<{}> {
  render(): React.Node {
    return (
      <View style={styles.sectionContainer}>
        {Platform.OS === 'ios' ? (
          <>
            <RNTesterBlock title="isBoldTextEnabled()">
              <EnabledExample
                test="bold text"
                eventListener="boldTextChanged"
              />
            </RNTesterBlock>
            <RNTesterBlock title="isReduceTransparencyEnabled()">
              <EnabledExample
                test="reduce transparency"
                eventListener="reduceTransparencyChanged"
              />
            </RNTesterBlock>
          </>
        ) : null}

        {Platform.OS === 'android' ? (
          <RNTesterBlock
            title="isAccessibilityServiceEnabled()"
            description={
              'Event emitted whenever an accessibility service is enabled. This includes TalkBack as well as assistive technologies such as "Select to Speak".'
            }>
            <EnabledExample
              test="any accessibility service"
              eventListener="accessibilityServiceChanged"
            />
          </RNTesterBlock>
        ) : null}

        <RNTesterBlock title="isReduceMotionEnabled()">
          <EnabledExample
            test="reduce motion"
            eventListener="reduceMotionChanged"
          />
        </RNTesterBlock>

        <RNTesterBlock title="isInvertColorsEnabled()">
          <EnabledExample
            test="invert colors"
            eventListener="invertColorsChanged"
          />
        </RNTesterBlock>

        <RNTesterBlock title="isScreenReaderEnabled()">
          <EnabledExample
            test="screen reader"
            eventListener="screenReaderChanged"
          />
        </RNTesterBlock>
        <RNTesterBlock title="isGrayScaleEnabled()">
          <EnabledExample test="gray scale" eventListener="grayscaleChanged" />
        </RNTesterBlock>
      </View>
    );
  }
}

class ImportantForAccessibilityExamples extends React.Component<{}> {
  render(): React.Node {
    return (
      <View style={styles.sectionContainer}>
        <RNTesterBlock title="ImageBackground with importantForAccessibility=no-hide-descendants">
          <View style={styles.container}>
            <ImageBackground
              importantForAccessibility="no-hide-descendants"
              source={require('../../assets/trees.jpg')}
              resizeMode="cover"
              style={styles.ImageBackground}>
              <RNTesterText style={styles.text}>not accessible</RNTesterText>
            </ImageBackground>
          </View>
        </RNTesterBlock>
        <RNTesterBlock title="ImageBackground with importantForAccessibility=no">
          <View style={styles.container}>
            <ImageBackground
              importantForAccessibility="no"
              source={require('../../assets/trees.jpg')}
              resizeMode="cover"
              style={styles.ImageBackground}>
              <RNTesterText style={styles.text}>accessible</RNTesterText>
            </ImageBackground>
          </View>
        </RNTesterBlock>
        <RNTesterBlock title="Button with importantForAccessibility=no">
          <Button
            title="this is text"
            importantForAccessibility="no"
            onPress={() => console.log('pressed')}
          />
        </RNTesterBlock>
      </View>
    );
  }
}

class EnabledExample extends React.Component<
  {
    eventListener:
      | 'reduceMotionChanged'
      | 'boldTextChanged'
      | 'grayscaleChanged'
      | 'invertColorsChanged'
      | 'reduceTransparencyChanged'
      | 'reduceMotionChanged'
      | 'screenReaderChanged'
      | 'accessibilityServiceChanged',
    test: string,
  },
  {
    isEnabled: boolean,
  },
> {
  state: {isEnabled: boolean} = {
    isEnabled: false,
  };
  _subscription: EventSubscription;
  componentDidMount(): null | Promise<unknown> {
    this._subscription = AccessibilityInfo.addEventListener(
      this.props.eventListener,
      this._handleToggled,
    );

    switch (this.props.eventListener) {
      case 'reduceMotionChanged':
        return AccessibilityInfo.isReduceMotionEnabled().then(state => {
          this.setState({isEnabled: state});
        });
      case 'accessibilityServiceChanged':
        return AccessibilityInfo.isAccessibilityServiceEnabled().then(state => {
          this.setState({isEnabled: state});
        });
      default:
        return null;
    }
  }

  componentWillUnmount() {
    this._subscription?.remove();
  }

  _handleToggled = (isEnabled: void | GestureResponderEvent | boolean) => {
    if (!this.state.isEnabled) {
      this.setState({isEnabled: true});
    } else {
      this.setState({isEnabled: false});
    }
  };

  render(): React.Node {
    return (
      <View>
        <RNTesterText>
          The {this.props.test} is{' '}
          {this.state.isEnabled ? 'enabled' : 'disabled'}
        </RNTesterText>
        <Button
          title={this.state.isEnabled ? 'disable' : 'enable'}
          onPress={this._handleToggled}
        />
      </View>
    );
  }
}

class DisplayOptionsStatusExample extends React.Component<{}> {
  render(): React.Node {
    const isAndroid = Platform.OS === 'android';
    return (
      <View>
        <DisplayOptionStatusExample
          optionName={'Reduce Motion'}
          optionChecker={AccessibilityInfo.isReduceMotionEnabled}
          notification={'reduceMotionChanged'}
        />
        <DisplayOptionStatusExample
          optionName={'Prefer Cross-Fade Transitions'}
          optionChecker={AccessibilityInfo.prefersCrossFadeTransitions}
          notification={'prefersCrossFadeTransitionsChanged'}
        />
        <DisplayOptionStatusExample
          optionName={'Screen Reader'}
          optionChecker={AccessibilityInfo.isScreenReaderEnabled}
          notification={'screenReaderChanged'}
        />
        {isAndroid ? null : (
          <>
            <DisplayOptionStatusExample
              optionName={'Bold Text'}
              optionChecker={AccessibilityInfo.isBoldTextEnabled}
              notification={'boldTextChanged'}
            />
            <DisplayOptionStatusExample
              optionName={'Grayscale'}
              optionChecker={AccessibilityInfo.isGrayscaleEnabled}
              notification={'grayscaleChanged'}
            />
            <DisplayOptionStatusExample
              optionName={'Invert Colors'}
              optionChecker={AccessibilityInfo.isInvertColorsEnabled}
              notification={'invertColorsChanged'}
            />
            <DisplayOptionStatusExample
              optionName={'Reduce Transparency'}
              optionChecker={AccessibilityInfo.isReduceTransparencyEnabled}
              notification={'reduceTransparencyChanged'}
            />
          </>
        )}
      </View>
    );
  }
}

function DisplayOptionStatusExample({
  optionName,
  optionChecker,
  notification,
}: {
  notification: string,
  optionChecker: () => Promise<boolean>,
  optionName: string,
}) {
  const [statusEnabled, setStatusEnabled] = useState(false);
  useEffect(() => {
    const listener = AccessibilityInfo.addEventListener(
      // $FlowFixMe[prop-missing]
      // $FlowFixMe[invalid-computed-prop]
      notification,
      setStatusEnabled,
    );
    // $FlowFixMe[unused-promise]
    optionChecker().then(isEnabled => {
      setStatusEnabled(isEnabled);
    });
    return function cleanup() {
      listener.remove();
    };
  }, [optionChecker, notification]);
  return (
    <View>
      <RNTesterText>
        {optionName}
        {' is '}
        {statusEnabled ? 'enabled' : 'disabled'}.
      </RNTesterText>
    </View>
  );
}

function AccessibilityExpandedExample(): React.Node {
  const [expand, setExpanded] = useState(false);
  const expandAction = {name: 'expand'};
  const collapseAction = {name: 'collapse'};
  return (
    <View style={styles.sectionContainer}>
      <RNTesterBlock title="Collapse/Expanded state change (Paper)">
        <RNTesterText>
          The following component announces expanded/collapsed state correctly
        </RNTesterText>
        <Button
          onPress={() => setExpanded(!expand)}
          accessibilityState={{expanded: expand}}
          accessibilityActions={expand ? [collapseAction] : [expandAction]}
          onAccessibilityAction={event => {
            switch (event.nativeEvent.actionName) {
              case 'expand':
                setExpanded(true);
                break;
              case 'collapse':
                setExpanded(false);
                break;
            }
          }}
          title="click me to change state"
        />
      </RNTesterBlock>

      <RNTesterBlock title="Screenreader announces the visible text">
        <RNTesterText>
          Announcing expanded/collapse and the visible text.
        </RNTesterText>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setExpanded(!expand)}
          accessibilityState={{expanded: expand}}>
          <RNTesterText>Click me to change state</RNTesterText>
        </TouchableOpacity>
      </RNTesterBlock>

      <RNTesterBlock title="expanded/collapsed only managed through the accessibility menu">
        <TouchableWithoutFeedback
          accessibilityState={{expanded: true}}
          accessible={true}>
          <View>
            <RNTesterText>Clicking me does not change state</RNTesterText>
          </View>
        </TouchableWithoutFeedback>
      </RNTesterBlock>
    </View>
  );
}

function AccessibilityTextInputWithArialabelledByAttributeExample(): React.Node {
  return (
    <View>
      <RNTesterText nativeID="testAriaLabelledBy"> Phone Number</RNTesterText>
      <TextInput
        aria-labelledby={'testAriaLabelledBy'}
        style={styles.default}
      />
    </View>
  );
}

function AccessibilityOrderExample(): React.Node {
  return (
    <>
      <RNTesterText style={{marginBottom: 8}}>
        Basic accessibility order: accessibilityOrder=['b', 'c', 'a']
      </RNTesterText>
      <View
        style={{flexDirection: 'row', gap: 10, marginBottom: 8}}
        experimental_accessibilityOrder={['b', 'c', 'a']}>
        <View
          accessible={true}
          nativeID="a"
          accessibilityLabel="a"
          style={[{backgroundColor: 'red'}, styles.boxSize]}
        />
        <View
          accessible={true}
          nativeID="b"
          accessibilityLabel="b"
          style={[{backgroundColor: 'green'}, styles.boxSize]}
        />
        <View
          accessible={true}
          nativeID="c"
          accessibilityLabel="c"
          style={[{backgroundColor: 'yellow'}, styles.boxSize]}
        />
      </View>
      <RNTesterText style={{marginBottom: 8}}>
        Accessibility order disables components not in the order:
        accessibilityOrder=['b', 'c', 'a']
      </RNTesterText>
      <View
        style={{flexDirection: 'row', gap: 10, marginBottom: 8}}
        experimental_accessibilityOrder={['b', 'c', 'a']}>
        <View
          accessible={true}
          nativeID="a"
          accessibilityLabel="a"
          style={[{backgroundColor: 'red'}, styles.boxSize]}
        />
        <RNTesterText accessible={true} style={{width: 50}}>
          Not in the order :P
        </RNTesterText>
        <View
          accessible={true}
          nativeID="b"
          accessibilityLabel="b"
          style={[{backgroundColor: 'green'}, styles.boxSize]}
        />
        <Pressable
          accessible={true}
          style={[{backgroundColor: 'orange'}, styles.boxSize]}>
          <RNTesterText>I am a pressable</RNTesterText>
        </Pressable>
        <View
          accessible={true}
          nativeID="c"
          accessibilityLabel="c"
          style={[{backgroundColor: 'yellow'}, styles.boxSize]}
        />
      </View>
      <RNTesterText style={{marginBottom: 8}}>
        Accessibility order won't enable non-accessible components in the order:
        accessibilityOrder=['b', 'c', 'a']
      </RNTesterText>
      <View
        style={{flexDirection: 'row', gap: 10, marginBottom: 8}}
        experimental_accessibilityOrder={['b', 'c', 'a']}>
        <View
          accessible={true}
          nativeID="a"
          accessibilityLabel="a"
          style={[{backgroundColor: 'red'}, styles.boxSize]}
        />
        <View
          accessible={true}
          nativeID="b"
          accessibilityLabel="b"
          style={[{backgroundColor: 'green'}, styles.boxSize]}
        />
        <View
          nativeID="c"
          style={[{backgroundColor: 'yellow'}, styles.boxSize]}
        />
      </View>
      <RNTesterText style={{marginBottom: 8}}>
        Accessibility order can reference containers: accessibilityOrder=['b',
        'c', 'a']
      </RNTesterText>
      <View
        style={{flexDirection: 'row', gap: 10, marginBottom: 8}}
        experimental_accessibilityOrder={['b', 'c', 'a']}>
        <View
          nativeID="a"
          style={[
            {backgroundColor: 'red', flexWrap: 'wrap', flexDirection: 'row'},
            styles.boxSize,
          ]}>
          <View
            accessible={true}
            accessibilityLabel="1st Child of a"
            style={[{backgroundColor: 'black'}, styles.smallBoxSize]}
          />
          <View
            accessible={true}
            accessibilityLabel="2nd Child of a"
            style={[{backgroundColor: 'white'}, styles.smallBoxSize]}
          />
          <View
            accessible={true}
            accessibilityLabel="3rd Child of a"
            style={[{backgroundColor: 'brown'}, styles.smallBoxSize]}
          />
          <View
            accessible={true}
            accessibilityLabel="4th Child of a"
            style={[{backgroundColor: 'maroon'}, styles.smallBoxSize]}
          />
        </View>
        <View
          accessible={true}
          nativeID="b"
          accessibilityLabel="b"
          style={[{backgroundColor: 'green'}, styles.boxSize]}
        />
        <View
          accessible={true}
          nativeID="c"
          accessibilityLabel="c"
          style={[{backgroundColor: 'yellow'}, styles.boxSize]}
        />
      </View>
      <RNTesterText style={{marginBottom: 8}}>
        Accessibility order can reference other accessibilityOrders:
        accessibilityOrder=['b', 'c', 'a']. a's accessibilityOrder=[4, 2, 1, 3]
      </RNTesterText>
      <View
        style={{flexDirection: 'row', gap: 10, marginBottom: 8}}
        experimental_accessibilityOrder={['b', 'c', 'a']}>
        <View
          nativeID="a"
          accessibilityLabel="a"
          experimental_accessibilityOrder={['4', '2', '1', '3']}
          style={[
            {backgroundColor: 'red', flexWrap: 'wrap', flexDirection: 'row'},
            styles.boxSize,
          ]}>
          <View
            accessible={true}
            nativeID="1"
            accessibilityLabel="1"
            style={[{backgroundColor: 'black'}, styles.smallBoxSize]}
          />
          <View
            accessible={true}
            nativeID="2"
            accessibilityLabel="2"
            style={[{backgroundColor: 'white'}, styles.smallBoxSize]}
          />
          <View
            accessible={true}
            nativeID="3"
            accessibilityLabel="3"
            style={[{backgroundColor: 'brown'}, styles.smallBoxSize]}
          />
          <View
            accessible={true}
            nativeID="4"
            accessibilityLabel="4"
            style={[{backgroundColor: 'maroon'}, styles.smallBoxSize]}
          />
        </View>
        <View
          accessible={true}
          nativeID="b"
          accessibilityLabel="b"
          style={[{backgroundColor: 'green'}, styles.boxSize]}
        />
        <View
          accessible={true}
          nativeID="c"
          accessibilityLabel="c"
          style={[{backgroundColor: 'yellow'}, styles.boxSize]}
        />
      </View>
      <RNTesterText style={{marginBottom: 8}}>
        Accessibility order cannot order the root, but it can still be
        accessible: accessibilityOrder=['b', 'c', 'root', 'a'].
      </RNTesterText>
      <View
        accessible={true}
        nativeID="root"
        accessibilityLabel="root"
        style={{flexDirection: 'row', gap: 10, marginBottom: 8}}
        experimental_accessibilityOrder={['b', 'c', 'root', 'a']}>
        <View
          accessible={true}
          nativeID="a"
          accessibilityLabel="a"
          style={[{backgroundColor: 'red'}, styles.boxSize]}
        />
        <View
          accessible={true}
          nativeID="b"
          accessibilityLabel="b"
          style={[{backgroundColor: 'green'}, styles.boxSize]}
        />
        <View
          accessible={true}
          nativeID="c"
          accessibilityLabel="c"
          style={[{backgroundColor: 'yellow'}, styles.boxSize]}
        />
      </View>
      <RNTesterText style={{marginBottom: 8}}>
        Accessibility order can reference parents and their decendants in any
        order: accessibilityOrder=[child 2, child 1, child 2.3, child 3.2, child
        4, child 2.4, parent, child 2.1]
      </RNTesterText>
      <View
        style={{flexDirection: 'row', gap: 10, marginBottom: 8}}
        experimental_accessibilityOrder={[
          'child2',
          'child1',
          'child2.3',
          'child3.2',
          'child4',
          'child2.4',
          'parent',
          'child2.1',
        ]}>
        <View
          accessible={true}
          nativeID="parent"
          accessibilityLabel="parent"
          style={[
            {backgroundColor: 'orange', flexWrap: 'wrap', flexDirection: 'row'},
            styles.bigBoxSize,
          ]}>
          <View
            accessible={true}
            nativeID="child1"
            accessibilityLabel="child1"
            style={[{backgroundColor: 'red'}, styles.boxSize]}
          />
          <View
            accessible={true}
            nativeID="child2"
            accessibilityLabel="child2"
            style={[
              {
                backgroundColor: 'green',
                flexWrap: 'wrap',
                flexDirection: 'row',
              },
              styles.boxSize,
            ]}>
            <View
              accessible={true}
              nativeID="child2.1"
              accessibilityLabel="child2.1"
              style={[{backgroundColor: 'black'}, styles.smallBoxSize]}
            />
            <View
              accessible={true}
              nativeID="child2.2"
              accessibilityLabel="child2.2"
              style={[{backgroundColor: 'white'}, styles.smallBoxSize]}
            />
            <View
              accessible={true}
              nativeID="child2.3"
              accessibilityLabel="child2.3"
              style={[{backgroundColor: 'brown'}, styles.smallBoxSize]}
            />
            <View
              accessible={true}
              nativeID="child2.4"
              accessibilityLabel="child2.4"
              style={[{backgroundColor: 'maroon'}, styles.smallBoxSize]}
            />
          </View>
          <View
            accessible={true}
            nativeID="child3"
            accessibilityLabel="child3"
            style={[
              {
                backgroundColor: 'yellow',
                flexWrap: 'wrap',
                flexDirection: 'row',
              },
              styles.boxSize,
            ]}>
            <View
              accessible={true}
              nativeID="child3.1"
              accessibilityLabel="child3.1"
              style={[{backgroundColor: 'olive'}, styles.smallBoxSize]}
            />
            <View
              accessible={true}
              nativeID="child3.2"
              accessibilityLabel="child3.2"
              style={[{backgroundColor: 'red'}, styles.smallBoxSize]}
            />
          </View>
          <View
            accessible={true}
            nativeID="child4"
            accessibilityLabel="child4"
            style={[{backgroundColor: 'teal'}, styles.boxSize]}
          />
        </View>
      </View>
      <RNTesterText style={{marginBottom: 8}}>
        Accessibility order will still co-opt labels even if they are not in the
        order: accessibilityOrder=[b, c, a]
      </RNTesterText>
      <View
        style={{flexDirection: 'row', gap: 10, marginBottom: 8}}
        experimental_accessibilityOrder={['b', 'c', 'a']}>
        <View
          accessible={true}
          nativeID="a"
          style={[{backgroundColor: 'red'}, styles.boxSize]}>
          <View
            accessible={true}
            accessibilityLabel="I am a view with a label that got co-opted"
            style={[{backgroundColor: 'blue'}, styles.smallBoxSize]}
          />
        </View>
        <View
          accessible={true}
          nativeID="b"
          style={[{backgroundColor: 'green'}, styles.boxSize]}>
          <RNTesterText accessible={true} style={{fontSize: 10}}>
            I am co-opted by my parent!!
          </RNTesterText>
        </View>
        <View
          accessible={true}
          nativeID="c"
          accessibilityLabel="c"
          style={[{backgroundColor: 'yellow'}, styles.boxSize]}>
          <RNTesterText
            accessible={true}
            style={{color: 'black', fontSize: 10}}>
            I won't get co-opted because my parent has a label
          </RNTesterText>
        </View>
      </View>
      <RNTesterText style={{marginBottom: 8}}>
        Accessibility order let's you focus links, but the text needs to be
        included: accessibilityOrder=[c, a, b, text]
      </RNTesterText>
      <View
        style={{flexDirection: 'row', gap: 10, marginBottom: 8}}
        experimental_accessibilityOrder={['c', 'a', 'b', 'text']}>
        <View
          accessible={true}
          nativeID="a"
          style={[{backgroundColor: 'red'}, styles.boxSize]}
        />
        <View
          accessible={true}
          nativeID="b"
          style={[{backgroundColor: 'green'}, styles.boxSize]}>
          <RNTesterText style={{fontSize: 10}} nativeID="text">
            I am a{' '}
            <RNTesterText accessibilityRole="link" style={styles.link}>
              link!
            </RNTesterText>
          </RNTesterText>
        </View>
        <View
          accessible={true}
          nativeID="c"
          accessibilityLabel="c"
          style={[{backgroundColor: 'yellow'}, styles.boxSize]}>
          <RNTesterText
            accessible={true}
            style={{color: 'black', fontSize: 10}}>
            I am a{' '}
            <RNTesterText accessibilityRole="link" style={styles.link}>
              non-discoverable link!
            </RNTesterText>
          </RNTesterText>
        </View>
      </View>
    </>
  );
}

function handleLinkPress(linkText: string): void {
  Alert.alert('Link Clicked', `You clicked on the ${linkText} link!`);
}

function TextLinkExample(): React.Node {
  return (
    <View style={{gap: 10}}>
      <RNTesterText>
        We can focus{' '}
        <RNTesterText
          accessibilityRole="link"
          onPress={() => handleLinkPress('first')}
          style={styles.link}>
          links
        </RNTesterText>{' '}
        in text, even if there are{' '}
        <RNTesterText
          accessibilityRole="link"
          onPress={() => handleLinkPress('second')}
          style={styles.link}>
          multiple of them!
        </RNTesterText>
      </RNTesterText>
      <RNTesterText
        accessibilityRole="link"
        onPress={() => handleLinkPress('thrid')}
        style={styles.link}>
        We can also focus text that are entirly links!
      </RNTesterText>
    </View>
  );
}

function LabelCooptingExample(): React.Node {
  return (
    <View
      style={{gap: 10}}
      experimental_accessibilityOrder={['a', 'a.5', 'b', 'c']}>
      <View
        accessible={true}
        nativeID="a"
        style={{
          backgroundColor: 'lightseagreen',
          padding: 10,
          borderRadius: 5,
        }}>
        <RNTesterText>
          This View is accessible and it will coopt this text. This text is not
          accessible because it got coopted!
        </RNTesterText>
      </View>
      <View
        accessible={true}
        nativeID="a.5"
        style={{backgroundColor: 'darkseagreen', padding: 10, borderRadius: 5}}>
        <RNTesterText>I am some text that will get coopted</RNTesterText>
        <View
          accessibilityLabel="I am a view with a label that got coopted"
          style={[{backgroundColor: 'tan'}, styles.smallBoxSize]}
        />
        <RNTesterText>I am also some text that will get coopted</RNTesterText>
      </View>
      <View
        accessible={true}
        nativeID="b"
        style={{backgroundColor: 'lightcoral', padding: 10, borderRadius: 5}}>
        <RNTesterText nativeID="c">
          This View is accessible and it will coopt this text. This text is not
          accessible because it got coopted! But it's{' '}
          <RNTesterText
            accessibilityRole="link"
            onPress={() => handleLinkPress('first')}
            style={styles.link}>
            links
          </RNTesterText>{' '}
          are!
        </RNTesterText>
      </View>
    </View>
  );
}

function AriaHiddenExample(): React.Node {
  const [ariaHidden, setAriaHidden] = useState(false);

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 40,
        }}>
        <RNTesterText variant="label" style={{flex: 1}}>
          Enable aria-hidden
        </RNTesterText>
        <Switch
          value={ariaHidden}
          onValueChange={() => setAriaHidden(!ariaHidden)}
          accessibilityLabel="Enable aria-hidden"
        />
      </View>

      <View
        accessible
        aria-hidden={ariaHidden}
        aria-label={
          ariaHidden ? 'This should be hidden' : 'This should be accessible'
        }
        style={styles.smallRedSquare}
      />

      <View
        accessible
        aria-hidden={ariaHidden}
        aria-label={
          ariaHidden ? 'This should be hidden' : 'This should be accessible'
        }>
        <Text>View with Text content</Text>
      </View>

      <Text aria-hidden={ariaHidden}>Regular Text</Text>

      <TextInput
        editable={false}
        aria-hidden={ariaHidden}
        aria-label={
          ariaHidden ? 'This should be hidden' : 'This should be accessible'
        }
        placeholder={`Non-editable TextInput`}
      />

      <TextInput
        editable={false}
        aria-hidden={ariaHidden}
        aria-label={
          ariaHidden ? 'This should be hidden' : 'This should be accessible'
        }
        placeholder={`Non-editable multiline TextInput`}
        multiline
        numberOfLines={3}
      />

      <Pressable
        aria-hidden={ariaHidden}
        onPress={() => console.log('Pressed')}
        aria-label={
          ariaHidden ? 'This should be hidden' : 'This should be accessible'
        }
        style={styles.button}>
        <Text>Pressable with text content</Text>
      </Pressable>

      <Image
        accessible
        aria-hidden={ariaHidden}
        aria-label={
          ariaHidden ? 'This should be hidden' : 'This should be accessible'
        }
        source={require('../../assets/like.png')}
        style={styles.button}
      />
    </View>
  );
}

exports.title = 'Accessibility';
exports.documentationURL = 'https://reactnative.dev/docs/accessibilityinfo';
exports.description = 'Examples of using Accessibility APIs.';
exports.examples = [
  {
    title: 'Accessibility expanded',
    render(): React.MixedElement {
      return <AccessibilityExpandedExample />;
    },
  },
  {
    title: 'Accessibility elements',
    render(): React.MixedElement {
      return <AccessibilityExample />;
    },
  },
  {
    title: 'Automatic Content Grouping',
    render(): React.MixedElement {
      return <AutomaticContentGrouping />;
    },
  },
  {
    title: 'New accessibility roles and states',
    render(): React.MixedElement {
      return <AccessibilityRoleAndStateExample />;
    },
  },
  {
    title: 'Accessibility action examples',
    render(): React.MixedElement {
      return <AccessibilityActionsExample />;
    },
  },
  {
    title: 'Fake Slider Example',
    render(): React.MixedElement {
      return <FakeSliderExample />;
    },
  },
  {
    title: 'Fake SliderExample For AccessibilityValue',
    render(): React.MixedElement {
      return <FakeSliderExampleForAccessibilityValue />;
    },
  },
  {
    title: 'Check if the display options are enabled',
    render(): React.MixedElement {
      return <DisplayOptionsStatusExample />;
    },
  },
  {
    title: 'Check if the screen reader announces',
    render(): React.MixedElement {
      return <AnnounceForAccessibility />;
    },
  },
  {
    title: 'Check if accessibility is focused',
    render(): React.MixedElement {
      return <SetAccessibilityFocusExample />;
    },
  },
  {
    title: 'Check if these properties are enabled',
    render(): React.MixedElement {
      return <EnabledExamples />;
    },
  },
  {
    title: 'Testing importantForAccessibility',
    render(): React.MixedElement {
      return <ImportantForAccessibilityExamples />;
    },
  },
  {
    title:
      'Check if accessibilityState disabled is announced when the screenreader focus moves on the image',
    render(): React.MixedElement {
      return (
        <Image
          accessible={true}
          accessibilityLabel="plain local image"
          accessibilityState={{disabled: true}}
          source={require('../../assets/like.png')}
          style={styles.disabledImage}
        />
      );
    },
  },
  {
    title: 'TextInput with aria-labelledby attribute',
    render(): React.MixedElement {
      return <AccessibilityTextInputWithArialabelledByAttributeExample />;
    },
  },
  {
    title: 'accessibilityOrder',
    render(): React.MixedElement {
      return <AccessibilityOrderExample />;
    },
  },
  {
    title: 'Links in text',
    render(): React.MixedElement {
      return <TextLinkExample />;
    },
  },
  {
    title: 'Label coopting',
    render(): React.MixedElement {
      return <LabelCooptingExample />;
    },
  },
  {
    title: 'aria-hidden',
    render(): React.MixedElement {
      return <AriaHiddenExample />;
    },
  },
] as Array<RNTesterModuleExample>;
