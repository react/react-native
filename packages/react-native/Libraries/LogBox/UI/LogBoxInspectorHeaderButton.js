/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ImageSource} from '../../Image/ImageSource';
import type {LogLevel} from '../Data/LogBoxLog';

import Image from '../../Image/Image';
import StyleSheet from '../../StyleSheet/StyleSheet';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

const backgroundForLevel = (level: LogLevel) =>
  ({
    warn: {
      default: 'transparent',
      pressed: LogBoxStyle.getWarningDarkColor(),
    },
    error: {
      default: 'transparent',
      pressed: LogBoxStyle.getErrorDarkColor(),
    },
    fatal: {
      default: 'transparent',
      pressed: LogBoxStyle.getFatalDarkColor(),
    },
    syntax: {
      default: 'transparent',
      pressed: LogBoxStyle.getFatalDarkColor(),
    },
  })[level];

export default function LogBoxInspectorHeaderButton(
  props: Readonly<{
    id: string,
    disabled: boolean,
    image: ImageSource,
    level: LogLevel,
    onPress?: ?() => void,
  }>,
): React.Node {
  return (
    <LogBoxButton
      id={props.id}
      backgroundColor={backgroundForLevel(props.level)}
      onPress={props.disabled ? null : props.onPress}
      style={styles.button}>
      {props.disabled ? null : (
        <Image source={props.image} style={styles.buttonImage} />
      )}
    </LogBoxButton>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    marginTop: 5,
    marginRight: 6,
    marginLeft: 6,
    marginBottom: -8,
    borderRadius: 3,
  },
  buttonImage: {
    height: 14,
    width: 8,
    tintColor: LogBoxStyle.getTextColor(),
  },
});
