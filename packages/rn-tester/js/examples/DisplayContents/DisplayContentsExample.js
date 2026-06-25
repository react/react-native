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

import type {RNTesterModule} from '../../types/RNTesterTypes';

import * as React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

const styles = StyleSheet.create({
  contents: {
    display: 'contents',
  },
  box: {
    width: 200,
    height: 100,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  tinyBox: {
    width: 50,
    height: 25,
  },
  border1: {
    borderWidth: 1,
    borderColor: 'brown',
  },
  border2: {
    borderWidth: 1,
    borderColor: 'magenta',
  },
  border3: {
    borderWidth: 1,
    borderColor: 'green',
  },
  row: {
    flexDirection: 'row',
  },
});

export default {
  title: 'Display: contents',
  category: 'UI',
  description:
    'Demonstrates various ways display: contents may be used in the tree',
  examples: [
    {
      title: 'Single display: contents node',
      name: 'single-contents-node',
      description:
        'Single display: contents node with flex-direction: row (should be ignored in layout)',
      render: function (): React.Node {
        return (
          <View
            testID="display-contents-test-single-node-root"
            style={[styles.box, styles.border1]}>
            <View
              testID="display-contents-test-single-node-child"
              style={[styles.box, styles.border2, styles.row, styles.contents]}>
              <View
                testID="display-contents-test-single-node-grandchild-1"
                style={[styles.tinyBox, styles.border3]}
              />
              <View
                testID="display-contents-test-single-node-grandchild-2"
                style={[styles.tinyBox, styles.border3]}
              />
            </View>
          </View>
        );
      },
    },
    {
      title: 'Multiple display: contents nodes',
      name: 'multiple-contents-nodes',
      description:
        'Three display: contents nodes with flex-direction: row (they should be ignored in layout)',
      render: function (): React.Node {
        return (
          <View
            testID="display-contents-test-multiple-node-root"
            style={[styles.box, styles.border1, styles.wrap]}>
            <View
              testID="display-contents-test-single-node-child-1"
              style={[styles.box, styles.border2, styles.row, styles.contents]}>
              <View
                testID="display-contents-test-single-node-grandchild-1"
                style={[styles.tinyBox, styles.border3]}
              />
              <View
                testID="display-contents-test-single-node-grandchild-2"
                style={[styles.tinyBox, styles.border3]}
              />
            </View>

            <View
              testID="display-contents-test-single-node-child-2"
              style={[styles.box, styles.border2, styles.row, styles.contents]}>
              <View
                testID="display-contents-test-single-node-grandchild-3"
                style={[styles.tinyBox, styles.border2]}
              />
              <View
                testID="display-contents-test-single-node-grandchild-4"
                style={[styles.tinyBox, styles.border2]}
              />
            </View>

            <View
              testID="display-contents-test-single-node-child-3"
              style={[styles.box, styles.border2, styles.row, styles.contents]}>
              <View
                testID="display-contents-test-single-node-grandchild-5"
                style={[styles.tinyBox, styles.border3]}
              />
              <View
                testID="display-contents-test-single-node-grandchild-6"
                style={[styles.tinyBox, styles.border3]}
              />
            </View>
          </View>
        );
      },
    },
    {
      title: 'Nested display: contents nodes',
      name: 'nested-contents-nodes',
      description:
        'Single display: contents node with two nested display: contents nodes, each with flex-direction: row (they should be ignored in layout)',
      render: function (): React.Node {
        return (
          <View
            testID="display-contents-test-multiple-node-root"
            style={[styles.box, styles.border1, styles.wrap]}>
            <View
              testID="display-contents-test-single-node-child-1"
              style={[styles.box, styles.border2, styles.row, styles.contents]}>
              <View
                testID="display-contents-test-single-node-grandchild-1"
                style={[styles.tinyBox, styles.border2]}
              />
              <View
                testID="display-contents-test-single-node-grandchild-2"
                style={[styles.tinyBox, styles.border1, styles.contents]}>
                <View
                  testID="display-contents-test-single-node-great-grandchild-1"
                  style={[styles.tinyBox, styles.border3]}
                />
                <View
                  testID="display-contents-test-single-node-great-grandchild-2"
                  style={[styles.tinyBox, styles.border3]}
                />
              </View>
            </View>
          </View>
        );
      },
    },
    {
      title: 'Leaf node with display: contents',
      name: 'contents-leaf-node',
      description:
        'Single display: contents leaf node (should be ignored in layout)',
      render: function (): React.Node {
        return (
          <View
            testID="display-contents-test-single-node-root"
            style={[styles.box, styles.border1]}>
            <View
              testID="display-contents-test-single-node-child"
              style={[styles.tinyBox, styles.border2, styles.contents]}
            />
          </View>
        );
      },
    },
    {
      title: 'TextInput with display: contents',
      name: 'contents-textinput',
      description:
        'A TextInput with display: contents style (should behave as if display: none was set)',
      render: function (): React.Node {
        return (
          <View
            testID="display-contents-textinput-root"
            style={[styles.box, styles.border1, styles.wrap]}>
            <TextInput
              testID="display-contents-textinput"
              style={[
                styles.tinyBox,
                styles.border2,
                styles.row,
                styles.contents,
              ]}
            />
            <TextInput
              testID="display-contents-textinput2"
              style={[
                styles.tinyBox,
                styles.border2,
                styles.row,
                styles.contents,
              ]}>
              <Text>Text1</Text>
              <Text>Text2</Text>
            </TextInput>
          </View>
        );
      },
    },
  ],
} as RNTesterModule;
