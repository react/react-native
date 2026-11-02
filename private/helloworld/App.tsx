/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {useState} from 'react';
import {
  I18nManager,
  type SafeAreaInsets,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

function App(): React.ReactNode {
  const isDarkMode = useColorScheme() === 'dark';
  const [insets, setInsets] = useState<SafeAreaInsets | null>(null);
  // Insets are physical edges, but Yoga treats paddingLeft/paddingRight as
  // start/end when swapLeftAndRightInRTL is on.
  const swap = I18nManager.isRTL && I18nManager.doLeftAndRightSwapInRTL;

  return (
    <View
      style={
        insets && {
          paddingTop: insets.top,
          paddingRight: swap ? insets.left : insets.right,
          paddingBottom: insets.bottom,
          paddingLeft: swap ? insets.right : insets.left,
        }
      }
      experimental_onSafeAreaInsetsChange={event =>
        setInsets(event.nativeEvent.insets)
      }>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text style={[styles.title, {color: isDarkMode ? 'white' : 'black'}]}>
            Hello, World!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});

export default App;
