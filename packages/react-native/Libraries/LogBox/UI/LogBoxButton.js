/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {GestureResponderEvent} from '../../Types/CoreEventTypes';

import Pressable from '../../Components/Pressable/Pressable';
import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';
import {useState} from 'react';

component LogBoxButton(
  id?: string,
  backgroundColor: Readonly<{
    default: string,
    pressed: string,
  }>,
  children?: React.Node,
  hitSlop?: ?EdgeInsetsProp,
  onPress?: ?(event: GestureResponderEvent) => void,
  onFocusChange?: ?(focused: boolean) => void,
  style?: ViewStyleProp,
) {
  const [focused, setFocused] = useState(false);

  let resolvedBackgroundColor = backgroundColor;
  if (!resolvedBackgroundColor) {
    resolvedBackgroundColor = {
      default: LogBoxStyle.getBackgroundColor(0.95),
      pressed: LogBoxStyle.getBackgroundColor(0.6),
    };
  }

  if (onPress == null) {
    return (
      <View
        id={id}
        style={StyleSheet.compose(
          {backgroundColor: resolvedBackgroundColor.default},
          style,
        )}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      id={id}
      focusable={true}
      hitSlop={hitSlop}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocusChange?.(true);
      }}
      onBlur={() => {
        setFocused(false);
        onFocusChange?.(false);
      }}
      style={({pressed}) =>
        StyleSheet.compose(
          {
            backgroundColor: pressed
              ? resolvedBackgroundColor.pressed
              : resolvedBackgroundColor.default,
          },
          focused ? StyleSheet.compose(style, styles.focusRing) : style,
        )
      }>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  focusRing: {
    borderWidth: 2,
    borderColor: LogBoxStyle.getTextColor(0.6),
    borderRadius: 4,
  },
});

export default LogBoxButton;
