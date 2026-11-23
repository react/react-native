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

  return (
    <View
      style={
        insets && {
          paddingTop: insets.top,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
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
