/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TextProps} from 'react-native';

import {RNTesterThemeContext} from './RNTesterTheme';
import * as React from 'react';
import {useContext, useMemo} from 'react';
import {Text} from 'react-native';

type Props = Readonly<{
  ...TextProps,
  variant?: 'body' | 'label' | 'caption',
}>;

export default function RNTesterText(props: Props): React.Node {
  const {style, variant, ...rest} = props;
  const theme = useContext(RNTesterThemeContext);
  const color = useMemo(() => {
    switch (variant) {
      case 'body':
        return theme.LabelColor;
      case 'label':
        return theme.SecondaryLabelColor;
      case 'caption':
        return theme.TertiaryLabelColor;
      default:
        return theme.LabelColor;
    }
  }, [variant, theme]);
  return <Text {...rest} style={[{color}, style]} />;
}
