/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import {useRef, useState} from 'react';
import {
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function StickyHeader() {
  const [backgroundColor, setBackgroundColor] = useState('blue');
  return (
    <View
      key={0}
      style={{
        backgroundColor: backgroundColor,
        margin: 10,
        width: 500,
        height: 100,
      }}>
      <Pressable
        style={{flex: 1}}
        onPress={() => {
          setBackgroundColor(backgroundColor === 'blue' ? 'yellow' : 'blue');
        }}
        testID="pressable_header">
        <Text>Press to change color</Text>
      </Pressable>
    </View>
  );
}

function renderComponent1(i: number) {
  return (
    <View
      key={i}
      style={{backgroundColor: 'red', margin: 10, width: 500, height: 100}}
    />
  );
}

export default component ScrollViewPressableStickyHeaderExample() {
  const scrollRef = useRef<$FlowFixMe>(null);
  const components = [];
  for (var i = 1; i < 10; i++) {
    components.push(renderComponent1(i));
  }
  return (
    <View style={styles.container}>
      <View>
        <Button
          title="scroll to top"
          onPress={() => {
            scrollRef.current?.scrollTo({y: 0});
          }}
          testID="scroll_to_top_button"
        />
        <Button
          title="scroll to bottom"
          onPress={() => {
            scrollRef.current?.scrollToEnd();
          }}
          testID="scroll_to_bottom_button"
        />
      </View>
      <ScrollView
        nestedScrollEnabled={true}
        ref={scrollRef}
        style={{flex: 1}}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        testID="scroll_pressable_sticky_header">
        <StickyHeader />
        {components}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    paddingTop: 30,
    flex: 1,
  },
});
