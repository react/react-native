/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import processColor from '../StyleSheet/processColor';
import {getColorScheme} from './Appearance';
import NativeDevLoadingView from './NativeDevLoadingView';

const COLOR_SCHEME = {
  dark: {
    load: {
      backgroundColor: '#fafafa',
      textColor: '#242526',
    },
    refresh: {
      backgroundColor: '#1065AF',
      textColor: '#ffffff',
    },
    error: {
      backgroundColor: '#1065AF',
      textColor: '#ffffff',
    },
  },
  default: {
    load: {
      backgroundColor: '#404040',
      textColor: '#ffffff',
    },
    refresh: {
      backgroundColor: '#1065AF',
      textColor: '#ffffff',
    },
    error: {
      backgroundColor: '#1065AF',
      textColor: '#ffffff',
    },
  },
};

export default {
  showMessage(
    message: string,
    type: 'load' | 'refresh' | 'error',
    options?: {dismissButton?: boolean},
  ) {
    if (NativeDevLoadingView) {
      const colorScheme =
        getColorScheme() === 'dark' ? COLOR_SCHEME.dark : COLOR_SCHEME.default;

      const colorSet = colorScheme[type];

      let backgroundColor;
      let textColor;

      if (colorSet) {
        backgroundColor = processColor(colorSet.backgroundColor);
        textColor = processColor(colorSet.textColor);
      }

      const hasDismissButton = options?.dismissButton ?? false;

      NativeDevLoadingView.showMessage(
        message,
        typeof textColor === 'number' ? textColor : null,
        typeof backgroundColor === 'number' ? backgroundColor : null,
        hasDismissButton,
      );
    }
  },
  hide() {
    NativeDevLoadingView && NativeDevLoadingView.hide();
  },
};
